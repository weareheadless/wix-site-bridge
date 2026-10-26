// Each component receives only its own copy dictionary. No Wix DOM is inspected.
function atelierLocalized(Base, dictionary) {
 const normalize = value => String(value).replace(/\s+/g, ' ').trim();
 return class extends Base {
  static get observedAttributes() { return [...new Set([...(Base.observedAttributes || []), 'locale'])]; }
  connectedCallback() {
   super.connectedCallback?.();
   this.localizeAtelier();
   this.observeAtelierTranslations();
  }
  observeAtelierTranslations() {
   if (this.atelierIsEnglish() && !this.atelierTranslationObserver && this.shadowRoot) {
    this.atelierTranslationObserver = new MutationObserver(() => this.localizeAtelier());
    this.atelierTranslationObserver.observe(this.shadowRoot, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['href', 'alt', 'aria-label', 'aria-roledescription', 'placeholder', 'title']});
   }
  }
  attributeChangedCallback(name, oldValue, value) {
   if (name !== 'locale') super.attributeChangedCallback?.(name, oldValue, value);
   if (this.isConnected) { this.localizeAtelier(); this.observeAtelierTranslations(); }
  }
  disconnectedCallback() {
   this.atelierTranslationObserver?.disconnect();
   this.atelierTranslationObserver = null;
   super.disconnectedCallback?.();
  }
  atelierIsEnglish() {
   return (this.getAttribute('locale') || (/^\/en(?:\/|$)/.test(location.pathname) ? 'en' : document.documentElement.lang)).toLowerCase().startsWith('en');
  }
  localizeAtelier() {
   const root = this.shadowRoot;
   if (!root) return;
   const english = this.atelierIsEnglish();
   this.atelierTextOriginals ||= new WeakMap();
   this.atelierAttributeOriginals ||= new WeakMap();
   const translate = value => {
    const key = normalize(value);
    const cart = key.match(/^Voir mon panier, (\d+) articles?$/);
    const text = dictionary[key] ?? (cart ? 'View my basket, '+cart[1]+' '+(cart[1]==='1'?'item':'items') : undefined) ?? (/^\d+ créations?( · sélection chargée)?$/.test(key) ? key.replace(/créations?/, Number(key.split(' ')[0]) === 1 ? 'creation' : 'creations').replace('sélection chargée', 'loaded selection') : /^Photographie \d+$/.test(key) ? key.replace('Photographie', 'Photograph') : /^Découvrir /.test(key) ? key.replace(/^Découvrir /, 'Discover ') : /^\d+ sur \d+$/.test(key) ? key.replace(' sur ', ' of ') : undefined);
    return text === undefined ? value : value.replace(/\S(?:[\s\S]*\S)?/, () => text);
   };
   const update = (node, value, records, key, setter, transform) => {
    const record = records.get(key);
    const original = record && value === record.last ? record.original : value;
    const next = english ? transform(original) : original;
    records.set(key, {original, last: next});
    if (next !== value) setter(next);
   };
   const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
   for (let node; (node = walker.nextNode());) {
    if (node.parentElement?.closest('style,script,svg,[translate="no"]')) continue;
    let record = this.atelierTextOriginals.get(node);
    const original = record && node.data === record.last ? record.original : node.data;
    const next = english ? translate(original) : original;
    this.atelierTextOriginals.set(node, {original, last: next});
    if (node.data !== next) node.data = next;
   }
   for (const node of root.querySelectorAll('[href],[alt],[aria-label],[aria-roledescription],[placeholder],[title]')) {
    if (node.closest('[translate="no"]')) continue;
    let records = this.atelierAttributeOriginals.get(node);
    if (!records) { records = new Map(); this.atelierAttributeOriginals.set(node, records); }
    for (const key of ['alt', 'aria-label', 'aria-roledescription', 'placeholder', 'title']) {
     if (node.hasAttribute(key)) update(node, node.getAttribute(key), records, key, v => node.setAttribute(key, v), translate);
    }
    if (node.hasAttribute('href')) update(node, node.getAttribute('href'), records, 'href', v => node.setAttribute('href', v), value => {
     if (!value || value.startsWith('#')) return value;
     try {
      const url = new URL(value, location.origin);
      if (![location.origin, 'https://www.atelier-harmonie.com'].includes(url.origin) || !/^https?:$/.test(url.protocol)) return value;
      if (!/^\/en(?:\/|$)/.test(url.pathname)) url.pathname = '/en' + (url.pathname === '/' ? '' : url.pathname);
      return url.pathname + url.search + url.hash;
     } catch { return value; }
    });
   }
  }
 };
}

