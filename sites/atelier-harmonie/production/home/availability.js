function homeProductCards(root){const cards=new Map();root.querySelectorAll('a[href*="/product-page/"]').forEach(link=>{try{const u=new URL(link.getAttribute('href'),location.origin),p=u.pathname.split('/').filter(Boolean);if(![location.origin,'https://www.atelier-harmonie.com'].includes(u.origin)||p.length!==2||p[0]!=='product-page')return;const card=link.closest('.ah-card');if(card)cards.set(card,decodeURIComponent(p[1]));}catch{}});return cards;}
function homeProductType(p){const n=p.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();if(/\bkit\b|\bdiy\b/.test(n))return'diy';if(/baladeuse|ondine|mini.phare/.test(n))return'baladeuse';if(/suspension|pagode|cousus/.test(n))return'suspension';if(/abat.jour|tambour|escale/.test(n))return'abat-jour';if(/lampe|\bphare\b/.test(n))return'lampe';if(/fauteuil|chaise|tabouret|siege|banc|pouf/.test(n))return'siege';return'deco';}
const HOME_PRODUCT_FILTERS={collections:[['abat-jour','Abat-jour'],['suspension','Suspensions'],['baladeuse','Baladeuses']],boutique:[['lampe','Lampes à poser'],['siege','Les sièges'],['deco','Objets déco'],['diy','Kits DIY']]};
function homeProductUrl(value){try{const u=new URL(value,location.origin);return [location.origin,'https://www.atelier-harmonie.com'].includes(u.origin)&&u.pathname.startsWith('/product-page/')?u.pathname+u.search:'';}catch{return '';}}
function updateHomeAvailability(element){
 const root=element.shadowRoot;if(!root)return;
 if(!element.homeOriginalSlugs)element.homeOriginalSlugs=[...new Set(homeProductCards(root).values())];
 element.homeFilters||={collections:'abat-jour',boutique:'lampe'};
 let products=[];try{products=JSON.parse(element.getAttribute('availability')||'[]');}catch{}
 const pending=!element.hasAttribute('availability');
 for(const [sectionId,filters] of Object.entries(HOME_PRODUCT_FILTERS)){
  const section=root.getElementById('wix-bridge-section-'+sectionId),rail=section?.querySelector('[data-rail]');if(!rail)continue;
  let group=section.querySelector('[data-home-filters]');
  if(!group){group=document.createElement('div');group.dataset.homeFilters='true';group.className='ah-home-filters';group.setAttribute('role','group');group.setAttribute('aria-label',sectionId==='collections'?'Filtrer les luminaires':'Filtrer les autres créations');rail.parentElement.insertBefore(group,rail);}
  group.replaceChildren();
  for(const [key,label] of filters){const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=pending;b.setAttribute('aria-pressed',String(element.homeFilters[sectionId]===key));b.onclick=()=>{element.homeFilters[sectionId]=key;updateHomeAvailability(element);};group.append(b);}
  rail.replaceChildren();rail.classList.add('ah-home-live');rail.setAttribute('aria-busy',String(pending));
  const selected=products.filter(p=>homeProductType(p)===element.homeFilters[sectionId]&&p.image&&homeProductUrl(p.url)).slice(0,12);
  for(const p of selected){
   const card=document.createElement('a');card.className='ah-card';card.href=homeProductUrl(p.url);
   const photo=document.createElement('div');photo.className=sectionId==='collections'?'ah-collection-image':'ah-product-photo';
   const image=document.createElement('img');image.src=p.heroImage||p.image;image.alt=p.displayName||p.name;image.loading='lazy';image.decoding='async';photo.append(image);
   const badge=document.createElement('span');badge.className='ah-availability-badge';badge.dataset.state=p.inStock?'available':'sold-out';badge.textContent=p.inStock?'Disponible':'Épuisé';photo.append(badge);
   const title=document.createElement('h3');title.textContent=p.displayName||p.name;
   const price=document.createElement('p');price.className='ah-price';price.textContent=new Intl.NumberFormat('fr-FR',{style:'currency',currency:p.currency||'EUR'}).format(p.price);
   card.append(photo,title,price);rail.append(card);
  }
  if(!selected.length){const status=document.createElement('p');status.className='ah-home-empty';status.setAttribute('role','status');status.textContent=pending?'Les créations se dévoilent…':'Aucune création à afficher dans cette catégorie pour le moment.';rail.append(status);}
  rail.scrollLeft=0;rail.dispatchEvent(new Event('scroll'));
 }
}
