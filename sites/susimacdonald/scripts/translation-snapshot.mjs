import {mkdir,writeFile} from 'node:fs/promises';
import {WixAppTokenProvider} from '../../../src/wix-client.mjs';
const site='878460ca-c98c-402b-8a10-862023f67cce';
if(process.argv[2]!=='--site'||process.argv[3]!=='susimacdonald'||process.env.WIX_ALLOWED_SITE_IDS!==site)throw Error('Exact Susi target required');
const token=await WixAppTokenProvider.fromEnv().getToken();
const headers={authorization:token,'content-type':'application/json'};
const identityResponse=await fetch('https://www.wixapis.com/apps/v1/instance',{headers});
if(!identityResponse.ok)throw Error('App identity unavailable');
const identity=await identityResponse.json();if(identity.site?.siteId!==site)throw Error('App installation targets another site');
const contents=[];let cursor;
for(let page=0;page<100;page++){
 const response=await fetch('https://www.wixapis.com/translation-content/v1/contents/query',{method:'POST',headers,body:JSON.stringify({query:{cursorPaging:{limit:100,...(cursor?{cursor}:{})}}})});
 if(!response.ok)throw Error('Translation read HTTP '+response.status);
 const data=await response.json();contents.push(...data.contents);
 if(!data.pagingMetadata?.hasNext)break;
 cursor=data.pagingMetadata.cursors.next;if(page===99)throw Error('Inventory incomplete');
}
const directory='sites/susimacdonald/.wix-bridge-state';await mkdir(directory,{recursive:true,mode:0o700});
await writeFile(directory+'/translation-inventory.json',JSON.stringify({siteId:site,multilingual:identity.site.multilingual,contents},null,2)+'\n',{mode:0o600});
console.log(JSON.stringify({site:'susimacdonald',version:identity.instance.appVersion,records:contents.length,locales:[...new Set(contents.map(c=>c.locale))],multilingual:identity.site.multilingual}));
