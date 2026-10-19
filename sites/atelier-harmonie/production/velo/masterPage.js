import { localizedSeo, bindAtelierLocale } from 'public/atelier-locale';
import { seoMarkup as footerSeoMarkupFrench, seoMarkupEnglish as footerSeoMarkupEnglish } from 'public/atelier-footer-seo';
import { seoMarkup as seoMarkupFrench, seoMarkupEnglish as seoMarkupEnglish } from 'public/atelier-navbar-seo';
import wixEcomFrontend from 'wix-ecom-frontend';
import { currentCart } from 'wix-ecom-backend';

const footerSeoMarkup = localizedSeo(footerSeoMarkupFrench, footerSeoMarkupEnglish);
const seoMarkup = localizedSeo(seoMarkupFrench, seoMarkupEnglish);

$w.onReady(function () {
 try{bindAtelierLocale($w('#customElement3'));}catch{}
 try{bindAtelierLocale($w('#customElement1'));}catch{}

 try{$w('#customElement3').seoMarkup=footerSeoMarkup;}catch{}
 let navbar;try{navbar=$w('#customElement1');navbar.seoMarkup=seoMarkup;}catch{return;}
 navbar.on('atelier-cart',()=>wixEcomFrontend.navigateToCartPage());
 let fetching=false,again=false;
 async function updateCount(){
  if(fetching){again=true;return;}fetching=true;
  try{
   const cart=await currentCart.getCurrentCart();
   const count=(cart.lineItems||[]).reduce((sum,item)=>sum+(Number.isSafeInteger(item.quantity)&&item.quantity>0?item.quantity:0),0);
   navbar.setAttribute('cart-count',String(count));
  }catch{navbar.setAttribute('cart-count','');}
  finally{fetching=false;if(again){again=false;updateCount();}}
 }
 wixEcomFrontend.onCartChange(updateCount);
 navbar.on('atelier-navbar-ready',updateCount);
 updateCount();
});
