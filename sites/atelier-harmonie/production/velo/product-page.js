import wixLocationFrontend from 'wix-location-frontend';
import wixEcomFrontend from 'wix-ecom-frontend';
import { getAtelierProduct, quoteAtelierProduct, addAtelierProductDetail } from 'backend/atelier-product.web';
import { seoMarkup as faqSeo } from 'public/atelier-productfaq-seo';
import { getAtelierProducts } from 'backend/atelier-shop.web';

$w.onReady(function(){
 let native,element;
 try{native=$w('#productPage1');native.hide();native.collapse();}catch{}
 // The retained native app host must never be displayed as a loading/error fallback.
 try{element=$w('#customElement20');if(typeof element.on!=='function')return;}catch{return;}

 // FAQ is an independent placement; its absence must not block the product.
 try{$w('#customElement21').seoMarkup=faqSeo;}catch{}
 let generation=0,selection=0,current=null,pendingAdd=false,readyTimer;
 element.on('atelier-product-rendered',event=>{
  if(event.detail?.renderToken===generation&&event.detail?.productId===current?.id)clearTimeout(readyTimer);
 });
 element.on('atelier-product-render-error',()=>clearTimeout(readyTimer));
 const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 async function load(){
  const version=++generation;current=null;++selection;
  clearTimeout(readyTimer);
  // Keep native UI suppressed on every product navigation, including failures.
  try{await native?.hide();await native?.collapse();await element.expand();}catch{}
  if(version!==generation)return;
  readyTimer=setTimeout(()=>{if(version===generation)element.setAttribute('product-error',String(version));},12000);
  element.setAttribute('product-loading',String(version));
  try{
   const path=wixLocationFrontend.path;
   if(path.length!==2||path[0]!=='product-page')throw Error('Invalid product route');
   let slug=path[1];try{slug=decodeURIComponent(slug);}catch{}
   const product=await getAtelierProduct(slug);
   if(version!==generation)return;
   current=product;element.setAttribute('product',JSON.stringify({...product,renderToken:version}));
   // Wix Stores retains its native canonical, structured Product data and SEO settings.
   element.seoMarkup='<article><h1>'+escape(product.name)+'</h1><p>'+escape(product.price)+' '+escape(product.currency)+'</p><p>'+escape(product.description.replace(/<[^>]*>/g,' '))+'</p></article>';
   getAtelierProducts(0).then(data=>{if(version===generation)element.setAttribute('related',JSON.stringify(data.items.filter(p=>p.id!==product.id).slice(0,4)));}).catch(()=>{});
  }catch{if(version===generation){element.setAttribute('product-error',String(version));element.seoMarkup='';clearTimeout(readyTimer);}}
 }
 element.on('atelier-product-select',async event=>{
  if(!current)return;const token=++selection,id=current.id,version=generation;
  try{const quote=await quoteAtelierProduct(id,event.detail.choices);if(token===selection&&version===generation)element.setAttribute('selection-result',JSON.stringify({...quote,requestId:event.detail.requestId}));}
  catch{if(token===selection&&version===generation)element.setAttribute('selection-result',JSON.stringify({productId:id,requestId:event.detail.requestId,error:true}));}
 });
 element.on('atelier-product-add',async event=>{
  if(pendingAdd||!current||event.detail.productId!==current.id)return;
  pendingAdd=true;const version=generation;
  try{const result=await addAtelierProductDetail(event.detail);if(version===generation)element.setAttribute('cart-result',JSON.stringify({ok:true,at:Date.now()}));await wixEcomFrontend.refreshCart().catch(()=>{});if(result.checkoutId&&version===generation)await wixEcomFrontend.navigateToCheckoutPage(result.checkoutId,{}).catch(()=>{});}
  catch{if(version===generation)element.setAttribute('cart-result',JSON.stringify({ok:false,at:Date.now()}));}
  finally{pendingAdd=false;}
 });
 element.on('atelier-product-cart',()=>wixEcomFrontend.navigateToCartPage());
 wixLocationFrontend.onChange(load);
 load();
});
