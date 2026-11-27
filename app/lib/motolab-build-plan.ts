import {POWER_ENGINES,powerRangesFor} from './storefront-config';
export type Fuel='unknown'|'petrol'|'ethanol';
export type BuildTask={id:string;title:[string,string];detail:[string,string];level:'required'|'inspect'|'conditional';candidates?:string[]};
export type BuildCandidate={sku:string;assembly?:{kind:'complete'|'supercore'|'chra';hotIncluded:boolean;coldIncluded:boolean};expectedName:string;note:[string,string];source?:string;verification?:{checkedOn:string;scope:[string,string];url:string}};
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

export type PartsSlot={id:string;label:[string,string];qty:number|null;conditional:boolean;candidate?:string;rpmOptions?:string[];alternatives?:string[];defaultNone?:boolean;planNote?:[string,string];dependency?:'m52tu'};
export type PilotProfile={fuel:string;internals:string;rods:string;priority:string};
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
 slot('manifold','Kolektor turbo','Turbo manifold',1,version==='2jz-gte'),
 slot('wastegate','Wastegate','Wastegate',null,true),
 slot('bov','Zawór upustowy BOV','Blow-off valve',1,true),
 slot('intercooler','Intercooler','Intercooler',1,true,'intercooler'),
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
 return isTuPilot(version,range,usage,fuel,profile)?tuPilotSlots(result,tier,profile!):result;
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
export const tuCandidates:Record<string,BuildCandidate>={"tuTurboSmart":{"sku":"102128202","expectedName":"Turbosprężarka Pulsar PSR 2860 GEN 2 łożysko kulkowe podwójny V-Band 0.72 A/R IWG PSR Billet Actuator 7.4psi","note":["V-Band, A/R .72, IWG 7.4 PSI. Potwierdź średnice flansz i kontrolę doładowania.","V-band, .72 A/R, 7.4 PSI IWG. Confirm flange dimensions and boost control."],"assembly":{"kind":"complete","hotIncluded":true,"coldIncluded":true}},"tuTurboPremium":{"sku":"102128123","expectedName":"Turbosprężarka Pulsar PSR 2860 Gen2 475HP .82 2.5\" V-Band Wlot 3\" V-Band Wylot Stal Nierdzewna Łożyska kulkowe","note":["V-Band 2.5/3 cala, A/R .82, wariant EWG do potwierdzenia po dokumentacji. Sprawdź mapę i przeciwciśnienie.","2.5/3 inch V-band, .82 A/R, EWG layout to confirm against documentation. Check map and backpressure."],"assembly":{"kind":"complete","hotIncluded":true,"coldIncluded":true}},"tuPumpBudget":{"sku":"USA-DW-9-201-1031","expectedName":"Pompa paliwa DW200 DeatschWerks 255 lph BMW E36 E46 zestaw montażowy 9-1031","note":["255 l/h katalogowo; sprawdź przepływ przy ciśnieniu bazowym + boost, napięcie i nadwozie.","255 l/h catalogue rating; confirm flow at base pressure plus boost, voltage and chassis."]},"tuPumpSmart":{"sku":"USA-DW-9-301-1031","expectedName":"Pompa paliwa DW300 DeatschWerks 320 lph BMW E36 E46 zestaw montażowy 9-1031","note":["320 l/h wg feedu; potwierdź krzywą i montaż. Na torze sprawdź odpływ paliwa.","320 l/h per feed; verify flow curve and fitment. Check fuel starvation on track."]},"tuInjectors":{"sku":"USA-DW-17U-01-0750-6","expectedName":"Zestaw wtryskiwaczy DeatschWerks 750cc Porsche 911 996 H6 3.6L turbo 2001-05 BMW E46 3.2L M54/S54 2001-06 BMW 328ci 2000 330i/330xi 2001-05 330ci 2001","note":["Komplet 6 wg katalogu, 750 cc. Listwa M54B25: długość, złącza, ciśnienie i dane strojenia do potwierdzenia.","Catalogue set of six, 750 cc. Confirm M54B25 rail length, connectors, pressure and characterization."]},"tuRods":{"sku":"K1-305AX17140","expectedName":"Korbowody H-Beam Billet K1, BMW M50B25Tu / M52B25Tu Dł. 140 Pin 22mm","note":["Katalog wskazuje M52B25TU, 140 mm i sworzeń 22 mm. Potwierdź komplet, geometrię stopy, tłoka i luzy; nie zamieniaj automatycznie na korbowód 135 mm.","Catalogue lists M52B25TU, 140 mm and 22 mm pin. Confirm set quantity, big end, piston geometry and clearances; do not substitute a 135 mm rod."]},"tuRodBearings":{"sku":"ACL-6B1490H-STD","expectedName":"Panewki korbowodowe ACL Race STD BMW M20B20/23/25/27M50B20/25/27M52B20/25/28M54B25M54B22 M54B30","note":["STD to propozycja wyceny; pomierz czopy, korbowody i luzy. Nie zakładaj zgodności TU bez pomiarów.","STD is a pricing candidate; measure journals, rods and clearances. Confirm TU fitment."]},"tuMainBearings":{"sku":"ACL-7M1532H-STD","expectedName":"Panewki główne ACL Race STD BMW M20 / M50 / M52 / S52 / S54","note":["STD do wyceny, nie zamówienie przed pomiarami wału i bloku.","STD for estimation only; measure crankshaft and block before ordering."]},"tuWastegate":{"sku":"TS-0553-1001","expectedName":"Zawór wastegate Turbosmart TS-0553-1001 WG45 GenV Hypergate 45 7psi","note":["45 mm, 7 PSI wg katalogu. Potwierdź flanszę, przepływ i sprężynę; tylko dla EWG.","45 mm, 7 PSI per catalogue. Confirm flange, flow and spring; EWG only."]},"tuTurboT3":{"sku":"102128198","expectedName":"Turbosprężarka Pulsar PSR 2860 Gen2 475HP .82 T3 Wlot 3\" V-Band Wylot Stal Nierdzewna Łożyska kulkowe","note":["T3, A/R .82, wylot 3″ V-Band. Wariant EWG do potwierdzenia po dokumentacji; wymaga kolektora T3 i doboru zewnętrznego WG.","T3, .82 A/R, 3-inch V-band outlet. Confirm EWG configuration against documentation; requires T3 manifold and external WG selection."],"assembly":{"kind":"complete","hotIncluded":true,"coldIncluded":true}}};
export const allCandidates:Record<string,BuildCandidate>={...candidates,...alternatives,...tuCandidates};
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
 const flow=injector==='tuInjectors'?750:injector==='injectors'?1200:injector==='injectors1500'?1500:injector==='geInjectors'?1000:undefined;
 if(flow&&demand&&flow<demand.injectorCc)issues.push({id:'injector-flow',slots:['injectors'],level:'conflict',message:['Nominalny przepływ wtryskiwacza jest niższy od szacowanego zapotrzebowania przy założeniach MotoLab. Dobierz wydajniejszy wariant.','Nominal injector flow is below estimated demand under MotoLab assumptions. Choose a higher-flow option.']});
 else if(flow)issues.push({id:'injector-review',slots:['injectors'],level:'review',message:['Przepływ katalogowy to nie potwierdzenie wydajności przy wybranym paliwie i ciśnieniu; sprawdź również geometrię i kalibrację.','Catalogue flow is not proof of performance with the selected fuel and pressure; geometry and calibration also require confirmation.']});
 const tu=slots.some(s=>s.dependency==='m52tu');
 if(tu){const spec=tuTurboSpec(turbo);issues.push({id:'tu-turbo-review',slots:['turbo','manifold','wastegate'],level:'review',message:spec?[`Plan flanszy ${spec.flangeLabel}, ${spec.wg==='internal'?'IWG — bez zewnętrznego WG':'EWG — jeden WG45'}. Potwierdź rzeczywiste mocowania, przepływ i stabilność boostu.`,`Planned ${spec.flangeLabel}, ${spec.wg==='internal'?'IWG — no external WG':'EWG — one WG45'}. Confirm actual fittings, flow and boost stability.`]:['Nieznana konfiguracja turbo — ustal flanszę i wastegate indywidualnie.','Unknown turbo configuration — confirm flange and wastegate independently.']});}
 const pump=get('pump');
 if(pump)issues.push({id:'pump-review',slots:['pump'],level:'review',message:['Wydajność wybranej pompy przy rzeczywistym ciśnieniu i napięciu nie została obliczona.','Selected pump flow at actual operating pressure and voltage has not been calculated.']});
 return issues;
}

