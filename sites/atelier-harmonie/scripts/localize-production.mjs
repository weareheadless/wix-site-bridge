import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

export async function localizeComponents(out, components) {
 const dictionary = {...JSON.parse(await readFile(out+'/i18n/en.json','utf8')), ...JSON.parse(await readFile(out+'/i18n/ui.en.json','utf8'))};
 const runtime = await readFile(out+'/i18n/runtime.js','utf8');
 const inventory = JSON.parse(await readFile(out+'/i18n/inventory.json','utf8'));
 for (const [key, component] of Object.entries(components)) {
  const relevant = new Set(inventory.sources[key+'-seo'] || inventory.sources[key] || []);
  const subset = Object.fromEntries(Object.entries(dictionary).filter(([fr]) => relevant.has(fr) || component.source.includes(fr) || component.source.includes(JSON.stringify(fr).slice(1,-1))));
  // Keep each class's lifecycle and business logic intact, adding local text/link rendering.
  let replaced = false;
  component.source = component.source.replace(/customElements\.define\(TAG,\s*([A-Za-z_$][\w$]*)\)/g, (_, name) => {
   replaced = true;
   return 'customElements.define(TAG,atelierLocalized('+name+','+JSON.stringify(subset)+'))';
  });
  if (!replaced) throw Error('Missing component registration: '+key);
  component.source = runtime+'\n'+component.source;
  component.sha256 = createHash('sha256').update(component.source).digest('hex');
  await writeFile(out+'/custom-elements/'+component.tag+'.js',component.source);
 }
}
