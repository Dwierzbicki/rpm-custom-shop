export type HomepageDraft={
 heroTitle:string;heroSubtitle:string;heroDescription:string;heroImage:string;
 motolabTitle:string;motolabDescription:string;promoTitle:string;
};
export const HOMEPAGE_DRAFT_KEY='rpm-homepage-editor-draft-v1';
export const DEFAULT_HOMEPAGE_DRAFT:HomepageDraft={
 heroTitle:'BUDUJ\nBEZ OGRANICZEŃ.',
 heroSubtitle:'CZĘŚCI DO TWOJEGO PROJEKTU.',
 heroDescription:'Turbosprężarki, układy wydechowe, intercoolery i komponenty do wymagających projektów.',
 heroImage:'',
 motolabTitle:'MotoLab',
 motolabDescription:'Wybierz silnik, poznaj możliwe konfiguracje i dobierz komponenty do swojego projektu.',
 promoTitle:'CZĘŚCI DO PRAWDZIWYCH PROJEKTÓW'
};
export function readHomepageDraft():HomepageDraft{
 if(typeof window==='undefined')return DEFAULT_HOMEPAGE_DRAFT;
 try{
  const raw=localStorage.getItem(HOMEPAGE_DRAFT_KEY);
  if(!raw)return DEFAULT_HOMEPAGE_DRAFT;
  const obj=JSON.parse(raw) as Record<string,unknown>;
  const next={...DEFAULT_HOMEPAGE_DRAFT};
  for(const key of Object.keys(next) as (keyof HomepageDraft)[]){
   if(typeof obj[key]==='string')next[key]=(obj[key] as string).slice(0,1000);
  }
  return next;
 }catch{return DEFAULT_HOMEPAGE_DRAFT}
}
