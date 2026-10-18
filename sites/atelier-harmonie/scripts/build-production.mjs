import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
if(process.argv[2]!=='--site'||process.argv[3]!=='atelier-harmonie')throw Error('Explicit --site atelier-harmonie required');
const manifest=JSON.parse(await readFile('sites/atelier-harmonie/site.manifest.json','utf8'));
if(manifest.site.siteId!=='376faa89-fe6c-4ae8-8feb-10520e813a89')throw Error('Wrong site');
const out='sites/atelier-harmonie/production';
const modules=JSON.parse(await readFile('sites/atelier-harmonie/.build/modules.json','utf8'));
const bundles={navbar:[],home:[]};
for(const m of modules){
 let html=await readFile(m.file,'utf8');
 // Production components own their shadow DOM; no access to Wix-generated shell.
 html=html.replace(/body:has\([^}]+\}/g,'').replace(/#wix-bridge-prototype\{[^}]+\}/g,'');
 const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
 html=html.replace(/<script>[\s\S]*?<\/script>/g,'');
 bundles[m.mountId==='navbar'?'navbar':'home'].push({id:m.mountId,html,scripts});
}
// Shop behavior stays in Wix: a documented Velo event navigates to its cart.
const nav=bundles.navbar[0];
nav.html=nav.html.replace('<a class="ah-project-link"', '<button class="ah-cart" type="button" data-cart aria-label="Voir mon panier">Panier</button><a class="ah-project-link"');
nav.html=nav.html.replace('</nav></details>','<button type="button" data-cart>Mon panier</button></nav></details>');
nav.html+='<style>#wix-bridge-section-navbar .ah-cart{background:none;border:0;font-size:11px;padding:12px 0;color:#87475b}#wix-bridge-section-navbar .ah-mobile-menu nav button{background:none;border:0;text-align:left;font-size:16px;padding:13px 0}@media(max-width:850px){#wix-bridge-section-navbar>.ah-nav>.ah-cart{display:none}}</style>';
const components={};
for(const [key,parts] of Object.entries(bundles)){
 const tag='atelier-'+key+'-v1';
 let html=parts.map(p=>`<div id="wix-bridge-section-${p.id}">${p.html}</div>`).join('');
 // Load the common fonts once per component rather than once per section.
 const imports=[...new Set([...html.matchAll(/@import url\('[^']+'\);/g)].map(x=>x[0]))];
 html=html.replace(/@import url\('[^']+'\);/g,'');
 html='<style>'+imports.join('')+':host{display:block;width:100%;min-width:0}main{display:block}a,button{-webkit-tap-highlight-color:transparent}</style><main>'+html+'</main>';
 const inline=parts.flatMap(p=>p.scripts).map(s=>s.replaceAll('document.getElementById(','root.getElementById(').replaceAll('new ResizeObserver(update).observe(v);','{const observer=new ResizeObserver(update);observer.observe(v);this.cleanups.push(()=>observer.disconnect())};'));
 // Defer only third-party reviews; retain heading and text immediately.
 html=html.replace('iframe src="https://widgets.sociablekit.com/','iframe data-src="https://widgets.sociablekit.com/');
 const source=`(()=>{const TAG=${JSON.stringify(tag)};if(customElements.get(TAG))return;class AtelierElement extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'});this.cleanups=[];this.rendered=false}connectedCallback(){if(this.rendered)return;this.rendered=true;const root=this.shadowRoot;root.innerHTML=${JSON.stringify(html)};${inline.join('\n')}root.querySelectorAll('[data-cart]').forEach(button=>button.addEventListener('click',()=>this.dispatchEvent(new CustomEvent('atelier-cart',{bubbles:true,composed:true}))));const observer=new ResizeObserver(()=>{const height=Math.ceil(root.querySelector('main').getBoundingClientRect().height);if(height>0&&this.style.height!==height+'px'){this.style.height=height+'px';this.dispatchEvent(new CustomEvent('atelier-layout',{detail:{height},bubbles:true,composed:true}))}});observer.observe(root.querySelector('main'));this.cleanups.push(()=>observer.disconnect());root.querySelectorAll('iframe[data-src]').forEach(frame=>{const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){frame.src=frame.dataset.src;io.disconnect()}},{rootMargin:'200px'});io.observe(frame);this.cleanups.push(()=>io.disconnect())});this.dataset.atelierReady='true'}disconnectedCallback(){this.cleanups.forEach(fn=>fn());this.cleanups=[];this.rendered=false;this.shadowRoot.replaceChildren()}}customElements.define(TAG,AtelierElement)})();`;
 await writeFile(`${out}/custom-elements/${tag}.js`,source);
 components[key]={tag,source,sha256:createHash('sha256').update(source).digest('hex')};
}
const release='atelier-production-20261018-v1';
const packets=[];
for(const [key,c] of Object.entries(components)){
 const packed=gzipSync(c.source).toString('base64');const size=12000,count=Math.ceil(packed.length/size);
 for(let index=0;index<count;index++){
  const packet={key,index,count,encoded:packed.slice(index*size,(index+1)*size)};
  const html='<script>(window.__atelierPackets||(window.__atelierPackets=[])).push('+JSON.stringify(packet)+');window.__atelierDrain?.();</script>';
  if(html.length>=15000)throw Error('Packet too large');
  const file=`early-packet-${key}-${index+1}.html`;await writeFile(`${out}/custom-code/${file}`,html);packets.push({key,file,characters:html.length});
 }
}
const tags=Object.fromEntries(Object.entries(components).map(([k,v])=>[k,v.tag]));
const firstImage=bundles.home[0].html.match(/<img src="([^"]+)"/)[1];
const controller=`(()=>{if(new URLSearchParams(location.search).get('earlyElements')==='off')return;const route=location.pathname.replace(/\\/+$/,'')||'/',tags=${JSON.stringify(tags)},keys=['navbar',...(route==='/'||route==='/copy-of-accueil'?['home']:[])];const state=window.__atelierRegistry||(window.__atelierRegistry={pending:{}});let marker=document.querySelector('meta[name="atelier-early-elements"]');if(!marker){marker=document.createElement('meta');marker.name='atelier-early-elements';document.head.append(marker)}marker.content=${JSON.stringify(release)};marker.dataset.route=route;window.__atelierDrain=()=>{const packets=window.__atelierPackets||[];for(const key of keys){if(state.pending[key]||customElements.get(tags[key]))continue;const matching=packets.filter(p=>p.key===key),count=matching[0]?.count;if(!count||new Set(matching.map(p=>p.index)).size!==count)continue;if(!window.DecompressionStream){marker.dataset[key]='fallback';continue}state.pending[key]=true;marker.dataset[key]='decompressing';const encoded=Array.from({length:count},(_,i)=>matching.find(p=>p.index===i).encoded).join('');const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text().then(source=>{if(!customElements.get(tags[key])){const script=document.createElement('script');script.textContent=source;document.head.append(script)}marker.dataset[key]=customElements.get(tags[key])?'defined':'fallback'}).catch(()=>{delete state.pending[key];marker.dataset[key]='fallback'})}};if(route==='/'||route==='/copy-of-accueil'){if(!document.querySelector('link[data-atelier-critical]')){const image=document.createElement('link');image.rel='preload';image.as='image';image.href=${JSON.stringify(firstImage)};image.fetchPriority='high';image.dataset.atelierCritical='hero';document.head.append(image)}}window.__atelierDrain()})();`;
await writeFile(`${out}/custom-code/early-elements-global.html`,'<script>'+controller+'</script>');
await writeFile(`${out}/build-manifest.json`,JSON.stringify({siteAlias:'atelier-harmonie',siteId:manifest.site.siteId,release,components:Object.fromEntries(Object.entries(components).map(([key,c])=>[key,{tag:c.tag,sha256:c.sha256}])),packets,coverage:{sharedHeader:'all routes with Wix shared header; placement must be inventoried',home:['/','/copy-of-accueil'],otherPages:'native page UI preserved; shared navbar bundle only',status:'pending full route inventory and Wix placement'},deployed:false},null,2)+'\n');
console.log(JSON.stringify({components:Object.keys(components),packets:packets.map(p=>({file:p.file,characters:p.characters})),deployed:false}));
