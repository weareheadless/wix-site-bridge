// Inserted inside __susiText after the exact dictionary lookup. These are
// page/chrome strings only. Property-card data (names, prices, beds/baths,
// availability, delivery, status labels) belongs to the CMS phase and must not
// be translated by the embed layer.
export const cityContextRules=String.raw`if(translated===undefined){
  const lead=text.match(/^Explore homes, villas and investment properties across (.+), compare neighbourhoods and find a home that fits the way you want to live\.$/i);
  const map=text.match(/^Properties across (.+)$/i);
  const eyebrow=text.match(/^(.+) · Real estate$/i);
  const collectionTitle=text.match(/^(.+) for sale$/i);
  const collectionEyebrow=text.match(/^Susi MacDonald · The (.+) collection$/i);
  const titles={Penthouses:'Penthouses',Condos:'Departamentos','Villas & houses':'Villas y casas','Beachfront properties':'Propiedades frente al mar','Condos under $200K':'Condominios de menos de $200K','Luxury properties':'Propiedades de lujo'};
  if(lead)translated='Explora casas, villas y propiedades de inversión en '+lead[1]+', compara zonas y encuentra la propiedad que se adapte a tu estilo de vida.';
  else if(map)translated='Propiedades en '+map[1];
  else if(eyebrow)translated=eyebrow[1]+' · Bienes raíces';
  else if(collectionTitle&&titles[collectionTitle[1]])translated=titles[collectionTitle[1]]+' en venta';
  else if(collectionEyebrow)translated='Susi MacDonald · Colección '+(titles[collectionEyebrow[1]]||collectionEyebrow[1]);
}`;
