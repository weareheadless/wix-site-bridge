import { seoMarkup } from 'public/atelier-home-seo';
import { getAtelierAvailability } from 'backend/atelier-shop.web';

$w.onReady(function () {
 const element=$w('#customElement2');
 element.seoMarkup=seoMarkup;
 let last='';
 async function load(event){
  const slugs=[...new Set(event.detail?.slugs||[])];
  if(!slugs.length||JSON.stringify(slugs)===last)return;
  last=JSON.stringify(slugs);
  try{element.setAttribute('availability',JSON.stringify(await getAtelierAvailability(slugs)));}
  catch{last='';element.setAttribute('availability','[]');}
 }
 element.on('atelier-home-products-ready',load);
 // Handshake also covers registration before Velo event binding.
 element.setAttribute('availability-request',String(Date.now()));
});
