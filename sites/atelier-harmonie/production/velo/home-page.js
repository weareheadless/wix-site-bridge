import { seoMarkup } from 'public/atelier-home-seo';
import { getAtelierProducts } from 'backend/atelier-shop.web';

$w.onReady(function () {
 const element=$w('#customElement2');
 element.seoMarkup=seoMarkup;
 let last='',generation=0;
 const slugFromUrl=value=>{try{const path=new URL(value,'https://www.atelier-harmonie.com').pathname.split('/').filter(Boolean);return path[0]==='product-page'&&path.length===2?decodeURIComponent(path[1]).normalize('NFC'):'';}catch{return '';}};
 async function load(event){
  const slugs=[...new Set(event.detail?.slugs||[])].map(s=>s.normalize('NFC'));
  if(!slugs.length||JSON.stringify(slugs)===last)return;
  last=JSON.stringify(slugs);const version=++generation;
  let items=[],skip=0;
  try{
   // Reuse the established shop catalog feed; no separate slug-query service.
   while(true){
    const data=await getAtelierProducts(skip);
    if(version!==generation)return;
    items=items.concat(data.items);
    element.setAttribute('availability',JSON.stringify(items));
    const found=new Set(items.flatMap(p=>[p.slug?.normalize('NFC'),slugFromUrl(p.url)]).filter(Boolean));
    if(slugs.every(slug=>found.has(slug))||!data.hasMore||data.nextSkip<=skip)break;
    skip=data.nextSkip;
   }
  }catch{if(version===generation){last='';element.setAttribute('availability',JSON.stringify(items));}}
 }
 element.on('atelier-home-products-ready',load);
 element.setAttribute('availability-request',String(Date.now()));
});
