// Inserted inside __susiText after the exact dictionary lookup. These are
// complete, variable-bearing strings rendered by the city components.
export const cityContextRules=String.raw`if(translated===undefined){
  const lead=text.match(/^Explore homes, villas and investment properties across (.+), compare neighbourhoods and find a home that fits the way you want to live\.$/);
  const map=text.match(/^Properties across (.+)$/);
  const eyebrow=text.match(/^(.+) · Real estate$/);
  const delivery=text.match(/^DELIVERY ([A-Z]+) (\d{4})$/);
  const month={JANUARY:'ENERO',FEBRUARY:'FEBRERO',MARCH:'MARZO',APRIL:'ABRIL',MAY:'MAYO',JUNE:'JUNIO',JULY:'JULIO',AUGUST:'AGOSTO',SEPTEMBER:'SEPTIEMBRE',OCTOBER:'OCTUBRE',NOVEMBER:'NOVIEMBRE',DECEMBER:'DICIEMBRE'};
  if(lead)translated='Explora casas, villas y propiedades de inversión en '+lead[1]+', compara zonas y encuentra la propiedad que se adapte a tu estilo de vida.';
  else if(map)translated='Propiedades en '+map[1];
  else if(eyebrow)translated=eyebrow[1]+' · Bienes raíces';
  else if(delivery&&month[delivery[1]])translated='ENTREGA EN '+month[delivery[1]]+' DE '+delivery[2];
  else translated={PRESALE:'PREVENTA','FOR SALE':'EN VENTA',SOLD:'VENDIDA','SOLD OUT':'AGOTADO',RENTED:'RENTADA'}[text.toUpperCase()];
}`;
