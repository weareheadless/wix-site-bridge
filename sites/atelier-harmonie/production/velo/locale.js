import wixWindowFrontend from 'wix-window-frontend';

export function atelierLocale() {
 try { return wixWindowFrontend.multilingual.currentLanguage === 'en' ? 'en' : 'fr'; }
 catch { return 'fr'; }
}

export function localizedSeo(french, english) {
 return atelierLocale() === 'en' ? english : french;
}

export function bindAtelierLocale(element) {
 element.setAttribute('locale', atelierLocale());
}
