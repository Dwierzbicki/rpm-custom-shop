export type CommunitySettings={enabled:boolean;title:string;accent:string;description:string;image:string;groupUrl:string;button:string;titleEn:string;accentEn:string;descriptionEn:string;buttonEn:string};
export const DEFAULT_COMMUNITY:CommunitySettings={enabled:true,title:'WIĘCEJ NIŻ TUNING.',accent:'JEDNA PASJA.',description:'Budujesz projekt? Szukasz inspiracji? Dołącz do naszej motoryzacyjnej społeczności na Facebooku.',image:'',groupUrl:'https://www.facebook.com/groups/916445236023158',button:'DOŁĄCZ DO SPOŁECZNOŚCI',titleEn:'MORE THAN TUNING.',accentEn:'ONE PASSION.',descriptionEn:'Building a project? Looking for inspiration? Join our automotive community on Facebook.',buttonEn:'JOIN THE COMMUNITY'};
export function validCommunity(v:unknown):v is CommunitySettings{
 if(!v||typeof v!=='object')return false;
 const x=v as Record<string,unknown>;
 if(typeof x.enabled!=='boolean')return false;
 for(const key of Object.keys(DEFAULT_COMMUNITY).filter(k=>k!=='enabled')){if(typeof x[key]!=='string'||(x[key] as string).length>1000)return false}
 try{const group=new URL(x.groupUrl as string);if(group.protocol!=='https:'||!['www.facebook.com','facebook.com'].includes(group.hostname)||group.username||group.password||!/^\/groups\/[^/]+\/?$/.test(group.pathname))return false;
 if(x.image){const image=new URL(x.image as string);if(image.protocol!=='https:'||image.username||image.password)return false}
 }catch{return false}
 return !!(x.title as string).trim()&&!!(x.button as string).trim();
}
