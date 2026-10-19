import { localizedSeo, bindAtelierLocale } from 'public/atelier-locale';
import { seoMarkup as topSeoFrench, seoMarkupEnglish as topSeoEnglish } from 'public/atelier-journaltop-seo';
import { seoMarkup as bottomSeoFrench, seoMarkupEnglish as bottomSeoEnglish } from 'public/atelier-journalbottom-seo';

const topSeo = localizedSeo(topSeoFrench, topSeoEnglish);
const bottomSeo = localizedSeo(bottomSeoFrench, bottomSeoEnglish);

$w.onReady(function(){
 try{bindAtelierLocale($w('#customElement18'));}catch{}
 try{bindAtelierLocale($w('#customElement19'));}catch{}

 $w('#customElement18').seoMarkup=topSeo;
 $w('#customElement19').seoMarkup=bottomSeo;
 // Native Wix Blog feed owns posts, categories, pagination and membership behavior.
});
