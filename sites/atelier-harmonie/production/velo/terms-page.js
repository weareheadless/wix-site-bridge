import { localizedSeo, bindAtelierLocale } from 'public/atelier-locale';
import { seoMarkup as seoMarkupFrench, seoMarkupEnglish as seoMarkupEnglish } from 'public/atelier-terms-seo';

const seoMarkup = localizedSeo(seoMarkupFrench, seoMarkupEnglish);

$w.onReady(function(){
 try{bindAtelierLocale($w('#customElement22'));}catch{}

 $w('#customElement22').seoMarkup=seoMarkup;
});
