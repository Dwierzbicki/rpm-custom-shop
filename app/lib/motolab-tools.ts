export const MOTOLAB_HOME='/#rpm-motolab';
export const MOTOLAB_TOOLS=[
 {id:'power',name:'Power Builder',href:'/power-guides',pl:'Konfiguracja silnika',en:'Engine configuration'},
 {id:'cr',name:'CR Calculator 3D',href:'/cr-calculator',pl:'Geometria silnika',en:'Engine geometry'},
 {id:'itb',name:'ITB Designer',href:'/itb-designer',pl:'Projektowanie dolotu',en:'Intake design'},
 {id:'hardware',name:'Engine Hardware',href:'/engine-hardware',pl:'Zestawy montażowe silnika',en:'Engine fastener sets'}
] as const;
export type MotoLabToolId=typeof MOTOLAB_TOOLS[number]['id'];
