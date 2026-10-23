#!/usr/bin/env node
// Full-record Mexican Spanish translation for the City Guides collection.
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {WixAppTokenProvider} from '../../../src/wix-client.mjs';

const alias='susimacdonald', siteId='878460ca-c98c-402b-8a10-862023f67cce';
const schemaId='1286d8f5-779e-4c02-8c92-55d68e6ebe9d';
const stateDir=path.resolve('sites/susimacdonald/.wix-bridge-state/city-guides');
const cachePath=path.join(stateDir,'es-MX.json');
const apply=process.argv.includes('--apply');
const limitArg=process.argv.indexOf('--limit');
const limit=limitArg>=0?Number(process.argv[limitArg+1]):0;
if(process.env.WIX_ALLOWED_SITE_IDS!==siteId)throw Error('Exact Susi site allowlist required');
const KEY_FILE=process.env.OPENROUTER_ENV_FILE||'/home/admin/.config/susi-translation/openrouter.env';
let apiKey=process.env.OPENROUTER_API_KEY;
if(!apiKey){for(const line of (await readFile(KEY_FILE,'utf8')).split('\n'))if(line.startsWith('OPENROUTER_API_KEY=')){apiKey=line.split('=').slice(1).join('=').trim().replace(/^['"]|['"]$/g,'');break}}
if(!apiKey)throw Error('OPENROUTER_API_KEY missing');
const model=process.env.OPENROUTER_TRANSLATOR_MODEL||'google/gemini-3.1-flash-lite';
await mkdir(stateDir,{recursive:true,mode:0o700});

async function headers(){const token=await WixAppTokenProvider.fromEnv().getToken();const h={authorization:token,'content-type':'application/json'};const id=await fetch('https://www.wixapis.com/apps/v1/instance',{headers:h});if(!id.ok)throw Error('Bridge identity HTTP '+id.status);const body=await id.json();if(body.site?.siteId!==siteId)throw Error('Bridge app installed on another site');return h}
async function inventory(h){const rows=[];let cursor;for(let page=0;page<100;page++){const r=await fetch('https://www.wixapis.com/translation-content/v1/contents/query',{method:'POST',headers:h,body:JSON.stringify({query:{cursorPaging:{limit:100,...(cursor?{cursor}:{})}}})});if(!r.ok)throw Error('Inventory HTTP '+r.status);const d=await r.json();rows.push(...(d.contents??[]));if(!d.pagingMetadata?.hasNext)return rows;cursor=d.pagingMetadata.cursors?.next}throw Error('Inventory too large')}
const tags=html=>[...String(html).matchAll(/<[^>]*>/g)].map(m=>m[0]);
const hrefs=html=>[...String(html).matchAll(/href="([^"]*)"/g)].map(m=>m[1]);
const numbers=text=>[...String(text).replace(/<[^>]*>/g,' ').matchAll(/\b\d+(?:[.,]\d+)?\b/g)].map(m=>m[0]).sort();
function validate(source,target,label){
 const a=tags(source),b=tags(target);
 if(JSON.stringify(a)!==JSON.stringify(b))throw Error(`${label}: HTML tag sequence changed`);
 if(JSON.stringify(hrefs(source))!==JSON.stringify(hrefs(target)))throw Error(`${label}: links changed`);
 const srcNums=new Set(numbers(source)),tgtNums=new Set(numbers(target));const missing=[...srcNums].filter(n=>!tgtNums.has(n));if(missing.length)throw Error(`${label}: missing numeric facts ${JSON.stringify(missing).slice(0,500)}`);
}
function protectNumbers(text){
 const values=[];
 const out=String(text).split(/(<[^>]*>)/g).map(part=>part.startsWith('<')?part:part.replace(/\d+(?:[.,]\d+)?/g,m=>{values.push(m);return `⟦${values.length-1}⟧`})).join('');
 return {text:out,restore:value=>String(value).replace(/⟦(\d+)⟧/g,(all,index)=>values[Number(index)]??all)};
}
async function translate(title,content){
 const pTitle=protectNumbers(title),pContent=protectNumbers(content);
 const prompt=`Translate this Riviera Maya city guide into natural Mexican Spanish. Return JSON {"title":"...","content":"..."} where content is the complete HTML with every tag, attribute, href, class and image preserved exactly, and every ⟦n⟧ marker preserved in place. Translate only visible text. Keep place names and legal meaning exact. Do not summarize or omit anything.\n${JSON.stringify({title:pTitle.text,content:pContent.text})}`;
 let lastError;
 for(let attempt=0;attempt<3;attempt++){
  const r=await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','HTTP-Referer':'https://github.com/weareheadless/wix-site-bridge','X-Title':'Susi city guides'},body:JSON.stringify({model,temperature:0,response_format:{type:'json_object'},max_tokens:16000,messages:[{role:'system',content:'Return only JSON. Preserve HTML structure exactly.'},{role:'user',content:prompt}]})});
  if(!r.ok){lastError=Error(`OpenRouter HTTP ${r.status}`);continue}
  const d=await r.json();const text=d.choices?.[0]?.message?.content;if(!text||d.choices?.[0]?.finish_reason!=='stop'){lastError=Error('Incomplete model response');continue}
  let out;try{out=JSON.parse(text)}catch{lastError=Error('Invalid model JSON');continue}
  if(typeof out.title!=='string'||typeof out.content!=='string'){lastError=Error('Invalid model JSON');continue}
  out={title:pTitle.restore(out.title),content:pContent.restore(out.content)};
  try{validate(title,out.title,'title');validate(content,out.content,'content');return out}catch(error){lastError=error}
 }
 throw lastError;
}

const h=await headers();const rows=await inventory(h);
const en=rows.filter(r=>r.locale==='en'&&r.schemaId===schemaId);
const es=new Map(rows.filter(r=>r.locale==='es'&&r.schemaId===schemaId).map(r=>[r.entityId,r]));
let cache={};try{cache=JSON.parse(await readFile(cachePath,'utf8'))}catch{}
const selected=limit?en.slice(0,limit):en;
const results=[];
for(const row of selected){
 const title=row.fields?.title?.textValue??'';const content=row.fields?.cityGuideContent?.textValue??'';
 if(!title||!content)continue;
 const key=`${row.entityId}:${Buffer.from(title+content).toString('base64').slice(0,16)}`;
 let out=cache[key];
 if(!out){out=await translate(title,content);cache[key]=out;await writeFile(cachePath,JSON.stringify(cache,null,2)+'\n',{mode:0o600});}
 results.push({entityId:row.entityId,parentEntityId:row.parentEntityId,title,content,translated:out});
 console.log(JSON.stringify({entityId:row.entityId,title:out.title,contentChars:out.content.length}));
}
if(!apply){console.log(JSON.stringify({status:'preview',records:results.length}));process.exit(0)}
const receipt={site:alias,schemaId,status:'started',records:[],appliedAt:new Date().toISOString()};
const missing=results.filter(r=>!es.has(r.entityId));
for(let i=0;i<missing.length;i+=50){
 const contents=missing.slice(i,i+50).map(r=>({schemaId,entityId:r.entityId,locale:'es',...(r.parentEntityId?{parentEntityId:r.parentEntityId}:{}),fields:{title:{textValue:r.translated.title,published:false},cityGuideContent:{textValue:r.translated.content,published:false}}}));
 const res=await fetch('https://www.wixapis.com/translation-content/v1/bulk/contents/create',{method:'POST',headers:h,body:JSON.stringify({contents,returnEntity:true})});
 if(!res.ok)throw Error('Draft create HTTP '+res.status+' '+await res.text());
 const body=await res.json();receipt.records.push({stage:'create',body});
 if(body.bulkActionMetadata?.totalFailures||!body.results?.every(x=>x.itemMetadata?.success))throw Error('Partial draft create');
}
const updates=results.map(r=>({content:{schemaId,entityId:r.entityId,locale:'es',fields:{title:{textValue:r.translated.title,published:true,updatedBy:'USER'},cityGuideContent:{textValue:r.translated.content,published:true,updatedBy:'USER'}}}}));
for(let i=0;i<updates.length;i+=50){
 const res=await fetch('https://www.wixapis.com/translation-content/v1/bulk/contents/update-by-key',{method:'POST',headers:h,body:JSON.stringify({contents:updates.slice(i,i+50),returnEntity:true})});
 if(!res.ok)throw Error('Publish HTTP '+res.status+' '+await res.text());
 const body=await res.json();receipt.records.push({stage:'publish',body});
 if(body.bulkActionMetadata?.totalFailures||!body.results?.every(x=>x.itemMetadata?.success))throw Error('Partial publish');
}
const verified=await inventory(h);const map=new Map(verified.map(r=>[r.entityId+'|'+r.locale,r]));
for(const r of results){const saved=map.get(r.entityId+'|es');if(saved?.fields?.title?.published!==true||saved?.fields?.title?.textValue!==r.translated.title||saved?.fields?.cityGuideContent?.textValue!==r.translated.content)throw Error('Read-back mismatch '+r.entityId)}
receipt.status='verified';const receiptPath=path.join(stateDir,`receipt-${Date.now()}.json`);await writeFile(receiptPath,JSON.stringify(receipt,null,2)+'\n',{mode:0o600});
console.log(JSON.stringify({status:'verified',records:results.length,receipt:receiptPath}));