(()=>{const TAG="atelier-gift-guide-v1";if(customElements.get(TAG))return;class GiftElement extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'});}connectedCallback(){if(this.rendered)return;this.rendered=true;const href='https://fonts.googleapis.com/css2?family=Parisienne&family=DM+Sans:wght@400;500;600&family=Libre+Caslon+Text:ital,wght@0,400;1,400&display=swap';if(![...document.querySelectorAll('link[data-atelier-fonts]')].some(e=>e.href===href)){const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset.atelierFonts='true';document.head.append(l);}this.shadowRoot.innerHTML="<style>:host{display:block;width:100%;color:#42170a;font:400 14px/1.8 'DM Sans',sans-serif}*{box-sizing:border-box}h1,h2,h3,p,figure{margin:0}h1,h2,h3{font-family:'Libre Caslon Text',Georgia,serif;font-weight:400;letter-spacing:-.035em}a{color:inherit;text-decoration:none}.wrap{max-width:1440px;margin:auto;padding-inline:clamp(24px,6vw,96px)}.eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:.16em;color:#87475b;margin-bottom:23px}.intro{background:#faf6ee;padding-block:28px 55px}.crumb{display:flex;gap:14px;font-size:10px;color:#84746a;margin-bottom:32px}.split{display:grid;grid-template-columns:1.1fr .8fr;gap:8vw;align-items:center}h1{font-size:clamp(40px,4.8vw,68px);line-height:1.15;max-width:700px}h1 em{color:#87475b}.copy{max-width:540px;margin-top:26px;font-size:13px;color:#736258}.copy p+p{margin-top:14px}.visual{max-width:300px;width:100%;justify-self:center}.visual img{display:block;width:100%;height:auto}.guide{background:#faf6ee;padding-block:65px 75px}.guide-heading{max-width:650px;margin-bottom:34px}.guide h2{font-size:clamp(30px,3.3vw,45px);line-height:1.25}.steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}.step{background:#fdfbf7;border:1px solid #e5dace;padding:30px 28px}.step h3{font-size:24px;line-height:1.35;margin-bottom:20px}.step p{font-size:13px;color:#736258;line-height:1.95}.contact{margin-top:35px;display:flex;align-items:center;justify-content:space-between;gap:25px}.contact p{font-size:13px;color:#736258}.contact a{font-size:11px;color:#87475b;border-bottom:1px solid #b9808e77;padding-bottom:8px}.contact a:focus-visible{outline:2px solid #87475b;outline-offset:5px}@media(max-width:700px){.intro{padding-block:24px 35px}.split{grid-template-columns:1fr;gap:28px}h1{font-size:40px}.visual{max-width:240px}.copy{font-size:12px}.steps{grid-template-columns:1fr;gap:16px}.guide{padding-block:40px 45px}.guide h2{font-size:31px}.step{padding:25px 24px}.step h3{font-size:23px;margin-bottom:13px}.step p{font-size:12px}.contact{align-items:start;flex-direction:column;gap:17px}}</style><main><section class=\"guide\"><div class=\"wrap\"><header class=\"guide-heading\"><p class=\"eyebrow\">Le plaisir d’offrir, simplement</p><h2>Comment ça marche ?<br>C'est tout simple !</h2></header><div class=\"steps\"><article class=\"step\"><h3>Choisissez le montant</h3><p>Sélectionnez la valeur de la carte cadeau que vous souhaitez offrir.</p></article><article class=\"step\"><h3>Recevez la carte</h3><p>Vous recevrez une jolie carte cadeau par email, prête à être imprimée ou transférée directement à l&#x27;heureux(se) élu(e).</p></article><article class=\"step\"><h3>Laissez la magie opérer</h3><p>Le ou la destinataire pourra utiliser le code unique sur sa carte pour régler ses achats sur toute la boutique en ligne, ou pour financer un projet sur mesure.</p></article></div><div class=\"contact\"><p>Une question sur la carte cadeau ou un projet sur mesure ?</p><a href=\"mailto:mathildevalle.atelier@gmail.com\">Écrire à Mathilde ↗</a></div></div></section></main>";this.resize=new ResizeObserver(()=>{const height=Math.ceil(this.shadowRoot.querySelector('main').getBoundingClientRect().height);if(height&&this.style.height!==height+'px'){this.style.height=height+'px';this.dispatchEvent(new CustomEvent('atelier-layout',{detail:{height}}));}});this.resize.observe(this.shadowRoot.querySelector('main'));}disconnectedCallback(){this.resize?.disconnect();this.rendered=false;}}customElements.define(TAG,atelierLocalized(GiftElement,{"Mathilde":"Mathilde","Écrire à Mathilde":"Email Mathilde","Comment ça marche ?":"How does it work?","projet sur mesure":"your ideas to life","A":"A","telier":"telier","Le plaisir d’offrir, simplement":"Giving made simple","C'est tout simple !":"It’s simple!","Choisissez le montant":"Choose the amount","Sélectionnez la valeur de la carte cadeau que vous souhaitez offrir.":"Select the value of the gift card you wish to give.","Recevez la carte":"Receive the card","Vous recevrez une jolie carte cadeau par email, prête à être imprimée ou transférée directement à l'heureux(se) élu(e).":"Your gift card arrives by email, ready to print or forward to the person you are treating.","Laissez la magie opérer":"Let the magic happen","Le ou la destinataire pourra utiliser le code unique sur sa carte pour régler ses achats sur toute la boutique en ligne, ou pour financer un projet sur mesure.":"The recipient can use the unique code on their card to shop online or put it towards a bespoke project.","Une question sur la carte cadeau ou un projet sur mesure ?":"A question about gift cards or a bespoke project?","Écrire à Mathilde ↗":"Email Mathilde ↗","mathildevalle.atelier@gmail.com":"mathildevalle.atelier@gmail.com","ou":"or","de":"at"}));})();