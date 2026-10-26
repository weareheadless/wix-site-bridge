import { localizedSeo, bindAtelierLocale, atelierLocale } from 'public/atelier-locale';
import wixSeoFrontend from 'wix-seo-frontend';
import { seoMarkup as seoMarkupFrench, seoMarkupEnglish as seoMarkupEnglish } from 'public/atelier-workshops-seo';

const seoMarkup = localizedSeo(seoMarkupFrench, seoMarkupEnglish);

const title=atelierLocale()==='en'?'Creative workshops in Normandy | Atelier de l’harmonie':'Ateliers DIY en Normandie | Atelier de l’harmonie';
const description=atelierLocale()==='en'?'Make a lampshade or restore a chair with Mathilde in Saint-Pierre-en-Port, Normandy. Small-group workshops, beginners welcome.':'Créez votre abat-jour ou restaurez une chaise avec Mathilde à Saint-Pierre-en-Port, en Normandie. Ateliers en petits groupes, débutants bienvenus.';
const image='https://static.wixstatic.com/media/667aea_a2993b7928a24b0e8e8de7d9c091f788~mv2.jpg';

$w.onReady(function(){
 try{bindAtelierLocale($w('#customElement14'));}catch{}

 // Set metadata in page onReady so Wix rendering exposes it to search engines.
 wixSeoFrontend.setTitle(title);
 wixSeoFrontend.setMetaTags([
  {name:'description',content:description},
  {property:'og:title',content:title},
  {property:'og:description',content:description},
  {property:'og:type',content:'website'},
  {property:'og:url',content:'https://www.atelier-harmonie.com/'+(atelierLocale()==='en'?'en/':'')+'les-ateliers'},
  {property:'og:image',content:image},
  {property:'og:image:alt',content:atelierLocale()==='en'?'Making and sharing at a lampshade workshop with Mathilde':'Création et partage lors d’un atelier abat-jour avec Mathilde'},
  {name:'twitter:card',content:'summary_large_image'},
  {name:'twitter:title',content:title},
  {name:'twitter:description',content:description},
  {name:'twitter:image',content:image}
 ]);
 $w('#customElement14').seoMarkup=seoMarkup;
});
