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

(()=>{const TAG='atelier-contact-v1';if(customElements.get(TAG))return;class GiftElement extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'});}connectedCallback(){if(this.rendered)return;this.rendered=true;const href='https://fonts.googleapis.com/css2?family=Parisienne&family=DM+Sans:wght@400;500;600&family=Libre+Caslon+Text:ital,wght@0,400;1,400&display=swap';if(![...document.querySelectorAll('link[data-atelier-fonts]')].some(e=>e.href===href)){const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset.atelierFonts='true';document.head.append(l);}this.shadowRoot.innerHTML="<style>:host{display:block;width:100%;background:#faf6ee;color:#42170a;font:400 14px/1.8 'DM Sans',sans-serif}*{box-sizing:border-box}h2,p,figure{margin:0}.wrap{max-width:1440px;margin:auto;padding:55px clamp(24px,6vw,96px)}.contact-grid{display:grid;grid-template-columns:.55fr 1fr;gap:7vw;align-items:center}.photo{max-width:270px;justify-self:center;width:100%}.photo img{display:block;width:100%;height:auto}.eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:.15em;color:#87475b;margin-bottom:21px}h2{font:400 clamp(32px,3.7vw,50px)/1.2 'Libre Caslon Text',Georgia,serif;letter-spacing:-.035em}.copy{font-size:13px;color:#736258;margin-top:21px;max-width:530px}.links{display:flex;flex-wrap:wrap;gap:13px 28px;margin-top:25px}a{color:#87475b;text-decoration:none;border-bottom:1px solid #c4a6a8;padding-bottom:5px;font-size:13px}a:focus-visible{outline:2px solid #87475b;outline-offset:5px}.signature{font:400 33px/1.3 Parisienne,cursive;color:#87475b;margin-top:22px}@media(max-width:700px){.wrap{padding-block:35px}.contact-grid{grid-template-columns:1fr;gap:25px}.photo{max-width:185px}.eyebrow{font-size:9px}h2{font-size:34px}.copy{font-size:12px}.links{flex-direction:column;align-items:start;gap:14px}a{font-size:12px}.signature{font-size:30px}}.photo{position:relative}.photo:before{content:'';position:absolute;inset:-16px 16px 16px -16px;border:1px solid #d8b8b1;z-index:0;pointer-events:none}.photo img{position:relative;z-index:1}h2{color:#87475b}</style><main><section class=\"wrap\" aria-labelledby=\"contact-heading\"><div class=\"contact-grid\"><figure class=\"photo\"><img src=\"https://static.wixstatic.com/media/667aea_90e41a7fb49440a9858793d67062cdf9~mv2.webp/v1/fit/w_800,h_1000,q_82,enc_avif/667aea_90e41a7fb49440a9858793d67062cdf9~mv2.webp\" alt=\"Étape de piquage d’une chaise en tapisserie traditionnelle\" loading=\"lazy\" decoding=\"async\" width=\"600\" height=\"600\"></figure><div><p class=\"eyebrow\">Donnons vie à vos idées, ensemble !</p><h2 id=\"contact-heading\">Pour me contacter</h2><p class=\"copy\">Un fauteuil à restaurer, un abat-jour à imaginer, des coussins sur mesure ? Parlez-moi de votre projet dans le formulaire ci-dessous, ou contactez-moi directement.</p><div class=\"links\"><a href=\"mailto:mathildevalle.atelier@gmail.com\">mathildevalle.atelier@gmail.com</a><a href=\"tel:+33659015744\">06 59 01 57 44</a></div><div class=\"signature\" aria-hidden=\"true\">Mathilde</div></div></div></section></main>";this.resize=new ResizeObserver(()=>{const height=Math.ceil(this.shadowRoot.querySelector('main').getBoundingClientRect().height);if(height&&this.style.height!==height+'px'){this.style.height=height+'px';this.dispatchEvent(new CustomEvent('atelier-layout',{detail:{height}}));}});this.resize.observe(this.shadowRoot.querySelector('main'));}disconnectedCallback(){this.resize?.disconnect();this.rendered=false;}}customElements.define(TAG,atelierLocalized(GiftElement,{"Mathilde":"Mathilde","Étape de piquage d’une chaise en tapisserie traditionnelle":"Stitching a chair seat using traditional upholstery techniques","Donnons vie à vos idées, ensemble !":"Let’s bring your ideas to life, together!","Pour me contacter":"Get in touch","Un fauteuil à restaurer, un abat-jour à imaginer, des coussins sur mesure ? Parlez-moi de votre projet dans le formulaire ci-dessous, ou contactez-moi directement.":"Need an armchair restored, a lampshade designed, or custom-made cushions? Tell me about your project in the form below, or contact me directly.","A":"A","telier":"telier","mathildevalle.atelier@gmail.com":"mathildevalle.atelier@gmail.com","ou":"or","de":"at"}));})();