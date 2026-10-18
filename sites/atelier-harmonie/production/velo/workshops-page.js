import wixSeoFrontend from 'wix-seo-frontend';
import { seoMarkup } from 'public/atelier-workshops-seo';

const title='Ateliers DIY en Normandie | Atelier de l’harmonie';
const description='Créez votre abat-jour ou restaurez une chaise avec Mathilde à Saint-Pierre-en-Port, en Normandie. Ateliers en petits groupes, débutants bienvenus.';
const image='https://static.wixstatic.com/media/667aea_a2993b7928a24b0e8e8de7d9c091f788~mv2.jpg';

$w.onReady(function(){
 // Set metadata in page onReady so Wix rendering exposes it to search engines.
 wixSeoFrontend.setTitle(title);
 wixSeoFrontend.setMetaTags([
  {name:'description',content:description},
  {property:'og:title',content:title},
  {property:'og:description',content:description},
  {property:'og:type',content:'website'},
  {property:'og:url',content:'https://www.atelier-harmonie.com/les-ateliers'},
  {property:'og:image',content:image},
  {property:'og:image:alt',content:'Création et partage lors d’un atelier abat-jour avec Mathilde'},
  {name:'twitter:card',content:'summary_large_image'},
  {name:'twitter:title',content:title},
  {name:'twitter:description',content:description},
  {name:'twitter:image',content:image}
 ]);
 $w('#customElement14').seoMarkup=seoMarkup;
});
