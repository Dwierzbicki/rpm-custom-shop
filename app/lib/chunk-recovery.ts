/** Static trusted script installed before hydration. */
export const chunkRecoveryScript=String.raw`(function () {
 var w=window,key='rpm-chunk-recovery-v1',reloading=false;
 function safePage(){
  var p=w.location.pathname;
  return p==='/sklep'||p.indexOf('/sklep/')===0||p.indexOf('/produkt/')===0;
 }
 function chunkError(e){
  if(!e)return false;
  var message=typeof e==='string'?e:e.message;
  return e.name==='ChunkLoadError'||(typeof message==='string'&&/(?:Loading (?:CSS )?chunk [^\n]+ failed|CSS_CHUNK_LOAD_FAILED|ChunkLoadError)/i.test(message));
 }
 function assetError(t){
  if(!t||(t.tagName!=='SCRIPT'&&t.tagName!=='LINK'))return false;
  if(t.tagName==='LINK'&&t.rel!=='stylesheet'&&t.rel!=='modulepreload'&&!(t.rel==='preload'&&(t.as==='style'||t.as==='script')))return false;
  try{
   var u=new URL(t.src||t.href,w.location.href);
   return u.origin===w.location.origin&&u.pathname.indexOf('/_next/static/')===0&&/\.(js|css)$/.test(u.pathname);
  }catch(_){return false;}
 }
 function recover(){
  if(reloading||!safePage()||w.navigator.onLine===false)return;
  try{
   var now=Date.now(),last=Number(w.sessionStorage.getItem(key)||'0');
   if(last>0&&now-last<120000)return;
   w.sessionStorage.setItem(key,String(now));reloading=true;w.location.reload();
  }catch(_){}
 }
 w.addEventListener('error',function(e){if(assetError(e.target)||chunkError(e.error||e.message))recover();},true);
 w.addEventListener('unhandledrejection',function(e){if(chunkError(e.reason))recover();});
 w.addEventListener('rpm:chunk-error',function(e){if(chunkError(e.detail))recover();});
})();`;
