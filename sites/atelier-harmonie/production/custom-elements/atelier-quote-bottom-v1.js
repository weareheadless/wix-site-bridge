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
    const text = dictionary[key] ?? (/^\d+ créations?( · sélection chargée)?$/.test(key) ? key.replace(/créations?/, Number(key.split(' ')[0]) === 1 ? 'creation' : 'creations').replace('sélection chargée', 'loaded selection') : /^Photographie \d+$/.test(key) ? key.replace('Photographie', 'Photograph') : /^Découvrir /.test(key) ? key.replace(/^Découvrir /, 'Discover ') : /^\d+ sur \d+$/.test(key) ? key.replace(' sur ', ' of ') : undefined);
    return text === undefined ? value : value.replace(key, text);
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

(()=>{const TAG="atelier-quote-bottom-v1";if(customElements.get(TAG))return;class GiftElement extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'});}connectedCallback(){if(this.rendered)return;this.rendered=true;const href='https://fonts.googleapis.com/css2?family=Parisienne&family=DM+Sans:wght@400;500;600&family=Libre+Caslon+Text:ital,wght@0,400;1,400&display=swap';if(![...document.querySelectorAll('link[data-atelier-fonts]')].some(e=>e.href===href)){const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset.atelierFonts='true';document.head.append(l);}this.shadowRoot.innerHTML="<style>:host{display:block;width:100%;background:white;color:#42170a;font:400 14px/1.8 'DM Sans',sans-serif}*{box-sizing:border-box}h1,h2,h3,p{margin:0}h1,h2,h3{font-family:'Libre Caslon Text',Georgia,serif;font-weight:400;letter-spacing:-.035em}.wrap{max-width:1400px;margin:auto;padding-inline:clamp(24px,6vw,96px)}a{color:inherit;text-decoration:none}a:focus-visible,summary:focus-visible{outline:2px solid #87475b;outline-offset:5px}.eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:.15em;color:#87475b;margin-bottom:22px}.top{background:#faf6ee;padding-block:28px 45px}.crumb{display:flex;gap:14px;font-size:10px;color:#84746a;margin-bottom:32px}.intro-grid{display:grid;grid-template-columns:1fr 1fr;gap:7vw;align-items:center}h1{font-size:clamp(40px,4.4vw,62px);line-height:1.15}h1 em{color:#87475b}.body p{font-size:13px;color:#736258;line-height:1.95}.body p+p{margin-top:18px}.intro-note{border-top:1px solid #e5dace;margin-top:26px;padding-top:20px;color:#87475b;font-size:12px}.bottom{padding-block:50px 55px}.process-heading{max-width:700px;margin-bottom:30px}h2{font-size:clamp(30px,3.2vw,44px);line-height:1.25}.process{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}.step{background:#fdfbf7;border:1px solid #e5dace;padding:28px 26px}.step h3{font-size:24px;line-height:1.3;margin-bottom:18px}.step p{font-size:12px;color:#736258;line-height:1.9}.pricing{background:#faf6ee;padding-block:50px 55px}.pricing-grid{display:grid;grid-template-columns:1fr 1.2fr;gap:7vw;align-items:start}.pricing .body{margin-top:23px}.accordion{border-top:1px solid #e5dace}.accordion details{border-bottom:1px solid #e5dace}.accordion summary{list-style:none;cursor:pointer;font:400 21px/1.4 'Libre Caslon Text',Georgia,serif;display:flex;justify-content:space-between;gap:20px;padding:21px 0}.accordion summary::-webkit-details-marker{display:none}.accordion summary:after{content:'+';color:#87475b}.accordion details[open] summary:after{content:'−'}.accordion .body{margin-top:0;padding-bottom:23px}.closing{font:italic 22px/1.65 'Libre Caslon Text',Georgia,serif;color:#87475b;border-top:1px solid #e5dace;margin-top:35px;padding-top:28px;max-width:1050px}@media(max-width:700px){.top{padding-block:24px 32px}.intro-grid,.pricing-grid{grid-template-columns:1fr;gap:25px}h1{font-size:40px}.body p{font-size:12px}.crumb{margin-bottom:27px}.process{grid-template-columns:1fr;gap:16px}.bottom{padding-block:35px}.process-heading{margin-bottom:25px}h2{font-size:31px}.step{padding:24px}.step h3{font-size:23px;margin-bottom:14px}.pricing{padding-block:35px}.accordion summary{font-size:19px}.closing{font-size:19px;margin-top:25px;padding-top:24px}}</style><main><section class=\"bottom wrap\"><header class=\"process-heading\"><p class=\"eyebrow\">Comment ça marche ?</p><h2>Notre processus,<br>simple et transparent</h2></header><div class=\"process\"><article class=\"step\"><h3>Votre Demande</h3><p>Vous me décrivez votre projet via le formulaire. N&#x27;hésitez pas à joindre des photos, c&#x27;est encore mieux !</p></article><article class=\"step\"><h3>Notre Échange</h3><p>Je reviens vers vous très rapidement pour discuter plus en détail, vous conseiller et affiner ensemble votre projet.</p></article><article class=\"step\"><h3>Le Devis Détaillé</h3><p>Vous recevez une proposition chiffrée, claire et sans surprise, qui correspond exactement à ce que nous avons défini.</p></article></div></section><section class=\"pricing\"><div class=\"wrap\"><div class=\"pricing-grid\"><div><p class=\"eyebrow\">Le sens du fait main</p><h2>Comprendre le tarif<br>d’une création artisanale</h2><div class=\"body\"><p>Chaque devis est le reflet d&#x27;un travail juste et passionné. Le prix d&#x27;une création ou d&#x27;une restauration sur mesure ne se résume pas aux matières premières ; il comprend surtout :</p></div></div><div class=\"accordion\"><details><summary>Le temps et le savoir-faire</summary><div class=\"body\"><p>Des heures de travail minutieux d&#x27;un Artisan d&#x27;Art qualifié, que ce soit pour une rénovation de siège dans les règles de l&#x27;art ou pour la création d&#x27;un abat-jour aux finitions impeccables.</p></div></details><details><summary>La qualité des matériaux</summary><div class=\"body\"><p>Nous sélectionnons des tissus de créateur, des garnitures durables et écologiques, et des fournitures de qualité pour que votre pièce traverse le temps.</p></div></details><details><summary>La singularité de votre projet</summary><div class=\"body\"><p>La complexité du design, l&#x27;état d&#x27;un meuble à restaurer, les dimensions... chaque détail est pris en compte pour créer une pièce qui sera véritablement la vôtre.</p></div></details></div></div><p class=\"closing\">Investir dans une pièce sur mesure, c&#x27;est choisir un objet qui a une âme, soutient l&#x27;artisanat local et que vous ne retrouverez nulle part ailleurs.</p></div></section></main>";this.resize=new ResizeObserver(()=>{const height=Math.ceil(this.shadowRoot.querySelector('main').getBoundingClientRect().height);if(height&&this.style.height!==height+'px'){this.style.height=height+'px';this.dispatchEvent(new CustomEvent('atelier-layout',{detail:{height}}));}});this.resize.observe(this.shadowRoot.querySelector('main'));}disconnectedCallback(){this.resize?.disconnect();this.rendered=false;}}customElements.define(TAG,atelierLocalized(GiftElement,{"Comment ça marche ?":"How does it work?","Notre processus,":"Our process,","simple et transparent":"simple and transparent","Votre Demande":"Your Request","Vous me décrivez votre projet via le formulaire. N'hésitez pas à joindre des photos, c'est encore mieux !":"Describe your project using the form. Feel free to attach photos, it's even better!","Notre Échange":"Our Exchange","Je reviens vers vous très rapidement pour discuter plus en détail, vous conseiller et affiner ensemble votre projet.":"I will get back to you very soon to discuss this in more detail, advise you and refine your project together.","Le Devis Détaillé":"The Detailed Quote","Vous recevez une proposition chiffrée, claire et sans surprise, qui correspond exactement à ce que nous avons défini.":"You will receive a clear and straightforward detailed proposal that corresponds exactly to what we have defined.","Le sens du fait main":"The meaning of handmade","Comprendre le tarif":"Understanding the price","d’une création artisanale":"of a handcrafted creation","Chaque devis est le reflet d'un travail juste et passionné. Le prix d'une création ou d'une restauration sur mesure ne se résume pas aux matières premières ; il comprend surtout :":"Each quote reflects fair and passionate work. The price of a custom creation or restoration is not simply the cost of raw materials; it primarily includes:","Le temps et le savoir-faire":"Time and know-how","Des heures de travail minutieux d'un Artisan d'Art qualifié, que ce soit pour une rénovation de siège dans les règles de l'art ou pour la création d'un abat-jour aux finitions impeccables.":"Hours of meticulous work by a skilled craftsman, whether for a seat renovation done according to the rules of the art or for the creation of a lampshade with impeccable finishes.","La qualité des matériaux":"The quality of the materials","Nous sélectionnons des tissus de créateur, des garnitures durables et écologiques, et des fournitures de qualité pour que votre pièce traverse le temps.":"We select designer fabrics, durable and eco-friendly trims, and quality supplies to ensure your piece stands the test of time.","La singularité de votre projet":"The uniqueness of your project","La complexité du design, l'état d'un meuble à restaurer, les dimensions... chaque détail est pris en compte pour créer une pièce qui sera véritablement la vôtre.":"The complexity of the design, the condition of a piece of furniture to be restored, the dimensions... every detail is taken into account to create a piece that will truly be yours.","Investir dans une pièce sur mesure, c'est choisir un objet qui a une âme, soutient l'artisanat local et que vous ne retrouverez nulle part ailleurs.":"Investing in a custom-made piece means choosing an object that has a soul, supports local craftsmanship, and that you won't find anywhere else.","A":"HAS","telier":"workshop","ou":"or","de":"little","création":"creation"}));})();