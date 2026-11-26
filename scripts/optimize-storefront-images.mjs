import sharp from 'sharp';
import {mkdir,readFile} from 'node:fs/promises';
await mkdir('public/optimized',{recursive:true});
await sharp('public/rpm-hero-drift.png').resize({width:1920,withoutEnlargement:true}).webp({quality:80}).toFile('public/optimized/hero.webp');
await sharp('public/rpm-logo.png.png').resize({width:1024,withoutEnlargement:true}).webp({quality:85}).toFile('public/optimized/logo.webp');
await sharp('public/rpm-logo.png.png').resize({width:64,height:64,fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toFile('public/optimized/icon.png');

// Branded 1200x630 social fallback, no invented product photo.
const socialBackground=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#090a0d"/><path d="M0 0H360L0 360ZM1200 630H840L1200 270Z" fill="#20252e"/><path d="M0 395L395 0M805 630L1200 235" stroke="#f12748" stroke-width="6"/><rect x="0" y="588" width="1200" height="6" fill="#f12748"/><text x="600" y="455" fill="#f7f7f8" font-family="sans-serif" font-size="38" font-weight="bold" text-anchor="middle">TUNING &amp; MOTORSPORT</text><text x="600" y="510" fill="#b3b5ba" font-family="sans-serif" font-size="25" text-anchor="middle">RPMCUSTOM.PL</text></svg>');
const socialLogo=await sharp('public/rpm-logo.png.png').resize({width:650,height:210,fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
await sharp(socialBackground).composite([{input:socialLogo,left:275,top:155}]).jpeg({quality:90}).toFile('public/optimized/social-card.jpg');

// Keep logo processing optional so a supplier outage cannot block deployments.
await import('./optimize-brand-assets.mjs').catch(e=>console.warn('Brand optimizer skipped:',e.message));

// Local workshop photos: preserve originals and normalize EXIF orientation.
// Generate assets at build time, without contacting any external service.
const projectPhotos=JSON.parse(await readFile(new URL('../app/components/storefront/custom-project-photos.json',import.meta.url),'utf8'));
await mkdir('public/optimized/cars',{recursive:true});
for(const filename of projectPhotos){
 const output=filename.replace(/\.jpg$/i,'.webp');
 await sharp('public/cars/'+filename).rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:82}).toFile('public/optimized/cars/'+output);
}
