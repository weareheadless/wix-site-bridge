function homeProductCards(root){
 const cards=new Map();
 root.querySelectorAll('a[href*="/product-page/"]').forEach(link=>{
  try{const url=new URL(link.getAttribute('href'),location.origin);if(![location.origin,'https://www.atelier-harmonie.com'].includes(url.origin))return;const path=url.pathname.split('/').filter(Boolean);if(path.length!==2||path[0]!=='product-page')return;const card=link.closest('.ah-card');if(card)cards.set(card,decodeURIComponent(path[1]));}catch{}
 });return cards;
}
function updateHomeAvailability(element){
 const root=element.shadowRoot;if(!root)return;
 let items=[];try{items=JSON.parse(element.getAttribute('availability')||'[]');}catch{}
 const data=new Map(items.map(p=>[p.slug,p]));
 for(const [card,slug] of homeProductCards(root)){
  const photo=card.querySelector('.ah-product-photo,.ah-collection-image');if(!photo)continue;
  let badge=photo.querySelector('[data-availability]');if(!badge){badge=document.createElement('span');badge.dataset.availability='true';badge.className='ah-availability-badge';photo.append(badge);}
  const p=data.get(slug);badge.hidden=p?.inStock===true;badge.textContent=p?.inStock===false?'Épuisé':element.hasAttribute('availability')?'Voir la disponibilité':'Disponibilité…';
  if(p&&card.querySelector('.ah-price'))card.querySelector('.ah-price').textContent=new Intl.NumberFormat('fr-FR',{style:'currency',currency:p.currency||'EUR'}).format(p.price);
 }
}
