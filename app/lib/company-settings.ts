export type CompanySettings={name:string;nip:string;email:string;phone:string;street:string;postalCode:string;city:string;pickupInstructions:string};
export const DEFAULT_COMPANY_SETTINGS:CompanySettings={name:'',nip:'',email:'',phone:'',street:'',postalCode:'',city:'',pickupInstructions:''};
export function validCompanySettings(value:unknown):value is CompanySettings{
 if(!value||typeof value!=='object')return false;
 const v=value as Record<string,unknown>;
 const limits:Record<keyof CompanySettings,number>={name:160,nip:10,email:200,phone:40,street:200,postalCode:20,city:100,pickupInstructions:500};
 return (Object.keys(limits) as (keyof CompanySettings)[]).every(k=>typeof v[k]==='string'&&(v[k] as string).length<=limits[k])&&
 (!v.nip||/^\d{10}$/.test(v.nip as string))&&(!v.email||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email as string));
}
