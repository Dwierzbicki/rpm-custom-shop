import {POWER_ENGINES,powerRangesFor} from './storefront-config';
export type Fuel='unknown'|'petrol'|'ethanol';
export type BuildTask={id:string;title:[string,string];detail:[string,string];level:'required'|'inspect'|'conditional';candidates?:string[]};
export type BuildCandidate={materialUnitMm?:number;sku:string;assembly?:{kind:'complete'|'supercore'|'chra';hotIncluded:boolean;coldIncluded:boolean};expectedName:string;note:[string,string];source?:string;verification?:{checkedOn:string;scope:[string,string];url:string}};
export const candidates:Record<string,BuildCandidate>={
 injectors:{sku:'DW-16MX-30-1200-6',expectedName:'Zestaw wtryskiwaczy DeatschWerks 1200cc BMW E46 3.2L M54/S54 2001-06 Porsche 911 996 H6 3.6L turbo 2001-05 BMW 328ci 2000 330i/330xi 2001-05 330ci 200',note:['Producent: komplet 6 Bosch EV14, 1200 cm³/min; potwierdź montaż i dane strojenia.','Manufacturer: matched set of six Bosch EV14, 1200 cc/min; confirm fitment and calibration data.'],source:'https://deatschwerks.com/products/16mx-30-1200-6',verification:{"checkedOn":"2026-11-25","scope":["Komplet 6, 1200 cm³/min, Bosch EV14","Set of six, 1200 cc/min, Bosch EV14"],"url":"https://deatschwerks.com/products/16mx-30-1200-6"}},
 pistons:{sku:'USA-WIS-KE325M84',expectedName:'Kute tłoki silnika Wiseco KE325M84 BMW E46 M54B30 Double Vanos 3.0L (84.00mm) STD, 9.0:1 CR',note:['Katalog FMIC: 84 mm, nominalne CR 9:1. Dane producenta niepotwierdzone. Wybierz dopiero po pomiarze cylindrów i obliczeniu rzeczywistego CR.','FMIC lists 84 mm and nominal 9:1 CR. Manufacturer data not verified. Select only after measuring cylinders and calculating actual CR.']},
 turbo:{sku:'102130183',assembly:{kind:'complete',hotIncluded:true,coldIncluded:true},expectedName:'Turbosprężarka Pulsar PSR 3076 Gen2 750HP .85 T4 Twin Scroll Wlot 3" V-Band Wylot Łożyska kulkowe',note:['Producent deklaruje około 65 lb/min i 750 FWHP dla modelu. FMIC podaje wariant T4 twin scroll .85; dokładny wariant niepotwierdzony u producenta. Porównaj mapę sprężarki i reakcję z celem momentu; potrzebny zgodny kolektor i układ wastegate.','Manufacturer quotes approximately 65 lb/min and 750 FWHP for the model. FMIC lists a T4 twin-scroll .85 variant; exact variant not manufacturer-confirmed. Check compressor map and response against torque target; requires matching manifold and wastegate layout.'],source:'https://pulsarturbo.com/product/psr3076-gen2-dual-ball-bearing-turbocharger/'},
 ecu:{sku:'ECU-EMU-BLACK',expectedName:'EcuMaster EMU BLACK USB-C',note:['Sterownik uniwersalny; dobierz wiązkę, czujniki, obsługę przepustnicy i VANOS.','Universal ECU; confirm wiring, sensors, throttle and VANOS control.'],source:'https://www.ecumaster.com/products/emu-black/',verification:{"checkedOn":"2026-11-25","scope":["Funkcje EMU BLACK, w tym wejście lambda, MAP 4 bar i Flex Fuel","EMU BLACK features including wideband input, 4 bar MAP and flex fuel"],"url":"https://www.ecumaster.com/products/emu-black/"}},
 pump:{sku:'USA-DW-9-401-1001',expectedName:'Pompa paliwa DeatschWerks DW400 415 lph',note:['415 l/h przy 40 psi to wydajność deklarowana przez producenta, nie gwarancja przy ciśnieniu roboczym. Sprawdź krzywą przepływu, napięcie, paliwo i zapas.','415 l/h at 40 psi is a manufacturer rating, not guaranteed at operating pressure. Check flow curve, voltage, fuel and reserve.'],source:'https://deatschwerks.com/products/9-401-1001',verification:{"checkedOn":"2026-11-25","scope":["9-401-1001, 415 l/h przy 40 psi; brak potwierdzenia przepływu przy docelowym ciśnieniu","9-401-1001, 415 l/h at 40 psi; target-pressure flow not confirmed"],"url":"https://deatschwerks.com/blogs/news/dw400-dw-s-highest-flowing-in-tank-fuel-pump-available"}},
 intercooler:{sku:'IC60030076',expectedName:'Intercooler 600x300x76mm FMIC.EU',note:['Uniwersalny: sprawdź miejsce, króćce, spadek ciśnienia i temperaturę IAT.','Universal: check space, connections, pressure drop and IAT.']},
 rods:{sku:'ZRP-R-BMW-006-I',expectedName:'Kute korbowody ZRP BMW M20B25 / M50B25 / M52B25 / M50B28 / M52B28 / M54B30 / M52B32 Classic Series R-BMW-006-I',note:['Producent: R-BMW-006-I, komplet 6, 135 mm, sworzeń 22 mm, otwór stopy 48 mm, ARP2000. Sprawdź wymiary i luzy konkretnego silnika.','Manufacturer: R-BMW-006-I, set of six, 135 mm, 22 mm pin, 48 mm big-end bore, ARP2000. Verify actual engine dimensions and clearances.'],source:'https://zrp-rods.com/length-cc/135-00/',verification:{"checkedOn":"2026-11-25","scope":["R-BMW-006-I, zastosowanie M54B30, długość 135 mm i sworzeń 22 mm","R-BMW-006-I, M54B30 application, 135 mm length and 22 mm pin"],"url":"https://zrp-rods.com/length-cc/135-00/"}}
};
export function buildPlan(version:string,range:number,usage:string,tier:string,fuel:Fuel):BuildTask[]{
 if(!POWER_ENGINES.some(e=>e.versions.some(v=>v.id===version))||!powerRangesFor(version)[range]||!['street','drift','track'].includes(usage)||!['budget','recommended','premium'].includes(tier))return [];
 const na=version!=='2jz-gte',high=powerRangesFor(version)[range].max>=600,example=version==='m54b30'&&range===1&&usage==='drift'&&tier==='recommended';
 const task=(id:string,level:BuildTask['level'],title:BuildTask['title'],detail:BuildTask['detail'],keys?:string[]):BuildTask=>({id,level,title,detail,candidates:example?keys:undefined});
 return [
 ...(version==='m50b30-stroker'?[task('hybrid','required',['Geometria stroker / hybryda','Stroker / hybrid geometry'],['Potwierdź dokładny odlew i średnicę cylindrów bloku, kod wału i skok, długość korbowodów, wysokość kompresyjną tłoków, głowicę, deck clearance i rzeczywisty CR. Sprawdź kolizje oraz wyważenie. Nie zakładaj zamienności części z M54B30.','Confirm exact block casting and bore, crankshaft code and stroke, rod length, piston compression height, head, deck clearance and actual CR. Check interference and balance. Do not assume M54B30 parts are interchangeable.'])]:[]),
 task('health','required',['Diagnostyka jednostki','Engine health'],['Pomiar kompresji, leak-down, ciśnienie oleju, stan cylindrów i układu chłodzenia przed podnoszeniem mocy.','Measure compression, leak-down, oil pressure, cylinder and cooling condition before increasing power.']),
 task('bottom',high?'required':'inspect',['Dół silnika','Short block'],[high?'Zaprojektuj wzmocniony dół, dobierz tłoki i korbowody, sprawdź luzy, panewki, pierścienie oraz obciążenie momentem.':'Oceń stan tłoków, korbowodów, panewek i przewidywany moment; decyzja o kuciu po pomiarach.','Assess pistons, rods, bearings and torque loading; engineer clearances, ring gaps and strengthened components where required.'],['rods','pistons']),
 task('head','inspect',['Głowica i uszczelnienie','Cylinder head and sealing'],['Sprawdź płaskość, szczelność zaworów, uszczelkę i mocowanie głowicy. Dobierz CR do paliwa, momentu i strojenia.','Check flatness, valve sealing, gasket and head fastening. Match compression ratio to fuel, torque and calibration.']),
 task('turbo',na?'required':'conditional',['Turbo i kolektor','Turbo and manifold'],[na?'Konwersja turbo: dobierz sprężarkę z mapy, kolektor, flanszę i układ regulacji doładowania.':'Oceń wydajność fabrycznego turbo, dobierz zamiennik i kolektor, jeżeli nie spełniają celu.','Select or assess turbo using compressor map, manifold flange, turbine housing and boost control.'],['turbo']),
 task('boost','required',['Wastegate i dolot','Wastegate and intake'],['Dobierz wielkość i liczbę wastegate do kolektora i przepływu; uwzględnij BOV, filtr, przewody i szczelność.','Size wastegate count and diameter for the manifold and flow; include BOV, filter, piping and leak testing.']),
 task('injectors','required',['Wtryskiwacze i paliwo','Injectors and fuel'],[fuel==='ethanol'?'Uwzględnij większe zapotrzebowanie objętościowe i zgodność materiałową z etanolem. Oblicz przepływ dla sześciu wtryskiwaczy przy rzeczywistym ciśnieniu i duty cycle.':'Dobierz sześć wtryskiwaczy na podstawie paliwa, mocy, BSFC, ciśnienia różnicowego i duty cycle. Zweryfikuj długość, wtyczkę i charakterystykę.', 'Size six injectors for fuel, power, BSFC, differential pressure and duty cycle; confirm geometry, connector and characterization. Ethanol blends require additional volume and compatible materials.'],['injectors']),
 task('pump','required',['Zasilanie paliwem','Fuel supply'],['Sprawdź przepływ pompy pod obciążeniem, regulator, listwę, przewody, filtr i zasilanie elektryczne.','Check pump flow under load, regulator, rail, lines, filter and electrical supply.'],['pump']),
 task('charge','required',['Chłodzenie powietrza','Charge cooling'],['Dobierz intercooler i orurowanie do przepływu, strat ciśnienia i miejsca w nadwoziu; loguj IAT.','Match intercooler and piping to flow, pressure drop and packaging; log IAT.'],['intercooler']),
 task('oil','required',['Smarowanie i odma','Lubrication and ventilation'],['Sprawdź zasilanie i spływ oleju turbo, odmę oraz ciśnienie i temperaturę oleju; dobierz miskę i przegrody do przeciążeń.','Check turbo oil feed/drain, ventilation, oil pressure and temperature; adapt sump and baffling to acceleration loads.']),
 task('cooling','required',['Chłodzenie silnika','Engine cooling'],[usage==='drift'||usage==='track'?'Zweryfikuj chłodnicę, wentylatory, kanały powietrza i chłodzenie oleju przy długim obciążeniu.':'Sprawdź chłodnicę, termostat, wentylator i temperatury pod obciążeniem.','Validate radiator, airflow, fans and oil cooling under the actual duty cycle.']),
 task('exhaust','required',['Układ wydechowy','Exhaust system'],['Dobierz downpipe, średnicę, mocowania i ochronę termiczną; uwzględnij wymagania prawne użytkowania.','Size downpipe and exhaust, mounts and heat protection; respect applicable road-use requirements.']),
 task('ecu','required',['ECU, czujniki i strojenie','ECU, sensors and calibration'],['Zaplanuj sterowanie zapłonem, paliwem i boostem, czujniki MAP/IAT/lambda oraz zabezpieczenia ciśnienia oleju i paliwa. Strojenie na hamowni z logami.','Plan ignition, fueling, boost, MAP/IAT/lambda sensors and oil/fuel pressure protections. Calibrate on a dyno with logs.'],['ecu']),
 task('drivetrain','inspect',['Napęd, hamulce i bezpieczeństwo','Drivetrain, brakes and safety'],['Dobierz sprzęgło, skrzynię, wał, dyferencjał i półosie do momentu; sprawdź hamulce, opony i wymagania sportowe.','Match clutch, transmission, shaft, differential and axles to torque; check brakes, tyres and motorsport requirements.'])
 ];
}

