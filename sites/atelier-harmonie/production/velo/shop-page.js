import { getAtelierProducts, addAtelierProduct } from 'backend/atelier-shop.web';
import wixEcomFrontend from 'wix-ecom-frontend';
import { seoMarkup } from 'public/atelier-shop-seo';

$w.onReady(function(){
 const element=$w('#customElement4');
 let items=[],nextSkip=0,loading=false,loaded=false;
 element.seoMarkup=seoMarkup;
 const escape=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 async function load(){
  if(loading)return;loading=true;
  try{
   const data=await getAtelierProducts(nextSkip);
   items=items.concat(data.items);nextSkip=data.nextSkip;loaded=true;
   element.setAttribute('catalog',JSON.stringify({items,hasMore:data.hasMore}));
   element.seoMarkup=seoMarkup+'<section aria-label="Les créations">'+items.map(p=>'<article><h2><a href="'+escape(p.url)+'">'+escape(p.name)+'</a></h2><p>'+escape(new Intl.NumberFormat('fr-FR',{style:'currency',currency:p.currency}).format(p.price))+'</p></article>').join('')+'</section>';
  }catch{element.setAttribute('catalog-error',String(Date.now()));}
  finally{loading=false;}
 }
 element.on('atelier-shop-ready',()=>{if(!loaded)load();});
 element.on('atelier-shop-more',load);
 element.on('atelier-shop-add',async event=>{
  try{await addAtelierProduct(event.detail.productId);await wixEcomFrontend.refreshCart();element.setAttribute('cart-result',JSON.stringify({ok:true,at:Date.now()}));}
  catch{element.setAttribute('cart-result',JSON.stringify({ok:false,at:Date.now()}));}
 });
 load();
});
