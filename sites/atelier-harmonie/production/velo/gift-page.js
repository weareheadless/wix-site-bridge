import { localizedSeo, bindAtelierLocale } from 'public/atelier-locale';
import { seoMarkup as introSeoFrench, seoMarkupEnglish as introSeoEnglish } from 'public/atelier-giftintro-seo';
import { seoMarkup as guideSeoFrench, seoMarkupEnglish as guideSeoEnglish } from 'public/atelier-giftguide-seo';

const introSeo = localizedSeo(introSeoFrench, introSeoEnglish);
const guideSeo = localizedSeo(guideSeoFrench, guideSeoEnglish);

$w.onReady(function(){
 try{bindAtelierLocale($w('#customElement8'));}catch{}
 try{bindAtelierLocale($w('#customElement9'));}catch{}

 $w('#customElement8').seoMarkup=introSeo;
 $w('#customElement9').seoMarkup=guideSeo;
 // Native Wix Gift Cards widget retains the purchase, checkout and delivery flow.
});
