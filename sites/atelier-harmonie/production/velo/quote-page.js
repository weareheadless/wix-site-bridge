import { seoMarkup as topSeo } from 'public/atelier-quotetop-seo';
import { seoMarkup as bottomSeo } from 'public/atelier-quotebottom-seo';

$w.onReady(function(){
 $w('#customElement16').seoMarkup=topSeo;
 $w('#customElement17').seoMarkup=bottomSeo;
 // Preserve the native Wix quote form, uploads, picture and submission behavior.
});
