function updateNavbarCart(element){
 const raw=element.getAttribute('cart-count'),count=raw!==null&&raw!==''?Number(raw):null;
 const known=Number.isSafeInteger(count)&&count>=0;
 element.shadowRoot?.querySelectorAll('[data-cart]').forEach(button=>{
  const badge=button.querySelector('[data-cart-count]');if(!badge)return;
  badge.hidden=!known;badge.textContent=known?String(count):'';
  button.setAttribute('aria-label',known?'Voir mon panier, '+count+' '+(count===1?'article':'articles'):'Voir mon panier');
 });
}
