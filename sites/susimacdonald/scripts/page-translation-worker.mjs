#!/usr/bin/env node
// One invocation reviews one real route. Shared packets are released only after all their routes pass.
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {gunzipSync, gzipSync} from 'node:zlib';
import path from 'node:path';
import {WixAppTokenProvider, WixCustomEmbedsClient} from '../../../src/wix-client.mjs';
import {runOperation} from '../../../src/bridge.mjs';

const execFileAsync=promisify(execFile);
const alias='susimacdonald', siteId='878460ca-c98c-402b-8a10-862023f67cce';
const root=path.resolve(import.meta.dirname,'../../..');
const base=path.join(root,'sites/susimacdonald');
const manifestPath=path.join(base,'site.manifest.json');
const pagePath=path.join(base,'translation-pages.json');
const stateDir=path.join(base,'.wix-bridge-state/page-translations');
const statePath=path.join(stateDir,'progress.json');
const budgetPath=path.join(stateDir,'openrouter-spend.json');
const apply=process.argv.includes('--apply');
const preview=process.argv.includes('--preview');
const sha=value=>createHash('sha256').update(value).digest('hex');
const fail=message=>{throw Error(message)};
if(process.argv.includes('--site')===false||process.argv[process.argv.indexOf('--site')+1]!==alias)fail('Explicit --site susimacdonald required');
if(process.env.WIX_ALLOWED_SITE_IDS!==siteId)fail('Exact Susi site allowlist required');
const config=JSON.parse(await readFile(pagePath,'utf8'));
const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
if(config.siteId!==siteId||config.siteAlias!==alias||manifest.site.siteId!==siteId||config.phase!=='embeds')fail('Site or phase boundary mismatch');
await mkdir(stateDir,{recursive:true,mode:0o700});
const readState=async()=>{try{return JSON.parse(await readFile(statePath,'utf8'))}catch(error){if(error.code==='ENOENT')return {group:0,route:0,status:'new'};throw error}};
const save=async state=>writeFile(statePath,JSON.stringify(state,null,2)+'\n',{mode:0o600});
if(preview){const s=await readState();console.log(JSON.stringify({site:alias,phase:'embeds',nextGroup:config.groups[s.group]?.name??null,nextRoute:config.groups[s.group]?.routes[s.route]??null,state:s.status,apply:false}));process.exit(0)}
if(!apply){console.log('Dry-run: pass --apply to process one page. No Wix writes occur until both independent reviews pass.');process.exit(0)}
if(!process.env.OPENROUTER_API_KEY)fail('OPENROUTER_API_KEY is not configured; no page was processed');
if(!process.env.CHROMIUM_PATH)fail('CHROMIUM_PATH is required for rendered page screenshots');

