import type {Diagram,Localized} from './catalog';
export type Connection={id:string;title:Localized;diagramId?:string;positions?:string[]};
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
     "pl": "Kołki ustalające głowicę względem bloku",
     "en": "Head-to-block locating dowels"
    }
   },
   {
    "id": "core-plugs",
    "title": {
     "pl": "Zaślepki kanałów i otworów technologicznych",
     "en": "Gallery and core plugs"
    }
   },
   {
    "id": "oil-jets",
    "title": {
     "pl": "Dysze olejowe → blok",
     "en": "Oil jets → block"
    }
   },
   {
    "id": "rear-seal",
    "title": {
     "pl": "Tylna obudowa uszczelniacza → blok",
     "en": "Rear seal housing → block"
    }
   },
   {
    "id": "front-seal",
    "title": {
     "pl": "Przedni uszczelniacz / jego mocowanie",
     "en": "Front seal / retention"
    }
   },
   {
    "id": "drain-coolant",
    "title": {
     "pl": "Korek spustowy płynu w bloku",
     "en": "Block coolant drain"
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
    }
   },
   {
    "id": "crank-hub",
    "title": {
     "pl": "Piasta / centralna śruba wału",
     "en": "Crankshaft hub / central bolt"
    }
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
    }
   },
   {
    "id": "cam-exhaust",
    "title": {
     "pl": "Podpory wałka wydechowego",
     "en": "Exhaust camshaft bearing caps"
    }
   },
   {
    "id": "cam-carriers",
    "title": {
     "pl": "Elementy mocujące prowadnice / łoża wałków",
     "en": "Camshaft carrier fasteners"
    }
   },
   {
    "id": "valve-keepers",
    "title": {
     "pl": "Zamki zaworowe i zabezpieczenia",
     "en": "Valve keepers and retainers"
    }
   },
   {
    "id": "head-plugs",
    "title": {
     "pl": "Korki i zaślepki głowicy",
     "en": "Cylinder head plugs"
    }
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
     "pl": "Szpilki pokrywy → głowica",
     "en": "Valve cover studs → head"
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
    }
   },
   {
    "id": "main-guide",
    "title": {
     "pl": "Prowadnica łańcucha głównego",
     "en": "Primary chain guide"
    }
   },
   {
    "id": "tension-guide",
    "title": {
     "pl": "Szyna napinająca łańcuch główny",
     "en": "Primary tensioning rail"
    }
   },
   {
    "id": "main-tensioner",
    "title": {
     "pl": "Napinacz główny i uszczelnienie",
     "en": "Primary tensioner and seal"
    }
   },
   {
    "id": "secondary-guide",
    "title": {
     "pl": "Prowadnica łańcucha wałków",
     "en": "Secondary chain guide"
    }
   },
   {
    "id": "secondary-tensioner",
    "title": {
     "pl": "Napinacz łańcucha wałków",
     "en": "Secondary chain tensioner"
    }
   },
   {
    "id": "intake-sprocket",
    "title": {
     "pl": "Koło wałka ssącego i mocowanie",
     "en": "Intake cam sprocket and fastening"
    }
   },
   {
    "id": "exhaust-sprocket",
    "title": {
     "pl": "Koło wałka wydechowego i mocowanie",
     "en": "Exhaust cam sprocket and fastening"
    }
   },
   {
    "id": "vanos-head",
    "title": {
     "pl": "VANOS → głowica",
     "en": "VANOS → head"
    }
   },
   {
    "id": "vanos-pistons",
    "title": {
     "pl": "Tłoki VANOS / elementy zabezpieczające",
     "en": "VANOS pistons / retention"
    }
   },
   {
    "id": "vanos-cover",
    "title": {
     "pl": "Pokrywy i korki VANOS",
     "en": "VANOS covers and plugs"
    }
   },
   {
    "id": "vanos-solenoids",
    "title": {
     "pl": "Elektrozawory i uchwyty VANOS",
     "en": "VANOS solenoids and retainers"
    }
   },
   {
    "id": "vanos-line",
    "title": {
     "pl": "Przewód olejowy przy VANOS",
     "en": "Oil line at VANOS"
    }
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
    "diagramId": "11_9921",
    "positions": [
     "10",
     "11"
    ]
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
    }
   },
   {
    "id": "pump-housing",
    "title": {
     "pl": "Korpus / pokrywa pompy oleju",
     "en": "Oil pump body / cover"
    }
   },
   {
    "id": "pump-relief",
    "title": {
     "pl": "Zawór przelewowy / zabezpieczenia",
     "en": "Pressure relief valve / retention"
    }
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
    }
   },
   {
    "id": "pan-baffle",
    "title": {
     "pl": "Przegrody / osłony oleju",
     "en": "Oil baffles / shields"
    }
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
