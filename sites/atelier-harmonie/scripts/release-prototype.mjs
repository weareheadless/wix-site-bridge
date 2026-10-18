import {readFile,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const mode=process.argv[2]??'dry-run',only=process.argv[3];
if(!['dry-run','apply'].includes(mode))throw Error('Invalid mode');
const modules=JSON.parse(await readFile('work/reference-modules.json','utf8'));
const manifestPath='sites/atelier-harmonie/site.manifest.json';
const summary=[];
for(const m of modules.filter(m=>!only||only.split(',').includes(m.mountId))){
 const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
 if(manifest.site.alias!=='atelier-harmonie'||manifest.site.siteId!=='376faa89-fe6c-4ae8-8feb-10520e813a89')throw Error('Wrong site');
 const existing=manifest.site.customCode.find(s=>s.mountId===m.mountId);
 const args=['src/cli.mjs',existing?'update-snippet':'create-snippet','--manifest',manifestPath,'--site','atelier-harmonie','--html-file',m.file,'--route','/copy-of-accueil'];
 if(existing){
  if(existing.mountOrder!==m.mountOrder||existing.routeGuard!=='/copy-of-accueil')throw Error('Mount drift');
  args.push('--snippet',existing.id,'--from-category','ESSENTIAL');
 }else args.push('--name',`Atelier prototype — ${m.mountId}`,'--mount-id',m.mountId,'--mount-order',String(m.mountOrder),'--position','BODY_END','--category','ESSENTIAL','--load-once','false','--enabled','true');
 if(mode==='apply')args.push('--apply');
 const p=spawnSync(process.execPath,args,{encoding:'utf8',maxBuffer:2e6});
 if(p.status!==0){process.stderr.write(p.stderr);throw Error(`Bridge failed: ${m.mountId}`)}
 const result=JSON.parse(p.stdout);
 if(mode==='dry-run'){
  const plan=result.wouldUpdate??result.wouldCreate;
  if(result.status!=='dry-run'||plan.routeGuard!=='/copy-of-accueil'||plan.mountId!==m.mountId||plan.mountOrder!==m.mountOrder)throw Error('Plan mismatch');
  const row={mount:m.mountId,operation:existing?'update':'create',order:m.mountOrder,bytes:plan.htmlBytes,route:plan.routeGuard,status:result.status};summary.push(row);console.log(JSON.stringify(row));
 }else{
  const receipt=JSON.parse(await readFile(result.receiptPath,'utf8'));
  if(!['created','updated'].includes(receipt.status)||receipt.siteId!==manifest.site.siteId||receipt.mountId!==m.mountId||receipt.mountOrder!==m.mountOrder||receipt.routeGuard!=='/copy-of-accueil')throw Error('Receipt mismatch');
  if(receipt.status==='updated'&&(!receipt.recovery||!receipt.snapshotPath||receipt.afterSha256!==receipt.htmlSha256))throw Error('Missing update recovery');
  if(!existing){
   if(!receipt.confirmedEnabled||receipt.confirmedPosition!=='BODY_END'||receipt.confirmedPageScope.type!=='all')throw Error('Unexpected created configuration');
   manifest.site.customCode.push({id:receipt.customEmbedId,position:'BODY_END',pageScope:{type:'all'},category:'ESSENTIAL',loadOnce:false,routeGuard:'/copy-of-accueil',mountId:m.mountId,mountOrder:m.mountOrder,htmlFile:m.file});
   manifest.site.customCode.sort((a,b)=>a.mountOrder-b.mountOrder);
   await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
  }
  const saved=JSON.parse(await readFile(manifestPath,'utf8')).site.customCode.find(s=>s.mountId===m.mountId);
  if(saved.id!==(receipt.customEmbedId??receipt.snippetId)||saved.mountOrder!==m.mountOrder||saved.htmlFile!==m.file)throw Error('Manifest confirmation failed');
  const row={mount:m.mountId,order:m.mountOrder,status:receipt.status,id:saved.id,manifestConfirmed:true,receipt:result.receiptPath,...(receipt.recovery?{recovery:receipt.recovery}:{} )};summary.push(row);console.log(JSON.stringify(row));
 }
}
await writeFile(mode==='apply'?`.wix-bridge-state/reference-rebuild-release${only?'-'+only:''}.json`:`work/reference-dry-run${only?'-'+only:''}.json`,JSON.stringify(summary,null,2)+'\n',{mode:0o600});