const candidateBrands:Record<string,string>={tuTurboT3:'Pulsar',tuTurboSmart:'Pulsar',tuTurboPremium:'Pulsar',tuPumpBudget:'DeatschWerks',tuPumpSmart:'DeatschWerks',tuInjectors:'DeatschWerks',tuRods:'K1',tuRodBearings:'ACL',tuMainBearings:'ACL',tuWastegate:'Turbosmart',
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
 const turbo=slots.find(s=>s.dependency==='m52tu');if(!turbo)return slots;
 const spec=tuTurboSpec(selectedPart(turbo,selection));
 return slots.flatMap(s=>s.id==='wastegate'?(spec?.wg==='internal'?[]:[{...s,candidate:spec?.wg==='external'?'tuWastegate':undefined,alternatives:[],qty:spec?.wg==='external'?1:null}]):s.id==='downpipe'&&spec?[{...s,planNote:['Wylot turbo: '+spec.outlet+'; dopasuj do nadwozia.','Turbo outlet: '+spec.outlet+'; confirm chassis fitment.'] as [string,string]}]:[s]);
}
export function tuManifoldSpec(slots:PartsSlot[],selection:Record<string,string>,tier:string){
 const slot=slots.find(s=>s.dependency==='m52tu');const spec=slot?tuTurboSpec(selectedPart(slot,selection)):null;
 if(!spec||selection.manifold==='own')return null;
 return {...spec,egtPoints:tier==='premium'?7:1,options:{'rpm-engine':'m52','rpm-flange':spec.flange,'rpm-wg-diameter':spec.wg==='internal'?'internal':'wg-45','rpm-egt':tier==='premium'?'seven':'yes','rpm-thermal-insulation':tier==='premium'?'termshield':'none'} as Record<string,string>};
}
type ManifoldCatalog={id:number;sku:string;name:string;price:number;visible?:boolean;stockStatus?:string;configurable?:boolean;optionGroups?:{id:string;required?:boolean;options:{id:string;price:number}[]}[]};
export function tuManifoldEstimate(products:ManifoldCatalog[],spec:ReturnType<typeof tuManifoldSpec>){
 if(!spec)return null;
 const p=products.find(x=>x.sku==='RPM-00032'&&x.visible===true&&x.configurable&&['available','order'].includes(x.stockStatus??'')&&Number.isFinite(x.price)&&x.price>0);
 if(!p||!p.optionGroups)return null;
 let price=p.price;
 for(const [id,value] of Object.entries(spec.options)){const o=p.optionGroups.find(g=>g.id===id)?.options.find(o=>o.id===value);if(!o||!Number.isFinite(o.price))return null;price+=o.price}
 // Missing chassis is intentional; only a provisional estimate, no cart line.
 if(!p.optionGroups.find(g=>g.id==='rpm-chassis')?.options.length||p.optionGroups.some(g=>g.required&&g.id!=='rpm-chassis'&&!(g.id in spec.options)))return null;
 return {product:p,price:Math.round(price*100)/100};
}