/** Planning estimate at the upper end of the selected crankshaft-power band.
 * Metric PS -> mechanical hp; assumed turbo BSFC in lb/(hp*h), density kg/L.
 * Not a pump flow curve or a calibration specification. E85 is an illustrative
 * assumption, not a model of every ethanol blend.
 */
export function estimateFuel(version:string,range:number,fuel:Fuel,targetPower?:number|null,ethanolPercent?:number){
 const band=powerRangesFor(version)[range];
 if(!band||fuel==='unknown')return null;
 const powerPs=targetPower??band.max;
 if(!Number.isFinite(powerPs)||powerPs<band.min||powerPs>band.max)return null;
 const hp=powerPs*0.98632007;
 // Planning interpolation between existing petrol and E85 assumptions;
 // extrapolation above E85 is indicative, not a measured BSFC or calibration.
 const blend=fuel==='ethanol'?(ethanolPercent??85):0;
 if(!Number.isFinite(blend)||blend<0||blend>100)return null;
 const bsfc=0.65+(0.85-0.65)*blend/85;
 const density=0.745+(0.78-0.745)*blend/85;
 const duty=0.80, reserve=1.20;
 const litres=hp*bsfc*0.45359237/density;
 return {powerPs,bsfc,density,duty,reserve,ethanolPercent:blend,injectorCc:Math.ceil(litres*1000/60/6/duty),pumpLph:Math.ceil(litres*reserve)};
}

export type FitmentReference={turboSku:string;label:string;url:string;checkedOn:string;catalogCandidate?:string};
export type PartsSlot={fitmentReference?:FitmentReference;id:string;label:[string,string];qty:number|null;conditional:boolean;candidate?:string;rpmOptions?:string[];alternatives?:string[];defaultNone?:boolean;planNote?:[string,string];dependency?:'m52tu';manifoldEngine?:'m50'|'m52'|'m54'|'2jz-ge'|'2jz-gte'};
export type PilotProfile={fuel:string;internals:string;rods:string;priority:string;ethanolPercent?:number};
export function isTuPilot(version:string,range:number,usage:string,fuel:Fuel,profile?:PilotProfile){return version==='m52b25tu'&&powerRangesFor(version)[range]?.min===350&&powerRangesFor(version)[range]?.max===400&&['drift','track'].includes(usage)&&fuel==='petrol'&&profile?.fuel==='pb98'}
export function buildParts(version:string,range:number,usage:string,tier:string,fuel:Fuel,profile?:PilotProfile):PartsSlot[]{
 const tasks=buildPlan(version,range,usage,tier,fuel);
 if(!tasks.length)return [];
 const assigned=new Set(tasks.flatMap(t=>t.candidates??[]));
 // Curated candidate pools, not verified complete builds. Reuse only explicit
 // engine applications or universal products with fitment still to confirm.
 const pilot=range===1&&['m54b30','2jz-ge','2jz-gte'].includes(version);
 const pool:Record<string,string>=pilot?{turbo:'turbo',intercooler:'intercooler',pump:'pump',ecu:'ecu',...(version==='m54b30'?{injectors:'injectors',rods:'rods',pistons:'pistons'}:version==='2jz-ge'?{injectors:'geInjectors',manifold:'geManifold'}:{rods:'gteRods',pistons:'gtePistons',manifold:'gteManifold'}),wastegate:'wastegate45'}:{};
 const slot=(id:string,pl:string,en:string,qty:number|null,conditional=false,candidate?:string):PartsSlot=>({id,label:[pl,en],qty,conditional,candidate:pool[id]??(candidate&&assigned.has(candidate)?candidate:undefined)});
 const result=[
 slot('turbo','Turbosprężarka','Turbocharger',1,version==='2jz-gte','turbo'),
 slot('turbo-insulation','Koc termiczny turbosprężarki','Turbo blanket',1,true),
 slot('exhaust-wrap','Bandaż termiczny downpipe','Downpipe heat wrap',1,true),
 slot('manifold','Kolektor turbo','Turbo manifold',1,version==='2jz-gte'),
 slot('wastegate','Wastegate','Wastegate',null,true),
 slot('bov','Zawór upustowy BOV','Blow-off valve',1,true),
 slot('intercooler','Intercooler','Intercooler',1,true,'intercooler'),
 slot('intake-manifold','Kolektor ssący (dolotowy)','Intake manifold',1,true),
 slot('chargepipes','Rury i złącza dolotowe','Charge pipes and couplers',null,true),
 slot('filter','Filtr powietrza','Air filter',1,true),
 slot('injectors','Wtryskiwacze (komplet 6 szt.)','Injectors (set of six)',1,true,'injectors'),
 slot('pump','Pompa paliwa','Fuel pump',null,true,'pump'),
 slot('regulator','Regulator ciśnienia paliwa','Fuel pressure regulator',1,true),
 slot('rail','Listwa paliwowa','Fuel rail',1,true),
 slot('fuel-lines','Przewody i filtr paliwa','Fuel lines and filter',null,true),
 slot('pistons','Tłoki (komplet)','Piston set',1,true,'pistons'),
 slot('rods','Korbowody (komplet)','Connecting rod set',1,true,'rods'),
 slot('bearings','Panewki główne i korbowodowe','Main and rod bearings',null,true),
 slot('rings','Pierścienie tłokowe','Piston rings',null,true),
 slot('gasket','Uszczelka głowicy','Head gasket',1,true),
 slot('fasteners','Mocowanie głowicy (komplet)','Head fastener set',1,true),
 ...(version==='m50b30-stroker'?[slot('crank','Wał korbowy B30','B30 crankshaft',1,true)]:[]),
 slot('oil-feed','Przewody zasilania i spływu oleju turbo','Turbo oil feed and drain',null,true),
 slot('breather','Odma / catch tank','Breather / catch tank',null,true),
 slot('oil-cooler','Chłodnica oleju','Oil cooler',1,true),
 slot('radiator','Chłodnica cieczy i wentylator','Radiator and fan',null,true),
 slot('downpipe','Downpipe i elementy wydechu','Downpipe and exhaust components',null,true),
 slot('ecu','Sterownik silnika','Engine management ECU',1,true,'ecu'),
 slot('sensors','Czujniki, wiązka i osprzęt ECU','Sensors, harness and ECU accessories',null,true),
 slot('clutch','Sprzęgło / elementy przeniesienia napędu','Clutch / drivetrain components',null,true)
 ];
 const parts=isTuPilot(version,range,usage,fuel,profile)?tuPilotSlots(result,tier,profile!):profile&&fuel!=='unknown'?globalBuildSlots(result,version,range,usage,tier,fuel,profile):result;
 return [...parts.map(s=>s.id==='intake-manifold'?intakeManifoldSlot(s,version,tier):thermalProtectionSlot(s,tier)),...completionSlots()];
}

