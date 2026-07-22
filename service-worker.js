const CACHE='ssgb-bi-v8-gold-library-return';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
const LIBRARY_URL='https://eng-abdullah-omar.github.io/aoao0535-tech.github.io/?v=20260722-14';

const LIBRARY_STYLE=`<style id="course-library-home-style">
#courseLibraryHome{position:fixed;z-index:10000;inset-inline-start:18px;bottom:calc(18px + env(safe-area-inset-bottom,0px));display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:52px;padding:0 19px;border:2px solid #fff3c4;border-radius:16px;background:#f4c861;color:#102a38;text-decoration:none;font:900 15px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",Tahoma,Arial,sans-serif;box-shadow:0 14px 38px rgba(0,0,0,.34);white-space:nowrap;transition:transform .18s ease,filter .18s ease}
#courseLibraryHome:hover{transform:translateY(-2px);filter:brightness(1.04)}#courseLibraryHome:focus-visible{outline:4px solid #fff;outline-offset:3px}#courseLibraryHome .home-icon{font-size:21px;line-height:1}@media(max-width:620px){#courseLibraryHome{inset-inline-start:12px;inset-inline-end:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));width:auto;min-height:56px;padding:0 16px;border-radius:17px;font-size:16px}}@media print{#courseLibraryHome{display:none!important}}
</style>`;
const LIBRARY_BUTTON=`<a id="courseLibraryHome" href="${LIBRARY_URL}" aria-label="العودة إلى مكتبة الدورات"><span class="home-icon">⌂</span><span>العودة إلى مكتبة الدورات</span></a>`;

function injectLibraryButton(html){
  if(html.includes('id="courseLibraryHome"')) return html;
  let output=html;
  if(output.includes('</head>')) output=output.replace('</head>',`${LIBRARY_STYLE}</head>`);
  if(output.includes('<body>')) output=output.replace('<body>',`<body>${LIBRARY_BUTTON}`);
  else if(output.includes('<body ')) output=output.replace(/<body([^>]*)>/i,`<body$1>${LIBRARY_BUTTON}`);
  return output;
}

async function decorateNavigationResponse(response){
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html')) return response;
  const html=injectLibraryButton(await response.text());
  const headers=new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    await caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))));
    await self.clients.claim();
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    await Promise.all(windows.map(client=>client.navigate(client.url).catch(()=>null)));
  })());
});

self.addEventListener('fetch',event=>{
  if(event.request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const network=await fetch(event.request,{cache:'no-store'});
        const decorated=await decorateNavigationResponse(network);
        const copy=decorated.clone();
        caches.open(CACHE).then(cache=>cache.put('./index.html',copy));
        return decorated;
      }catch(error){
        const cached=await caches.match('./index.html');
        if(!cached) throw error;
        return decorateNavigationResponse(cached);
      }
    })());
    return;
  }

  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
    const copy=response.clone();
    caches.open(CACHE).then(cache=>cache.put(event.request,copy));
    return response;
  })));
});
