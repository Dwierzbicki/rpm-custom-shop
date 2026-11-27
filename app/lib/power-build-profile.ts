/** Explicit customer preferences, not a certificate of technical compatibility. */
export const BUILD_FUELS=['pb95','pb98','e85','flex'] as const;
export const BUILD_INTERNALS=['stock','forged','auto'] as const;
export const BUILD_RODS=['stock','m50b25nv','forged','auto'] as const;
export type BuildRods=typeof BUILD_RODS[number];
/** M50B25 NV is a requested build option, not confirmed interchangeable fitment. */
export function rodOptionsFor(version:string):readonly BuildRods[]{
 if(/^(m50b20|m50b25|m50b30-stroker|m52b20|m52b25|m52b28|m54b22|m54b25|m54b30)$/.test(version))return ['stock','m50b25nv','forged'];
 if(version==='2jz-ge'||version==='2jz-gte')return ['stock','forged','auto'];
 return [];
}
export const BUILD_PRIORITIES=['response','power','reliability','cost','balanced'] as const;
export type BuildProfile={
 induction:'turbo';fuel:typeof BUILD_FUELS[number];
 internals:typeof BUILD_INTERNALS[number];rods:BuildRods;priority:typeof BUILD_PRIORITIES[number];
 budgetPln:number|null;
};
export function validBuildProfile(raw:unknown,version:string):raw is BuildProfile{
 if(!raw||typeof raw!=='object')return false;
 const p=raw as Record<string,unknown>;
 return p.induction==='turbo'&&BUILD_FUELS.some(v=>v===p.fuel)&&BUILD_INTERNALS.some(v=>v===p.internals)&&rodOptionsFor(version).some(v=>v===p.rods)&&BUILD_PRIORITIES.some(v=>v===p.priority)
 &&(p.budgetPln===null||(typeof p.budgetPln==='number'&&Number.isSafeInteger(p.budgetPln)&&p.budgetPln>=1000&&p.budgetPln<=1000000));
}
export function fuelModel(fuel:BuildProfile['fuel']):'petrol'|'ethanol'{
 return fuel==='e85'||fuel==='flex'?'ethanol':'petrol';
}
export function budgetRemaining(budgetPln:number|null,subtotal:number):number|null{
 return budgetPln===null||!Number.isFinite(subtotal)||subtotal<0?null:Math.round((budgetPln-subtotal)*100)/100;
}
