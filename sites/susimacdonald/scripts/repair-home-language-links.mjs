#!/usr/bin/env node
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gunzipSync,gzipSync} from 'node:zlib';
import path from 'node:path';
import {runOperation} from '../../../src/bridge.mjs';

const alias='susimacdonald',siteId='878460ca-c98c-402b-8a10-862023f67cce';
const id='87186364-afc7-4103-8428-f783be13e7c8';
if(process.argv[2]!=='--site'||process.argv[3]!==alias||process.env.WIX_ALLOWED_SITE_IDS!==siteId)throw Error('Exact Susi site boundary required');
const base=path.resolve(import.meta.dirname,'..');
const manifest=path.join(base,'site.manifest.json');
const stateDir=path.join(base,'.wix-bridge-state');
const current=(await runOperation('snippet',{manifest,site:alias,stateDir,snippet:id},process.env,{transport:'cli'})).snippet;
let html=current.embedData?.html??'',changed=0;
for(const match of [...html.matchAll(/\["([^"\\]+)","([A-Za-z0-9+/=]+)"\]/g)]){
  let source=gunzipSync(Buffer.from(match[2],'base64')).toString('utf8');
  const old="url.pathname='/es'+(url.pathname==='/'?'/':url.pathname);return url.pathname+url.search+url.hash;";
  if(!source.includes(old))continue;
  source=source.replace(old,"url.searchParams.set('lang','es');return url.pathname+url.search+url.hash;");
  html=html.replace(match[2],gzipSync(Buffer.from(source),{level:9,mtime:0}).toString('base64'));changed++;
}
if(!changed)throw Error('No legacy /es links found; inspect current snippet before changing it');
if(html.length>15000)throw Error('Corrected homepage packet exceeds Wix embed limit');
await mkdir(stateDir,{recursive:true,mode:0o700});
const file=path.join(stateDir,'home-query-language-links.html');
await writeFile(file,html,{mode:0o600});
const args={manifest,site:alias,stateDir,snippet:id,htmlFile:file,allPages:true};
const plan=await runOperation('update-snippet',args,process.env,{transport:'cli'});
if(plan.status!=='dry-run')throw Error('Bridge did not produce a dry-run');
if(!process.argv.includes('--apply')){console.log(JSON.stringify({site:alias,status:'dry-run',components:changed,htmlBytes:html.length}));process.exit(0)}
const receipt=await runOperation('update-snippet',{...args,apply:true},process.env,{transport:'cli'});
if(receipt.status!=='updated')throw Error(`Bridge update failed; inspect ${receipt.receiptPath}`);
console.log(JSON.stringify({site:alias,status:'updated',components:changed,receiptPath:receipt.receiptPath}));
