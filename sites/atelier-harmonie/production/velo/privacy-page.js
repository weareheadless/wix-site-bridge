import { localizedSeo, bindAtelierLocale } from 'public/atelier-locale';
import { seoMarkup as seoMarkupFrench, seoMarkupEnglish as seoMarkupEnglish } from 'public/atelier-privacy-seo';

const seoMarkup = localizedSeo(seoMarkupFrench, seoMarkupEnglish);

$w.onReady(function(){
 try{bindAtelierLocale($w('#customElement24'));}catch{}

 $w('#customElement24').seoMarkup=seoMarkup;
});
