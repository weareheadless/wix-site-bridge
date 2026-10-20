#!/usr/bin/env node
import {writeFile,mkdir} from 'node:fs/promises';
import {gunzipSync,gzipSync} from 'node:zlib';
import path from 'node:path';
import {runOperation} from '../../../src/bridge.mjs';
import {cityContextRules} from './city-context-rules.mjs';

const alias='susimacdonald',siteId='878460ca-c98c-402b-8a10-862023f67cce';
if(process.argv[2]!=='--site'||process.argv[3]!==alias||process.env.WIX_ALLOWED_SITE_IDS!==siteId)throw Error('Exact Susi site boundary required');
const base=path.resolve(import.meta.dirname,'..');
const manifest=path.join(base,'site.manifest.json');
const stateDir=path.join(base,'.wix-bridge-state/page-translations');
const ids=['f1609014-c6c1-4eaa-804e-d28c87713dd1','cf970d8b-e82e-41d5-a118-a9e0a7998d06'];
await mkdir(stateDir,{recursive:true,mode:0o700});
for(const id of ids){
  const current=(await runOperation('snippet',{manifest,site:alias,stateDir,snippet:id},process.env,{transport:'cli'})).snippet;
  let html=current.embedData?.html??'',changed=0;
  for(const match of [...html.matchAll(/\["([^"\\]+)","([A-Za-z0-9+/=]+)"\]/g)]){
    let source=gunzipSync(Buffer.from(match[2],'base64')).toString('utf8');
    const anchor='let translated=__susiDictionary[text];';
    if(!source.includes(anchor))throw Error(`Missing city localization helper in ${id}`);
    if(source.includes('const lead=text.match('))continue;
    source=source.replace(anchor,anchor+cityContextRules);
    html=html.replace(match[2],gzipSync(Buffer.from(source),{level:9,mtime:0}).toString('base64'));
    changed++;
  }
  if(!changed)throw Error(`No city packet changed in ${id}`);
  if(html.length>15000)throw Error(`Corrected city packet ${id} exceeds Wix embed limit`);
  const file=path.join(stateDir,`city-context-${id}.html`);
  await writeFile(file,html,{mode:0o600});
  const args={manifest,site:alias,stateDir,snippet:id,htmlFile:file,allPages:true};
  const plan=await runOperation('update-snippet',args,process.env,{transport:'cli'});
  if(plan.status!=='dry-run')throw Error('Bridge dry-run failed');
  if(!process.argv.includes('--apply')){console.log(JSON.stringify({site:alias,status:'dry-run',id,htmlBytes:html.length}));continue}
  const receipt=await runOperation('update-snippet',{...args,apply:true},process.env,{transport:'cli'});
  if(receipt.status!=='updated')throw Error(`Bridge update failed; inspect ${receipt.receiptPath}`);
  console.log(JSON.stringify({site:alias,status:'updated',id,receiptPath:receipt.receiptPath}));
}
