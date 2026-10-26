import { localizedSeo, bindAtelierLocale } from 'public/atelier-locale';
import { seoMarkup as seoMarkupFrench, seoMarkupEnglish as seoMarkupEnglish } from 'public/atelier-cookies-seo';

const seoMarkup = localizedSeo(seoMarkupFrench, seoMarkupEnglish);

$w.onReady(function(){
 try{bindAtelierLocale($w('#customElement25'));}catch{}

 $w('#customElement25').seoMarkup=seoMarkup;
});