/** Shared recommendation layer. Existing curated scenarios remain the evidence base;
 * generic matches are provisional, and unsupported combinations stay unresolved. */
export function buildGlobalParts(version:string,range:number,usage:string,tier:string,fuel:Fuel,profile: PilotProfile & {ethanolPercent?:number},targetPower?:number|null):PartsSlot[]{
 const base=buildParts(version,range,usage,tier,fuel,profile);
 if(!base.length)return [];
 if(isTuPilot(version,range,usage,fuel,profile))return base;
 const band=powerRangesFor(version)[range],power=targetPower??band.max;
 if(!Number.isFinite(power)||power<band.min||power>band.max)return [];
 const premium=tier==='premium',budget=tier==='budget';
 const demand=estimateFuel(version,range,fuel,undefined,profile.ethanolPercent);
 // Turbo candidates from the existing catalogue only; no inferred high-power SKU.
 const low=power<=400,mid=power>400&&power<=550;
 const turboKeys=low?(premium?['tuTurboPremium','tuTurboT3','tuTurboSmart']:['tuTurboSmart','tuTurboT3','tuTurboPremium']):mid?(profile.priority==='response'||profile.priority==='cost'?['turboVband','turbo']:['turbo','turboVband']):[];
 const pumpKeys=demand?(fuel==='ethanol'?['pumpAem','pumpWalbro']:budget?['pumpAem','pump','pumpWalbro']:['pump','pumpWalbro','pumpAem']).filter(k=>(({pump:415,pumpAem:340,pumpWalbro:450} as Record<string,number>)[k]??0)>=demand.pumpLph):[];
 const notes:Record<string,[string,string]>={
  turbo:['Dobór wstępny: potwierdź mapę sprężarki, pojemność, A/R, przeciwciśnienie i docelowy moment. Brak przypisania oznacza indywidualny dobór.','Provisional selection: confirm compressor map, displacement, A/R, backpressure and torque target. No match means individual selection.'],
  manifold:premium?['Premium: 7× EGT (6 runnerów + 1 zbiorczy), TermShield. Cena tylko dla zgodnego kolektora z katalogu RPM.','Premium: 7 EGT points (6 runners + collector), TermShield. Price only for a matching RPM catalogue manifold.']:['Rekomendowany 1× EGT zbiorczy przed turbiną. Flansza i WG zależą od turbo.','Recommend one pre-turbine collector EGT. Flange and WG depend on turbo.'],
  pump:['Przepływ nominalny nie zastępuje krzywej pompy przy ciśnieniu roboczym; potwierdź paliwo, napięcie i montaż.','Nominal flow is not a pump curve at operating pressure; confirm fuel, voltage and installation.'],
  pistons:['Dobierz po pomiarze cylindra, geometrii i CR; preferencja seryjna nie potwierdza wytrzymałości.','Select after bore, geometry and CR measurements; stock preference does not establish strength.'],
  rods:['Dobierz wyłącznie do potwierdzonej wersji i geometrii; preferencja seryjna nie potwierdza wytrzymałości.','Match exact engine version and geometry; stock preference does not establish strength.'],
  ecu:budget?['Seryjne ECU lub konwersja do indywidualnej oceny; EMU Black jako alternatywa.','Stock ECU or conversion to assess individually; EMU Black as an alternative.']:['EMU Black: potwierdź wiązkę, czujniki, liczbę kanałów oraz obsługę przepustnicy i rozrządu.','EMU Black: verify harness, sensors, channel count, throttle and cam control.']
 };
 const out=base.map(s=>{
  const note=notes[s.id];
  const next:PartsSlot={...s,...(note?{planNote:note}:{})};
  if(s.id==='turbo')return {...next,candidate:turboKeys[0],alternatives:turboKeys.slice(1)};
  if(s.id==='manifold'||s.id==='wastegate')return {...next,candidate:undefined,alternatives:[]};
  if(s.id==='pump')return {...next,candidate:pumpKeys[0],alternatives:pumpKeys.slice(1),qty:1};
  if(s.id==='ecu')return {...next,candidate:budget?undefined:'ecu',alternatives:budget?['ecu']:[],defaultNone:budget};
  if(s.id==='intercooler')return {...next,candidate:power<=550?'intercooler':undefined,alternatives:power<=550?['intercoolerJr','intercoolerPsr','intercoolerBlack']:[]};
  if(s.id==='rods'||s.id==='pistons'){
   let candidate=s.candidate;
   if(s.id==='rods'&&['m50b25','m52b25','m52b28','m54b30'].includes(version))candidate='rods';
   if(s.id==='rods'&&version==='m52b25tu')candidate='tuRods';
   if(s.id==='rods'&&version==='2jz-gte')candidate='gteRods';
   if(s.id==='pistons'&&version==='m54b30')candidate='pistons';
   if(s.id==='pistons'&&version==='2jz-gte')candidate='gtePistons';
   const pref=s.id==='rods'?profile.rods:profile.internals;
   const defer=pref==='stock'||pref==='m50b25nv'||(pref==='auto'&&budget);
   return {...next,candidate:defer?undefined:candidate,alternatives:defer&&pref!=='m50b25nv'&&candidate?[candidate]:defer?[]:undefined,defaultNone:defer};
  }
  if(s.id==='injectors'){
   const keys=(version==='m54b30'?['injectors','injectors1500']:version==='2jz-ge'?['geInjectors']:[]).filter(k=>demand&&(({injectors:1200,injectors1500:1500,geInjectors:1000} as Record<string,number>)[k]??0)>=demand.injectorCc);
   return {...next,candidate:keys[0],alternatives:keys.slice(1),planNote:['Dobierz przepływ, listwę, złącza i dane kalibracyjne do dokładnej wersji.','Match flow, rail, connectors and calibration data to exact version.']};
  }
  return next;
 });
 if(premium)out.push({id:'egt-expansion',label:['Moduł pomiarowy EGT i wiązka','EGT measurement module and harness'],qty:null,conditional:false,planNote:['7 kanałów, termopary oraz zgodność ECU/CAN. Moduł i wiązka do osobnej wyceny; termopary w pakiecie tylko gdy potwierdza to katalog kolektora.','Seven channels, thermocouples and ECU/CAN compatibility. Module and harness separately quoted; probes included only when confirmed by manifold catalogue.']});
 return out;
}

