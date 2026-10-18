import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {WixAppTokenProvider,WixCustomEmbedsClient} from '../../../src/wix-client.mjs';
const args=process.argv.slice(2),apply=args.includes('--apply');
if(args[0]!=='--site'||args[1]!=='atelier-harmonie')throw Error('Explicit --site atelier-harmonie required');
const base='sites/atelier-harmonie',path=base+'/site.manifest.json';
const manifest=JSON.parse(await readFile(path,'utf8')),site=manifest.site;
if(site.alias!=='atelier-harmonie'||site.siteId!=='376faa89-fe6c-4ae8-8feb-10520e813a89')throw Error('Wrong target');
if(process.env.WIX_ALLOWED_SITE_IDS!==site.siteId)throw Error('Exact allowed site boundary required');
const build=JSON.parse(await readFile(base+'/production/build-manifest.json','utf8'));
const specs=[{name:'Atelier production early registration — initial',file:'early-elements-global.html',loadOnce:true},{name:'Atelier production early registration — navigation',file:'early-elements-global.html',loadOnce:false},...build.packets.map(p=>({name:'Atelier production '+p.file,file:p.file,loadOnce:true}))];
for(const spec of specs){spec.html=await readFile(base+'/production/custom-code/'+spec.file,'utf8');spec.sha256=createHash('sha256').update(spec.html).digest('hex');if(spec.html.length>=15000)throw Error('Custom code size limit exceeded');}
console.log(JSON.stringify({status:apply?'applying':'dry-run',site:site.alias,siteId:site.siteId,entries:specs.map(({html,...s})=>({...s,characters:html.length,position:'HEAD',category:'ESSENTIAL',scope:'all'}))},null,2));
if(!apply)process.exit(0);
const state=base+'/.wix-bridge-state/receipts';await mkdir(state,{recursive:true,mode:0o700});
const client=new WixCustomEmbedsClient({siteId:site.siteId,tokenProvider:WixAppTokenProvider.fromEnv()});
const existing=await client.listAll();
for(const spec of specs){
 const declared=site.customCode.find(e=>e.name===spec.name&&e.purpose==='nonvisual-early-registration');
 const sameName=existing.filter(e=>e.name===spec.name);
 if(sameName.length>1||(!declared&&sameName.length))throw Error('Unexpected existing entry; inspect before proceeding: '+spec.name);
 let created;
 if(declared){
  const before=await client.get(declared.id);
  if(before.name!==spec.name||before.position!=='HEAD'||before.pageFilter?.pageIds?.length||before.loadOnce!==spec.loadOnce||before.embedData?.category!=='ESSENTIAL')throw Error('Startup scope or placement differs from manifest');
  await writeFile(state+'/startup-before-'+before.id+'-'+Date.now()+'.json',JSON.stringify(before,null,2)+'\n',{mode:0o600});
  created=await client.updateHtml(before,spec.html,'ESSENTIAL');
 }else{
  created=await client.create({name:spec.name,position:'HEAD',category:'ESSENTIAL',html:spec.html,loadOnce:spec.loadOnce,enabled:true});
 }
 const receipt={siteAlias:site.alias,siteId:site.siteId,id:created.id,revision:created.revision,name:spec.name,sha256:spec.sha256,position:created.position,pageFilter:created.pageFilter,loadOnce:created.loadOnce,createdAt:new Date().toISOString(),recovery:'Restore private startup-before snapshot HTML through the bridge, or disable this startup entry in Wix Custom Code. Normal Wix custom-element sources remain available.'};
 await writeFile(state+'/startup-'+created.id+'.json',JSON.stringify(receipt,null,2)+'\n',{mode:0o600});
 if(created.position!=='HEAD'||created.pageFilter?.pageIds?.length||created.loadOnce!==spec.loadOnce)throw Error('Returned startup placement differs from plan; inspect receipt');
 if(!declared)site.customCode.push({id:created.id,name:spec.name,position:'HEAD',pageScope:{type:'all'},category:'ESSENTIAL',loadOnce:spec.loadOnce,htmlFile:base+'/production/custom-code/'+spec.file,purpose:'nonvisual-early-registration'});
 await writeFile(path,JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify({status:declared?'updated':'created',id:created.id,name:spec.name,manifestRecorded:true,position:'HEAD',loadOnce:created.loadOnce}));
}
