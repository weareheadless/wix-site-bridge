#!/usr/bin/env python3
"""Build-time pipeline: crawl packet tags, translate visible strings, append a localizer, rebuild and push packets."""
import base64, gzip, json, os, re, shutil, socket, subprocess, tempfile, time, urllib.request
from pathlib import Path
import websocket

ROOT=Path('/home/admin/wix-site-bridge'); BASE=ROOT/'sites/susimacdonald'; STATE=BASE/'.wix-bridge-state'
CACHE=STATE/'auto-translations'/'packets'; CACHE.mkdir(parents=True,exist_ok=True)
CHROME=os.environ.get('CHROMIUM_PATH','/home/admin/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome')
ESBUILD=os.environ.get('ESBUILD_BIN',str(ROOT/'node_modules/esbuild/bin/esbuild'))
MODEL=os.environ.get('OPENROUTER_TRANSLATOR_MODEL','google/gemini-3.1-flash-lite')
KEY_FILE=Path(os.environ.get('OPENROUTER_ENV_FILE','/home/admin/.config/susi-translation/openrouter.env'))
SITE='https://www.susimacdonald.com'
ENTRIES=[
 {'name':'cities-hero','embed':'f1609014-c6c1-4eaa-804e-d28c87713dd1','components':[('property-hero-v2','property-hero-v2')],'routes':['/homes-for-sale-in-cozumel','/puerto-morelos-real-estate']},
 {'name':'cities-listings','embed':'cf970d8b-e82e-41d5-a118-a9e0a7998d06','components':[('property-listings-v2','property-listings-v2')],'routes':['/homes-for-sale-in-cozumel','/puerto-morelos-real-estate']},
 {'name':'cities-guide','embed':'4358a4f4-b8a6-424e-b35f-42f11f0b54b7','components':[('property-guide-v2','property-guide-v2')],'routes':['/homes-for-sale-in-cozumel','/puerto-morelos-real-estate']},
 {'name':'playa','embed':'67d39dc3-f840-4ee0-b897-94efaf0064fd','components':[('playa-city-properties-hero','playa-city-properties-hero')],'routes':['/homes-for-sale-in-cozumel']},
 {'name':'units','embed':'7acc2d1d-cb80-4086-8d6e-5e767f6002ef','components':[('unit-type-collection-split','unit-type-collection-split')],'routes':['/riviera-maya-beachfront-sale','/riviera-maya-penthouses-sale']},
 {'name':'home','embed':'87186364-afc7-4103-8428-f783be13e7c8','components':[('home-property-slider','home-property-slider'),('home-featured-properties-v2','home-featured-properties-v2')],'routes':['/']},
 {'name':'rentals','embed':'9410c467-b293-48f9-8bff-9e888063c9bf','components':[('rental-experience-v2','rental-experience-v2')],'routes':['/apartments-for-rent-in-playa-del-carmen']},
 {'name':'listing-detail','embed':'0a8830a0-e744-4255-9893-d32aded70d6b','components':[('listing-detail-v1',['listing-header-v1','listing-location-v1','listing-faq-v1','listing-related-v1'])],'routes':['/real-estate-listings/costera---playa-del-carmen','/real-estate-listings/volta-202---playa-del-carmen-rental']},
]

def key():
 k=os.environ.get('OPENROUTER_API_KEY')
 if k:return k
 for line in KEY_FILE.read_text().splitlines():
  if line.startswith('OPENROUTER_API_KEY='):return line.split('=',1)[1].strip().strip('"\'')
 raise SystemExit('missing key')

def free_port():
 with socket.socket() as s:s.bind(('127.0.0.1',0));return s.getsockname()[1]

