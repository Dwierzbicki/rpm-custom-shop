// Build-time normalization of the existing supplier logos. A supplier outage never fails the shop build.
import sharp from 'sharp';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const brands=JSON.parse(await readFile('app/components/storefront/brand-assets.json','utf8'));
const out='public/optimized/brands';
const display={};
await mkdir(out,{recursive:true});
sharp.cache(false);
sharp.concurrency(1);
async function download(url){
 const parsed=new URL(url);
 if(!['https://fmic.pl','https://upload.wikimedia.org','https://www.strongflex.eu','https://www.garrettmotion.com'].includes(parsed.origin)||parsed.username||parsed.password)throw Error('Unexpected logo host');
 const response=await fetch(parsed,{redirect:'error',signal:AbortSignal.timeout(8000),headers:{'User-Agent':'RPMCustomCatalog/1.0 (product brand identification; https://rpmcustom.pl)'}});
 if(!response.ok||!response.body)throw Error('HTTP '+response.status);
 const reader=response.body.getReader(),parts=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4*1024*1024)throw Error('Logo exceeds 4 MiB');parts.push(Buffer.from(value))}}
 finally{await reader.cancel().catch(()=>{});reader.releaseLock()}
 return Buffer.concat(parts);
}
async function normalize(brand){
 const bytes=await download(brand.url);
 const {data,info}=await sharp(bytes,{limitInputPixels:8000000}).rotate().resize({width:640,height:400,fit:'inside',withoutEnlargement:true}).ensureAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
 const {width:w,height:h}=info;
 const corners=[0,w-1,(h-1)*w,w*h-1].map(p=>p*4);
 const whiteMatte=corners.filter(i=>data[i+3]>240&&Math.min(data[i],data[i+1],data[i+2])>225).length>=3;
 let left=w,top=h,right=-1,bottom=-1,maxAlpha=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4;
  let r=data[i],g=data[i+1],b=data[i+2],a=data[i+3]/255;
  if(whiteMatte){
   const min=Math.min(r,g,b);
   const ink=(255-min)/255;
   if(ink<.065){data[i+3]=0;continue}
   a*=ink;
   r=(r-min)/ink;g=(g-min)/ink;b=(b-min)/ink;
  }
  if(a<.04){data[i+3]=0;continue}
  // Lift near-black marks just enough to remain legible on the dark rail.
  const peak=Math.max(r,g,b);
  if(peak<155){const lift=155-peak;r+=lift;g+=lift;b+=lift}
  data[i]=Math.round(r);data[i+1]=Math.round(g);data[i+2]=Math.round(b);
  data[i+3]=Math.round(a*255);
  maxAlpha=Math.max(maxAlpha,data[i+3]);
  if(data[i+3]>20){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
 }
 if(right<left||bottom<top||!maxAlpha)throw Error('Empty normalized logo');
 // Make light-gray marks visible as well; preserve anti-aliased edges.
 for(let i=3;i<data.length;i+=4)data[i]=Math.min(255,Math.round(data[i]*255/maxAlpha));
 const image=await sharp(data,{raw:{width:w,height:h,channels:4}}).extract({left,top,width:right-left+1,height:bottom-top+1}).resize(320,128,{fit:'inside'}).webp({quality:88,alphaQuality:100}).toBuffer();
 await writeFile(join(out,brand.slug+'.webp'),image);
 display[brand.slug]='data:image/webp;base64,'+image.toString('base64');
}
for(let i=0;i<brands.length;i+=4){
 await Promise.all(brands.slice(i,i+4).map(async brand=>{try{if(brand.slug==='rpm-custom'&&brand.url==='/optimized/logo.webp')return;await normalize(brand);console.log('Optimized brand: '+brand.name)}catch(e){console.warn('Brand fallback: '+brand.name+' — '+(e instanceof Error?e.message:String(e)))}}));
}

// Embed small optimized logos in the storefront bundle: no per-logo HTTP requests or stale URLs.
await writeFile('app/components/storefront/brand-display.generated.json',JSON.stringify(display));
