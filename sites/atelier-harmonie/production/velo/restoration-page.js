import { seoMarkup } from 'public/atelier-restoration-seo';

$w.onReady(function(){
 $w('#customElement10').seoMarkup=seoMarkup;
 // Keep the real native Wix contact form and its submission bindings unchanged.
});
