import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
if(process.argv[2]!=='--site'||process.argv[3]!=='atelier-harmonie')throw Error('Explicit --site atelier-harmonie required');
const manifest=JSON.parse(await readFile('sites/atelier-harmonie/site.manifest.json','utf8'));
if(manifest.site.siteId!=='376faa89-fe6c-4ae8-8feb-10520e813a89')throw Error('Wrong site');
const out='sites/atelier-harmonie/production';
await mkdir(out+'/velo',{recursive:true});
const modules=JSON.parse(await readFile('sites/atelier-harmonie/.build/modules.json','utf8'));
const bundles={navbar:[],home:[],footer:[]};
for(const m of modules){
 let html=await readFile(m.file,'utf8');
 // Production components own their shadow DOM; no access to Wix-generated shell.
 html=html.replace(/body:has\([^}]+\}/g,'').replace(/#wix-bridge-prototype\{[^}]+\}/g,'');
 const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
 html=html.replace(/<script>[\s\S]*?<\/script>/g,'');
 bundles[m.mountId==='navbar'?'navbar':m.mountId==='contact'?'footer':'home'].push({id:m.mountId,html,scripts});
}
// Shop behavior stays in Wix: a documented Velo event navigates to its cart.
const nav=bundles.navbar[0];
nav.html=nav.html.replace('<a class="ah-project-link"', '<button class="ah-cart" type="button" data-cart aria-label="Voir mon panier">Panier</button><a class="ah-project-link"');
nav.html=nav.html.replace('</nav></details>','<button type="button" data-cart>Mon panier</button></nav></details>');
nav.html+='<style>#wix-bridge-section-navbar .ah-cart{background:none;border:0;font-size:11px;padding:12px 0;color:#87475b}#wix-bridge-section-navbar .ah-mobile-menu nav button{background:none;border:0;text-align:left;font-size:16px;padding:13px 0}@media(max-width:850px){#wix-bridge-section-navbar>.ah-nav>.ah-cart{display:none}}</style>';
// Preserve the original Wix menu destinations in accessible, compact submenus.
const groups=[
 {label:'Les luminaires',items:[['/shop','La boutique'],['/lampes','Les luminaires'],['/objets-deco','Objets déco'],['/sieges','Les sièges'],['/gift-card','Carte cadeau']]},
 {label:'La tapisserie',items:[['/tapisserie-restauration','Tapisserie & restauration'],['/les-tissus','Les tissus'],['/b2b','Pour les professionnels']]},
 {label:'Mathilde',items:[['/a-propos','À propos'],['/blog','Le journal']]}
];
for(const group of groups){
 const links=group.items.map(([href,label])=>`<a href="${href}">${label}</a>`).join('');
 const match=new RegExp('<a href="[^"]+">'+group.label+'</a>');
 nav.html=nav.html.replace(match,`<details class="ah-submenu"><summary>${group.label}<span aria-hidden="true">⌄</span></summary><div>${links}</div></details>`);
 nav.html=nav.html.replace('</nav></details></header>',links+'</nav></details></header>');
}
nav.html+='<style>.ah-submenu{position:relative}.ah-submenu summary{cursor:pointer;list-style:none;display:flex;align-items:center;gap:6px;font-size:11px}.ah-submenu summary::-webkit-details-marker{display:none}.ah-submenu summary span{color:#b9808e}.ah-submenu>div{position:absolute;top:28px;left:-18px;min-width:210px;padding:16px 20px;background:#fffdf9;box-shadow:0 12px 32px #42170a14;z-index:20}.ah-submenu>div a{display:block;padding:9px 0;white-space:nowrap;font-size:12px}</style>';
nav.html+='<style>#wix-bridge-section-navbar .ah-desktop-nav{align-items:center}#wix-bridge-section-navbar .ah-desktop-nav>a,#wix-bridge-section-navbar .ah-submenu>summary{display:flex;align-items:center;min-height:40px;padding:10px 0;line-height:20px;font-size:11px;position:relative}#wix-bridge-section-navbar .ah-submenu>summary:after{content:\"\";position:absolute;left:0;bottom:3px;width:18px;height:2px;background:#b9808e}#wix-bridge-section-navbar .ah-submenu:nth-child(even)>summary:after{background:#8296aa}#wix-bridge-section-navbar .ah-submenu>div{top:40px}#wix-bridge-section-navbar .ah-submenu>div a:after{display:none}</style>';
// Keep the two utility actions together at the right edge.
nav.html=nav.html.replace('<button class="ah-cart"','<div class="ah-nav-actions"><button class="ah-cart"').replace('</a><details class="ah-mobile-menu">','</a></div><details class="ah-mobile-menu">');
nav.html+='<style>#wix-bridge-section-navbar .ah-nav{gap:clamp(16px,2vw,32px)}#wix-bridge-section-navbar .ah-desktop-nav{flex:1;justify-content:center}#wix-bridge-section-navbar .ah-nav-actions{display:flex;align-items:center;gap:10px;margin-left:auto;flex-shrink:0}#wix-bridge-section-navbar .ah-nav-actions .ah-cart,#wix-bridge-section-navbar .ah-nav-actions .ah-project-link{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:40px;padding:10px 16px;line-height:18px;font-size:11px;border:1px solid #8296aa55;border-radius:2px;text-decoration:none;transition:background .2s,border-color .2s}#wix-bridge-section-navbar .ah-nav-actions .ah-cart{background:#f7f8fa;color:#52687d}#wix-bridge-section-navbar .ah-nav-actions .ah-project-link{background:#faf4f2;border-color:#b9808e66;color:#87475b}#wix-bridge-section-navbar .ah-nav-actions .ah-cart:hover{background:#eef1f5;border-color:#8296aa}#wix-bridge-section-navbar .ah-nav-actions .ah-project-link:hover{background:#f3e7e5;border-color:#b9808e}@media(max-width:850px){#wix-bridge-section-navbar .ah-nav-actions{display:none}}</style>';
const components={};
for(const [key,parts] of Object.entries(bundles)){
 const tag='atelier-'+key+'-v1';
 let html=parts.map(p=>`<div id="wix-bridge-section-${p.id}">${p.html}</div>`).join('');
 // Load the common fonts once per component rather than once per section.
 const imports=[...new Set([...html.matchAll(/@import url\('[^']+'\);/g)].map(x=>x[0]))];
 html=html.replace(/@import url\('[^']+'\);/g,'');
 const fontUrls=imports.map(rule=>rule.match(/url\('([^']+)'\)/)[1]);
 html='<style>'+ ':host{display:block;width:100%;min-width:0}main{display:block}a,button{-webkit-tap-highlight-color:transparent}</style><main>'+html+'</main>';
 const inline=parts.flatMap(p=>p.scripts).map(s=>s.replaceAll('document.getElementById(','componentRoot.getElementById(').replaceAll('new ResizeObserver(update).observe(v);','{const observer=new ResizeObserver(update);observer.observe(v);this.cleanups.push(()=>observer.disconnect())};'));
 // Defer only third-party reviews; retain heading and text immediately.
 html=html.replace('iframe src="https://widgets.sociablekit.com/','iframe data-src="https://widgets.sociablekit.com/');
 const seoHtml=html.replace(/<style>[\s\S]*?<\/style>/g,'').replace(/<svg[\s\S]*?<\/svg>/g,'').replace(/<iframe[\s\S]*?<\/iframe>/g,'');
 await writeFile(`${out}/velo/${key}-seo.js`,'export const seoMarkup = '+JSON.stringify(seoHtml)+';\n');
 const source=`(()=>{const TAG=${JSON.stringify(tag)};if(customElements.get(TAG))return;class AtelierElement extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'});this.cleanups=[];this.rendered=false}connectedCallback(){if(this.rendered)return;this.rendered=true;const componentRoot=this.shadowRoot;for(const href of ${JSON.stringify(fontUrls)}){if(!Array.from(document.querySelectorAll('link[data-atelier-fonts]')).some(link=>link.href===href)){const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.atelierFonts='true';document.head.append(link)}}componentRoot.innerHTML=${JSON.stringify(html)};${inline.join('\n')}componentRoot.querySelectorAll('[data-cart]').forEach(button=>button.addEventListener('click',()=>this.dispatchEvent(new CustomEvent('atelier-cart',{bubbles:true,composed:true}))));const observer=new ResizeObserver(()=>{const height=Math.ceil(componentRoot.querySelector('main').getBoundingClientRect().height);if(height>0&&this.style.height!==height+'px'){this.style.height=height+'px';this.dispatchEvent(new CustomEvent('atelier-layout',{detail:{height},bubbles:true,composed:true}))}});observer.observe(componentRoot.querySelector('main'));this.cleanups.push(()=>observer.disconnect());componentRoot.querySelectorAll('iframe[data-src]').forEach(frame=>{const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){frame.src=frame.dataset.src;io.disconnect()}},{rootMargin:'200px'});io.observe(frame);this.cleanups.push(()=>io.disconnect())});this.dataset.atelierReady='true'}disconnectedCallback(){this.cleanups.forEach(fn=>fn());this.cleanups=[];this.rendered=false;this.shadowRoot.replaceChildren()}}customElements.define(TAG,AtelierElement)})();`;
 await writeFile(`${out}/custom-elements/${tag}.js`,source);
 components[key]={tag,source,sha256:createHash('sha256').update(source).digest('hex')};
}
// Shop is a live Wix catalog component, with no embedded product snapshots.
const shopHtml=await readFile(`${out}/shop/shop.html`,'utf8');
const shopSource=(await readFile(`${out}/shop/element.js`,'utf8')).replace('__SHOP_HTML__',JSON.stringify(shopHtml));
await writeFile(`${out}/custom-elements/atelier-shop-v1.js`,shopSource);
await writeFile(`${out}/velo/shop-seo.js`,'export const seoMarkup = '+JSON.stringify(shopHtml.replace(/<style>[\s\S]*?<\/style>/g,''))+';\n');
components.shop={tag:'atelier-shop-v1',source:shopSource,sha256:createHash('sha256').update(shopSource).digest('hex')};
const lampsHtml=await readFile(`${out}/lamps/lamps.html`,'utf8');
const lampsSource=(await readFile(`${out}/lamps/element.js`,'utf8')).replace('__LAMPS_HTML__',JSON.stringify(lampsHtml));
await writeFile(`${out}/custom-elements/atelier-lamps-v1.js`,lampsSource);
await writeFile(`${out}/velo/lamps-seo.js`,'export const seoMarkup = '+JSON.stringify(lampsHtml.replace(/<style>[\s\S]*?<\/style>/g,''))+';\n');
components.lamps={tag:'atelier-lamps-v1',source:lampsSource,sha256:createHash('sha256').update(lampsSource).digest('hex')};
const seatsHtml=await readFile(`${out}/seats/seats.html`,'utf8');
const seatsSource=(await readFile(`${out}/seats/element.js`,'utf8')).replace('__SEATS_HTML__',JSON.stringify(seatsHtml));
await writeFile(`${out}/custom-elements/atelier-seats-v1.js`,seatsSource);
await writeFile(`${out}/velo/seats-seo.js`,'export const seoMarkup = '+JSON.stringify(seatsHtml.replace(/<style>[\s\S]*?<\/style>/g,''))+';\n');
components.seats={tag:'atelier-seats-v1',source:seatsSource,sha256:createHash('sha256').update(seatsSource).digest('hex')};
const decoHtml=await readFile(`${out}/deco/deco.html`,'utf8');
const decoSource=(await readFile(`${out}/deco/element.js`,'utf8')).replace('__DECO_HTML__',JSON.stringify(decoHtml));
await writeFile(`${out}/custom-elements/atelier-deco-v1.js`,decoSource);
await writeFile(`${out}/velo/deco-seo.js`,'export const seoMarkup = '+JSON.stringify(decoHtml.replace(/<style>[\s\S]*?<\/style>/g,''))+';\n');
components.deco={tag:'atelier-deco-v1',source:decoSource,sha256:createHash('sha256').update(decoSource).digest('hex')};
const giftHtml={};
for(const part of ['intro','guide']){
 const key='gift'+part,tag='atelier-gift-'+part+'-v1';
 const html=await readFile(`${out}/gift/${part}.html`,'utf8');giftHtml[part]=html;
 const source=(await readFile(`${out}/gift/element.js`,'utf8')).replace('__TAG__',JSON.stringify(tag)).replace('__GIFT_HTML__',JSON.stringify(html));
 await writeFile(`${out}/custom-elements/${tag}.js`,source);
 await writeFile(`${out}/velo/${key}-seo.js`,'export const seoMarkup = '+JSON.stringify(html.replace(/<style>[\s\S]*?<\/style>/g,''))+';\n');
 components[key]={tag,source,sha256:createHash('sha256').update(source).digest('hex')};
}
const release='atelier-production-20261018-v16';
const packets=[];
for(const [key,c] of Object.entries(components)){
 const packed=gzipSync(c.source).toString('base64');const size=12000,count=Math.ceil(packed.length/size);
 for(let index=0;index<count;index++){
  const packet={key,index,count,encoded:packed.slice(index*size,(index+1)*size)};
  const html='<script>(window.__atelierPacketsV16||(window.__atelierPacketsV16=[])).push('+JSON.stringify(packet)+');window.__atelierDrainV16?.();</script>';
  if(html.length>=15000)throw Error('Packet too large');
  const file=`early-packet-${key}-${index+1}.html`;await writeFile(`${out}/custom-code/${file}`,html);packets.push({key,file,characters:html.length});
 }
}
const tags=Object.fromEntries(Object.entries(components).map(([k,v])=>[k,v.tag]));
const firstImage=bundles.home[0].html.match(/<img src="([^"]+)"/)[1];
const controller=`(()=>{if(new URLSearchParams(location.search).get('earlyElements')==='off')return;const route=location.pathname.replace(/\\/+$/,'')||'/',tags=${JSON.stringify(tags)},keys=['navbar','footer',...(route==='/'||route==='/copy-of-accueil'?['home']:[]),...(route==='/shop'?['shop']:[]),...(route==='/lampes'?['lamps']:[]),...(route==='/sieges'?['seats']:[]),...(route==='/objets-deco'?['deco']:[]),...(route==='/gift-card'?['giftintro','giftguide']:[])];const state=window.__atelierRegistryV16||(window.__atelierRegistryV16={pending:{}});let marker=document.querySelector('meta[name="atelier-early-elements"]');if(!marker){marker=document.createElement('meta');marker.name='atelier-early-elements';document.head.append(marker)}marker.content=${JSON.stringify(release)};marker.dataset.route=route;window.__atelierDrainV16=()=>{const packets=window.__atelierPacketsV16||[];for(const key of keys){if(state.pending[key]||customElements.get(tags[key]))continue;const matching=packets.filter(p=>p.key===key),count=matching[0]?.count;if(!count||new Set(matching.map(p=>p.index)).size!==count)continue;if(!window.DecompressionStream){marker.dataset[key]='fallback';continue}state.pending[key]=true;marker.dataset[key]='decompressing';const encoded=Array.from({length:count},(_,i)=>matching.find(p=>p.index===i).encoded).join('');const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text().then(source=>{if(!customElements.get(tags[key])){const script=document.createElement('script');script.textContent=source;document.head.append(script)}marker.dataset[key]=customElements.get(tags[key])?'defined':'fallback'}).catch(()=>{delete state.pending[key];marker.dataset[key]='fallback'})}};if(route==='/'||route==='/copy-of-accueil'){if(!document.querySelector('link[data-atelier-critical]')){const image=document.createElement('link');image.rel='preload';image.as='image';image.href=${JSON.stringify(firstImage)};image.fetchPriority='high';image.dataset.atelierCritical='hero';document.head.append(image)}}if(route==='/lampes'&&!document.querySelector('link[data-atelier-lamps-critical]')){const image=document.createElement('link');image.rel='preload';image.as='image';image.href=${JSON.stringify(lampsHtml.match(/<img\b[^>]*\bsrc="([^"]+)"/)[1])};image.fetchPriority='high';image.dataset.atelierLampsCritical='hero';document.head.append(image)}if(route==='/sieges'&&!document.querySelector('link[data-atelier-seats-critical]')){const image=document.createElement('link');image.rel='preload';image.as='image';image.href=${JSON.stringify(seatsHtml.match(/<img\b[^>]*\bsrc="([^"]+)"/)[1])};image.fetchPriority='high';image.dataset.atelierSeatsCritical='hero';document.head.append(image)}if(route==='/objets-deco'&&!document.querySelector('link[data-atelier-deco-critical]')){const image=document.createElement('link');image.rel='preload';image.as='image';image.href=${JSON.stringify(decoHtml.match(/<img\b[^>]*\bsrc="([^"]+)"/)[1])};image.fetchPriority='high';image.dataset.atelierDecoCritical='hero';document.head.append(image)}if(route==='/gift-card'&&!document.querySelector('link[data-atelier-gift-critical]')){const image=document.createElement('link');image.rel='preload';image.as='image';image.href=${JSON.stringify(giftHtml.intro.match(/<img\b[^>]*\bsrc="([^"]+)"/)[1])};image.fetchPriority='high';image.dataset.atelierGiftCritical='hero';document.head.append(image)}window.__atelierDrainV16()})();`;
await writeFile(`${out}/custom-code/early-elements-global.html`,'<script>'+controller+'</script>');
await writeFile(`${out}/build-manifest.json`,JSON.stringify({siteAlias:'atelier-harmonie',siteId:manifest.site.siteId,release,components:Object.fromEntries(Object.entries(components).map(([key,c])=>[key,{tag:c.tag,sha256:c.sha256}])),packets,coverage:{sharedHeader:'navbar and footer on all routes using Wix shared containers; placement reported by user',home:['/','/copy-of-accueil'],shop:['/shop'],lamps:['/lampes'],seats:['/sieges'],deco:['/objets-deco'],gift:['/gift-card'],elementIds:{navbar:'customElement1',home:'customElement2',footer:'customElement3',shop:'customElement4',lamps:'customElement5',seats:'customElement6',deco:'customElement7',giftintro:'customElement8',giftguide:'customElement9'},otherPages:'native page UI preserved; shared navbar bundle only',status:'pending full route inventory and Wix placement'},deployed:false},null,2)+'\n');
console.log(JSON.stringify({components:Object.keys(components),packets:packets.map(p=>({file:p.file,characters:p.characters})),deployed:false}));
