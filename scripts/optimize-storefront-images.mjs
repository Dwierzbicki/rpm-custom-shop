import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
await mkdir('public/optimized',{recursive:true});
await sharp('public/rpm-hero-drift.png').resize({width:1920,withoutEnlargement:true}).webp({quality:80}).toFile('public/optimized/hero.webp');
await sharp('public/rpm-logo.png.png').resize({width:1024,withoutEnlargement:true}).webp({quality:85}).toFile('public/optimized/logo.webp');
await sharp('public/rpm-logo.png.png').resize({width:64,height:64,fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toFile('public/optimized/icon.png');

// Keep logo processing optional so a supplier outage cannot block deployments.
await import('./optimize-brand-assets.mjs').catch(e=>console.warn('Brand optimizer skipped:',e.message));
