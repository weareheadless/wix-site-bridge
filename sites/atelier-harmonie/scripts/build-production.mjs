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
for(const parts of Object.values(bundles))for(const part of parts)part.html=part.html.replaceAll("/post/nouveauté-à-l-atelier-découvrez-nos-3-nouveaux-ateliers-diy",'/les-ateliers');
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
const restorationHtml=await readFile(`${out}/restoration/restoration.html`,'utf8');
const restorationSource=(await readFile(`${out}/restoration/element.js`,'utf8')).replace('__RESTORATION_HTML__',JSON.stringify(restorationHtml));
await writeFile(`${out}/custom-elements/atelier-restoration-v1.js`,restorationSource);
await writeFile(`${out}/velo/restoration-seo.js`,'export const seoMarkup = '+JSON.stringify(restorationHtml.replace(/<style>[\s\S]*?<\/style>/g,''))+';\n');
components.restoration={tag:'atelier-restoration-v1',source:restorationSource,sha256:createHash('sha256').update(restorationSource).digest('hex')};
const contactHtml=await readFile(`${out}/contact/contact.html`,'utf8');
const contactSource=(await readFile(`${out}/contact/element.js`,'utf8')).replace('__CONTACT_HTML__',JSON.stringify(contactHtml));
await writeFile(`${out}/custom-elements/atelier-contact-v1.js`,contactSource);
await writeFile(`${out}/velo/contact-seo.js`,'export const seoMarkup = '+JSON.stringify(contactHtml.replace(/<style>[\s\S]*?<\/style>/g,''))+';\n');
components.contact={tag:'atelier-contact-v1',source:contactSource,sha256:createHash('sha256').update(contactSource).digest('hex')};
const fabricsHtml=await readFile(`${out}/fabrics/fabrics.html`,'utf8');
const fabricsSource=(await readFile(`${out}/fabrics/element.js`,'utf8')).replace('__FABRICS_HTML__',JSON.stringify(fabricsHtml));
await writeFile(`${out}/custom-elements/atelier-fabrics-v1.js`,fabricsSource);
await writeFile(`${out}/velo/fabrics-seo.js`,'export const seoMarkup = '+JSON.stringify(fabricsHtml.replace(/<style>[\s\S]*?<\/style>/g,''))+';\n');
components.fabrics={tag:'atelier-fabrics-v1',source:fabricsSource,sha256:createHash('sha256').update(fabricsSource).digest('hex')};
const b2bHtml=await readFile(`${out}/b2b/b2b.html`,'utf8');
const b2bSource=(await readFile(`${out}/b2b/element.js`,'utf8')).replace('__B2B_HTML__',JSON.stringify(b2bHtml));
await writeFile(`${out}/custom-elements/atelier-b2b-v1.js`,b2bSource);
await writeFile(`${out}/velo/b2b-seo.js`,'export const seoMarkup = '+JSON.stringify(b2bHtml.replace(/<style>[\s\S]*?<\/style>/g,''))+';\n');
components.b2b={tag:'atelier-b2b-v1',source:b2bSource,sha256:createHash('sha256').update(b2bSource).digest('hex')};
const workshopsHtml=await readFile(`${out}/workshops/workshops.html`,'utf8');
const workshopsSource=(await readFile(`${out}/workshops/element.js`,'utf8')).replace('__WORKSHOPS_HTML__',JSON.stringify(workshopsHtml));
await writeFile(`${out}/custom-elements/atelier-workshops-v1.js`,workshopsSource);
await writeFile(`${out}/velo/workshops-seo.js`,'export const seoMarkup = '+JSON.stringify(workshopsHtml.replace(/<style>[\s\S]*?<\/style>/g,''))+';\n');
components.workshops={tag:'atelier-workshops-v1',source:workshopsSource,sha256:createHash('sha256').update(workshopsSource).digest('hex')};
const aboutHtml=await readFile(`${out}/about/about.html`,'utf8');
const aboutSource=(await readFile(`${out}/about/element.js`,'utf8')).replace('__ABOUT_HTML__',JSON.stringify(aboutHtml));
await writeFile(`${out}/custom-elements/atelier-about-v1.js`,aboutSource);
await writeFile(`${out}/velo/about-seo.js`,'export const seoMarkup = '+JSON.stringify(aboutHtml.replace(/<style>[\s\S]*?<\/style>/g,''))+';\n');
components.about={tag:'atelier-about-v1',source:aboutSource,sha256:createHash('sha256').update(aboutSource).digest('hex')};
for(const part of ['top','bottom']){
 const key='quote'+part,tag='atelier-quote-'+part+'-v1';
 const html=await readFile(`${out}/quote/${part}.html`,'utf8');
 const source=(await readFile(`${out}/quote/element.js`,'utf8')).replace('__TAG__',JSON.stringify(tag)).replace('__QUOTE_HTML__',JSON.stringify(html));
 await writeFile(`${out}/custom-elements/${tag}.js`,source);
 await writeFile(`${out}/velo/${key}-seo.js`,'export const seoMarkup = '+JSON.stringify(html.replace(/<style>[\s\S]*?<\/style>/g,''))+';\n');
 components[key]={tag,source,sha256:createHash('sha256').update(source).digest('hex')};
}
for(const part of ['top','bottom']){
 const key='journal'+part,tag='atelier-journal-'+part+'-v1';
 const html=await readFile(`${out}/journal/${part}.html`,'utf8');
 const source=(await readFile(`${out}/journal/element.js`,'utf8')).replace('__TAG__',JSON.stringify(tag)).replace('__JOURNAL_HTML__',JSON.stringify(html));
 await writeFile(`${out}/custom-elements/${tag}.js`,source);
 await writeFile(`${out}/velo/${key}-seo.js`,'export const seoMarkup = '+JSON.stringify(html.replace(/<style>[\s\S]*?<\/style>/g,''))+';\n');
 components[key]={tag,source,sha256:createHash('sha256').update(source).digest('hex')};
}
const productHtml=await readFile(`${out}/product/product.html`,'utf8');
const productSource=(await readFile(`${out}/product/element.js`,'utf8')).replace('__PRODUCT_HTML__',JSON.stringify(productHtml));
await writeFile(`${out}/custom-elements/atelier-product-v1.js`,productSource);
components.product={tag:'atelier-product-v1',source:productSource,sha256:createHash('sha256').update(productSource).digest('hex')};
const release='atelier-production-20261018-v31';
const packets=[];
for(const [key,c] of Object.entries(components)){
 const packed=gzipSync(c.source).toString('base64');const size=12000,count=Math.ceil(packed.length/size);
 for(let index=0;index<count;index++){
  const packet={key,index,count,encoded:packed.slice(index*size,(index+1)*size)};
  const html='<script>(window.__atelierPacketsV31||(window.__atelierPacketsV31=[])).push('+JSON.stringify(packet)+');window.__atelierDrainV31?.();</script>';
  if(html.length>=15000)throw Error('Packet too large');
  const file=`early-packet-${key}-${index+1}.html`;await writeFile(`${out}/custom-code/${file}`,html);packets.push({key,file,characters:html.length});
 }
}
const tags=Object.fromEntries(Object.entries(components).map(([k,v])=>[k,v.tag]));
const firstImage=bundles.home[0].html.match(/<img src="([^"]+)"/)[1];
const controller=`(()=>{if(new URLSearchParams(location.search).get('earlyElements')==='off')return;const route=location.pathname.replace(/\\/+$/,'')||'/',tags=${JSON.stringify(tags)},keys=['navbar','footer',...(route==='/'||route==='/copy-of-accueil'?['home']:[]),...(route==='/shop'?['shop']:[]),...(route==='/lampes'?['lamps']:[]),...(route==='/sieges'?['seats']:[]),...(route==='/objets-deco'?['deco']:[]),...(route==='/gift-card'?['giftintro','giftguide']:[]),...(route==='/tapisserie-restauration'?['restoration','contact']:[]),...(route==='/les-tissus'?['fabrics']:[]),...(route==='/b2b'?['b2b']:[]),...(route==='/les-ateliers'?['workshops']:[]),...(route==='/a-propos'?['about']:[]),...(route==='/devis'?['quotetop','quotebottom']:[]),...(route==='/blog'?['journaltop','journalbottom']:[]),...(route.startsWith('/product-page/')&&route.split('/').length===3?['product']:[])];const state=window.__atelierRegistryV31||(window.__atelierRegistryV31={pending:{}});let marker=document.querySelector('meta[name="atelier-early-elements"]');if(!marker){marker=document.createElement('meta');marker.name='atelier-early-elements';document.head.append(marker)}marker.content=${JSON.stringify(release)};marker.dataset.route=route;window.__atelierDrainV31=()=>{const packets=window.__atelierPacketsV31||[];for(const key of keys){if(state.pending[key]||customElements.get(tags[key]))continue;const matching=packets.filter(p=>p.key===key),count=matching[0]?.count;if(!count||new Set(matching.map(p=>p.index)).size!==count)continue;if(!window.DecompressionStream){marker.dataset[key]='fallback';continue}state.pending[key]=true;marker.dataset[key]='decompressing';const encoded=Array.from({length:count},(_,i)=>matching.find(p=>p.index===i).encoded).join('');const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text().then(source=>{if(!customElements.get(tags[key])){const script=document.createElement('script');script.textContent=source;document.head.append(script)}marker.dataset[key]=customElements.get(tags[key])?'defined':'fallback'}).catch(()=>{delete state.pending[key];marker.dataset[key]='fallback'})}};if(route==='/'||route==='/copy-of-accueil'){if(!document.querySelector('link[data-atelier-critical]')){const image=document.createElement('link');image.rel='preload';image.as='image';image.href=${JSON.stringify(firstImage)};image.fetchPriority='high';image.dataset.atelierCritical='hero';document.head.append(image)}}if(route==='/lampes'&&!document.querySelector('link[data-atelier-lamps-critical]')){const image=document.createElement('link');image.rel='preload';image.as='image';image.href=${JSON.stringify(lampsHtml.match(/<img\b[^>]*\bsrc="([^"]+)"/)[1])};image.fetchPriority='high';image.dataset.atelierLampsCritical='hero';document.head.append(image)}if(route==='/sieges'&&!document.querySelector('link[data-atelier-seats-critical]')){const image=document.createElement('link');image.rel='preload';image.as='image';image.href=${JSON.stringify(seatsHtml.match(/<img\b[^>]*\bsrc="([^"]+)"/)[1])};image.fetchPriority='high';image.dataset.atelierSeatsCritical='hero';document.head.append(image)}if(route==='/objets-deco'&&!document.querySelector('link[data-atelier-deco-critical]')){const image=document.createElement('link');image.rel='preload';image.as='image';image.href=${JSON.stringify(decoHtml.match(/<img\b[^>]*\bsrc="([^"]+)"/)[1])};image.fetchPriority='high';image.dataset.atelierDecoCritical='hero';document.head.append(image)}if(route==='/gift-card'&&!document.querySelector('link[data-atelier-gift-critical]')){const image=document.createElement('link');image.rel='preload';image.as='image';image.href=${JSON.stringify(giftHtml.intro.match(/<img\b[^>]*\bsrc="([^"]+)"/)[1])};image.fetchPriority='high';image.dataset.atelierGiftCritical='hero';document.head.append(image)}if(route==='/tapisserie-restauration'&&!document.querySelector('link[data-atelier-restoration-critical]')){const image=document.createElement('link');image.rel='preload';image.as='image';image.href=${JSON.stringify(restorationHtml.match(/<img\b[^>]*\bsrc="([^"]+)"/)[1])};image.fetchPriority='high';image.dataset.atelierRestorationCritical='hero';document.head.append(image)}if(route==='/les-tissus'&&!document.querySelector('link[data-atelier-fabrics-critical]')){const image=document.createElement('link');image.rel='preload';image.as='image';image.href=${JSON.stringify(fabricsHtml.match(/<img\b[^>]*\bsrc="([^"]+)"/)[1])};image.fetchPriority='high';image.dataset.atelierFabricsCritical='hero';document.head.append(image)}if(route==='/b2b'&&!document.querySelector('link[data-atelier-b2b-critical]')){const image=document.createElement('link');image.rel='preload';image.as='image';image.href=${JSON.stringify(b2bHtml.match(/<img\b[^>]*\bsrc="([^"]+)"/)[1])};image.fetchPriority='high';image.dataset.atelierB2bCritical='hero';document.head.append(image)}if(route==='/les-ateliers'&&!document.querySelector('link[data-atelier-workshops-critical]')){const image=document.createElement('link');image.rel='preload';image.as='image';image.href=${JSON.stringify(workshopsHtml.match(/<img\b[^>]*\bsrc="([^"]+)"/)[1])};image.fetchPriority='high';image.dataset.atelierWorkshopsCritical='hero';document.head.append(image)}if(route==='/a-propos'&&!document.querySelector('link[data-atelier-about-critical]')){const image=document.createElement('link');image.rel='preload';image.as='image';image.href=${JSON.stringify(aboutHtml.match(/<img\b[^>]*\bsrc="([^"]+)"/)[1])};image.fetchPriority='high';image.dataset.atelierAboutCritical='hero';document.head.append(image)}window.__atelierDrainV31()})();`;
await writeFile(`${out}/custom-code/early-elements-global.html`,'<script>'+controller+'</script>');
await writeFile(`${out}/build-manifest.json`,JSON.stringify({siteAlias:'atelier-harmonie',siteId:manifest.site.siteId,release,components:Object.fromEntries(Object.entries(components).map(([key,c])=>[key,{tag:c.tag,sha256:c.sha256}])),packets,coverage:{sharedHeader:'navbar and footer on all routes using Wix shared containers; placement reported by user',home:['/','/copy-of-accueil'],shop:['/shop'],lamps:['/lampes'],seats:['/sieges'],deco:['/objets-deco'],gift:['/gift-card'],restoration:['/tapisserie-restauration'],fabrics:['/les-tissus'],b2b:['/b2b'],workshops:['/les-ateliers'],about:['/a-propos'],quote:['/devis'],journal:['/blog'],product:['/product-page/:slug'],elementIds:{navbar:'customElement1',home:'customElement2',footer:'customElement3',shop:'customElement4',lamps:'customElement5',seats:'customElement6',deco:'customElement7',giftintro:'customElement8',giftguide:'customElement9',restoration:'customElement10',contact:'customElement11',fabrics:'customElement12',b2b:'customElement13',workshops:'customElement14',about:'customElement15',quotetop:'customElement16',quotebottom:'customElement17',journaltop:'customElement18',journalbottom:'customElement19',product:'customElement20'},otherPages:'native page UI preserved; shared navbar bundle only',status:'pending full route inventory and Wix placement'},deployed:false},null,2)+'\n');
console.log(JSON.stringify({components:Object.keys(components),packets:packets.map(p=>({file:p.file,characters:p.characters})),deployed:false}));
