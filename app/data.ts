export type Product={id:number;name:string;brand:string;category:string;price:number;engine:string;configurable?:boolean;sku:string;description:string};
const groups:[string,string,string,number,string,boolean?][]= [
['Kolektor turbo BMW E36 M50/M52','RPM Custom','Kolektory',2899,'BMW M50/M52',true],
['Kolektor turbo BMW E46 M54','RPM Custom','Kolektory',3099,'BMW M54',true],
['Kolektor turbo Toyota 2JZ-GE','RPM Custom','Kolektory',3499,'Toyota 2JZ-GE',true],
['Kolektor turbo Toyota 2JZ-GTE','RPM Custom','Kolektory',3499,'Toyota 2JZ-GTE',true],
['Kolektor turbo Nissan RB25','RPM Custom','Kolektory',3399,'Nissan RB25',true],
['Turbosprężarka PSR 6266','Pulsar','Turbo',3799,'Uniwersalne'],
['Turbosprężarka GTX3076R','Garrett','Turbo',5699,'Uniwersalne'],
['Turbosprężarka G30-660','Garrett','Turbo',6599,'Uniwersalne'],
['Turbosprężarka PSR 3582','Pulsar','Turbo',3999,'Uniwersalne'],
['Intercooler 600×300×76','Demo Parts','Intercoolery',899,'Uniwersalne'],
['Intercooler 550×230×65','Demo Parts','Intercoolery',699,'Uniwersalne'],
['Intercooler 450×300×76','Demo Parts','Intercoolery',799,'Uniwersalne'],
['Intercooler 700×300×100','Demo Parts','Intercoolery',1299,'Uniwersalne'],
['Wastegate 44 mm','Demo Parts','Wastegate',649,'Uniwersalne'],
['Wastegate 50 mm','Demo Parts','Wastegate',799,'Uniwersalne'],
['Wastegate 60 mm','Demo Parts','Wastegate',999,'Uniwersalne'],
['Zawór BOV 50 mm','Demo Parts','Osprzęt',489,'Uniwersalne'],
['Opaska V-Band 3 cale','Demo Parts','Osprzęt',119,'Uniwersalne'],
['Flansza T3 stalowa','Demo Parts','Osprzęt',89,'Uniwersalne'],
['Flansza T4 stalowa','Demo Parts','Osprzęt',109,'Uniwersalne'],
['Kolano nierdzewne 76 mm 90°','Demo Parts','Osprzęt',119,'Uniwersalne'],
['Rura nierdzewna 76 mm 1 m','Demo Parts','Osprzęt',139,'Uniwersalne'],
['Łącznik silikonowy 76 mm','Demo Parts','Osprzęt',69,'Uniwersalne'],
['Czujnik EGT K-Type','Demo Parts','Elektronika',229,'Uniwersalne'],
['Czujnik MAP 4 bar','Demo Parts','Elektronika',279,'Uniwersalne'],
['Zestaw przewodów AN10','Demo Parts','Osprzęt',349,'Uniwersalne'],
['Podstawka pod filtr oleju','Demo Parts','Osprzęt',289,'Uniwersalne'],
['Pompa paliwa 340 l/h','Demo Parts','Paliwo',499,'Uniwersalne'],
['Regulator ciśnienia paliwa','Demo Parts','Paliwo',449,'Uniwersalne']
];
export const products:Product[]=groups.map((p,i)=>({id:i<4?i+1:i===4?29:i,name:p[0],brand:p[1],category:p[2],price:p[3],engine:p[4],configurable:!!p[5],sku:`RPM-DEMO-${String(i<4?i+1:i===4?29:i).padStart(3,'0')}`,description:p[5]?'Kolektor wykonywany na zamówienie. Wybierz wymagane parametry. Zgodność i termin wymagają potwierdzenia.':'Produkt demonstracyjny do testowania sklepu. Parametry i dostępność wymagają weryfikacji.'}));
export type CartLine={key:string;productId:number;qty:number;options?:Record<string,string>};
export const money=(v:number)=>new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN'}).format(v);
