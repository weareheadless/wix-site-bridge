import { seoMarkup } from 'public/atelier-home-seo';
import { getAtelierProducts } from 'backend/atelier-shop.web';

$w.onReady(function () {
 const element=$w('#customElement2');
 element.seoMarkup=seoMarkup;
 let loading=false,loaded=false;
 async function load(){
  if(loading||loaded)return;loading=true;
  let items=[],skip=0;
  try{
   while(true){
    const data=await getAtelierProducts(skip);
    items=items.concat(data.items);element.setAttribute('availability',JSON.stringify(items));
    if(!data.hasMore||data.nextSkip<=skip)break;
    skip=data.nextSkip;
   }
   loaded=true;
  }catch{element.setAttribute('availability',JSON.stringify(items));}
  finally{loading=false;}
 }
 element.on('atelier-home-products-ready',load);
 element.setAttribute('availability-request',String(Date.now()));
 load();
});
