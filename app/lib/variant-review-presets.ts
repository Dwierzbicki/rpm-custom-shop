export const reviewPresets=[
 {id:'silicone',label:'Silikony',scope:'colors',category:['Układ dolotowy','Łączniki silikonowe']},
 {id:'wastegate',label:'Wastegate',scope:'colors',category:['Układ wydechowy','Wastegate','Zawory Wastegate']},
 {id:'hel-brake',label:'HEL – hamulce',scope:'hel',category:['Hamulce i koła','Przewody hamulcowe HEL']},
 {id:'hel-clutch',label:'HEL – sprzęgło',scope:'hel',category:['Napęd i zawieszenie','Sprzęgło','Przewody sprzęgła']}
] as const;
export const findReviewPreset=(id:string)=>reviewPresets.find(p=>p.id===id);
