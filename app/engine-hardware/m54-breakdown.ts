import type {Diagram,Localized} from './catalog';
export type Connection={id:string;title:Localized;diagramId?:string;positions?:string[];review?:{kind:'included'|'assembly-only'|'pending';note:Localized;source:string}};
export type ConnectionGroup={id:string;title:Localized;connections:Connection[]};
// Research/navigation checklist, not a claim of fitment or completeness.
// A mapped item is a reference example only; exact-hole evidence is still required.
// Unmapped items carry no OEM, quantity, or inferred installation data.
export const m54Breakdown:ConnectionGroup[]=[
 {
  "id": "block",
  "title": {
   "pl": "Blok i skrzynia korbowa",
   "en": "Block and crankcase"
  },
  "connections": [
   {
    "id": "main-caps",
    "title": {
     "pl": "Podpory wału → blok",
     "en": "Main bearing caps → block"
    },
    "diagramId": "11_9905",
    "positions": [
     "02"
    ]
   },
   {
    "id": "block-plugs",
    "title": {
     "pl": "Korki gwintowane bloku",
     "en": "Threaded block plugs"
    },
    "diagramId": "11_9905",
    "positions": [
     "03",
     "04",
     "11"
    ]
   },
   {
    "id": "block-plates",
    "title": {
     "pl": "Płyty wsporcze → blok",
     "en": "Support plates → block"
    },
    "diagramId": "11_9905",
    "positions": [
     "13"
    ]
   },
   {
    "id": "block-dowels",
    "title": {
     "pl": "Kołki ustalające bloku – wszystkie średnice",
     "en": "Block locating dowels – all diameters"
    },
    "diagramId": "11_9905",
    "positions": [
     "06",
     "07",
     "08"
    ]
   },
   {
    "id": "core-plugs",
    "title": {
     "pl": "Zaślepki kanałów i otworów technologicznych",
     "en": "Gallery and core plugs"
    },
    "diagramId": "11_9906",
    "positions": [
     "13"
    ]
   },
   {
    "id": "oil-jets",
    "title": {
     "pl": "Dysze olejowe → blok",
     "en": "Oil jets → block"
    },
    "diagramId": "11_9906",
    "positions": [
     "12"
    ]
   },
   {
    "id": "rear-seal",
    "title": {
     "pl": "Tylna obudowa uszczelniacza → blok",
     "en": "Rear seal housing → block"
    },
    "diagramId": "11_9906",
    "positions": [
     "03",
     "04"
    ]
   },
   {
    "id": "front-seal",
    "title": {
     "pl": "Przedni uszczelniacz / jego mocowanie",
     "en": "Front seal / retention"
    },
    "review": {
     "kind": "assembly-only",
     "note": {
      "pl": "Uszczelniacz 48×65×10 (11142249532); w tym schemacie brak odrębnej pozycji śruby do niego.",
      "en": "48×65×10 seal (11142249532); no separate fastener listed on this diagram."
     },
     "source": "https://www.realoem.com/bmw/enUS/showparts?diagId=11_9907&id=AV52-EUR-08-2001-E46-BMW-330i"
    }
   },
   {
    "id": "drain-coolant",
    "title": {
     "pl": "Korek spustowy płynu w bloku",
     "en": "Block coolant drain"
    },
    "review": {
     "kind": "pending",
     "note": {
      "pl": "W grupie korków bloku istnieje M14×1,5 (07119904539); tożsamość dokładnego otworu do potwierdzenia, nie dodano drugi raz.",
      "en": "M14×1.5 (07119904539) already listed in block plugs; exact opening pending, not duplicated."
     },
     "source": "https://www.realoem.com/bmw/enUS/showparts?diagId=11_9905&id=AV51-EUR-08-2001-E46-BMW-330i"
    }
   },
   {
    "id": "block-studs",
    "title": {
     "pl": "Szpilki bloku – pozycje 09 i 10",
     "en": "Block studs – positions 09 and 10"
    },
    "diagramId": "11_9905",
    "positions": [
     "09",
     "10"
    ]
   }
  ]
 },
 {
  "id": "crank",
  "title": {
   "pl": "Wał, tłoki i korbowody",
   "en": "Crankshaft, pistons and rods"
  },
  "connections": [
   {
    "id": "rod-bolts",
    "title": {
     "pl": "Stopa korbowodu → korbowód",
     "en": "Connecting rod cap → rod"
    },
    "diagramId": "11_9913",
    "positions": [
     "04"
    ]
   },
   {
    "id": "rod-dowels",
    "title": {
     "pl": "Ustalenie stopy korbowodu",
     "en": "Rod cap location"
    },
    "diagramId": "11_9913",
    "positions": [
     "03"
    ]
   },
   {
    "id": "pin-retainers",
    "title": {
     "pl": "Zabezpieczenia sworzni tłokowych",
     "en": "Piston pin retainers"
    },
    "diagramId": "ref-pistons-2002",
    "positions": [
     "02"
    ]
   },
   {
    "id": "crank-hub",
    "title": {
     "pl": "Piasta / centralna śruba wału",
     "en": "Crankshaft hub / central bolt"
    },
    "diagramId": "ref-crank-hub-2002",
    "positions": [
     "02",
     "03"
    ]
   }
  ]
 },
 {
  "id": "head",
  "title": {
   "pl": "Głowica i zawory",
   "en": "Cylinder head and valves"
  },
  "connections": [
   {
    "id": "head-bolts",
    "title": {
     "pl": "Głowica → blok: śruby główne i podkładki",
     "en": "Head → block: main bolts and washers"
    },
    "diagramId": "11_9908",
    "positions": [
     "05",
     "06"
    ]
   },
   {
    "id": "head-small",
    "title": {
     "pl": "Dodatkowe śruby zespołu głowicy",
     "en": "Additional cylinder head assembly bolts"
    },
    "diagramId": "11_9908",
    "positions": [
     "07",
     "08",
     "09"
    ]
   },
   {
    "id": "cam-intake",
    "title": {
     "pl": "Podpory wałka ssącego",
     "en": "Intake camshaft bearing caps"
    },
    "review": {
     "kind": "included",
     "note": {
      "pl": "Wspólna grupa łoży wałków zawiera ilości łączne. Podział na wałki do potwierdzenia.",
      "en": "Combined bearing ledge group contains totals. Allocation pending."
     },
     "source": "https://www.realoem.com/bmw/enUS/showparts?diagId=11_9925&id=ET55-EUR-01-2002-E46-BMW-330i"
    }
   },
   {
    "id": "cam-exhaust",
    "title": {
     "pl": "Podpory wałka wydechowego",
     "en": "Exhaust camshaft bearing caps"
    },
    "review": {
     "kind": "included",
     "note": {
      "pl": "Wspólna grupa łoży wałków zawiera ilości łączne. Podział na wałki do potwierdzenia.",
      "en": "Combined bearing ledge group contains totals. Allocation pending."
     },
     "source": "https://www.realoem.com/bmw/enUS/showparts?diagId=11_9925&id=ET55-EUR-01-2002-E46-BMW-330i"
    }
   },
   {
    "id": "cam-carriers",
    "title": {
     "pl": "Elementy mocujące prowadnice / łoża wałków",
     "en": "Camshaft carrier fasteners"
    },
    "diagramId": "11_9925",
    "positions": [
     "03",
     "04",
     "08",
     "09"
    ]
   },
   {
    "id": "valve-keepers",
    "title": {
     "pl": "Zamki zaworowe i zabezpieczenia",
     "en": "Valve keepers and retainers"
    },
    "diagramId": "ref-valve-keepers",
    "positions": [
     "09"
    ]
   },
   {
    "id": "head-plugs",
    "title": {
     "pl": "Korki i zaślepki głowicy",
     "en": "Cylinder head plugs"
    },
    "diagramId": "11_9925",
    "positions": [
     "17",
     "18",
     "19",
     "20",
     "21",
     "22",
     "23",
     "27"
    ]
   },
   {
    "id": "cover-nuts",
    "title": {
     "pl": "Pokrywa zaworów: grupy nakrętek i podkładki",
     "en": "Valve cover: nut groups and washers"
    },
    "diagramId": "11_9911",
    "positions": [
     "05",
     "06",
     "08"
    ]
   },
   {
    "id": "cover-studs",
    "title": {
     "pl": "Szpilki pokrywy zaworów",
     "en": "Valve cover studs"
    },
    "diagramId": "11_9925",
    "positions": [
     "10"
    ],
    "review": {
     "kind": "pending",
     "note": {
      "pl": "M7/M6×29,5: 14 szt. w głowicy. M6×30: X w schemacie pokrywy, ilość do pomiaru.",
      "en": "M7/M6×29.5: 14 in head diagram. M6×30: X in cover diagram; quantity to measure."
     },
     "source": "https://www.realoem.com/bmw/enUS/showparts?diagId=11_9911&id=AW51-EUR---E46-BMW-330i"
    }
   }
  ]
 },
 {
  "id": "timing",
  "title": {
   "pl": "Rozrząd i VANOS",
   "en": "Timing and VANOS"
  },
  "connections": [
   {
    "id": "lower-cover-short",
    "title": {
     "pl": "Dolna obudowa: śruby 32 mm",
     "en": "Lower cover: 32 mm bolts"
    },
    "diagramId": "11_9907",
    "positions": [
     "07"
    ]
   },
   {
    "id": "lower-cover-long",
    "title": {
     "pl": "Dolna obudowa: śruby 62 mm",
     "en": "Lower cover: 62 mm bolts"
    },
    "diagramId": "11_9907",
    "positions": [
     "08"
    ]
   },
   {
    "id": "lower-cover-location",
    "title": {
     "pl": "Dolna obudowa: szpilki i kołki",
     "en": "Lower cover: studs and dowels"
    },
    "diagramId": "11_9907",
    "positions": [
     "02",
     "03"
    ]
   },
   {
    "id": "cover-head",
    "title": {
     "pl": "Obudowa rozrządu → głowica",
     "en": "Timing cover → head"
    },
    "review": {
     "kind": "pending",
     "note": {
      "pl": "Sprawdzić rozdział istniejących śrub obudowy i głowicy. Brak nowej ilości.",
      "en": "Reconcile existing timing cover and head bolts. No added quantity."
     },
     "source": "https://www.realoem.com/bmw/enUS/showparts?diagId=11_9907&id=AV52-EUR-08-2001-E46-BMW-330i"
    }
   },
   {
    "id": "main-guide",
    "title": {
     "pl": "Prowadnica łańcucha głównego",
     "en": "Primary chain guide"
    },
    "diagramId": "11_9900",
    "positions": [
     "06"
    ]
   },
   {
    "id": "tension-guide",
    "title": {
     "pl": "Szyna napinająca łańcuch główny",
     "en": "Primary tensioning rail"
    },
    "diagramId": "11_9900",
    "positions": [
     "08"
    ]
   },
   {
    "id": "main-tensioner",
    "title": {
     "pl": "Napinacz główny i uszczelnienie",
     "en": "Primary tensioner and seal"
    },
    "diagramId": "11_9900",
    "positions": [
     "10"
    ]
   },
   {
    "id": "secondary-guide",
    "title": {
     "pl": "Górny rozrząd – śruby 40, 16 i 55 mm",
     "en": "Upper timing – 40, 16 and 55 mm bolts"
    },
    "diagramId": "11_9910",
    "positions": [
     "04",
     "05",
     "14"
    ]
   },
   {
    "id": "secondary-tensioner",
    "title": {
     "pl": "Górny rozrząd – śruby Torx M6×20",
     "en": "Upper timing – M6×20 Torx bolts"
    },
    "diagramId": "11_9910",
    "positions": [
     "06"
    ]
   },
   {
    "id": "intake-sprocket",
    "title": {
     "pl": "Koło wałka ssącego i mocowanie",
     "en": "Intake cam sprocket and fastening"
    },
    "diagramId": "11_9910",
    "positions": [
     "09",
     "13"
    ]
   },
   {
    "id": "exhaust-sprocket",
    "title": {
     "pl": "Koło wałka wydechowego i mocowanie",
     "en": "Exhaust cam sprocket and fastening"
    },
    "diagramId": "11_9916",
    "positions": [
     "02",
     "05",
     "10"
    ]
   },
   {
    "id": "vanos-head",
    "title": {
     "pl": "VANOS → głowica",
     "en": "VANOS → head"
    },
    "diagramId": "11_9909",
    "positions": [
     "08",
     "09"
    ]
   },
   {
    "id": "vanos-pistons",
    "title": {
     "pl": "Tłoki VANOS / elementy zabezpieczające",
     "en": "VANOS pistons / retention"
    },
    "review": {
     "kind": "assembly-only",
     "note": {
      "pl": "Tłoki VANOS występują jako części; schemat nie rozpisuje ich wewnętrznych śrub. Nie oznacza to potwierdzenia braku śrub.",
      "en": "VANOS pistons listed as parts; their internal bolts are not listed. This is not proof no bolts exist."
     },
     "source": "https://www.realoem.com/bmw/enUS/showparts?diagId=11_9909&id=ET56-EUR-04_2001_E46_BMW_330i"
    }
   },
   {
    "id": "vanos-cover",
    "title": {
     "pl": "Pokrywy i korki VANOS",
     "en": "VANOS covers and plugs"
    },
    "diagramId": "11_9909",
    "positions": [
     "10",
     "11"
    ]
   },
   {
    "id": "vanos-solenoids",
    "title": {
     "pl": "Szpilka i nakrętka uchwytu VANOS – przypisanie do weryfikacji",
     "en": "VANOS holder stud and nut – allocation pending"
    },
    "diagramId": "11_9909",
    "positions": [
     "13",
     "14"
    ]
   },
   {
    "id": "vanos-line",
    "title": {
     "pl": "Przewód olejowy przy VANOS",
     "en": "Oil line at VANOS"
    },
    "diagramId": "11_9909",
    "positions": [
     "16",
     "17"
    ]
   },
   {
    "id": "crank-drive-key",
    "title": {
     "pl": "Wpusty ustalające napęd na wale",
     "en": "Crankshaft drive locating keys"
    },
    "diagramId": "11_9900",
    "positions": [
     "03"
    ]
   }
  ]
 },
 {
  "id": "oil",
  "title": {
   "pl": "Smarowanie i miska olejowa",
   "en": "Lubrication and oil pan"
  },
  "connections": [
   {
    "id": "filter-short",
    "title": {
     "pl": "Podstawa filtra: śruby 55 mm",
     "en": "Filter housing: 55 mm bolts"
    },
    "diagramId": "11_9921",
    "positions": [
     "07"
    ]
   },
   {
    "id": "filter-medium",
    "title": {
     "pl": "Podstawa filtra: śruby 70 mm",
     "en": "Filter housing: 70 mm bolts"
    },
    "diagramId": "11_9921",
    "positions": [
     "08"
    ]
   },
   {
    "id": "filter-long",
    "title": {
     "pl": "Podstawa filtra: śruba 100 mm",
     "en": "Filter housing: 100 mm bolt"
    },
    "diagramId": "11_9921",
    "positions": [
     "09"
    ]
   },
   {
    "id": "filter-line",
    "title": {
     "pl": "Przewód olejowy przy podstawie filtra",
     "en": "Oil line at filter housing"
    },
    "review": {
     "kind": "included",
     "note": {
      "pl": "Ujęto cały przewód w grupie VANOS (2 śruby, 4 pierścienie); nie doliczać końca przy filtrze.",
      "en": "Entire line listed under VANOS (2 bolts, 4 rings); do not add the filter end."
     },
     "source": "https://www.realoem.com/bmw/enUS/showparts?diagId=11_9909&id=ET56-EUR-04_2001_E46_BMW_330i"
    }
   },
   {
    "id": "pump-08",
    "title": {
     "pl": "Pompa / smok: pozycja OEM 08",
     "en": "Pump / pickup: OEM position 08"
    },
    "diagramId": "11_9953",
    "positions": [
     "08"
    ]
   },
   {
    "id": "pump-09",
    "title": {
     "pl": "Pompa: grupa śrub 55 mm",
     "en": "Pump: 55 mm bolt group"
    },
    "diagramId": "11_9953",
    "positions": [
     "09"
    ]
   },
   {
    "id": "pump-10",
    "title": {
     "pl": "Pompa: grupa śrub 16 mm",
     "en": "Pump: 16 mm bolt group"
    },
    "diagramId": "11_9953",
    "positions": [
     "10"
    ]
   },
   {
    "id": "pump-nut",
    "title": {
     "pl": "Koło napędowe pompy → wałek",
     "en": "Pump sprocket → shaft"
    },
    "diagramId": "11_9953",
    "positions": [
     "11"
    ]
   },
   {
    "id": "pump-pickup",
    "title": {
     "pl": "Smok → pompa: osobna weryfikacja połączenia",
     "en": "Pickup → pump: separate joint verification"
    },
    "review": {
     "kind": "pending",
     "note": {
      "pl": "Schemat pompy ma już pozycje 08–10; osobne przypisanie do smoka niepotwierdzone.",
      "en": "Pump diagram already lists positions 08–10; pickup allocation not confirmed."
     },
     "source": "https://www.realoem.com/bmw/enUS/showparts?diagId=11_9953&id=AN56-EUR-09-2001-E46-BMW-330i"
    }
   },
   {
    "id": "pump-housing",
    "title": {
     "pl": "Korpus / pokrywa pompy oleju",
     "en": "Oil pump body / cover"
    },
    "diagramId": "11_9953",
    "positions": [
     "17"
    ],
    "review": {
     "kind": "pending",
     "note": {
      "pl": "Kołek ma numer OEM; odrębne śruby pokrywy pompy nie są rozpisane. Zweryfikować fizycznie.",
      "en": "Dowel has OEM number; separate pump cover bolts not listed. Physical verification needed."
     },
     "source": "https://www.realoem.com/bmw/enUS/showparts?diagId=11_9953&id=AN56-EUR-09-2001-E46-BMW-330i"
    }
   },
   {
    "id": "pump-relief",
    "title": {
     "pl": "Zawór przelewowy / zabezpieczenia",
     "en": "Pressure relief valve / retention"
    },
    "diagramId": "11_9953",
    "positions": [
     "16",
     "15"
    ]
   },
   {
    "id": "pan-studs",
    "title": {
     "pl": "Miska: szpilki zespołu",
     "en": "Oil pan: assembly studs"
    },
    "diagramId": "11_9918",
    "positions": [
     "02"
    ]
   },
   {
    "id": "pan-drain",
    "title": {
     "pl": "Korek spustowy i podkładka",
     "en": "Drain plug and washer"
    },
    "diagramId": "11_9918",
    "positions": [
     "03",
     "04"
    ]
   },
   {
    "id": "pan-block",
    "title": {
     "pl": "Miska: główna grupa śrub, poz. 05",
     "en": "Oil pan: main bolt group, position 05"
    },
    "diagramId": "11_9918",
    "positions": [
     "05"
    ]
   },
   {
    "id": "pan-cover",
    "title": {
     "pl": "Miska → obudowa rozrządu",
     "en": "Oil pan → timing cover"
    },
    "review": {
     "kind": "pending",
     "note": {
      "pl": "Śruby miski 64 i 100 mm istnieją w katalogu. Nie doliczać nowych bez ustalenia otworów.",
      "en": "64 and 100 mm oil pan bolts already listed. No additions until holes are identified."
     },
     "source": "https://www.realoem.com/bmw/enUS/showparts?diagId=11_9918&id=AN56-EUR-03_2000_E46_BMW-330i"
    }
   },
   {
    "id": "pan-baffle",
    "title": {
     "pl": "Przegrody / osłony oleju",
     "en": "Oil baffles / shields"
    },
    "diagramId": "11_9906",
    "positions": [
     "22",
     "23"
    ]
   },
   {
    "id": "pan-long-64",
    "title": {
     "pl": "Miska: śruby 64 mm",
     "en": "Oil pan: 64 mm bolts"
    },
    "diagramId": "11_9918",
    "positions": [
     "06"
    ]
   },
   {
    "id": "pan-long-100",
    "title": {
     "pl": "Miska: śruby 100 mm",
     "en": "Oil pan: 100 mm bolts"
    },
    "diagramId": "11_9918",
    "positions": [
     "07"
    ]
   }
  ]
 }
];
export const allConnections=m54Breakdown.flatMap(g=>g.connections);
export function connectionRows(c:Connection,diagrams:Diagram[]){
 const d=diagrams.find(d=>d.id===c.diagramId&&d.engine==='M54B30');
 return d?.usages.filter(u=>c.positions?.includes(u.position))??[];
}
export function connectionForPosition(diagramId:string,position:string){
 return allConnections.find(c=>c.diagramId===diagramId&&c.positions?.includes(position));
}

/** Group view preserves each diagram/position identity; no summing repeated OEM numbers. */
export function groupSections(group:ConnectionGroup,diagrams:Diagram[]){
 return group.connections.map(connection=>({connection,diagram:diagrams.find(d=>d.id===connection.diagramId&&d.engine==='M54B30'),rows:connectionRows(connection,diagrams)}));
}

export const isIncludedElsewhere=(c:Connection)=>c.review?.kind==='included';
export const needsReference=(c:Connection,diagrams:Diagram[])=>!connectionRows(c,diagrams).length&&!isIncludedElsewhere(c);
