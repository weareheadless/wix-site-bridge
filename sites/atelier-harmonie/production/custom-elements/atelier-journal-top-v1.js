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

(()=>{const TAG="atelier-journal-top-v1";if(customElements.get(TAG))return;class GiftElement extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'});}connectedCallback(){if(this.rendered)return;this.rendered=true;const href='https://fonts.googleapis.com/css2?family=Parisienne&family=DM+Sans:wght@400;500;600&family=Libre+Caslon+Text:ital,wght@0,400;1,400&display=swap';if(![...document.querySelectorAll('link[data-atelier-fonts]')].some(e=>e.href===href)){const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset.atelierFonts='true';document.head.append(l);}this.shadowRoot.innerHTML="<style>:host{display:block;width:100%;color:#42170a;background:#faf6ee;font:400 14px/1.8 'DM Sans',sans-serif}*{box-sizing:border-box}h1,h2,p{margin:0}h1,h2{font-family:'Libre Caslon Text',Georgia,serif;font-weight:400;letter-spacing:-.035em}a{color:inherit;text-decoration:none}a:focus-visible{outline:2px solid #87475b;outline-offset:5px}.wrap{max-width:1440px;margin:auto;padding:28px clamp(24px,6vw,96px) 45px}.crumb{display:flex;gap:14px;font-size:10px;color:#84746a;margin-bottom:32px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:7vw;align-items:center}.eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:.15em;color:#87475b;margin-bottom:22px}h1{font-size:clamp(43px,4.8vw,68px);line-height:1.12}h1 em{color:#87475b}.body p{font-size:13px;line-height:1.95;color:#736258}.body p+p{margin-top:16px}.line{width:40px;height:2px;background:#b9808e;margin-top:25px}.bottom{padding-block:40px 45px}.bottom h2{font-size:clamp(30px,3vw,43px);line-height:1.25}.bottom .body{margin-top:20px;max-width:550px}.links{display:flex;gap:14px;flex-wrap:wrap;margin-top:24px}.links a{display:inline-flex;gap:22px;font-size:11px;color:#87475b;border-bottom:1px solid #cbb0b0;padding-bottom:8px}.note{border:1px solid #e5dace;padding:28px 30px;background:#fdfbf7}.note h2{font-size:29px}.note p{font-size:13px;color:#736258;margin-top:17px}.signature{font:400 33px/1.3 Parisienne,cursive;color:#87475b;margin-top:20px}@media(max-width:700px){.wrap{padding-block:24px 32px}.grid{grid-template-columns:1fr;gap:26px}h1{font-size:44px}.body p,.note p{font-size:12px}.bottom h2{font-size:31px}.bottom{padding-block:32px}.note{padding:25px 23px}.note h2{font-size:26px}}</style><main><section class=\"wrap\"><nav class=\"crumb\" aria-label=\"Fil d’Ariane\"><a href=\"/\">Accueil</a><span>/</span><span aria-current=\"page\">Le journal</span></nav><div class=\"grid\"><div><p class=\"eyebrow\">Dans les coulisses de l’atelier</p><h1>Le Blog<br><em>de l’Atelier</em></h1><div class=\"line\"></div></div><div class=\"body\"><p>Bienvenue dans le journal de bord de l&#x27;atelier ! Ici, je souhaite partager avec vous la passion qui m&#x27;anime : celle de la couleur, des belles matières et des objets uniques.</p><p>Ici, nous parlerons décoration, bien sûr, mais aussi des coulisses de la restauration de meubles, des techniques de création d&#x27;abat-jours... C&#x27;est un lieu d&#x27;échange et d&#x27;inspiration pour tous les amoureux de l&#x27;artisanat et des intérieurs qui ont de la personnalité. Alors, installez-vous confortablement !</p></div></div></section></main>";this.resize=new ResizeObserver(()=>{const height=Math.ceil(this.shadowRoot.querySelector('main').getBoundingClientRect().height);if(height&&this.style.height!==height+'px'){this.style.height=height+'px';this.dispatchEvent(new CustomEvent('atelier-layout',{detail:{height}}));}});this.resize.observe(this.shadowRoot.querySelector('main'));}disconnectedCallback(){this.resize?.disconnect();this.rendered=false;}}customElements.define(TAG,atelierLocalized(GiftElement,{"de l’atelier":"from the workshop","déco":"decor","Bienvenue":"Welcome","Le journal":"The newspaper","Dans les coulisses de l’atelier":"Behind the scenes at the workshop","Le Blog":"The Blog","de l’Atelier":"of the Workshop","Bienvenue dans le journal de bord de l'atelier ! Ici, je souhaite partager avec vous la passion qui m'anime : celle de la couleur, des belles matières et des objets uniques.":"Welcome to the workshop logbook! Here, I wish to share with you the passion that drives me: that of color, beautiful materials and unique objects.","Ici, nous parlerons décoration, bien sûr, mais aussi des coulisses de la restauration de meubles, des techniques de création d'abat-jours... C'est un lieu d'échange et d'inspiration pour tous les amoureux de l'artisanat et des intérieurs qui ont de la personnalité. Alors, installez-vous confortablement !":"Here, we'll talk about decoration, of course, but also about the behind-the-scenes aspects of furniture restoration, lampshade making techniques... It's a place for sharing and inspiration for all lovers of craftsmanship and interiors with personality. So, make yourself comfortable!","A":"HAS","telier":"workshop","Fil d’Ariane":"Breadcrumb","Accueil":"Home","ou":"or","de":"little","l’atelier":"shop","Atelier":"Atelier","création":"creation"}));})();