export function globalTurboSpec(key:string|undefined){
 const tu=tuTurboSpec(key);
 if(tu)return {...tu,wgCount:tu.wg==='internal'?0:1};
 if(key==='turbo')return {flange:'t4-twin',flangeLabel:'T4 Twin Scroll',wg:'external',outlet:'3" V-Band',wgCount:2} as const;
 if(key==='turboVband')return {flange:'vband-single',flangeLabel:'V-Band',wg:'external',outlet:'3" V-Band',wgCount:1} as const;
 return null;
}
export function resolveGlobalDependencies(slots:PartsSlot[],selection:Record<string,string>,version:string):PartsSlot[]{
 if(slots.some(s=>s.dependency==='m52tu'))return resolveTuDependencies(slots,selection);
 const turbo=slots.find(s=>s.id==='turbo'),spec=turbo?globalTurboSpec(selectedPart(turbo,selection)):null;
 return slots.flatMap(s=>{
  if(s.id==='wastegate'){
   if(spec?.wg==='internal')return [];
   if(spec?.wgCount===1)return [{...s,candidate:'tuWastegate',alternatives:[],qty:1,planNote:['WG45: wstępny dobór; potwierdź średnicę i przepływ.','WG45: provisional selection; confirm diameter and flow.'] as [string,string]}];
   return [{...s,candidate:undefined,alternatives:[],qty:spec?.wgCount??null,planNote:spec?.wgCount===2?['Dwa zewnętrzne WG — rozmiar i komplet do indywidualnego doboru.','Two external wastegates — size and set to be selected individually.']:['Ustal typ i liczbę WG po wyborze turbo.','Confirm wastegate type and count after turbo selection.']} as PartsSlot];
  }
  if(s.id==='downpipe'&&spec)return [{...s,planNote:['Wylot turbo: '+spec.outlet+'; dopasuj do nadwozia.','Turbo outlet: '+spec.outlet+'; confirm chassis fitment.'] as [string,string]}];
  if(s.id==='manifold'&&version==='2jz-gte'&&spec?.flange==='t4-twin')return [{...s,candidate:'gteManifold',alternatives:[]}];
  return [s];
 });
}
export function globalManifoldSpec(slots:PartsSlot[],selection:Record<string,string>,tier:string,version:string){
 if(selection.manifold==='own')return null;
 const family=POWER_ENGINES.find(e=>e.versions.some(v=>v.id===version));
 const sku=family?.make==='BMW'?'RPM-00032':version==='2jz-ge'?'RPM-00033':null;
 const turbo=slots.find(s=>s.id==='turbo'),spec=turbo?globalTurboSpec(selectedPart(turbo,selection)):null;
 if(!sku||!spec||!family)return null;
 const options:Record<string,string>={'rpm-flange':spec.flange,'rpm-wg-diameter':spec.wg==='internal'?'internal':'wg-45','rpm-egt':tier==='premium'?'seven':'yes','rpm-thermal-insulation':tier==='premium'?'termshield':'none'};
 if(family.make==='BMW')options['rpm-engine']=family.id;
 return {...spec,sku,egtPoints:tier==='premium'?7:1,options};
}
export function globalManifoldEstimate(products:ManifoldCatalog[],spec:ReturnType<typeof globalManifoldSpec>){
 if(!spec)return null;
 const p=products.find(x=>x.sku===spec.sku&&x.visible===true&&x.configurable&&['available','order'].includes(x.stockStatus??'')&&Number.isFinite(x.price)&&x.price>0);
 if(!p?.optionGroups)return null;
 let price=p.price;
 for(const [id,value] of Object.entries(spec.options)){
  const option=p.optionGroups.find(g=>g.id===id)?.options.find(o=>o.id===value);
  if(!option||!Number.isFinite(option.price))return null;
  price+=option.price;
 }
 if(p.optionGroups.some(g=>g.required&&!(g.id in spec.options)&&!(g.id==='rpm-chassis'&&spec.sku==='RPM-00032'&&g.options.length)))return null;
 if(spec.sku==='RPM-00032'&&!p.optionGroups.find(g=>g.id==='rpm-chassis')?.options.length)return null;
 return {product:p,price:Math.round(price*100)/100};
}
