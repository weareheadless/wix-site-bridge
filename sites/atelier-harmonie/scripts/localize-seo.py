"""Emit English SEO HTML from the same dictionary used by the visible components."""
from html.parser import HTMLParser
from html import escape
from pathlib import Path
import json, re

root = Path('sites/atelier-harmonie/production')
dictionary = {**json.loads((root/'i18n/en.json').read_text()), **json.loads((root/'i18n/ui.en.json').read_text())}
def translate(value):
    key = re.sub(r'\s+', ' ', value).strip()
    return value.replace(key, dictionary[key]) if key in dictionary else value
def link(value):
    if value.startswith('/') and not value.startswith('//') and not re.match(r'^/en(?:/|$)', value):
        return '/en' + (value if value != '/' else '')
    if value.startswith('https://www.atelier-harmonie.com/'):
        return link(value.removeprefix('https://www.atelier-harmonie.com'))
    return value
class Translate(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
    def handle_starttag(self, tag, attrs):
        translated = []
        for key, value in attrs:
            if value is not None:
                if key in ['aria-label','aria-roledescription','alt','title','placeholder']:
                    value = translate(value)
                if key == 'href':
                    value = link(value)
            translated.append(key if value is None else key+'="'+escape(value, quote=True)+'"')
        self.parts.append('<'+tag+(' '+' '.join(translated) if translated else '')+'>')
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
    def handle_endtag(self, tag):
        self.parts.append('</'+tag+'>')
    def handle_data(self, data):
        self.parts.append(escape(translate(data), quote=False))
for path in (root/'velo').glob('*-seo.js'):
    markup = json.loads(path.read_text().split('=',1)[1].split(';\n',1)[0])
    parser = Translate()
    parser.feed(markup)
    path.write_text('export const seoMarkup = '+json.dumps(markup,ensure_ascii=False)+';\nexport const seoMarkupEnglish = '+json.dumps(''.join(parser.parts),ensure_ascii=False)+';\n')