/** Catalog candidates, never a blanket compatibility certificate. */
export const alternatives:Record<string,BuildCandidate>={
 garrett3076:{sku:'851154-5001S',assembly:{kind:'supercore',hotIncluded:false,coldIncluded:true},expectedName:'Turbosprężarka Garrett GTX3076R Gen II Super Core',note:['Super Core Garrett: rdzeń z obudową sprężarki, bez obudowy turbiny. Dobierz kompatybilny zestaw strony gorącej; mapa i punkt pracy do potwierdzenia.','Garrett Super Core: rotating assembly with compressor housing, without turbine housing. Select a compatible turbine kit; compressor map and operating point require confirmation.'],verification:{checkedOn:'2026-11-25',scope:['851154-5001S, GTX3076R Gen II standard rotation, sprężarka 58/76 mm, turbina 60/55 mm; osobny turbine kit','851154-5001S, GTX3076R Gen II standard rotation, compressor 58/76 mm, turbine 60/55 mm; separate turbine kit'],url:'https://www.garrettmotion.com/racing-and-performance/performance-catalog/turbo/gtx3076r-gen-ii/'}},
 pumpAem:{sku:'USA-AEM-50-1200',expectedName:'Pompa paliwa AEM E85 340 LPH AEM-50-1200',note:['340 l/h przy 40 psi, E85. Wydajność przy docelowym ciśnieniu, montaż i zasilanie wymagają potwierdzenia.','340 l/h at 40 psi, E85. Confirm flow at operating pressure, fitment and electrical supply.'],verification:{checkedOn:'2026-11-25',scope:['50-1200: 340 l/h przy 40 psi, zgodność z E85','50-1200: 340 l/h at 40 psi, E85 compatibility'],url:'https://www.aemelectronics.com/products/fuel_delivery/high_flow_fuel_pumps/in-tank/parts/50-1200'}},
 pumpWalbro:{sku:'WAL-F90000274',expectedName:'Pompa paliwa Walbro E85 High Performance 450 LPH',note:['450 l/h przy 40 psi wg TI Automotive. Producent publikuje krzywą przepływu; dobór wymaga rzeczywistego ciśnienia i napięcia.','450 l/h at 40 psi per TI Automotive. Manufacturer provides a flow curve; sizing requires actual pressure and voltage.'],verification:{checkedOn:'2026-11-25',scope:['F90000274: 450 l/h przy 40 psi','F90000274: 450 l/h at 40 psi'],url:'https://aftermarket.tiautomotive.com/product/f90000274/'}},
 wastegateTial:{sku:'USA-TIAL-002949',expectedName:'Zawór Wastegate Tial MVR 44mm Czarny, Wszystkie sprężynki',note:['Katalog: MVR 44 mm. Mocowania, liczba zaworów, sprężyny i przepływ do potwierdzenia. Nie jest automatycznym zamiennikiem WG45.','Catalogue: MVR 44 mm. Confirm flanges, valve count, springs and flow. Not an automatic WG45 replacement.'],source:'https://tialsport.com/product/mvr-wastegate/'},
 turboVband:{sku:'102130140',assembly:{kind:'complete',hotIncluded:true,coldIncluded:true},expectedName:'Turbosprężarka Pulsar PSR 3076 Gen2 750HP 1.01 2,5" V-Band Wlot 3" V-Band Wylot Łożyska kulkowe',note:['Katalog: A/R 1.01, wlot V-Band 2,5 cala. Nie jest zamiennikiem montażowym wersji T4; reakcja i mapa do potwierdzenia.','Catalogue: A/R 1.01, 2.5-inch V-band inlet. Not a direct replacement for T4; response and map require confirmation.']},
 geInjectors:{sku:'USA-DW-22S-03-1000-6',expectedName:'DeatschWerks zestaw 6 wtryskiwaczy paliwa 1000cc/min, Lexus IS300 2JZ-GE 01-05',note:['Zastosowanie katalogowe: Lexus IS300 2001–2005 2JZ-GE, komplet sześciu. Nie oznacza zgodności z każdą wersją GE; sprawdź listwę i dane kalibracyjne.','Catalogue application: 2001–2005 Lexus IS300 2JZ-GE, set of six. Confirm exact GE variant, fuel rail and calibration.']},
 geManifold:{sku:'FMICPRO-MAN-2',expectedName:'Kolektor wydechowy FMIC.Pro Toyota 2JZ GE T4 Twin scroll stal nierdzewna 321',note:['Katalog: 2JZ-GE, T4 Twin Scroll, stal 321. Układ wastegate i miejsce montażu do potwierdzenia.','Catalogue: 2JZ-GE, T4 twin-scroll, 321 stainless. Confirm wastegate arrangement and packaging.']},
 gteManifold:{sku:'FMICPRO-MAN-4',expectedName:'Kolektor wydechowy FMIC.Pro Toyota 2JZ GTE T4 Twin scroll stal nierdzewna 321',note:['Katalog: 2JZ-GTE, T4 Twin Scroll, stal 321. Układ wastegate i miejsce montażu do potwierdzenia.','Catalogue: 2JZ-GTE, T4 twin-scroll, 321 stainless. Confirm wastegate arrangement and packaging.']},
 gteRods:{sku:'ZRP-R-TOY-006-H',expectedName:'Kute korbowody ZRP Toyota Supra 2JZ HD Series H-Beam R-TOY-006-H',note:['Katalog: seria HD 2JZ. Długość, sworzeń, stopa, komplet i nośność do potwierdzenia.','Catalogue: 2JZ HD series. Confirm length, pin, big end, set quantity and load rating.']},
 gteRodsFmic:{sku:'FP-TOY-2JZ-I+A',expectedName:'Kute korbowody FMIC.Pro Toyota 2JZ-GTE I-BEAM Korbowody + śruby ARP',note:['Katalog: 2JZ-GTE, I-beam, śruby ARP. Wymiary i nośność do potwierdzenia.','Catalogue: 2JZ-GTE, I-beam, ARP bolts. Confirm dimensions and load rating.']},
 gtePistons:{sku:'MAN-609000C-6',expectedName:'Kute tłoki Manley, Toyota Supra Turbo 93-98 - 2JZGTE 3.0L / STD, 86.0mm bore, CR 8.5, Dish -10cc',note:['Katalog: 2JZ-GTE, 86 mm, nominalne CR 8,5. Dobór zależy od rzeczywistej geometrii i pomiaru bloku.','Catalogue: 2JZ-GTE, 86 mm, nominal 8.5 CR. Fitment depends on actual geometry and bore measurement.']},
 gtePistonsWiseco:{sku:'USA-WIS-K550M86AP',expectedName:'Kute tłoki silnika Wiseco K550M86AP 6 cyl, Toyota Supra 2JZGTE 3.0l 24V 93-98 Bore 3.386 (86.00mm) Size STD CR 8.3:1',note:['Katalog: 86 mm, nominalne CR 8,3. Nie zakładaj identycznego CR po zamianie.','Catalogue: 86 mm, nominal 8.3 CR. Do not assume identical CR after substitution.']},
 wastegate45:{sku:'TS-0553-1012',expectedName:'Zawór wastegate Turbosmart TS-0553-1012 WG45 GenV Hypergate 45 14psi',note:['Katalog: 45 mm, 14 psi. Średnica, sprężyna, mocowania i liczba zaworów zależą od projektu; jedna sztuka nie oznacza kompletnego układu.','Catalogue: 45 mm, 14 psi. Diameter, spring, mounts and valve count depend on the build; one item is not a complete system.']},
 rodsFmic:{sku:'FP-BMW-M50-H-A',expectedName:'Kute korbowody Fmic.Pro BMW M20B25 M50B25 M52B25 M50B28 M52B28 M54B30 M52B32 + śruby ARP',note:['FMIC wymienia M54B30. Wymiary, typ śrub i wytrzymałość do potwierdzenia.','FMIC lists M54B30. Dimensions, bolt type and strength require confirmation.']},
 intercoolerJr:{sku:'IC60030076-JRSPEC',expectedName:'Intercooler JRspec 600x300x76mm',note:['Wymiary nominalne 600×300×76 mm. Wydajność cieplna, króćce i spadek ciśnienia niepotwierdzone.','Nominal dimensions 600×300×76 mm. Thermal performance, connections and pressure drop unconfirmed.']},
 intercoolerPsr:{sku:'234300005',expectedName:'PSR Pulsar Uniwersalny Wydajny Intercooler 600x300x76mm 76mm Wlot & Wylot',note:['Wymiary nominalne i króćce 76 mm według katalogu; wydajność cieplna do potwierdzenia.','Nominal dimensions and 76 mm ports per catalogue; thermal performance requires confirmation.']},
 intercoolerBlack:{sku:'IC60030076-BLACK',expectedName:'Intercooler 600x300x76mm Czarny FMIC.EU',note:['Wariant czarny, 600×300×76 mm według katalogu. Parametry przepływu do potwierdzenia.','Black variant, 600×300×76 mm per catalogue. Flow performance requires confirmation.']},
 injectors1500:{sku:'USA-DW-16M-30-1500-6',expectedName:'Zestaw wtryskiwaczy DeatschWerks 1500cc Porsche 911/996 H6 01-05 2001-05 BMW E46 M52 1998-2000 E46 3.2L M54/S54 2001-06 E90-E93 N52 2007-13 BMW 328ci',note:['Katalog: 1500 cc/min, zestaw dedykowany m.in. M54/S54. Zweryfikuj liczbę, ciśnienie referencyjne, geometrię i dane kalibracyjne. Większy przepływ nie oznacza lepszego doboru.','Catalogue: 1500 cc/min, application includes M54/S54. Confirm quantity, reference pressure, geometry and calibration. Higher flow is not inherently better.']}
};
export const tuCandidates:Record<string,BuildCandidate>={"tuTurboSmart":{"sku":"102128202","expectedName":"Turbosprężarka Pulsar PSR 2860 GEN 2 łożysko kulkowe podwójny V-Band 0.72 A/R IWG PSR Billet Actuator 7.4psi","note":["V-Band, A/R .72, IWG 7.4 PSI. Potwierdź średnice flansz i kontrolę doładowania.","V-band, .72 A/R, 7.4 PSI IWG. Confirm flange dimensions and boost control."],"assembly":{"kind":"complete","hotIncluded":true,"coldIncluded":true}},"tuTurboPremium":{"sku":"102128123","expectedName":"Turbosprężarka Pulsar PSR 2860 Gen2 475HP .82 2.5\" V-Band Wlot 3\" V-Band Wylot Stal Nierdzewna Łożyska kulkowe","note":["V-Band 2.5/3 cala, A/R .82, wariant EWG do potwierdzenia po dokumentacji. Sprawdź mapę i przeciwciśnienie.","2.5/3 inch V-band, .82 A/R, EWG layout to confirm against documentation. Check map and backpressure."],"assembly":{"kind":"complete","hotIncluded":true,"coldIncluded":true}},"tuPumpBudget":{"sku":"USA-DW-9-201-1031","expectedName":"Pompa paliwa DW200 DeatschWerks 255 lph BMW E36 E46 zestaw montażowy 9-1031","note":["255 l/h katalogowo; sprawdź przepływ przy ciśnieniu bazowym + boost, napięcie i nadwozie.","255 l/h catalogue rating; confirm flow at base pressure plus boost, voltage and chassis."]},"tuPumpSmart":{"sku":"USA-DW-9-301-1031","expectedName":"Pompa paliwa DW300 DeatschWerks 320 lph BMW E36 E46 zestaw montażowy 9-1031","note":["320 l/h wg feedu; potwierdź krzywą i montaż. Na torze sprawdź odpływ paliwa.","320 l/h per feed; verify flow curve and fitment. Check fuel starvation on track."]},"tuInjectors":{"sku":"USA-DW-17U-01-0750-6","expectedName":"Zestaw wtryskiwaczy DeatschWerks 750cc Porsche 911 996 H6 3.6L turbo 2001-05 BMW E46 3.2L M54/S54 2001-06 BMW 328ci 2000 330i/330xi 2001-05 330ci 2001","note":["Komplet 6 wg katalogu, 750 cc. Listwa M54B25: długość, złącza, ciśnienie i dane strojenia do potwierdzenia.","Catalogue set of six, 750 cc. Confirm M54B25 rail length, connectors, pressure and characterization."]},"tuRods":{"sku":"K1-305AX17140","expectedName":"Korbowody H-Beam Billet K1, BMW M50B25Tu / M52B25Tu Dł. 140 Pin 22mm","note":["Katalog wskazuje M52B25TU, 140 mm i sworzeń 22 mm. Potwierdź komplet, geometrię stopy, tłoka i luzy; nie zamieniaj automatycznie na korbowód 135 mm.","Catalogue lists M52B25TU, 140 mm and 22 mm pin. Confirm set quantity, big end, piston geometry and clearances; do not substitute a 135 mm rod."]},"tuRodBearings":{"sku":"ACL-6B1490H-STD","expectedName":"Panewki korbowodowe ACL Race STD BMW M20B20/23/25/27M50B20/25/27M52B20/25/28M54B25M54B22 M54B30","note":["STD to propozycja wyceny; pomierz czopy, korbowody i luzy. Nie zakładaj zgodności TU bez pomiarów.","STD is a pricing candidate; measure journals, rods and clearances. Confirm TU fitment."]},"tuMainBearings":{"sku":"ACL-7M1532H-STD","expectedName":"Panewki główne ACL Race STD BMW M20 / M50 / M52 / S52 / S54","note":["STD do wyceny, nie zamówienie przed pomiarami wału i bloku.","STD for estimation only; measure crankshaft and block before ordering."]},"tuWastegate":{"sku":"TS-0553-1001","expectedName":"Zawór wastegate Turbosmart TS-0553-1001 WG45 GenV Hypergate 45 7psi","note":["45 mm, 7 PSI wg katalogu. Potwierdź flanszę, przepływ i sprężynę; tylko dla EWG.","45 mm, 7 PSI per catalogue. Confirm flange, flow and spring; EWG only."]},"tuTurboT3":{"sku":"102128198","expectedName":"Turbosprężarka Pulsar PSR 2860 Gen2 475HP .82 T3 Wlot 3\" V-Band Wylot Stal Nierdzewna Łożyska kulkowe","note":["T3, A/R .82, wylot 3″ V-Band. Wariant EWG do potwierdzenia po dokumentacji; wymaga kolektora T3 i doboru zewnętrznego WG.","T3, .82 A/R, 3-inch V-band outlet. Confirm EWG configuration against documentation; requires T3 manifold and external WG selection."],"assembly":{"kind":"complete","hotIncluded":true,"coldIncluded":true}},"turbo2867T3":{"sku":"102127207","expectedName":"Turbosprężarka Pulsar PSR 2867 Gen2 550HP .82 T3 Wlot 3\" V-Band Wylot Stal Nierdzewna Łożyska kulkowe","note":["Kandydat wg nominalnej klasy mocy katalogu; sprawdź mapę, A/R, rzeczywiste EWG i fizyczne flansze, reakcję i przeciwciśnienie.","Candidate based on nominal catalogue power class; verify map, A/R, actual EWG and flange dimensions, response and backpressure."],"assembly":{"kind":"complete","hotIncluded":true,"coldIncluded":true}},"turbo2867V":{"sku":"102128112","expectedName":"Turbosprężarka Pulsar PSR 2867 Gen2 550HP .82 2.5\" V-Band Wlot 3\" V-Band Wylot Stal Nierdzewna Łożyska kulkowe","note":["Kandydat wg nominalnej klasy mocy katalogu; sprawdź mapę, A/R, rzeczywiste EWG i fizyczne flansze, reakcję i przeciwciśnienie.","Candidate based on nominal catalogue power class; verify map, A/R, actual EWG and flange dimensions, response and backpressure."],"assembly":{"kind":"complete","hotIncluded":true,"coldIncluded":true}},"turbo3076T3":{"sku":"102130123","expectedName":"Turbosprężarka Pulsar PSR 3076 Gen2 750HP .82 T3 Wlot 3\" V-Band Wylot Łożyska kulkowe","note":["Kandydat wg nominalnej klasy mocy katalogu; sprawdź mapę, A/R, rzeczywiste EWG i fizyczne flansze, reakcję i przeciwciśnienie.","Candidate based on nominal catalogue power class; verify map, A/R, actual EWG and flange dimensions, response and backpressure."],"assembly":{"kind":"complete","hotIncluded":true,"coldIncluded":true}},"turbo3582T3":{"sku":"102135271","expectedName":"Turbosprężarka Pulsar PSR 3582 Gen2 900HP .82 T3 Wlot 3\" V-Band Wylot Łożyska kulkowe","note":["Kandydat wg nominalnej klasy mocy katalogu; sprawdź mapę, A/R, rzeczywiste EWG i fizyczne flansze, reakcję i przeciwciśnienie.","Candidate based on nominal catalogue power class; verify map, A/R, actual EWG and flange dimensions, response and backpressure."],"assembly":{"kind":"complete","hotIncluded":true,"coldIncluded":true}},"turbo3582V":{"sku":"102135273","expectedName":"Turbosprężarka Pulsar PSR 3582 Gen2 900HP .83 2.5\" V-Band Wlot 3\" V-Band Wylot Łożyska kulkowe","note":["Kandydat wg nominalnej klasy mocy katalogu; sprawdź mapę, A/R, rzeczywiste EWG i fizyczne flansze, reakcję i przeciwciśnienie.","Candidate based on nominal catalogue power class; verify map, A/R, actual EWG and flange dimensions, response and backpressure."],"assembly":{"kind":"complete","hotIncluded":true,"coldIncluded":true}},"turbo3584T3":{"sku":"102135510","expectedName":"Turbosprężarka Pulsar PSR 3584 Gen3 1050HP .82 T3 Wlot 3\" V-Band Wylot Łożyska kulkowe","note":["Kandydat wg nominalnej klasy mocy katalogu; sprawdź mapę, A/R, rzeczywiste EWG i fizyczne flansze, reakcję i przeciwciśnienie.","Candidate based on nominal catalogue power class; verify map, A/R, actual EWG and flange dimensions, response and backpressure."],"assembly":{"kind":"complete","hotIncluded":true,"coldIncluded":true}},"turbo3584V":{"sku":"102135513","expectedName":"Turbosprężarka Pulsar PSR 3584 Gen3 1050HP .83 2.5\" V-Band Wlot 3\" V-Band Wylot Łożyska kulkowe","note":["Kandydat wg nominalnej klasy mocy katalogu; sprawdź mapę, A/R, rzeczywiste EWG i fizyczne flansze, reakcję i przeciwciśnienie.","Candidate based on nominal catalogue power class; verify map, A/R, actual EWG and flange dimensions, response and backpressure."],"assembly":{"kind":"complete","hotIncluded":true,"coldIncluded":true}},"turbo7375V":{"sku":"102142226","expectedName":"Turbosprężarka Pulsar PSR 7375G Compact 1200KM 1.01 3\" V-Band Wlot 3.5\" V-Band Wylot Łożyska kulkowe","note":["Kandydat wg nominalnej klasy mocy katalogu; sprawdź mapę, A/R, rzeczywiste EWG i fizyczne flansze, reakcję i przeciwciśnienie.","Candidate based on nominal catalogue power class; verify map, A/R, actual EWG and flange dimensions, response and backpressure."],"assembly":{"kind":"complete","hotIncluded":true,"coldIncluded":true}},"universal1200":{"sku":"USA-DW-16MX-00-1200-6","expectedName":"Zestaw wtryskiwaczy DeatschWerks A Bosch EV14 uniwersalne 40mm 6szt 1200cc","note":["Uniwersalny komplet 6, 40 mm; geometria listwy, zgodność paliwowa i dane kalibracji do potwierdzenia.","Universal set of six, 40 mm; confirm rail geometry, fuel compatibility and calibration."]},"universal1500":{"sku":"USA-DW-16M-00-1500-6","expectedName":"Zestaw wtryskiwaczy DeatschWerks Bosch EV14 uniwersalne 40mm 1500cc 6szt","note":["Uniwersalny komplet 6, 40 mm; geometria listwy, paliwo, ciśnienie i kalibracja do potwierdzenia.","Universal set of six, 40 mm; confirm rail geometry, fuel, pressure and calibration."]},"m54b25Rods":{"sku":"ZRP-R-BMW-003H","expectedName":"Kute korbowody ZRP BMW 2.5L M54B25 325 R-BMW-003H","note":["Katalog wymienia M54B25; potwierdź komplet, geometrię i luzy przed zakupem.","Catalogue lists M54B25; verify quantity, geometry and clearances before purchase."]},"egtModule":{"sku":"CC22928","expectedName":"CANchecked TCC08 Konwerter termoparowy z 4-pinowym złączem DTM","note":["Kandydat modułu EGT; potwierdź 8 kanałów, zgodność termopar, protokół CAN, zasilanie i wiązkę.","EGT module candidate; confirm eight channels, thermocouple compatibility, CAN protocol, power and harness."]}};
export const intakeCandidates:Record<string,BuildCandidate>={
 intakeM50:{sku:'FP-INTK-M50',expectedName:'Kolektor ssący dolotowy turbo BMW M50 M52',note:['Aluminiowy zestaw z przepustnicą 90 mm i listwą paliwową. Potwierdź dopasowanie do głowicy, przepustnicę, wtryskiwacze, miejsce i przepływ. Nie przypisujemy do M52TU/M54.','Aluminium kit with 90 mm throttle and fuel rail. Verify head fitment, throttle, injectors, clearance and flow. Not assigned to M52TU/M54.'],source:'https://fmic.pl/166431-kolektor-ssacy-dolotowy-turbo-bmw-m50-m52-fp-intk-m50.html'},
 intakeGE:{sku:'FP-INTK-2JZGE',expectedName:'Kolektor ssący dolotowy FMIC.Pro Toyota 2JZ-GE',note:['Zestaw z przepustnicą i listwą; wejścia wtryskiwaczy 14 mm. Potwierdź wariant głowicy, geometrię wtrysków i miejsce.','Kit with throttle and fuel rail; 14 mm injector ports. Confirm head variant, injector geometry and packaging.'],source:'https://fmic.pl/166430-kolektor-ssacy-dolotowy-fmic-pro-toyota-2jz-ge-fp-intk-2jzge.html'},
 intakeGTE:{sku:'FP-INTK-2JZGTE',expectedName:'Kolektor ssący dolotowy FMIC.Pro Toyota 2JZ-GTE',note:['Zestaw z przepustnicą i listwą; wejścia wtryskiwaczy 14 mm. Potwierdź wariant głowicy, geometrię wtrysków i miejsce.','Kit with throttle and fuel rail; 14 mm injector ports. Confirm head variant, injector geometry and packaging.'],source:'https://fmic.pl/166429-kolektor-ssacy-dolotowy-fmic-pro-toyota-2jz-gte-fp-intk-2jzgte.html'}
};
export const thermalCandidates:Record<string,BuildCandidate>={
 turboBlanketT25:{sku:'FMICPRO-TB-B1-T25',expectedName:'Koc termoizolacyjny na turbo FMIC.Pro Magma T25',note:['Potwierdź wymiary muszli gorącej, miejsce na siłownik IWG i zalecenia producenta turbo. Nie izoluj CHRA, przewodów ani strony zimnej.','Confirm turbine housing dimensions, actuator clearance and turbo manufacturer guidance. Do not cover CHRA, lines or compressor housing.'],source:'https://fmic.pl/182757-koc-termoizolacyjny-na-turbo-fmic-pro-magma-t25-fmicpro-tb-b1-t25.html'},
 turboBlanketT3:{sku:'FMICPRO-TB-B1-T3',expectedName:'Koc termoizolacyjny na turbo FMIC.Pro Magma T3',note:['Potwierdź wymiary muszli gorącej i zalecenia producenta. Rozmiar koca nie wynika wyłącznie z flanszy.','Confirm turbine housing dimensions and manufacturer guidance. Blanket size is not determined solely by inlet flange.'],source:'https://fmic.pl/182758-koc-termoizolacyjny-na-turbo-fmic-pro-magma-t3-fmicpro-tb-b1-t3.html'},
 turboBlanketT4:{sku:'FMICPRO-TB-C-T4',expectedName:'Koc Termoizolacyjny Na Turbo FMIC.Pro Carbon T4',note:['Potwierdź wymiary muszli gorącej i zalecenia producenta. Nie zakrywaj CHRA ani aktuatora.','Confirm turbine housing dimensions and manufacturer guidance. Do not cover CHRA or actuator.'],source:'https://fmic.pl/182765-koc-termoizolacyjny-na-turbo-fmic-pro-carbon-t4-fmicpro-tb-c-t4.html'},
 turboBlanketInconelT3:{sku:'FMICPRO-TB-BS-T3',expectedName:'Koc Termoizolacyjny Na Turbo FMIC.Pro Inconel Magma T3',note:['Wariant wzmocniony Inconel; dobór po pomiarze muszli i potwierdzeniu dopuszczalnej izolacji.','Inconel reinforced option; confirm housing dimensions and permitted insulation.'],source:'https://fmic.pl/182767-koc-termoizolacyjny-na-turbo-fmic-pro-inconel-magma-t3-fmicpro-tb-bs-t3.html'},
 downpipeWrap5:{sku:'FP-WRAP-MAG-5',expectedName:'Bandaż termoizolacyjny Fmic.Pro MAGMA 50mm 2mm 5m',note:['Rolka 5 m. Długość dobierz do średnicy, długości i zakładu owinięcia downpipe; sprawdź materiał i dopuszczenie izolacji. Unikaj wycieków oleju i paliwa.','5 m roll. Size for downpipe diameter, length and overlap; verify pipe material and permitted wrapping. Prevent oil and fuel contamination.'],source:'https://fmic.pl/351890-bandaz-termoizolacyjny-fmic-pro-magma-50mm-2mm-5m-fp-wrap-mag-5.html'},
 downpipeWrap10:{sku:'FP-WRAP-MAG-10',expectedName:'Bandaż termoizolacyjny Fmic.Pro MAGMA 50mm 2mm 10m',note:['Rolka 10 m; długość i sposób montażu do potwierdzenia. Nie dubluj izolacji tego samego elementu.','10 m roll; verify required length and installation. Do not duplicate insulation on the same component.'],source:'https://fmic.pl/351892-bandaz-termoizolacyjny-fmic-pro-magma-50mm-2mm-10m-fp-wrap-mag-10.html'}
};
export const auxiliaryCandidates:Record<string,BuildCandidate>={"vacuum4":{"sku":"VAC-FP-4-B","expectedName":"Przewód podciśnienia Vacuum zbrojony 4mm Fmic.Pro Czarny","materialUnitMm":1000,"source":"https://fmic.pl/320893-przewod-podcisnienia-vacuum-zbrojony-4mm-fmic-pro-czarny-vac-fp-4-b.html","note":["Średnica wewnętrzna 4 mm; cena za 1 m. Potwierdź króćce, ciśnienie i trasę.","4 mm inner diameter; priced per metre. Verify fittings, pressure and routing."]},"vacuum6":{"sku":"VAC-FP-6-B","expectedName":"Przewód podciśnienia Vacuum zbrojony 6mm Fmic.Pro Czarny","materialUnitMm":1000,"source":"https://fmic.pl/321419-przewod-podcisnienia-vacuum-zbrojony-6mm-fmic-pro-czarny-vac-fp-6-b.html","note":["Średnica 6 mm; zweryfikuj króćce, ciśnienie i jednostkę sprzedaży w aktualnym katalogu.","6 mm diameter; verify fittings, pressure and sales unit in current catalogue."]},"sleeve15":{"sku":"TH-SLEEVE15-100","expectedName":"Rękaw termoizolacyjny 15mm - odcinek 10cm","materialUnitMm":100,"source":"https://fmic.pl/42213-rekaw-termoizolacyjny-15mm-odcinek-10cm-th-sleeve15-100.html","note":["Średnica wewnętrzna 15 mm; 10 cm na jednostkę. Katalog deklaruje do 300°C. Potwierdź prześwit, warunki termiczne i długość.","15 mm inner diameter; 10 cm per unit. Catalogue states up to 300°C. Confirm clearance, thermal conditions and length."]},"sleeve10":{"sku":"FMIC-TH-2140","expectedName":"Termoizolacyjny rękaw ochronny FMIC.eu 10 mm odcinek 1m","materialUnitMm":1000,"source":"https://fmic.pl/389280-termoizolacyjny-rekaw-ochronny-fmic-eu-10-mm-odcinek-1m-fmic-th-2140.html","note":["10 mm, odcinek 1 m; potwierdź średnicę wewnętrzną, temperaturę i dopasowanie.","10 mm, 1 m section; verify internal diameter, temperature and fitment."]},"sleeve30":{"sku":"FMIC-TH-2148","expectedName":"Termoizolacyjny rękaw ochronny FMIC.eu 30 mm odcinek 1m","materialUnitMm":1000,"source":"https://fmic.pl/389288-termoizolacyjny-rekaw-ochronny-fmic-eu-30-mm-odcinek-1m-fmic-th-2148.html","note":["30 mm, odcinek 1 m; potwierdź średnicę wewnętrzną, temperaturę i dopasowanie.","30 mm, 1 m section; verify internal diameter, temperature and fitment."]},"boostMac":{"sku":"SEN-EBCMAC","expectedName":"Elektrozawór EBC MAC Solenoid","note":["FMIC: 12 V, 31 Hz, maks. 8 bar, dwa króćce i filtr. Zweryfikuj obciążalność wyjścia ECU, schemat IWG/EWG i kalibrację.","FMIC: 12 V, 31 Hz, max 8 bar, two fittings and filter. Verify ECU output rating, IWG/EWG routing and calibration."],"source":"https://fmic.pl/538-elektrozawor-ebc-mac-solenoid-sen-ebcmac.html"}};
export const allCandidates:Record<string,BuildCandidate>={...auxiliaryCandidates,...thermalCandidates,...intakeCandidates,...candidates,...alternatives,...tuCandidates};
const optionKeys:Record<string,string[]>={rods:['rodsFmic'],intercooler:['intercoolerJr','intercoolerPsr','intercoolerBlack'],injectors:['injectors1500'],turbo:['turboVband','garrett3076'],gteRods:['gteRodsFmic'],gtePistons:['gtePistonsWiseco'],pump:['pumpAem','pumpWalbro'],wastegate45:['wastegateTial']};
export function partOptions(slot:PartsSlot):string[]{
 return [...(slot.candidate?[slot.candidate]:[]),...(slot.alternatives??(slot.candidate?optionKeys[slot.candidate]??[]:[])),...(slot.rpmOptions??[])];
}
export function selectedPart(slot:PartsSlot,selection:Record<string,string>):string|undefined{
 const options=partOptions(slot),choice=selection[slot.id];
 if(choice==='own')return undefined;
 return options.includes(choice)?choice:slot.defaultNone?undefined:options[0];
}

