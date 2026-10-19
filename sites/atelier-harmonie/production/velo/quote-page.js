import { localizedSeo, bindAtelierLocale } from 'public/atelier-locale';
import { seoMarkup as topSeoFrench, seoMarkupEnglish as topSeoEnglish } from 'public/atelier-quotetop-seo';
import { seoMarkup as bottomSeoFrench, seoMarkupEnglish as bottomSeoEnglish } from 'public/atelier-quotebottom-seo';

const topSeo = localizedSeo(topSeoFrench, topSeoEnglish);
const bottomSeo = localizedSeo(bottomSeoFrench, bottomSeoEnglish);

$w.onReady(function(){
 try{bindAtelierLocale($w('#customElement16'));}catch{}
 try{bindAtelierLocale($w('#customElement17'));}catch{}

 $w('#customElement16').seoMarkup=topSeo;
 $w('#customElement17').seoMarkup=bottomSeo;
 // Preserve the native Wix quote form, uploads, picture and submission behavior.
});
