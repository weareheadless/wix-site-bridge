import { englishProductCopy, translatedField } from 'backend/atelier-translations';
import wixData from 'wix-data';
import wixStoresBackend from 'wix-stores-backend';
import { Permissions, webMethod } from 'wix-web-module';
import { currentCart } from 'wix-ecom-backend';

const APP_ID='215238eb-22a5-4c36-9e7b-e7c08025e04e';
const validId=value=>typeof value==='string'&&/^[\w-]{1,100}$/.test(value);
function mediaUrl(value,width=1200){
 if(typeof value!=='string')return '';
 const match=value.match(/^wix:image:\/\/v1\/([^/]+)/);
 const base=match?'https://static.wixstatic.com/media/'+match[1]:value.startsWith('https://static.wixstatic.com/media/')?value.split('/v1/')[0]:'';
 return base?base+'/v1/fit/w_'+width+',h_'+width+',q_85,enc_avif,quality_auto/file.jpg':'';
}
function optionsOf(p){return Object.entries(p.productOptions||{}).map(([key,o])=>({name:key,choices:(o.choices||[]).filter(c=>c.visible!==false).map(c=>({value:c.value,label:c.description||c.value,inStock:c.inStock!==false,image:mediaUrl(c.mainMedia)}))}));}
function textOf(p){return (p.customTextFields||[]).map(f=>({title:f.title,maxLength:f.maxLength||500,mandatory:f.mandatory===true}));}
async function publicProduct(id){
 if(!validId(id))throw Error('Invalid product');
 const result=await wixData.query('Stores/Products').eq('_id',id).limit(1).find();
 if(!result.items[0])throw Error('Product unavailable');
 return result.items[0];
}
function validatedChoices(p,input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Select product options');
 const options=optionsOf(p);
 if(Object.keys(input).length!==options.length)throw Error('Select all product options');
 return Object.fromEntries(options.map(o=>{
  const selected=o.choices.find(c=>c.value===input[o.name]);
  if(!selected||!selected.inStock)throw Error('Option unavailable');
  return [o.name,selected.value];
 }));
}
async function resolve(p,input,quantity=1){
 const choices=validatedChoices(p,input);
 let price=p.discountedPrice??p.price,originalPrice=p.price,inStock=p.inStock===true,variantId;
 if(p.manageVariants){
  const variants=await wixStoresBackend.getProductVariants(p._id,{choices});
  const match=variants.filter(v=>v.variant?.visible!==false&&Object.entries(choices).every(([k,vv])=>v.choices?.[k]===vv));
  if(match.length!==1)throw Error('Variant unavailable');
  const selected=match[0];variantId=selected._id;
  if(!validId(variantId))throw Error('Variant unavailable');
  price=selected.variant.discountedPrice??selected.variant.price;originalPrice=selected.variant.price;
  const inventory=await wixData.query('Stores/Variants').eq('productId',p._id).eq('variantId',variantId).limit(1).find();
  const stock=inventory.items[0]?.stock;
  inStock=inStock&&stock?.inStock===true&&(!stock.trackQuantity||stock.quantity>=quantity);
 }else if(p.trackInventory){inStock=inStock&&p.quantityInStock>=quantity;}
 return {choices,variantId,price,originalPrice,currency:p.currency||'EUR',inStock};
}
export const getAtelierProduct=webMethod(Permissions.Anyone,async(slug,locale='fr')=>{
 if(typeof slug!=='string'||!slug||slug.length>300||/[\/\x00-\x1f]/.test(slug))throw Error('Invalid product route');
 const result=await wixData.query('Stores/Products').eq('slug',slug).limit(1).find();
 const p=result.items[0];if(!p)throw Error('Product unavailable');
 const translated=(await englishProductCopy([p._id],locale).catch(()=>new Map())).get(p._id);
 // Some Wix catalogs keep the narrative in an additional product-info section.
 const sections=p.additionalInfoSections||[];
 const hasText=value=>typeof value==='string'&&value.replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/gi,' ').trim().length>0;
 const narrative=hasText(p.description)?null:sections.find(section=>/description|présentation|product info|informations? (?:sur le )?produit|détails? (?:du )?produit/i.test(section.title||'')&&hasText(section.description));
 const description=hasText(p.description)?p.description:narrative?.description||'';
 const photos=[{src:p.mainMedia,title:p.name},...(p.mediaItems||[]).filter(m=>m.type==='Image')];
 const seen=new Set();const images=photos.map(m=>({src:mediaUrl(m.src),thumbnail:mediaUrl(m.src,160),alt:m.description||m.title||p.name})).filter(m=>m.src&&!seen.has(m.src)&&seen.add(m.src));
 return {id:p._id,name:translatedField(translated,'product-name')||p.name,url:p.productPageUrl,description:translatedField(translated,'product-description')||description,images,price:p.discountedPrice??p.price,originalPrice:p.price,currency:p.currency||'EUR',inStock:p.inStock===true,ribbon:p.ribbon||'',options:optionsOf(p),customTextFields:textOf(p),additionalInfoSections:sections.filter(section=>section!==narrative).map(section=>sections.length===1&&translated?{...section,title:translatedField(translated,'product-additionalInfo()-title')||section.title,description:translatedField(translated,'product-additionalInfo()-description')||section.description}:section),manageVariants:p.manageVariants===true};
});
export const quoteAtelierProduct=webMethod(Permissions.Anyone,async(productId,choices)=>{
 const p=await publicProduct(productId);return {productId,...await resolve(p,choices)};
});
export const addAtelierProductDetail=webMethod(Permissions.Anyone,async(request)=>{
 if(!request||!Number.isSafeInteger(request.quantity)||request.quantity<1||request.quantity>99)throw Error('Invalid quantity');
 const p=await publicProduct(request.productId),resolved=await resolve(p,request.choices,request.quantity);
 if(!resolved.inStock)throw Error('Product unavailable');
 const fields=textOf(p),input=request.customTextFields;
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!fields.some(f=>f.title===k)))throw Error('Invalid custom text');
 const texts=Object.fromEntries(fields.map(f=>{
  const value=input[f.title]??'';
  if(typeof value!=='string'||value.length>f.maxLength||(f.mandatory&&!value.trim()))throw Error('Complete product details');
  return [f.title,value];
 }).filter(([,value])=>value!==''));
 const options=p.manageVariants?{variantId:resolved.variantId}:Object.keys(resolved.choices).length?{options:resolved.choices}:{};
 if(Object.keys(texts).length)options.customTextFields=texts;
 // Never accept a client price, app ID or arbitrary cart options. Wix calculates and validates the line item.
 await currentCart.addToCurrentCart({lineItems:[{catalogReference:{appId:APP_ID,catalogItemId:p._id,...(Object.keys(options).length?{options}:{})},quantity:request.quantity}]});
 if(request.checkout===true){
  try{const checkout=await currentCart.createCheckoutFromCurrentCart({channelType:'WEB'});return {ok:true,productId:p._id,checkoutId:checkout.checkoutId};}
  catch{return {ok:true,productId:p._id,checkoutError:true};}
 }
 return {ok:true,productId:p._id};
});