export type BuildIssue={id:string;slots:string[];level:'conflict'|'review';message:[string,string]};
export function assessBuild(slots:PartsSlot[],selection:Record<string,string>,version:string,range:number,fuel:Fuel,ethanolPercent?:number):BuildIssue[]{
 const get=(id:string)=>{const s=slots.find(x=>x.id===id);return s?selectedPart(s,selection):undefined};
 const issues:BuildIssue[]=[];
 const turbo=get('turbo'),manifold=get('manifold');
 if(turbo==='turboVband'&&(manifold==='geManifold'||manifold==='gteManifold'))issues.push({id:'flange',slots:['turbo','manifold'],level:'conflict',message:['Turbo V-Band nie pasuje bezpośrednio do kolektora T4 Twin Scroll. Zmień turbo lub dobierz inny kolektor.','V-band turbo does not directly fit a T4 twin-scroll manifold. Change the turbo or select a different manifold.']});
 else if((turbo==='turbo'||turbo==='turboVband')&&manifold)issues.push({id:'flange-review',slots:['turbo','manifold'],level:'review',message:['Katalogowo oba elementy mają T4 Twin Scroll; rzeczywiste mocowanie i układ wastegate wymagają potwierdzenia.','Both are catalogued as T4 twin-scroll; actual mount and wastegate layout still require confirmation.']});
 const missing=turboAssemblySlots(slots,selection);
 if(missing.length)issues.push({id:'turbo-incomplete',slots:['turbo',...missing.map(s=>s.id)],level:'conflict',message:['Wybrana turbosprężarka jest niekompletna. Brakuje potwierdzonego zestawu obudów. Zakup z MotoLab zablokowany do czasu doboru.','Selected turbo is incomplete. A confirmed housing kit is missing. MotoLab purchase blocked until the assembly is matched.']});
 const demand=estimateFuel(version,range,fuel,undefined,ethanolPercent),injector=get('injectors');
 const flow=injector==='universal1500'?1500:injector==='universal1200'?1200:injector==='tuInjectors'?750:injector==='injectors'?1200:injector==='injectors1500'?1500:injector==='geInjectors'?1000:undefined;
 if(flow&&demand&&flow<demand.injectorCc)issues.push({id:'injector-flow',slots:['injectors'],level:'conflict',message:['Nominalny przepływ wtryskiwacza jest niższy od szacowanego zapotrzebowania przy założeniach MotoLab. Dobierz wydajniejszy wariant.','Nominal injector flow is below estimated demand under MotoLab assumptions. Choose a higher-flow option.']});
 else if(flow)issues.push({id:'injector-review',slots:['injectors'],level:'review',message:['Przepływ katalogowy to nie potwierdzenie wydajności przy wybranym paliwie i ciśnieniu; sprawdź również geometrię i kalibrację.','Catalogue flow is not proof of performance with the selected fuel and pressure; geometry and calibration also require confirmation.']});
 const tu=slots.some(s=>s.dependency==='m52tu');
 if(tu){const spec=tuTurboSpec(turbo);issues.push({id:'tu-turbo-review',slots:['turbo','manifold','wastegate'],level:'review',message:spec?[`Plan flanszy ${spec.flangeLabel}, ${spec.wg==='internal'?'IWG — bez zewnętrznego WG':'EWG — jeden WG45'}. Potwierdź rzeczywiste mocowania, przepływ i stabilność boostu.`,`Planned ${spec.flangeLabel}, ${spec.wg==='internal'?'IWG — no external WG':'EWG — one WG45'}. Confirm actual fittings, flow and boost stability.`]:['Nieznana konfiguracja turbo — ustal flanszę i wastegate indywidualnie.','Unknown turbo configuration — confirm flange and wastegate independently.']});}
 const pump=get('pump');
 if(pump)issues.push({id:'pump-review',slots:['pump'],level:'review',message:['Wydajność wybranej pompy przy rzeczywistym ciśnieniu i napięciu nie została obliczona.','Selected pump flow at actual operating pressure and voltage has not been calculated.']});
 return issues;
}

