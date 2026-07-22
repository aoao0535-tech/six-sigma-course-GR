const CACHE='ssgb-bi-v6-library-home';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
const LIBRARY_URL='https://eng-abdullah-omar.github.io/aoao0535-tech.github.io/';

const LIBRARY_STYLE=`<style id="course-library-home-style">
#courseLibraryHome{position:fixed;z-index:9999;inset-inline-end:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));display:inline-flex;align-items:center;gap:8px;min-height:46px;padding:0 15px;border:1px solid rgba(255,255,255,.34);border-radius:15px;background:rgba(15,23,42,.92);box-shadow:0 10px 30px rgba(15,23,42,.28);backdrop-filter:blur(12px);color:#fff;text-decoration:none;font:800 14px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",Tahoma,Arial,sans-serif;white-space:nowrap;transition:transform .18s ease,background .18s ease}
#courseLibraryHome:hover{transform:translateY(-2px);background:#166534}#courseLibraryHome:focus-visible{outline:3px solid #38bdf8;outline-offset:3px}@media(max-width:520px){#courseLibraryHome{width:46px;padding:0;justify-content:center}#courseLibraryHome span{display:none}}@media print{#courseLibraryHome{display:none!important}}
</style>`;
const LIBRARY_BUTTON=`<a id="courseLibraryHome" href="${LIBRARY_URL}" aria-label="العودة إلى صفحة جميع الدورات" title="جميع الدورات / All Courses">⌂ <span>الدورات / Courses</span></a>`;

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
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))),
    self.clients.claim()
  ]));
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
