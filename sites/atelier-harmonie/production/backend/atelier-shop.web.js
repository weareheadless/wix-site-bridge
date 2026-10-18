import wixData from 'wix-data';
import { Permissions, webMethod } from 'wix-web-module';
import { currentCart } from 'wix-ecom-backend';

const PAGE_SIZE=100;
function imageUrl(value){
 if(typeof value!=='string')return '';
 if(value.startsWith('https://static.wixstatic.com/'))return value;
 const match=value.match(/^wix:image:\/\/v1\/([^/]+)/);
 return match?'https://static.wixstatic.com/media/'+match[1]+'/v1/fill/w_750,h_940,al_c,q_85,enc_avif,quality_auto/'+match[1]:'';
}
function requiresOptions(p){return Object.keys(p.productOptions||{}).length>0||(p.customTextFields||[]).length>0;}
export const getAtelierProducts=webMethod(Permissions.Anyone,async(skip=0)=>{
 if(!Number.isSafeInteger(skip)||skip<0||skip>10000)throw Error('Invalid catalog page');
 // Query Wix's public app collection; never suppress permissions or include hidden products.
 const result=await wixData.query('Stores/Products').descending('_updatedDate').skip(skip).limit(PAGE_SIZE).find();
 return {items:result.items.map(p=>({id:p._id,name:p.name,url:p.productPageUrl,image:imageUrl(p.mainMedia),secondaryImage:imageUrl((p.mediaItems||[]).filter(m=>m.type==='Image'&&m.src!==p.mainMedia)[0]?.src),price:p.discountedPrice??p.price,originalPrice:p.price,currency:p.currency||'EUR',inStock:p.inStock===true,ribbon:p.ribbon||'',requiresOptions:requiresOptions(p)})),hasMore:result.hasNext(),nextSkip:skip+result.items.length};
});
export const addAtelierProduct=webMethod(Permissions.Anyone,async(productId)=>{
 if(typeof productId!=='string'||!/^[\w-]{1,100}$/.test(productId))throw Error('Invalid product');
 const result=await wixData.query('Stores/Products').eq('_id',productId).limit(1).find();
 const product=result.items[0];
 if(!product||!product.inStock||requiresOptions(product))throw Error('Open the product page to select this piece');
 // Wix owns pricing, inventory, cart and checkout. No client-supplied price or quantity.
 await currentCart.addToCurrentCart({lineItems:[{catalogReference:{appId:'215238eb-22a5-4c36-9e7b-e7c08025e04e',catalogItemId:productId},quantity:1}]});
 return {ok:true};
});