const candidateBrands:Record<string,string>={vacuum4:'FMIC.Pro',vacuum6:'FMIC.Pro',sleeve15:'FMICEU',sleeve10:'FMICEU',sleeve30:'FMICEU',boostMac:'ECUMASTER',turboBlanketT25:'FMIC.Pro',turboBlanketT3:'FMIC.Pro',turboBlanketT4:'FMIC.Pro',turboBlanketInconelT3:'FMIC.Pro',downpipeWrap5:'FMIC.Pro',downpipeWrap10:'FMIC.Pro',intakeM50:'FMIC.Pro',intakeGE:'FMIC.Pro',intakeGTE:'FMIC.Pro',turbo2867T3:'Pulsar',turbo2867V:'Pulsar',turbo3076T3:'Pulsar',turbo3582T3:'Pulsar',turbo3582V:'Pulsar',turbo3584T3:'Pulsar',turbo3584V:'Pulsar',turbo7375V:'Pulsar',universal1200:'DeatschWerks',universal1500:'DeatschWerks',m54b25Rods:'ZRP',egtModule:'CANchecked',tuTurboT3:'Pulsar',tuTurboSmart:'Pulsar',tuTurboPremium:'Pulsar',tuPumpBudget:'DeatschWerks',tuPumpSmart:'DeatschWerks',tuInjectors:'DeatschWerks',tuRods:'K1',tuRodBearings:'ACL',tuMainBearings:'ACL',tuWastegate:'Turbosmart',
 injectors:'DeatschWerks',injectors1500:'DeatschWerks',geInjectors:'DeatschWerks',
 pistons:'Wiseco',gtePistons:'Manley',gtePistonsWiseco:'Wiseco',
 turbo:'Pulsar',turboVband:'Pulsar',garrett3076:'Garrett',ecu:'ECUMaster',pump:'DeatschWerks',pumpAem:'AEM',pumpWalbro:'Walbro / TI Automotive',
 intercooler:'FMIC.EU',intercoolerBlack:'FMIC.EU',intercoolerJr:'JRspec',intercoolerPsr:'Pulsar',
 rods:'ZRP',rodsFmic:'FMIC.Pro',gteRods:'ZRP',gteRodsFmic:'FMIC.Pro',
 geManifold:'FMIC.Pro',gteManifold:'FMIC.Pro',wastegate45:'Turbosmart',wastegateTial:'TiAL'
};
export function candidateBrand(key:string):string|undefined{return Object.prototype.hasOwnProperty.call(candidateBrands,key)?candidateBrands[key]:undefined}
export function brandsForOptions(keys:string[]):string[]{return [...new Set(keys.flatMap(k=>{const b=candidateBrand(k);return b?[b]:[]}))].sort((a,b)=>a.localeCompare(b))}

export function turboAssemblySlots(slots:PartsSlot[],selection:Record<string,string>):PartsSlot[]{
 const s=slots.find(x=>x.id==='turbo'),key=s?selectedPart(s,selection):undefined;
 const a=key?allCandidates[key]?.assembly:undefined;
 if(!a)return [];
 const out:PartsSlot[]=[];
 if(!a.hotIncluded)out.push({id:'turbo-hot',label:['Obudowa turbiny (strona gorąca)','Turbine housing (hot side)'],qty:1,conditional:false});
 if(!a.coldIncluded)out.push({id:'turbo-cold',label:['Obudowa sprężarki (strona zimna)','Compressor housing (cold side)'],qty:1,conditional:false});
 return out;
}

/** First curated compatibility scenario. Evidence is the exact current supplier
 * catalogue identity, not a validated dyno result or a fitment certificate. */
