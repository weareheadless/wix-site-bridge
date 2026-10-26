import { localizedSeo, bindAtelierLocale } from 'public/atelier-locale';
import { seoMarkup as seoMarkupFrench, seoMarkupEnglish as seoMarkupEnglish } from 'public/atelier-fabrics-seo';

const seoMarkup = localizedSeo(seoMarkupFrench, seoMarkupEnglish);

$w.onReady(function(){
 try{bindAtelierLocale($w('#customElement12'));}catch{}

 $w('#customElement12').seoMarkup=seoMarkup;
 // Preserve the native Wix contact section/form below the fabric gallery.
});
