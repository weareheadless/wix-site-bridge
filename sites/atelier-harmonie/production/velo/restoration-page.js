import { seoMarkup as contactSeo } from 'public/atelier-contact-seo';
import { seoMarkup } from 'public/atelier-restoration-seo';

$w.onReady(function(){
 $w('#customElement10').seoMarkup=seoMarkup;
 $w('#customElement11').seoMarkup=contactSeo;
 // Contact UI and submissions remain entirely in the native Wix form.
});
