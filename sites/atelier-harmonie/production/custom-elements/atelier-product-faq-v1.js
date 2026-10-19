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

(()=>{const TAG="atelier-product-faq-v1";if(customElements.get(TAG))return;class GiftElement extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'});}connectedCallback(){if(this.rendered)return;this.rendered=true;const href='https://fonts.googleapis.com/css2?family=Parisienne&family=DM+Sans:wght@400;500;600&family=Libre+Caslon+Text:ital,wght@0,400;1,400&display=swap';if(![...document.querySelectorAll('link[data-atelier-fonts]')].some(e=>e.href===href)){const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset.atelierFonts='true';document.head.append(l);}this.shadowRoot.innerHTML="<style>\n:host{display:block;width:100%;color:#42170a;background:#faf6ee;font:400 14px/1.8 'DM Sans',sans-serif}*{box-sizing:border-box}h2,p{margin:0}main{padding:70px clamp(24px,6vw,96px) 80px}.wrap{max-width:1240px;margin:auto;display:grid;grid-template-columns:.75fr 1.25fr;gap:clamp(35px,7vw,110px)}.eyebrow{color:#87475b;font-size:10px;letter-spacing:.16em;text-transform:uppercase;margin-bottom:18px}h2{font:400 clamp(31px,3.2vw,46px)/1.2 'Libre Caslon Text',Georgia,serif;letter-spacing:-.035em;max-width:350px}.intro{font-size:12px;color:#75675e;max-width:280px;margin-top:22px}.contact{display:inline-block;margin-top:24px;font-size:12px;color:#87475b;text-decoration:none;border-bottom:1px solid #b9808e;padding-bottom:4px}details{border-top:1px solid #ddd3c4}details:last-child{border-bottom:1px solid #ddd3c4}summary{cursor:pointer;list-style:none;display:flex;justify-content:space-between;gap:25px;padding:21px 0;font-size:13px;line-height:1.6}summary::-webkit-details-marker{display:none}summary:after{content:'+';font-size:20px;color:#87475b;line-height:1.1;flex-shrink:0}details[open] summary:after{content:'−'}.answer{font-size:13px;color:#6b584b;padding:0 28px 24px 0;line-height:1.9}summary:focus-visible,a:focus-visible{outline:2px solid #87475b;outline-offset:4px}@media(max-width:750px){main{padding:40px 24px 48px}.wrap{grid-template-columns:1fr;gap:30px}h2{max-width:none}.intro{max-width:none;margin-top:16px}.contact{margin-top:14px}summary{padding:18px 0}}\n</style>\n<main><div class=\"wrap\"><header><p class=\"eyebrow\">Les petits conseils de l’atelier</p><h2>Questions fréquentes</h2><p class=\"intro\">Lumière, entretien, livraison… Quelques réponses pour choisir votre création en toute confiance.</p><a class=\"contact\" href=\"/devis\">Une autre question ? Écrivez-moi ↗</a></header><section aria-label=\"Questions et réponses\">\n<details name=\"atelier-product-faq\"><summary>Quel type d'ampoule dois-je utiliser pour vos luminaires ?</summary><p class=\"answer\">Pour prendre soin de votre abat-jour, nous recommandons systématiquement l'utilisation d'une ampoule LED. Elle ne chauffe pas, ce qui préserve la qualité et les couleurs du tissu sur le long terme. Sauf indication contraire, nos lampes sont conçues pour des ampoules avec un culot E27.</p></details>\n<details name=\"atelier-product-faq\"><summary>Comment entretenir ma création artisanale ?</summary><p class=\"answer\">C'est très simple ! Pour les abat-jours et coussins en tissu, un dépoussiérage régulier avec un plumeau ou une brosse adhésive douce suffit. En cas de petite tache, utilisez un chiffon très légèrement humide. Pour les sièges restaurés, un coup d'aspirateur avec un embout brosse est idéal. Pour les pieds de lampe, un simple chiffon doux suffit.</p></details>\n<details name=\"atelier-product-faq\"><summary>Vos créations sont fragiles. Comment se passe la livraison ?</summary><p class=\"answer\">N'ayez aucune inquiétude ! Chaque pièce est emballée par nos soins avec la plus grande précaution, en utilisant des matériaux de calage et de protection adaptés pour qu'elle vous arrive en parfait état, prête à illuminer votre intérieur.</p></details>\n<details name=\"atelier-product-faq\"><summary>Qu'est-ce qui rend ma pièce \"unique\" ?</summary><p class=\"answer\">Chaque création qui sort de l'atelier est fabriquée à la main, jamais en grande série. Pour les pièces upcyclées, leur unicité vient aussi de leur histoire passée ! Une légère marque du temps sur un pied de lampe ou une structure de fauteuil n'est pas un défaut, mais la cicatrice pleine de charme de sa vie d'avant.</p></details>\n<details name=\"atelier-product-faq\"><summary>J'ai une question sur un produit avant de commander, que faire ?</summary><p class=\"answer\">Surtout, n'hésitez pas ! Nous adorons parler de nos créations. Utilisez le formulaire de contact pour nous poser toutes vos questions, nous vous répondrons avec grand plaisir et dans les plus brefs délais.</p></details>\n</section></div></main>\n";this.resize=new ResizeObserver(()=>{const height=Math.ceil(this.shadowRoot.querySelector('main').getBoundingClientRect().height);if(height&&this.style.height!==height+'px'){this.style.height=height+'px';this.dispatchEvent(new CustomEvent('atelier-layout',{detail:{height}}));}});this.resize.observe(this.shadowRoot.querySelector('main'));}disconnectedCallback(){this.resize?.disconnect();this.rendered=false;}}customElements.define(TAG,atelierLocalized(GiftElement,{"de l’atelier":"from the workshop","Les":"THE","sièges":"seats","A":"HAS","telier":"workshop","luminaires":"lighting fixtures","Les petits conseils de l’atelier":"Little tips from the workshop","Questions fréquentes":"Frequently Asked Questions","Lumière, entretien, livraison… Quelques réponses pour choisir votre création en toute confiance.":"Lighting, maintenance, delivery… Some answers to help you choose your creation with complete confidence.","Une autre question ? Écrivez-moi ↗":"Any other questions? Write to me ↗","Questions et réponses":"Questions and answers","Quel type d'ampoule dois-je utiliser pour vos luminaires ?":"What type of light bulb should I use for your light fixtures?","Pour prendre soin de votre abat-jour, nous recommandons systématiquement l'utilisation d'une ampoule LED. Elle ne chauffe pas, ce qui préserve la qualité et les couleurs du tissu sur le long terme. Sauf indication contraire, nos lampes sont conçues pour des ampoules avec un culot E27.":"To care for your lampshade, we always recommend using an LED bulb. It doesn't get hot, which preserves the quality and colors of the fabric over time. Unless otherwise specified, our lamps are designed for bulbs with an E27 base.","Comment entretenir ma création artisanale ?":"How do I care for my handmade creation?","C'est très simple ! Pour les abat-jours et coussins en tissu, un dépoussiérage régulier avec un plumeau ou une brosse adhésive douce suffit. En cas de petite tache, utilisez un chiffon très légèrement humide. Pour les sièges restaurés, un coup d'aspirateur avec un embout brosse est idéal. Pour les pieds de lampe, un simple chiffon doux suffit.":"It's very simple! For fabric lampshades and cushions, regular dusting with a feather duster or soft lint roller is all you need. For small stains, use a very slightly damp cloth. For restored chairs, a quick vacuum with a brush attachment is ideal. For lamp bases, a simple soft cloth is all you need.","Vos créations sont fragiles. Comment se passe la livraison ?":"Your creations are fragile. How does delivery work?","N'ayez aucune inquiétude ! Chaque pièce est emballée par nos soins avec la plus grande précaution, en utilisant des matériaux de calage et de protection adaptés pour qu'elle vous arrive en parfait état, prête à illuminer votre intérieur.":"Have no worries! Each piece is packed by us with the utmost care, using appropriate cushioning and protective materials so that it arrives in perfect condition, ready to brighten up your home.","Qu'est-ce qui rend ma pièce \"unique\" ?":"What makes my piece \"unique\"?","Chaque création qui sort de l'atelier est fabriquée à la main, jamais en grande série. Pour les pièces upcyclées, leur unicité vient aussi de leur histoire passée ! Une légère marque du temps sur un pied de lampe ou une structure de fauteuil n'est pas un défaut, mais la cicatrice pleine de charme de sa vie d'avant.":"Each creation that leaves the workshop is handmade, never mass-produced. For upcycled pieces, their uniqueness also comes from their past! A slight mark of time on a lamp base or chair frame is not a flaw, but the charming scar of its previous life.","J'ai une question sur un produit avant de commander, que faire ?":"I have a question about a product before ordering, what should I do?","Surtout, n'hésitez pas ! Nous adorons parler de nos créations. Utilisez le formulaire de contact pour nous poser toutes vos questions, nous vous répondrons avec grand plaisir et dans les plus brefs délais.":"Don't hesitate to contact us! We love talking about our creations. Use the contact form to ask us any questions; we'll be happy to answer them as soon as possible.","ou":"or","de":"little","l’atelier":"shop","création":"creation","créations":"creations","couleur":"colour"}));})();