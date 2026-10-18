import { seoMarkup as footerSeoMarkup } from 'public/atelier-footer-seo';
import { seoMarkup } from 'public/atelier-navbar-seo';
import wixEcomFrontend from 'wix-ecom-frontend';

// Shared navigation lives in Wix's header; cart state remains in Wix eCommerce.
$w.onReady(function () {
    $w('#customElement1').seoMarkup = seoMarkup;
    $w('#customElement3').seoMarkup = footerSeoMarkup;
    $w('#customElement1').on('atelier-cart', () => {
        return wixEcomFrontend.navigateToCartPage();
    });
});
