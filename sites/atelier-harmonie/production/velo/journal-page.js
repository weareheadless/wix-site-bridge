import { seoMarkup as topSeo } from 'public/atelier-journaltop-seo';
import { seoMarkup as bottomSeo } from 'public/atelier-journalbottom-seo';

$w.onReady(function(){
 $w('#customElement18').seoMarkup=topSeo;
 $w('#customElement19').seoMarkup=bottomSeo;
 // Native Wix Blog feed owns posts, categories, pagination and membership behavior.
});
