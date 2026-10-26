import { localizedSeo, bindAtelierLocale } from 'public/atelier-locale';
import { seoMarkup as seoMarkupFrench, seoMarkupEnglish as seoMarkupEnglish } from 'public/atelier-generalterms-seo';

const seoMarkup = localizedSeo(seoMarkupFrench, seoMarkupEnglish);

$w.onReady(function(){
 try{bindAtelierLocale($w('#customElement23'));}catch{}

 $w('#customElement23').seoMarkup=seoMarkup;
});