export const TU_TIERS=['budget','recommended','premium'] as const;
const tuTurboKeys=['tuTurboSmart','tuTurboT3','tuTurboPremium'];
const tuPumpKeys=['tuPumpBudget','tuPumpSmart'];
export function tuTurboSpec(key:string|undefined){
 if(key==='tuTurboT3')return {flange:'t3-single',flangeLabel:'T3',wg:'external',outlet:'3" V-Band'} as const;
 if(key==='tuTurboSmart')return {flange:'vband-single',flangeLabel:'V-Band',wg:'internal',outlet:'V-Band'} as const;
 if(key==='turbo2867T3')return {flange:'t3-single',flangeLabel:'T3',wg:'external',outlet:"3\" V-Band"} as const;
 if(key==='turbo2867V')return {flange:'vband-single',flangeLabel:'V-Band',wg:'external',outlet:"3\" V-Band"} as const;
 if(key==='turbo3076T3')return {flange:'t3-single',flangeLabel:'T3',wg:'external',outlet:"3\" V-Band"} as const;
 if(key==='turbo3582T3')return {flange:'t3-single',flangeLabel:'T3',wg:'external',outlet:"3\" V-Band"} as const;
 if(key==='turbo3582V')return {flange:'vband-single',flangeLabel:'V-Band',wg:'external',outlet:"3\" V-Band"} as const;
 if(key==='turbo3584T3')return {flange:'t3-single',flangeLabel:'T3',wg:'external',outlet:"3\" V-Band"} as const;
 if(key==='turbo3584V')return {flange:'vband-single',flangeLabel:'V-Band',wg:'external',outlet:"3\" V-Band"} as const;
 if(key==='turbo7375V')return {flange:'vband-single',flangeLabel:'V-Band',wg:'external',outlet:"3.5\" V-Band"} as const;
 if(key==='turboVband')return {flange:'vband-single',flangeLabel:'V-Band',wg:'external',outlet:'3" V-Band'} as const;
 if(key==='tuTurboPremium')return {flange:'vband-single',flangeLabel:'V-Band',wg:'external',outlet:'3" V-Band'} as const;
 return null;
}
function tuPilotSlots(slots:PartsSlot[],tier:string,profile:PilotProfile):PartsSlot[]{
 const budget=tier==='budget',premium=tier==='premium';
 const turbo=premium?'tuTurboPremium':'tuTurboSmart';
 const pump=budget?'tuPumpBudget':'tuPumpSmart';
 const notes:Record<string,[string,string]>={
 manifold:['Kolektor RPM Custom, flansza i WG wynikają z wyboru turbo. Nadwozie i fizyczne dopasowanie do potwierdzenia.','RPM Custom manifold, flange and WG derived from turbo. Chassis and physical fitment to confirm.'],
 wastegate:['Zależnie od turbo: IWG lub EWG.','Depends on turbo: IWG or EWG.'],
 pistons:profile.internals==='forged'||(premium&&profile.internals==='auto')?['Kute tłoki do indywidualnego doboru na podstawie geometrii M52B25TU i CR.','Select forged pistons individually for M52B25TU geometry and CR.']:['Seryjne tłoki tylko po kwalifikacji; pomiar geometrii i CR.','Stock pistons only after inspection; measure geometry and CR.'],
 rods:profile.rods==='m50b25nv'?['Korbowody M50B25 NV wymagają indywidualnej weryfikacji geometrii; nie zakładamy zamienności.','M50B25 NV rods need individual geometry review; no assumed interchangeability.']:profile.rods==='stock'?['Preferencja seryjnych korbowodów; kontrola stanu i momentu, możliwość koniecznego wzmocnienia.','Stock rod preference; inspect condition and torque loading, reinforcement may be needed.']:['Kute korbowody po potwierdzeniu geometrii i ilości w komplecie.','Forged rods after geometry and kit quantity confirmation.'],
 gasket:['Uszczelka / przekładka po pomiarze CR, płaskości i geometrii rozrządu.','Gasket/spacer after CR, flatness and timing geometry checks.'],
 fasteners:['M10 lub M12 wyłącznie po kwalifikacji bloku, doborze szpilek i procedury obróbki.','M10 or M12 only after block inspection, stud selection and machining review.'],
 'oil-cooler':['Wymagane sprawdzenie chłodzenia oleju na torze, termostatu i spadku ciśnienia.','Verify track oil cooling, thermostat and pressure drop.'],
 'oil-feed':['Zasilanie i spływ turbo według producenta; kontrola napędu pompy oleju i przegrody miski.','Turbo oil feed/drain per manufacturer; check pump drive and sump baffling.'],
 'fuel-lines':['Regulator 1:1, przewody, filtr i zabezpieczenie przed odpływem paliwa; na torze potwierdź wydajność.','1:1 regulator, lines, filter and fuel starvation protection; validate track flow.'],
 ecu:budget?['MS43: konwersja instalacji, pedał gazu, MAP, strojenie i dodatkowe zabezpieczenia; wycena indywidualna.','MS43: wiring conversion, pedal, MAP, calibration and additional protections; individual quote.']:['EMU Black: wiązka, DBW, oba VANOS i zabezpieczenia ciśnień oraz temperatur.','EMU Black: harness, DBW, both VANOS and pressure/temperature protections.'],
 clutch:['Dwutarczowe 240 mm po potwierdzeniu momentu, skrzyni, koła zamachowego i docisku.','240 mm twin disc after torque, gearbox, flywheel and pressure plate confirmation.'],
 downpipe:['Wylot zależny od turbo; dopasowanie do nadwozia i ochrona termiczna.','Outlet depends on turbo; chassis fitment and heat shielding.'],
 };
 const map:Record<string,string|undefined>={turbo,pump,injectors:'tuInjectors',intercooler:'intercooler',ecu:budget?undefined:'ecu',rods:profile.rods==='forged'||(profile.rods==='auto'&&!budget)?'tuRods':undefined};
 const out:PartsSlot[]=slots.map(s=>({...s,candidate:map[s.id],alternatives:s.id==='turbo'?tuTurboKeys.filter(k=>k!==turbo):s.id==='pump'?tuPumpKeys.filter(k=>k!==pump):s.id==='ecu'?(budget?['ecu']:[]):s.id==='rods'?(!map.rods&&profile.rods!=='m50b25nv'?['tuRods']:[]):s.id==='injectors'||s.id==='intercooler'?[]:undefined,defaultNone:(s.id==='ecu'&&budget)||(s.id==='rods'&&!map.rods),planNote:notes[s.id],...(s.id==='turbo'?{dependency:'m52tu' as const}:{}),...(s.id==='pump'?{qty:1}:{})}));
 const idx=out.findIndex(s=>s.id==='bearings');
 out.splice(idx,1,{id:'bearings-rod',label:['Panewki korbowodowe','Rod bearings'],qty:1,conditional:true,candidate:'tuRodBearings',alternatives:[],planNote:['Dobór po pomiarach.','Select after measurements.']},{id:'bearings-main',label:['Panewki główne','Main bearings'],qty:1,conditional:true,candidate:'tuMainBearings',alternatives:[],planNote:['Dobór po pomiarach.','Select after measurements.']});
 if(premium)out.push({id:'egt-expansion',label:['Moduł pomiarowy EGT i wiązka','EGT measurement module and harness'],qty:null,conditional:false,planNote:['7 punktów z termoparami w cenie skonfigurowanego kolektora. Moduł pomiarowy i wiązka osobno — dobierz co najmniej 7 kanałów, typ termopar i zgodność ECU/CAN.','Seven points with thermocouples included in the configured manifold price. Measurement module and wiring separately — confirm at least seven channels, thermocouple type and ECU/CAN compatibility.']});
 return out;
}
/** Recalculate dependencies from current turbo; never preserve an external WG
 * when switching to an internal actuator. Unknown/owned turbo remains unresolved. */
export function resolveTuDependencies(slots:PartsSlot[],selection:Record<string,string>):PartsSlot[]{
 const turboSlot=slots.find(s=>s.id==='turbo');
 const turboKey=turboSlot?selectedPart(turboSlot,selection):undefined;
 const ecuSlot=slots.find(s=>s.id==='ecu');
 const ecuKey=ecuSlot?selectedPart(ecuSlot,selection):undefined;
 const protectedSlots=slots.map(s=>{
  if(s.id==='turbo-insulation')return resolveBlanketFitment(s,turboKey);
  if(s.id==='boost-control'&&ecuKey==='ecu'&&tuTurboSpec(turboKey))return {...s,candidate:'boostMac',defaultNone:false,qty:1};
  if(s.id==='vacuum-lines')return {...s,alternatives:['vacuum4','vacuum6'],defaultNone:true};
  if(['heat-sleeve-oil','heat-sleeve-water','heat-sleeve-fuel','heat-sleeve-wiring','heat-sleeve-vacuum'].includes(s.id))return {...s,alternatives:['sleeve10','sleeve15','sleeve30'],defaultNone:true};
  return s;
 }).filter(s=>!(s.id==='heat-shield-wg'&&tuTurboSpec(turboKey)?.wg==='internal'));
 const turbo=protectedSlots.find(s=>s.dependency==='m52tu');if(!turbo)return protectedSlots;
 const spec=tuTurboSpec(selectedPart(turbo,selection));
 return protectedSlots.flatMap(s=>s.id==='wastegate'?(spec?.wg==='internal'?[]:[{...s,candidate:spec?.wg==='external'?'tuWastegate':undefined,alternatives:[],qty:spec?.wg==='external'?1:null}]):s.id==='downpipe'&&spec?[{...s,planNote:['Wylot turbo: '+spec.outlet+'; dopasuj do nadwozia.','Turbo outlet: '+spec.outlet+'; confirm chassis fitment.'] as [string,string]}]:[s]);
}
export function tuManifoldSpec(slots:PartsSlot[],selection:Record<string,string>,tier:string){
 const slot=slots.find(s=>s.dependency==='m52tu');const spec=slot?tuTurboSpec(selectedPart(slot,selection)):null;
 const engine=slot?.manifoldEngine??'m52';
 if(!spec||selection.manifold==='own'||engine==='2jz-gte')return null;
 return {...spec,sku:engine==='2jz-ge'?'RPM-00033':'RPM-00032',egtPoints:tier==='premium'?7:1,options:{...(engine==='2jz-ge'?{}:{'rpm-engine':engine}),'rpm-flange':spec.flange,'rpm-wg-diameter':spec.wg==='internal'?'internal':'wg-45','rpm-egt':tier==='premium'?'seven':'yes','rpm-thermal-insulation':tier==='premium'?'termshield':'none'} as Record<string,string>};
}
type ManifoldCatalog={id:number;sku:string;name:string;price:number;visible?:boolean;stockStatus?:string;configurable?:boolean;optionGroups?:{id:string;required?:boolean;options:{id:string;price:number}[]}[]};
export function tuManifoldEstimate(products:ManifoldCatalog[],spec:ReturnType<typeof tuManifoldSpec>){
 if(!spec)return null;
 const p=products.find(x=>x.sku===spec.sku&&x.visible===true&&x.configurable&&['available','order'].includes(x.stockStatus??'')&&Number.isFinite(x.price)&&x.price>0);
 if(!p||!p.optionGroups)return null;
 let price=p.price;
 for(const [id,value] of Object.entries(spec.options)){const o=p.optionGroups.find(g=>g.id===id)?.options.find(o=>o.id===value);if(!o||!Number.isFinite(o.price))return null;price+=o.price}
 // Missing chassis is intentional; only a provisional estimate, no cart line.
 if((spec.sku==='RPM-00032'&&!p.optionGroups.find(g=>g.id==='rpm-chassis')?.options.length)||p.optionGroups.some(g=>g.required&&g.id!=='rpm-chassis'&&!(g.id in spec.options)))return null;
 return {product:p,price:Math.round(price*100)/100};
}

/** Global planning layer: exact catalogue candidates, nominal power classes
 * and conservative band-end fuel demand; never claims verified fitment.
 * Existing no-profile calls retain historical curated behaviour. */
