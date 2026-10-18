import { seoMarkup as introSeo } from 'public/atelier-giftintro-seo';
import { seoMarkup as guideSeo } from 'public/atelier-giftguide-seo';

$w.onReady(function(){
 $w('#customElement8').seoMarkup=introSeo;
 $w('#customElement9').seoMarkup=guideSeo;
 // Native Wix Gift Cards widget retains the purchase, checkout and delivery flow.
});
