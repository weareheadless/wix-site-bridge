#!/usr/bin/env node
import {readFile} from 'node:fs/promises';
import {WixAppTokenProvider,WixCustomEmbedsClient} from '../../../src/wix-client.mjs';
const args=process.argv.slice(2);
const get=name=>{const i=args.indexOf(name);return i>=0?args[i+1]:null};
const html=await readFile(get('--html'),'utf8');
const id=get('--id');const name=get('--name')||'Susi auto overlay';
const c=new WixCustomEmbedsClient({siteId:'878460ca-c98c-402b-8a10-862023f67cce',tokenProvider:WixAppTokenProvider.fromEnv()});
if(id){const e=await c.get(id);const r=await c.updateHtml(e,html,e.embedData.category);console.log(JSON.stringify({id:r.id,revision:r.revision}))}
else{const e=await c.create({name,position:'HEAD',category:'ESSENTIAL',html,loadOnce:true,enabled:true});console.log(JSON.stringify({id:e.id,revision:e.revision}))}