const client=new WixCustomEmbedsClient({siteId,tokenProvider:WixAppTokenProvider.fromEnv()});
const live=await client.listAll();
const state=await readState();
if(['releasing','post-review-held','held'].includes(state.status))fail(`Previous quality or release hold requires inspection before resuming: ${statePath}`);
const group=config.groups[state.group];
if(!group){console.log(JSON.stringify({status:'listed-embed-groups-reviewed',deferred:config.deferred}));process.exit(0)}
const route=group.routes[state.route];
if(!route)fail('Invalid route index in private progress state');
const packetPattern=/\["([^"\\]+)","([A-Za-z0-9+/=]+)"\]/g;
function dictionaryRange(source){
  const anchor='const __susiDictionary=';const start=source.indexOf(anchor);
  if(start<0)fail('Packet lacks Spanish dictionary; needs source-level localization first');
  const at=start+anchor.length;let depth=0,quoted=false,escaped=false;
  for(let i=at;i<source.length;i++){const c=source[i];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;continue}if(c==='"'){quoted=true;continue}if(c==='{')depth++;if(c==='}'&&--depth===0)return {start:at,end:i+1,value:JSON.parse(source.slice(at,i+1))}}
  fail('Unclosed Spanish dictionary');
}
function unpack(html,keys){
  const found=[...html.matchAll(packetPattern)];
  if(found.length!==keys.length||found.some((item,i)=>item[1]!==keys[i]))fail('Packet structure or key order drifted');
  return found.map(item=>{const source=gunzipSync(Buffer.from(item[2],'base64')).toString('utf8');const dict=dictionaryRange(source);return {key:item[1],source,dict,encoded:item[2]}});
}
function replacePacket(html,packet,updates){
  let revised=html;
  for(const part of packet){const values={...part.dict.value,...updates[part.key]};const source=part.source.slice(0,part.dict.start)+JSON.stringify(values)+part.source.slice(part.dict.end);const encoded=gzipSync(Buffer.from(source),{level:9,mtime:0}).toString('base64');revised=revised.replace(part.encoded,encoded)}
  if(revised.length>15000)fail('Rebuilt packet exceeds Wix 15 KB limit');
  return revised;
}
function protect(source,target){
  if(typeof target!=='string'||!target.trim())fail('Empty translation');
  const tokens=s=>[...s.matchAll(/https?:\/\/[^\s<>"']+|\{[^{}]+\}|\$\s?[\d.,]+|\b\d+(?:[.,]\d+)?\s?(?:%|m²|km|USD|MXN|years?)?\b/g)].map(x=>x[0]).sort();
  if(JSON.stringify(tokens(source))!==JSON.stringify(tokens(target)))fail(`Protected URL, number or placeholder changed in ${JSON.stringify(source)}`);
}
async function openrouter(model,messages,maxTokens=12000){
  const day=new Date().toISOString().slice(0,10);
  let budget={day,estimatedUsd:0};try{budget=JSON.parse(await readFile(budgetPath,'utf8'));if(budget.day!==day)budget={day,estimatedUsd:0}}catch(error){if(error.code!=='ENOENT')throw error}
  if(budget.estimatedUsd>=Number(process.env.OPENROUTER_DAILY_BUDGET_USD||5))fail('OpenRouter daily worker budget reached');
  const response=await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENROUTER_API_KEY}`,'Content-Type':'application/json','HTTP-Referer':'https://github.com/weareheadless/wix-site-bridge','X-Title':'Susi page translation worker'},body:JSON.stringify({model,messages,temperature:0,response_format:{type:'json_object'},max_tokens:maxTokens}),signal:AbortSignal.timeout(180000)});
  if(!response.ok)fail(`OpenRouter ${model} HTTP ${response.status}`);
  const json=await response.json();const content=json.choices?.[0]?.message?.content;
  const rates={'google/gemini-3.1-flash-lite':[0.25,1.5],'google/gemini-3-flash-preview':[0.5,3]};
  const rate=rates[model];if(!rate)fail(`No cost rate configured for ${model}`);
  const usage=json.usage??{};
  budget.estimatedUsd+=((usage.prompt_tokens??0)*rate[0]+(usage.completion_tokens??0)*rate[1])/1_000_000;
  await writeFile(budgetPath,JSON.stringify(budget,null,2)+'\n',{mode:0o600});
  if(!content||json.choices?.[0]?.finish_reason!=='stop')fail(`Incomplete OpenRouter response from ${model}`);
  try{return {data:JSON.parse(content),usage:json.usage??{}}}catch{fail(`Invalid JSON from ${model}`)}
}
async function screenshot(pageRoute,locale,label){
  const target=new URL(pageRoute,config.baseUrl);
  // This Wix site currently renders Spanish embeds with ?lang=es; /es/ is a live 404.
  if(locale==='es')target.searchParams.set('lang','es');
  const url=target.href;
  const status=await fetch(url,{method:'GET',redirect:'follow',signal:AbortSignal.timeout(30000)});
  if(!status.ok)fail(`Public route ${url} returned HTTP ${status.status}`);
  await status.body?.cancel();
  const output=path.join(stateDir,`${group.name}-${state.route}-${label}.png`);
  await execFileAsync(process.env.CHROMIUM_PATH,['--headless=new','--no-sandbox','--disable-gpu','--hide-scrollbars','--window-size=1440,1100','--virtual-time-budget=12000',`--screenshot=${output}`,url],{timeout:60000,maxBuffer:200000});
  const bytes=await readFile(output);if(bytes.length<15000)fail(`Rendered screenshot is empty for ${url}`);
  return {url,path:output,image:`data:image/png;base64,${bytes.toString('base64')}`};
}
function rowsFor(packets){return packets.flatMap(item=>item.parts.flatMap(part=>Object.entries(part.dict.value).map(([english,current])=>({packetId:item.id,component:part.key,english,current}))));}
function checkedResult(result,rows){
  if(!Array.isArray(result.translations)||result.translations.length!==rows.length)fail('Model did not return every phrase');
  const outputs={};const indices=new Set();
  for(const item of result.translations){if(!Number.isInteger(item.index)||item.index<0||item.index>=rows.length||indices.has(item.index))fail('Duplicate or missing phrase index');indices.add(item.index);const row=rows[item.index];protect(row.english,item.spanish);(outputs[row.packetId]??={})[row.component]??={};outputs[row.packetId][row.component][row.english]=item.spanish}
  return outputs;
}
const packets=group.packets.map(spec=>{const embed=live.find(x=>x.id===spec.id);if(!embed||!embed.enabled||embed.pageFilter?.pageIds?.length)fail(`Missing or changed global embed ${spec.id}`);const html=embed.embedData?.html;if(!html)fail(`Empty embed ${spec.id}`);return {id:spec.id,revision:String(embed.revision),html,parts:unpack(html,spec.keys)}});
let candidate=state.candidate;
if(!candidate){
  const rows=rowsFor(packets);
  const request=rows.map((row,index)=>({index,component:row.component,english:row.english,currentSpanish:row.current}));
  const translation=await openrouter(process.env.OPENROUTER_TRANSLATOR_MODEL||'google/gemini-3.1-flash-lite',[{role:'system',content:'Translate the COMPLETE page copy into natural Mexican Spanish for a luxury Riviera Maya real estate site. Review existing Spanish; retain good translations, correct awkward or inaccurate ones. Keep Susi MacDonald and all place names, property facts, prices, measurements, URLs and placeholders exact. Do not translate brand names. Return JSON object {translations:[{index,spanish}]} covering every index exactly once. No word-by-word rendering; make the page read coherently.'},{role:'user',content:JSON.stringify({route,group:group.name,purpose:group.purpose,phrases:request})}]);
  const values=checkedResult(translation.data,rows);
  candidate={base:packets.map(({id,revision,html})=>({id,revision,sha256:sha(html)})),values,translatorUsage:translation.usage};
  state.candidate=candidate;state.status='candidate';await save(state);
}
for(const item of packets){const prior=candidate.base.find(x=>x.id===item.id);if(!prior||prior.revision!==item.revision||prior.sha256!==sha(item.html))fail(`Live embed ${item.id} changed since candidate creation; manual review required`)}
const englishShot=await screenshot(route,'en','english');
const spanishShot=await screenshot(route,'es','spanish-before');
const sourceRows=rowsFor(packets);
let proposed=sourceRows.map((row,index)=>({index,component:row.component,english:row.english,spanish:candidate.values[row.packetId]?.[row.component]?.[row.english]}));
let review,reviewPath;
for(let attempt=0;attempt<2;attempt++){
  review=await openrouter(process.env.OPENROUTER_REVIEW_MODEL||'google/gemini-3-flash-preview',[{role:'system',content:'Independently review this ONE page of English and Mexican Spanish real-estate copy in context. The images show the currently published page and are context for tone, product and layout; the proposed Spanish text is in the JSON. Check every phrase for natural Mexican Spanish, factual fidelity, correct geography and clear terminology. Reject only a material translation error: missing or added meaning, changed facts, untranslated English, or Spanish that harms comprehension. Accept normal synonyms and CTA wording; for example Precio de venta, Precio solicitado and Precio de lista can all convey Asking price, while Ver propiedad or Explorar propiedad can convey Explore home. Do not reject a stylistic preference or reverse an earlier accepted synonym. Existing unrelated Wix or CMS English may remain. Return JSON {approved:boolean,issues:[{index:number,reason:string}],summary:string}. Approve when there are no material errors.'},{role:'user',content:[{type:'text',text:JSON.stringify({route,purpose:group.purpose,phrases:proposed})},{type:'image_url',image_url:{url:englishShot.image}},{type:'image_url',image_url:{url:spanishShot.image}}]}],5000);
  reviewPath=path.join(stateDir,`${group.name}-${state.route}-review-${attempt}.json`);
  await writeFile(reviewPath,JSON.stringify({route,purpose:group.purpose,review:review.data,usage:review.usage},null,2)+'\n',{mode:0o600});
  if(review.data.approved===true&&Array.isArray(review.data.issues)&&!review.data.issues.length)break;
  if(!Array.isArray(review.data.issues)||!review.data.issues.length||attempt===1){state.status='held';await save(state);fail(`Page review held ${route}; inspect ${reviewPath}`)}
  const rejected=review.data.issues.map(issue=>({index:issue.index,reason:issue.reason,...proposed[issue.index]}));
  if(rejected.some(x=>!Number.isInteger(x.index)||!x.english||!x.reason)){state.status='held';await save(state);fail(`Reviewer returned invalid correction indices; inspect ${reviewPath}`)}
  const correction=await openrouter(process.env.OPENROUTER_TRANSLATOR_MODEL||'google/gemini-3.1-flash-lite',[{role:'system',content:'Correct only the flagged Mexican Spanish real-estate translations. Preserve the English meaning, all names, facts, numbers, URLs and placeholders. Return JSON {translations:[{index,spanish}]} for every flagged index exactly once.'},{role:'user',content:JSON.stringify({route,purpose:group.purpose,reviewIssues:rejected,fullPage:proposed})}],4000);
  if(!Array.isArray(correction.data.translations)||correction.data.translations.length!==rejected.length){state.status='held';await save(state);fail('Correction response omitted flagged phrases')}
  const seen=new Set();for(const entry of correction.data.translations){if(seen.has(entry.index)||!rejected.some(x=>x.index===entry.index)){state.status='held';await save(state);fail('Correction response changed unflagged phrase')}seen.add(entry.index);const row=sourceRows[entry.index];protect(row.english,entry.spanish);candidate.values[row.packetId][row.component][row.english]=entry.spanish}
  state.candidate=candidate;await save(state);
  proposed=sourceRows.map((row,index)=>({index,component:row.component,english:row.english,spanish:candidate.values[row.packetId]?.[row.component]?.[row.english]}));
}
state.route++;state.status='reviewed';await save(state);
if(state.route<group.routes.length){console.log(JSON.stringify({site:alias,status:'page-reviewed',route,next:group.routes[state.route],published:false}));process.exit(0)}
// A shared packet is released only after every route using it has passed independent page review.
for(const item of packets){const revised=replacePacket(item.html,item.parts,candidate.values[item.id]??{});const file=path.join(stateDir,`${group.name}-${item.id}.html`);await writeFile(file,revised,{mode:0o600});const args={manifest:manifestPath,site:alias,stateDir,snippet:item.id,htmlFile:file,allPages:true};const plan=await runOperation('update-snippet',args,process.env,{transport:'cli'});if(plan.status!=='dry-run')fail(`Bridge dry-run failed for ${item.id}`)}
state.status='releasing';await save(state);
for(const item of packets){const file=path.join(stateDir,`${group.name}-${item.id}.html`);const args={manifest:manifestPath,site:alias,stateDir,snippet:item.id,htmlFile:file,allPages:true,apply:true};const receipt=await runOperation('update-snippet',args,process.env,{transport:'cli'});if(receipt.status!=='updated')fail(`Bridge update failed for ${item.id}; inspect receipts before retrying`);(state.receipts??=[]).push({group:group.name,id:item.id,receiptPath:receipt.receiptPath});await save(state)}
for(let i=0;i<group.routes.length;i++){
  state.route=i;await save(state);
  const after=await screenshot(group.routes[i],'es','spanish-after');
  const result=await openrouter(process.env.OPENROUTER_REVIEW_MODEL||'google/gemini-3-flash-preview',[{role:'system',content:'Review the ACTUALLY RENDERED Spanish page screenshot after the embed release. Check whether the page has visible Spanish in its embed areas, no obvious untranslated embed headings/buttons, no broken or blank major content, and no layout failure. Some native Wix or CMS English can remain; do not judge those in this embed phase. Return JSON {approved:boolean,issues:[{reason:string}],summary:string}. Reject any uncertain or broken embed.'},{role:'user',content:[{type:'text',text:JSON.stringify({route:group.routes[i],purpose:group.purpose,expectedEmbedPhrases:proposed.map(x=>x.spanish)})},{type:'image_url',image_url:{url:after.image}}]}],2500);
  const file=path.join(stateDir,`${group.name}-${i}-post-review.json`);await writeFile(file,JSON.stringify({route:group.routes[i],review:result.data,usage:result.usage},null,2)+'\n',{mode:0o600});
  if(result.data.approved!==true||!Array.isArray(result.data.issues)||result.data.issues.length){state.status='post-review-held';await save(state);fail(`Published page review held ${group.routes[i]}; inspect ${file} and bridge recovery receipts`)}
}
state.group++;state.route=0;state.candidate=null;state.status='released';await save(state);
console.log(JSON.stringify({site:alias,status:'group-released',group:group.name,routes:group.routes,receipts:state.receipts?.slice(-packets.length)}));
