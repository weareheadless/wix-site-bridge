import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {WixAppTokenProvider} from '../../../src/wix-client.mjs';
const site='878460ca-c98c-402b-8a10-862023f67cce',base='sites/susimacdonald/.wix-bridge-state';
if(process.argv[2]!=='--site'||process.argv[3]!=='susimacdonald'||process.env.WIX_ALLOWED_SITE_IDS!==site)throw Error('Exact Susi target required');
const source=await readFile(base+'/native-spanish-plan.json','utf8'),plan=JSON.parse(source),apply=process.argv.includes('--apply');
for(const r of plan.contents){if(r.locale!=='es'||!r.schemaId||!r.entityId)throw Error('Invalid Spanish key');for(const f of Object.values(r.fields))if(typeof f.textValue!=='string'||f.published!==false||f.updatedBy!=='USER')throw Error('Only direct draft text allowed');}
const hash=createHash('sha256').update(source).digest('hex');console.log(JSON.stringify({site:'susimacdonald',operation:'create-spanish-drafts',records:plan.contents.length,fields:plan.contents.reduce((n,r)=>n+Object.keys(r.fields).length,0),sha256:hash,apply,languageVisibilityChanged:false}));if(!apply)process.exit(0);
const token=await WixAppTokenProvider.fromEnv().getToken(),headers={authorization:token,'content-type':'application/json'};
const identity=await(await fetch('https://www.wixapis.com/apps/v1/instance',{headers})).json();if(identity.site?.siteId!==site)throw Error('Wrong installed site');
const existing=new Set();let cursor;
for(let page=0;page<100;page++){const r=await fetch('https://www.wixapis.com/translation-content/v1/contents/query',{method:'POST',headers,body:JSON.stringify({query:{cursorPaging:{limit:100,...(cursor?{cursor}:{})}}})});if(!r.ok)throw Error('Inventory HTTP '+r.status);const data=await r.json();for(const c of data.contents)existing.add(JSON.stringify([c.schemaId,c.entityId,c.locale]));if(!data.pagingMetadata?.hasNext)break;cursor=data.pagingMetadata.cursors.next;if(page===99)throw Error('Inventory incomplete');}
for(const r of plan.contents)if(existing.has(JSON.stringify([r.schemaId,r.entityId,r.locale])))throw Error('Draft already exists; rebuild plan before mutation');
const receipt={siteAlias:'susimacdonald',siteId:site,planSha256:hash,sourceSnapshot:base+'/translation-inventory.json',results:[],recovery:'Created Spanish drafts only; preserve returned IDs for deliberate removal or correction. Original English and language visibility were not changed.'},path=base+'/spanish-drafts-receipt-'+Date.now()+'.json';
for(let i=0;i<plan.contents.length;i+=100){const r=await fetch('https://www.wixapis.com/translation-content/v1/bulk/contents/create',{method:'POST',headers,body:JSON.stringify({contents:plan.contents.slice(i,i+100),returnEntity:true})});if(!r.ok)throw Error('Draft create HTTP '+r.status);const data=await r.json();receipt.results.push(data);await writeFile(path,JSON.stringify(receipt,null,2)+'\n',{mode:0o600});console.log(JSON.stringify({offset:i,...data.bulkActionMetadata}));if(data.bulkActionMetadata?.totalFailures)throw Error('Partial failure; inspect private receipt');}
console.log(JSON.stringify({receipt:path}));