def extract(route,tags):
 port=free_port();profile=tempfile.mkdtemp(prefix='susi-pipe-')
 p=subprocess.Popen([CHROME,'--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--hide-scrollbars',f'--remote-debugging-port={port}','--remote-allow-origins=*',f'--user-data-dir={profile}','--window-size=1440,1100','about:blank'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 ws=None
 try:
  targets=None
  for _ in range(80):
   try:targets=json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json',timeout=1));break
   except Exception:time.sleep(.25)
  page=next(t for t in targets if t.get('type')=='page');ws=websocket.create_connection(page['webSocketDebuggerUrl'],timeout=90);n=0
  def cmd(m,params=None):
   nonlocal n;n+=1;ws.send(json.dumps({'id':n,'method':m,'params':params or {}}))
   while True:
    msg=json.loads(ws.recv())
    if msg.get('id')==n:
     if 'error'in msg:raise SystemExit(msg['error'].get('message','CDP'))
     return msg.get('result',{})
  def ev(expr):
   r=cmd('Runtime.evaluate',{'expression':expr,'returnByValue':True});return r.get('result',{}).get('value')
  cmd('Page.enable');cmd('Runtime.enable');cmd('Page.navigate',{'url':SITE+route+('&' if '?' in route else '?')+'lang=es'});time.sleep(8)
  expr="""(()=>{const tags=%s,out=new Set();const ok=t=>{t=(t||'').replace(/\\s+/g,' ').trim();return t.length>3&&t.length<1200&&/[A-Za-z]/.test(t)&&!/^(https?:|\\/|[0-9.%% ,+\\- ]+$)/.test(t)};const add=t=>{if(ok(t))out.add(t.replace(/\\s+/g,' ').trim())};const queue=[];for(const tag of tags)for(const el of document.querySelectorAll(tag))queue.push(el.shadowRoot||el);while(queue.length){const root=queue.shift();const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){const p=n.parentElement;if(p&&['SCRIPT','STYLE','NOSCRIPT','CODE','PRE'].includes(p.tagName))continue;add(n.nodeValue)}for(const x of root.querySelectorAll('*')){for(const a of ['placeholder','aria-label','alt','title']){const v=x.getAttribute(a);if(v)add(v)}if(x.shadowRoot)queue.push(x.shadowRoot)}}return [...out]})()"""%json.dumps(tags)
  return ev(expr) or []
 finally:
  try:ws and ws.close()
  except Exception:pass
  p.terminate()
  try:p.wait(timeout=10)
  except Exception:p.kill()
  shutil.rmtree(profile,ignore_errors=True)

def translate(strings):
 if not strings:return {}
 result={};pending=list(strings)
 for _ in range(4):
  if not pending:break
  for i in range(0,len(pending),20):
   batch=pending[i:i+20]
   prompt='Translate these website strings into natural Mexican Spanish for a luxury Riviera Maya real estate site. Preserve names, prices, URLs, numbers and legal meaning. Return a JSON object mapping each exact input string to its Spanish translation. Do not add or omit keys.\n'+json.dumps(batch,ensure_ascii=False)
   body={'model':MODEL,'temperature':0,'response_format':{'type':'json_object'},'messages':[{'role':'system','content':'Return only a JSON object with the exact source strings as keys.'},{'role':'user','content':prompt}]}
   req=urllib.request.Request('https://openrouter.ai/api/v1/chat/completions',data=json.dumps(body).encode(),headers={'Authorization':f'Bearer {key()}','Content-Type':'application/json','HTTP-Referer':'https://github.com/weareheadless/wix-site-bridge','X-Title':'Susi pipeline'})
   data=json.load(urllib.request.urlopen(req,timeout=180));parsed=json.loads(data['choices'][0]['message']['content'])
   for s in batch:
    v=parsed.get(s)
    if isinstance(v,str) and v.strip() and v.strip()!=s:result[s]=v.strip()
  pending=[s for s in strings if s not in result]
 return result

def localizer(tags,dictionary):
 return """;(function(){const T=%s,D=%s;function es(){return /^es(?:-|$)/i.test(document.documentElement.lang||'')||/^\\/es(?:\\/|$)/.test(location.pathname)||new URLSearchParams(location.search).get('lang')==='es'}if(!es())return;function tr(t){const k=String(t||'').replace(/\\s+/g,' ').trim(),v=D[k];return v?String(t).replace(k,v):t}function walk(r){if(!r)return;const w=document.createTreeWalker(r,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){const p=n.parentElement;if(p&&['SCRIPT','STYLE','NOSCRIPT','CODE','PRE'].includes(p.tagName))continue;n.nodeValue=tr(n.nodeValue)}for(const el of r.querySelectorAll('*')){for(const a of ['placeholder','aria-label','alt','title']){const v=el.getAttribute(a);if(v)el.setAttribute(a,tr(v))}if(el.shadowRoot)walk(el.shadowRoot)}}function attach(el){if(el.__susiLoc)return;el.__susiLoc=1;if(el.shadowRoot)walk(el.shadowRoot)}function scan(){for(const tag of T)for(const el of document.querySelectorAll(tag))attach(el)}[0,500,1500,3000,6000].forEach(t=>setTimeout(scan,t))})();"""%(json.dumps(tags,ensure_ascii=False),json.dumps(dictionary,ensure_ascii=False))

def overlay_chunks(tags,dictionary):
 chunks=[];current={}
 for k,v in dictionary.items():
  trial=dict(current);trial[k]=v
  if current and len(localizer(tags,trial))>14000:
   chunks.append(current);current={k:v}
  else:current=trial
 if current:chunks.append(current)
 return [localizer(tags,c) for c in chunks]


def publish_overlays(entry,tags,dictionary):
 state_path=STATE/'auto-translations'/'overlays'/f"{entry['name']}.json";state_path.parent.mkdir(parents=True,exist_ok=True)
 state=json.loads(state_path.read_text()) if state_path.exists() else {'ids':[]};ids=state.get('ids',[])
 html_chunks=overlay_chunks(tags,dictionary);path=Path('/tmp/pipeline-overlay.html')
 for index,html in enumerate(html_chunks):
  path.write_text(html)
  cmd=['node',str(BASE/'scripts/overlay-publish.mjs'),'--html',str(path),'--name',f"Susi auto {entry['name']} {index+1}"]
  if index<len(ids):cmd+=['--id',ids[index]]
  out=subprocess.check_output(cmd,cwd=ROOT,env=os.environ,text=True)
  result=json.loads(out.strip().splitlines()[-1])
  if index>=len(ids):ids.append(result['id'])
  print(f"[{entry['name']}] overlay shard {index+1}: {len(html)} bytes",flush=True)
 state['ids']=ids;state_path.write_text(json.dumps(state,indent=2)+'\n')


def build_packet(entry,dictionary):
 parts=[];alltags=[]
 src_dir=Path('/home/admin/susimacdonald-rentals/wix/custom-elements')
 for source,tags in entry['components']:
  tags=[tags] if isinstance(tags,str) else tags;alltags+=tags
  source_text=(src_dir/f'{source}.js').read_text()
  filtered={k:v for k,v in dictionary.items() if k in source_text}
  loc=localizer(tags,filtered)
  tmp=Path(tempfile.mkdtemp(prefix='susi-build-'))/'src.js';tmp.write_text(source_text+'\n'+loc)
  print(f"[{entry['name']}] {source}: {len(filtered)} source strings",flush=True)
  out=tmp.with_suffix('.min.js');subprocess.check_call([ESBUILD,str(tmp),'--minify',f'--outfile={out}'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
  b64=base64.b64encode(gzip.compress(out.read_bytes(),9)).decode();parts.append([source if isinstance(tags,str) else source,b64])
  shutil.rmtree(tmp.parent,ignore_errors=True)
 html='<script>(window.__susiEarlyPackets||(window.__susiEarlyPackets=[])).push(...'+json.dumps(parts)+');if(window.__susiDrainEarly)window.__susiDrainEarly();</script>'
 return html

def push(embed,html):
 path=Path('/tmp/pipeline-packet.html');path.write_text(html)
 subprocess.check_call(['node','src/cli.mjs','update-snippet','--manifest',str(BASE/'site.manifest.json'),'--site','susimacdonald','--state-dir',str(STATE),'--snippet',embed,'--html-file',str(path),'--all-pages','--apply'],cwd=ROOT,stdout=subprocess.DEVNULL)

def main():
 only=os.environ.get('PIPELINE_ONLY','')
 for entry in ENTRIES:
  if only and entry['name'] not in only.split(','): continue
  cache=CACHE/f"{entry['name']}.json";dictionary=json.loads(cache.read_text()) if cache.exists() else {}
  tags=[t if isinstance(t,str) else x for _,t in entry['components'] for x in ([t] if isinstance(t,str) else t)]
  found=[]
  for route in entry['routes']:
   print(f"[{entry['name']}] crawling {route}",flush=True)
   for s in extract(route,tags):
    if s not in dictionary and s not in found:found.append(s)
  print(f"[{entry['name']}] new strings {len(found)}",flush=True)
  dictionary.update(translate(found));cache.write_text(json.dumps(dictionary,ensure_ascii=False,indent=2)+'\n')
  html=build_packet(entry,dictionary);print(f"[{entry['name']}] packet {len(html)} bytes, dictionary {len(dictionary)}",flush=True)
  if len(html)>15000:print(f"[{entry['name']}] SKIP packet: over Wix 15k limit",flush=True)
  else:push(entry['embed'],html);print(f"[{entry['name']}] packet pushed",flush=True)


if __name__=='__main__':main()
