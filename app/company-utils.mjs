/** @param {string} value */
export function normalizeNip(value){return value.replace(/[^0-9]/g,'')}
/** @param {string} nip */
export function validNip(nip){if(!/^\d{10}$/.test(nip))return false;const weights=[6,5,7,2,3,4,5,6,7];const sum=weights.reduce((a,w,i)=>a+w*Number(nip[i]),0)%11;return sum!==10&&sum===Number(nip[9])}
/** @param {string} value */
export function parsePolishAddress(value){
 const raw=value.trim().replace(/\s+/g,' ');
 const postal=raw.match(/\b(\d{2})\s*-?\s*(\d{3})\b/);
 if(!postal)return {street:raw,postalCode:'',city:'',complete:false};
 const postalCode=postal[1]+'-'+postal[2];
 const before=raw.slice(0,postal.index).replace(/[,\s]+$/,'').trim();
 const after=raw.slice((postal.index??0)+postal[0].length).replace(/^[,\s]+/,'').trim();
 let street=before,city=after;
 if(!city&&before.includes(',')){const parts=before.split(',').map(p=>p.trim()).filter(Boolean);city=parts.pop()??'';street=parts.join(', ')}
 if(!street&&after.includes(',')){const parts=after.split(',').map(p=>p.trim()).filter(Boolean);street=parts.shift()??'';city=parts.join(', ')}
 return {street:street||raw,postalCode,city,complete:!!(street&&city)}
}
