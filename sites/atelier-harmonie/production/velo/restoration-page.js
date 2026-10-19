import { localizedSeo, bindAtelierLocale } from 'public/atelier-locale';
import { seoMarkup as contactSeoFrench, seoMarkupEnglish as contactSeoEnglish } from 'public/atelier-contact-seo';
import { seoMarkup as seoMarkupFrench, seoMarkupEnglish as seoMarkupEnglish } from 'public/atelier-restoration-seo';

const contactSeo = localizedSeo(contactSeoFrench, contactSeoEnglish);
const seoMarkup = localizedSeo(seoMarkupFrench, seoMarkupEnglish);

$w.onReady(function(){
 try{bindAtelierLocale($w('#customElement10'));}catch{}
 try{bindAtelierLocale($w('#customElement11'));}catch{}

 $w('#customElement10').seoMarkup=seoMarkup;
 $w('#customElement11').seoMarkup=contactSeo;
 // Contact UI and submissions remain entirely in the native Wix form.
});