export function hasCatalogBuild(version:string,range:number,usage:string,tier:string,fuel:Fuel,profile?:PilotProfile){
 return !!profile&&fuel!=='unknown'&&!!powerRangesFor(version)[range]&&['street','drift','track'].includes(usage)&&['budget','recommended','premium'].includes(tier);
}
function globalBuildSlots(slots:PartsSlot[],version:string,range:number,usage:string,tier:string,fuel:Fuel,profile:PilotProfile):PartsSlot[]{
 const band=powerRangesFor(version)[range],max=band.max,budget=tier==='budget',premium=tier==='premium';
 const engine=(version.startsWith('m50')?'m50':version.startsWith('m52')?'m52':version.startsWith('m54')?'m54':version==='2jz-ge'?'2jz-ge':'2jz-gte') as NonNullable<PartsSlot['manifoldEngine']>;
 const turbos=max<=400?['tuTurboSmart','tuTurboT3','tuTurboPremium']:max<=480?['turbo2867T3','turbo2867V']:max<=650?['turbo3076T3','turboVband']:max<=800?['turbo3582T3','turbo3582V']:max<=930?['turbo3584T3','turbo3584V']:['turbo7375V'];
 const turbo=premium?turbos.at(-1)!:turbos[0];
 const demand=estimateFuel(version,range,fuel,undefined,profile.ethanolPercent);
 const pumpPool:[string,number][]=(fuel==='ethanol'||engine.startsWith('2jz')?[['pumpAem',340],['pumpWalbro',450]]:[['tuPumpBudget',255],['tuPumpSmart',320],['pump',415],['pumpWalbro',450]]);
 const pumps=pumpPool.filter(([,flow])=>!!demand&&flow>=demand.pumpLph).map(([k])=>k);
 const pump=budget?pumps[0]:pumps[Math.min(1,pumps.length-1)];
 const injectorPool:[string,number][]=[...(engine==='2jz-ge'?[['geInjectors',1000] as [string,number]]:engine.startsWith('m')?[['tuInjectors',750] as [string,number]]:[]),['universal1200',1200],['universal1500',1500]];
 const injectors=injectorPool.filter(([,flow])=>!!demand&&flow>=demand.injectorCc).map(([k])=>k);
 const rods=profile.rods==='forged'||profile.rods==='auto'&&!budget?({m52b25tu:'tuRods',m54b25:'m54b25Rods',m54b30:'rods','2jz-gte':'gteRods'} as Record<string,string>)[version]:undefined;
 const pistons=profile.internals==='forged'?({m54b30:'pistons','2jz-gte':'gtePistons'} as Record<string,string>)[version]:undefined;
 const notes:Record<string,[string,string]>={
 manifold:engine==='2jz-gte'?['Kolektor pod wybraną flanszę i EGT (Premium 6+1); brak potwierdzonego produktu RPM dla GTE. Wycena indywidualna.','Manifold for selected flange and EGT (Premium 6+1); no confirmed RPM GTE product. Individual quote.']:['Kolektor RPM Custom z EGT; flansza i WG wynikają z wyboru turbo.','RPM Custom manifold with EGT; flange and WG derived from turbo.'],
 turbo:['Wstępny dobór klasy turbo; mapa, reakcja, ciśnienie i przeciwciśnienie do potwierdzenia.','Preliminary turbo class; confirm map, response, pressure and backpressure.'],
 pump:pumps.length?['Przepływ nominalny nie jest przepływem pod boostem; sprawdź krzywą i paliwo.','Nominal flow is not flow under boost; verify curve and fuel.']:['Brak pojedynczej pompy o wystarczającej nominalnej wydajności — dobierz układ wielopompowy przy ciśnieniu roboczym.','No single pump in pool meets nominal demand — size multi-pump system at operating pressure.'],
 injectors:injectors.length?['Sprawdź listwę, długość, złącza, ciśnienie, paliwo i kalibrację.','Confirm rail, length, connectors, pressure, fuel and calibration.']:['Brak wystarczającego kompletu w puli; dobierz wtryski o większej wydajności.','No sufficiently rated set in pool; select higher-flow injectors.'],
 pistons:[profile.internals==='stock'?'Seryjne tłoki: pomiar stanu i CR, wzmocnienie po kwalifikacji.':'Dobór geometrii tłoków i CR po pomiarach.','Inspect piston geometry and CR; stock preference does not establish durability.'],
 rods:[profile.rods==='stock'?'Seryjne korbowody: sprawdź stan i obciążenie momentem.':profile.rods==='m50b25nv'?'M50B25 NV: nie zakładamy zamienności; pomiar geometrii.':'Kute korbowody: dobór wymiarów i nośności.','Verify rod geometry, load and clearances; stock or NV choice is not fitment approval.'],
 bearings:['Pomierz wał i blok, dobierz rozmiar i luz panewek.','Measure crank and block; select bearing size and clearance.'],
 ecu:budget&&engine.startsWith('m')?['Seryjny ECU lub standalone: potwierdź sterowanie boostem, MAP i zabezpieczenia; wycena indywidualna.','Stock ECU or standalone: confirm boost control, MAP and protections; individual quote.']:['Standalone: potwierdź obsługę silnika, wiązkę i zabezpieczenia.','Standalone: confirm engine support, harness and protections.'],
 'fuel-lines':['Dobierz przewody, regulator 1:1, filtr oraz zabezpieczenie przed odpływem paliwa.','Size lines, 1:1 regulator, filter and starvation protection.'],
 'oil-cooler':['Dobierz chłodnicę oleju i termostat do obciążenia.','Size oil cooler and thermostat for load.'],
 clutch:['Dobierz sprzęgło po określeniu momentu i skrzyni.','Select clutch after confirming torque and gearbox.']
 };
 const map:Record<string,string|undefined>={turbo,pump,injectors:injectors[0],intercooler:max<=650?'intercooler':undefined,ecu:budget&&engine.startsWith('m')?undefined:'ecu',rods,pistons};
 const out:PartsSlot[]=slots.map(s=>({...s,candidate:map[s.id],alternatives:s.id==='turbo'?turbos.filter(k=>k!==turbo):s.id==='pump'?pumps.filter(k=>k!==pump):s.id==='injectors'?injectors.slice(1):s.id==='ecu'&&!map.ecu?['ecu']:s.id==='intercooler'&&map.intercooler?['intercoolerJr','intercoolerPsr','intercoolerBlack']:[],defaultNone:!map[s.id],planNote:notes[s.id],...(s.id==='turbo'?{dependency:'m52tu' as const,manifoldEngine:engine}:{}),...(s.id==='pump'?{qty:1}:{})}));
 if(version==='m54b25'||version==='m54b30'){const idx=out.findIndex(s=>s.id==='bearings');out.splice(idx,1,{id:'bearings-rod',label:['Panewki korbowodowe','Rod bearings'],qty:1,conditional:true,candidate:'tuRodBearings',alternatives:[],planNote:notes.bearings},{id:'bearings-main',label:['Panewki główne','Main bearings'],qty:null,conditional:true,planNote:notes.bearings});}
 if(premium)out.push({id:'egt-expansion',label:['Moduł pomiarowy EGT','EGT measurement module'],qty:1,conditional:false,candidate:'egtModule',alternatives:[],planNote:['7 punktów EGT; wiązka i zgodność ECU/CAN do potwierdzenia.','Seven EGT points; confirm wiring and ECU/CAN compatibility.']});
 return out;
}

/** Existing manifold is a legitimate starting point, not a zero-cost
 * certified solution. Upgrades remain explicit alternatives until fitted. */
function intakeManifoldSlot(slot:PartsSlot,version:string,tier:string):PartsSlot{
 const earlyBmw=['m50b20','m50b25','m50b30-stroker','m52b20','m52b25','m52b28'].includes(version);
 const key=earlyBmw?'intakeM50':version==='2jz-ge'?'intakeGE':version==='2jz-gte'?'intakeGTE':undefined;
 const tu=version==='m52b25tu',m54=version.startsWith('m54');
 const stock=['Seryjny kolektor właściwy dla głowicy: wstępna propozycja ponownego użycia po próbie szczelności, ocenie ciśnienia, przepływu i mocowań.','Original manifold matching the head: provisional reuse after leak, pressure, flow and mounting checks.'];
 const custom=tu||m54?['Kolektor aluminiowy dopasowany do M52TU/M54 lub konwersja z adapterem — do indywidualnego doboru. Sprawdź DISA, przepustnicę, listwę, wtryski, podciśnienia i miejsce w nadwoziu.','Head-specific aluminium manifold or adapter conversion — individual selection. Check DISA, throttle, rail, injectors, vacuum ports and packaging.']:['Kolektor aluminiowy / plenum dobrane do głowicy i przepływu. Sprawdź rozkład powietrza, przepustnicę, listwę i wtryskiwacze.','Aluminium manifold/plenum matched to head and airflow. Verify distribution, throttle, rail and injectors.'];
 const planNote:[string,string]=tier==='premium'?[custom[0]+' '+stock[0],custom[1]+' '+stock[1]]:[stock[0]+' '+custom[0],stock[1]+' '+custom[1]];
 return {...slot,candidate:undefined,alternatives:key?[key]:[],defaultNone:true,planNote};
}

/** Optional thermal protection: offer sizes for manual verification, never infer
 * blanket fitment from flange or power tier. Downpipe wrap is distinct from
 * manifold TermShield and does not imply wrapping the turbine or CHRA. */
function thermalProtectionSlot(slot:PartsSlot,tier:string):PartsSlot{
 if(slot.id==='turbo-insulation')return {...slot,candidate:undefined,defaultNone:true,alternatives:[],rpmOptions:[],planNote:[tier==='budget'?'Opcjonalny koc strony gorącej. Dobierz po pomiarze muszli; sprawdź dopuszczenie przez producenta turbo.':'Zalecane rozważenie osłony strony gorącej, szczególnie przy długim obciążeniu. Dobierz po pomiarze muszli, nie po samej flanszy. Sprawdź zalecenia producenta oraz chłodzenie CHRA.','Consider a turbine housing blanket; confirm dimensions, manufacturer guidance, CHRA cooling and actuator clearance before selecting.']};
 if(slot.id==='exhaust-wrap')return {...slot,candidate:undefined,defaultNone:true,alternatives:['downpipeWrap5','downpipeWrap10'],planNote:['Opcjonalna izolacja downpipe: dobierz długość rolki do wymiarów i zakładu. Nie stosuj, jeżeli producent wydechu tego nie dopuszcza. TermShield kolektora pozostaje oddzielną opcją.','Optional downpipe insulation: size roll length for dimensions and overlap. Verify exhaust manufacturer permits wrapping. Manifold TermShield remains a separate option.']};
 return slot;
}

/** Exact catalog identity -> manufacturer-listed housing variant.
 * A reference is not an available catalog SKU. Never substitute a generic
 * blanket by flange label, nominal power, or turbo family alone. */
