import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {WixAppTokenProvider} from '../../../src/wix-client.mjs';

// Contracts: docs/api-reference/business-management/multilingual/translation/
// translation-content/{query-contents,bulk-create-content,bulk-update-content-by-key}
const args=process.argv.slice(2);
const option=name=>{const index=args.indexOf(name);return index<0?undefined:args[index+1];};
if(option('--site')!=='atelier-harmonie')throw Error('Explicit --site atelier-harmonie required');
const base='sites/atelier-harmonie';
const manifest=JSON.parse(await readFile(base+'/site.manifest.json','utf8'));
const siteId=manifest.site.siteId;
if(siteId!=='376faa89-fe6c-4ae8-8feb-10520e813a89'||process.env.WIX_ALLOWED_SITE_IDS!==siteId)throw Error('Exact allowed site boundary required');
const operation=option('--operation');
if(!['snapshot','create','update'].includes(operation))throw Error('Choose --operation snapshot|create|update');
const apply=args.includes('--apply');
const state=base+'/.wix-bridge-state/receipts';
let plan,hash;
if(operation!=='snapshot'){
 const path=option('--plan');if(!path)throw Error('Explicit --plan required');
 const source=await readFile(path,'utf8');plan=JSON.parse(source);
 hash=createHash('sha256').update(source).digest('hex');
 if(!Array.isArray(plan.contents)||!plan.contents.length)throw Error('Empty translation plan');
 const keys=new Set();
 for(const item of plan.contents){
  const c=operation==='update'?item.content:item;
  if(!c||c.locale!=='en'||!c.schemaId||!c.entityId||!c.fields)throw Error('Only explicit English translation records allowed');
  const key=JSON.stringify([c.schemaId,c.entityId,c.locale]);if(keys.has(key))throw Error('Duplicate translation key');keys.add(key);
  for(const field of Object.values(c.fields))if(typeof field.textValue!=='string'||typeof field.published!=='boolean'||field.updatedBy!=='USER')throw Error('Only directly translated text fields with explicit publication status allowed');
 }
 console.log(JSON.stringify({site:'atelier-harmonie',operation,records:plan.contents.length,sha256:hash,apply,languageVisibilityChanged:false}));
 if(!apply)process.exit(0);
}
const provider=WixAppTokenProvider.fromEnv();
async function request(endpoint,body){
 const token=await provider.getToken();
 const response=await fetch('https://www.wixapis.com/translation-content/v1/'+endpoint,{method:'POST',headers:{authorization:token,'wix-site-id':siteId,'content-type':'application/json'},body:JSON.stringify(body)});
 if(!response.ok)throw Error('Wix translation request failed: HTTP '+response.status);
 return response.json();
}
await mkdir(state,{recursive:true,mode:0o700});
const before=[];let cursor;
for(let page=0;page<100;page++){
 const data=await request('contents/query',{query:{cursorPaging:{limit:100,...(cursor?{cursor}:{})}}});
 before.push(...data.contents);
 if(!data.pagingMetadata.hasNext)break;
 cursor=data.pagingMetadata.cursors.next;if(page===99)throw Error('Translation inventory incomplete');
}
const timestamp=Date.now(),snapshot=state+'/translations-before-'+timestamp+'.json';
await writeFile(snapshot,JSON.stringify({siteId,contents:before},null,2)+'\n',{mode:0o600});
if(operation==='snapshot'){console.log(JSON.stringify({site:'atelier-harmonie',records:before.length,snapshot}));process.exit(0);}
const existing=new Set(before.map(c=>JSON.stringify([c.schemaId,c.entityId,c.locale])));
for(const item of plan.contents){const c=operation==='update'?item.content:item;const found=existing.has(JSON.stringify([c.schemaId,c.entityId,c.locale]));if(operation==='create'?found:!found)throw Error('Translation key changed; rebuild and review the plan');}
const receipt={siteAlias:'atelier-harmonie',siteId,operation,planSha256:hash,snapshot,results:[],recovery:'Use the private before snapshot and documented translation update API to restore changed fields. For newly created English records retain returned IDs for a human-requested rollback. French records and language visibility are outside this command.'};
const receiptPath=state+'/translations-'+timestamp+'.json';
for(let offset=0;offset<plan.contents.length;offset+=100){
 const data=await request(operation==='create'?'bulk/contents/create':'bulk/contents/update-by-key',{contents:plan.contents.slice(offset,offset+100),returnEntity:true});
 receipt.results.push({offset,...data});
 await writeFile(receiptPath,JSON.stringify(receipt,null,2)+'\n',{mode:0o600});
 console.log(JSON.stringify({offset,...data.bulkActionMetadata}));
 if(data.bulkActionMetadata?.totalFailures)throw Error('Partial translation failure; inspect '+receiptPath);
}
console.log(JSON.stringify({receipt:receiptPath,languageVisibilityChanged:false}));
