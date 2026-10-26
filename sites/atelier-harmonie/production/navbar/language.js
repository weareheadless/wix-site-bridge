// Wix Velo supplies the site's display languages; never enable a hidden locale here.
function updateNavbarLanguage(element){
 const root=element.shadowRoot;if(!root)return;
 let languages=[];try{languages=JSON.parse(element.getAttribute('languages')||'[]')}catch{}
 const current=element.getAttribute('current-language')||element.getAttribute('locale')||'fr';
 const available=languages.filter(code=>code==='fr'||code==='en');
 root.querySelectorAll('[data-language-switch]').forEach(group=>{
  group.hidden=available.length<2;
  group.setAttribute('aria-label',current==='en'?'Language':'Langue');
  group.querySelectorAll('[data-language]').forEach(button=>{
   const active=button.dataset.language===current;
   button.disabled=!available.includes(button.dataset.language);
   button.setAttribute('aria-pressed',String(active));
  });
 });
}
function bindNavbarLanguage(element){
 element.shadowRoot.querySelectorAll('[data-language]').forEach(button=>{
  button.addEventListener('click',()=>{
   if(button.disabled||button.getAttribute('aria-pressed')==='true')return;
   element.dispatchEvent(new CustomEvent('atelier-language',{detail:{language:button.dataset.language},bubbles:true,composed:true}));
  });
 });
 updateNavbarLanguage(element);
}