const blanketReferences:Readonly<Record<string,FitmentReference>>={
 '102128202':{
  turboSku:'102128202',label:'Pulsar Gen2 Turbo Blanket — PTX28/PTX30 IWG Housing: V-BAND Inlet',
  url:'https://pulsarturbo.com/product/pulsar-gen2-turbo-blanket-for-ptg-ptx-iwg-turbos/',checkedOn:'2026-11-27'
 }
};
export function resolveBlanketFitment(slot:PartsSlot,turboKey:string|undefined):PartsSlot{
 const sku=turboKey?allCandidates[turboKey]?.sku:undefined;
 const ref=sku?blanketReferences[sku]:undefined;
 const planNote:[string,string]=ref?[
  'Producent wymienia wybraną obudowę turbo jako zgodną z dedykowanym kocem. '+ref.label+'. Uwzględniono w projekcie — brak powiązanego SKU koca, do wyceny; potwierdź miejsce i swobodę pracy aktuatora.',
  'Manufacturer lists the selected turbo housing for this dedicated blanket. '+ref.label+'. Included in the project — no linked blanket SKU, quote required; verify clearance and actuator movement.'
 ]:[
  'Brak potwierdzonego dopasowania koca do wybranej obudowy turbo. Nie proponujemy przypadkowych koców T25/T3/T4. Wymagana dokumentacja producenta lub pomiar muszli i potwierdzenie dopasowania.',
  'No confirmed blanket fitment for the selected turbo housing. Generic T25/T3/T4 blankets are not offered. Manufacturer documentation or housing measurements and fitment confirmation required.'
 ];
 const candidate=ref?.catalogCandidate&&allCandidates[ref.catalogCandidate]?ref.catalogCandidate:undefined;
 return {...slot,candidate,alternatives:[],rpmOptions:[],defaultNone:!candidate,fitmentReference:ref,planNote:candidate?['Dedykowany koc uwzględniony automatycznie. Sprawdź miejsce montażu i ruch aktuatora.','Dedicated blanket included automatically. Check mounting clearance and actuator movement.']:planNote};
}

/** Complete planning checklist. Unresolved geometry/quantity stays visible
 * and unpriced; never invent a SKU or assume a component is necessary on every car. */
function completionSlots():PartsSlot[]{
 const item=(id:string,pl:string,en:string,plNote:string,enNote:string):PartsSlot=>({id,label:[pl,en],qty:null,conditional:true,defaultNone:true,alternatives:[],planNote:[plNote,enNote]});
 return [
 item('throttle','Przepustnica i adapter','Throttle body and adapter','Sprawdź sterowanie ECU, średnicę i zawartość zestawu kolektora ssącego.','Check ECU control, bore and intake manifold kit contents.'),
 item('boost-control','Elektrozawór sterowania boostem','Boost control solenoid','Dobierz do ECU, IWG/EWG i schematu pneumatycznego.','Match ECU, IWG/EWG and pneumatic layout.'),
 item('vacuum-lines','Przewody podciśnienia i złączki','Vacuum lines and fittings','Dobierz średnice, długości, temperaturę i ciśnienie.','Match diameter, length, temperature and pressure.'),
 item('turbo-support','Podpora turbo i mocowania','Turbo support and mounting','Sprawdź obciążenie kolektora, rozszerzalność i miejsce.','Check manifold loading, expansion and clearance.'),
 item('fuel-fittings','Złączki paliwowe AN','Fuel AN fittings','Dobierz do średnic, gwintów, paliwa i ciśnienia.','Match diameters, threads, fuel and pressure.'),
 item('fuel-surge','Surge tank / dodatkowe pompy','Surge tank / auxiliary pumps','Oceń odpływ paliwa przy przeciążeniach i wydajność przy ciśnieniu roboczym.','Assess fuel starvation under acceleration and flow at operating pressure.'),
 item('pump-wiring','Zasilanie elektryczne pompy','Fuel pump electrical supply','Dobierz przewody, bezpiecznik i przekaźnik do poboru prądu.','Size wiring, fuse and relay for current draw.'),
 item('thrust-bearings','Panewki oporowe','Thrust bearings','Sprawdź czy są w komplecie panewek głównych; dobierz po pomiarze.','Check main bearing kit contents and measure before selection.'),
 item('main-fasteners','Mocowanie podpór wału','Main bearing fasteners','Sprawdź wymagania bloku, procedurę montażu i osiowanie.','Check block requirements, assembly procedure and alignment.'),
 item('camshafts','Wałki rozrządu','Camshafts','Dobierz do charakterystyki i sprawdź kolizje oraz VANOS/VVT-i.','Match desired characteristics and verify clearance and VANOS/VVT-i.'),
 item('valve-train','Sprężyny, talerzyki i zawory','Valve springs, retainers and valves','Oceń stan, wznios, obroty i siły sprężyn.','Assess condition, lift, RPM and spring forces.'),
 item('timing-kit','Rozrząd i napinacze','Timing drive and tensioners','Dobierz do konkretnej wersji silnika; sprawdź stan.','Match exact engine variant and inspect condition.'),
 item('engine-seals','Uszczelki i uszczelniacze silnika','Engine gaskets and seals','Sprawdź zawartość kompletu i nie dubluj uszczelki głowicy.','Check kit contents and avoid duplicating head gasket.'),
 item('harmonic-damper','Tłumik drgań wału','Harmonic damper','Dobierz do wału, osprzętu i zakresu obrotów.','Match crank, accessories and RPM range.'),
 item('turbo-oil-restrictor','Restriktor oleju turbo','Turbo oil restrictor','Tylko zgodnie z wymaganiami producenta CHRA i ciśnieniem oleju. Sprawdź czy jest w zestawie turbo.','Only per CHRA manufacturer requirements and oil pressure. Check turbo kit contents.'),
 item('turbo-water','Przewody chłodzenia wodnego turbo','Turbo coolant lines','Tylko gdy dana CHRA wymaga chłodzenia wodą; dobierz gwinty i trasę.','Only when the CHRA requires water cooling; verify threads and routing.'),
 item('oil-thermostat','Termostat i adapter chłodnicy oleju','Oil cooler thermostat and adapter','Sprawdź czy są w zestawie chłodnicy; dobierz gwinty i przepływ.','Check cooler kit contents, threads and flow.'),
 item('oil-pump','Pompa oleju i jej napęd','Oil pump and drive','Oceń ciśnienie, stan pompy i specyficzne wymagania jednostki.','Assess pressure, pump condition and engine-specific requirements.'),
 item('sump-baffle','Przegrody miski olejowej','Sump baffling','Oceń przeciążenia oraz konstrukcję miski.','Assess acceleration loads and sump design.'),
 item('water-pump','Pompa wody i termostat','Water pump and thermostat','Dobierz do wersji silnika i oceń stan.','Match engine variant and inspect condition.'),
 item('fluids','Oleje i płyny eksploatacyjne','Oil and service fluids','Dobierz specyfikację i ilości do silnika i osprzętu.','Match specifications and quantities to engine and equipment.'),
 item('ignition-coils','Cewki zapłonowe i adaptery','Ignition coils and adapters','Sprawdź sterownik, dwell, mocowania i złącza.','Verify ECU, dwell, mounting and connectors.'),
 item('spark-plugs','Świece zapłonowe','Spark plugs','Dobierz gwint, długość, zakres cieplny i odstęp elektrod.','Match thread, reach, heat range and gap.'),
 item('wideband','Sonda szerokopasmowa lambda','Wideband lambda sensor','Sprawdź typ sondy, kontroler ECU i zawartość zestawu.','Check sensor type, ECU controller and kit contents.'),
 item('map-sensor','Pomiar MAP','MAP sensing','Sprawdź zakres i czy ECU ma wbudowany MAP.','Check pressure range and integrated ECU MAP.'),
 item('iat-sensor','Czujnik IAT','IAT sensor','Dobierz charakterystykę i miejsce za intercoolerem.','Match calibration and post-intercooler location.'),
 item('oil-pressure-sensor','Czujnik ciśnienia oleju','Oil pressure sensor','Dobierz zakres, gwint i wejście ECU.','Match range, thread and ECU input.'),
 item('oil-temp-sensor','Czujnik temperatury oleju','Oil temperature sensor','Dobierz charakterystykę, gwint i miejsce.','Match calibration, thread and location.'),
 item('fuel-pressure-sensor','Czujnik ciśnienia paliwa','Fuel pressure sensor','Dobierz zakres, paliwo, gwint i wejście ECU.','Match range, fuel, thread and ECU input.'),
 item('flex-sensor','Czujnik zawartości etanolu','Ethanol content sensor','Dla Flex Fuel lub pomiaru mieszanki; sprawdź zgodność ECU.','For Flex Fuel or blend monitoring; verify ECU support.'),
 item('egt-probe','Pomiar EGT i termopary','EGT sensing and thermocouples','Sprawdź liczbę punktów i termopary już zawarte w kolektorze; dobierz wejścia i wiązkę.','Check measurement points and probes included with manifold; match inputs and wiring.'),
 item('flywheel','Koło zamachowe','Flywheel','Dobierz do silnika, skrzyni i sprzęgła; sprawdź komplet.','Match engine, gearbox and clutch; check kit contents.'),
 item('exhaust-hardware','Złącza, uszczelki i mocowania wydechu','Exhaust joints, seals and mounts','Sprawdź flansze, średnice, obejmy i elementy w zestawie turbo/downpipe.','Check flanges, diameters, clamps and turbo/downpipe kit contents.'),
 item('exhaust-system','Pozostały układ wydechowy','Remaining exhaust system','Oceń średnicę, tłumiki, katalizator i wymagania użytkowania.','Assess diameter, mufflers, catalyst and use requirements.'),
 item('drivetrain-review','Skrzynia, wał, dyferencjał i półosie','Gearbox, shaft, differential and axles','Dobierz po ustaleniu nadwozia, skrzyni i docelowego momentu.','Select after chassis, gearbox and target torque are known.'),
 item('heat-sleeve-oil','Rękawy termiczne przewodów oleju','Oil line heat sleeves','Dobierz do średnicy zewnętrznej, długości i ekspozycji cieplnej.','Match outer diameter, length and heat exposure.'),
 item('heat-sleeve-water','Rękawy termiczne przewodów wodnych','Coolant line heat sleeves','Tylko dla przewodów narażonych na ciepło; sprawdź średnicę i temperaturę.','For exposed lines only; verify diameter and temperature.'),
 item('heat-sleeve-fuel','Rękawy termiczne przewodów paliwa','Fuel line heat sleeves','Najpierw bezpieczna trasa przewodów, następnie osłona do średnicy i temperatury.','Prioritize safe routing, then match sleeve diameter and temperature.'),
 item('heat-sleeve-wiring','Rękawy termiczne wiązki','Wiring heat sleeves','Dobierz do średnicy wiązki, długości, temperatury i trasy.','Match loom diameter, length, temperature and routing.'),
 item('heat-sleeve-vacuum','Osłony przewodów podciśnienia','Vacuum line heat sleeves','Dobierz do średnicy i temperatury; nie ograniczaj ruchu aktuatora.','Match diameter and temperature; do not obstruct actuator movement.'),
 item('heat-shield-wg','Osłona termiczna wastegate','Wastegate heat shield','Wyłącznie dla zewnętrznego WG, po potwierdzeniu modelu i chłodzenia membrany.','External WG only, confirm model and diaphragm cooling.'),
 item('heat-shield-ignition','Osłony zapłonu','Ignition heat shields','Oceń ekspozycję cieplną cewek i złączy.','Assess coil and connector heat exposure.'),
 item('heat-shield-mat','Mata / blacha termoizolacyjna','Heat shield mat / sheet','Dobierz powierzchnię, temperaturę, szczelinę powietrzną i montaż.','Match area, temperature, air gap and mounting.'),
 item('heat-reflective-tape','Taśma odbijająca ciepło','Heat reflective tape','Dobierz do chronionej powierzchni i temperatury, nie do bezpośredniego kontaktu z wydechem.','Match protected surface and temperature; not direct exhaust contact.'),
 item('heat-wrap-ties','Opaski nierdzewne do bandaży','Stainless heat wrap ties','Sprawdź ilość, długość i zawartość zestawu bandaża.','Check quantity, length and wrap kit contents.')
 ];
}
