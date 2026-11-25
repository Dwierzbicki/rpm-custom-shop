'use client';
import {useEffect,useRef,useState} from 'react';
type Catalog={discount:number;stats:{total:number;available:number;mapped:number;updated_at:string|null};groups:{source_category:string;target_category:string[]|null;mapping_status:string;total:number}[];products:{sku:string;name:string;source_price:string;proposed_gross:string;available:boolean;mapping_status:string}[]};
export default function FmicPanel(){
 const [data,setData]=useState<Catalog|null>(null),[q,setQ]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const modal=useRef<HTMLDialogElement>(null);
 const [importState,setImportState]=useState<{phase:string;count:number;bytes:number;percent:number|null;error?:string}|null>(null);
 const importing=!!importState&&!['done','error'].includes(importState.phase);
 useEffect(()=>{if(importState&&!modal.current?.open)modal.current?.showModal()},[importState]);
 useEffect(()=>{if(!importing)return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue=''};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[importing]);
 const [paths,setPaths]=useState<string[][]>([]),[chosen,setChosen]=useState<Record<string,string>>({}),[reviewOnly,setReviewOnly]=useState(true),[categorySearch,setCategorySearch]=useState('');
 useEffect(()=>{fetch('/api/admin/suppliers/fmic/categories',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Błąd pobierania kategorii');return r.json()}).then(d=>setPaths(d.paths)).catch(e=>setError(String(e)))},[]);
 async function saveMapping(source:string,target:string[],total:number){
 if(!target.length||!window.confirm('Przypisać '+total+' produktów do '+target.join(' > ')+'?'))return;
 setBusy(true);setError('');setSaved('');
 try{const r=await fetch('/api/admin/suppliers/fmic/categories',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({source,target})});const d=await r.json();if(!r.ok)throw Error(d.error||'Błąd mapowania');await load(q);setSaved('Zapisano mapowanie '+d.updated+' produktów.')}
 catch(e){setError(String(e))}finally{setBusy(false)}
 }
 const [discount,setDiscount]=useState('5'),[saved,setSaved]=useState('');
 async function load(query=''){setBusy(true);setError('');try{const r=await fetch('/api/admin/suppliers/fmic?q='+encodeURIComponent(query),{cache:'no-store'});if(!r.ok)throw Error('Nie udało się pobrać katalogu FMIC');const next:Catalog=await r.json();setData(next);setDiscount(String(next.discount))}catch(e){setError(String(e))}finally{setBusy(false)}}
 async function saveDiscount(){
 const value=Number(discount);
 if(!discount.trim()||!Number.isFinite(value)||value<0||value>99.99)return;
 if(!window.confirm('Przeliczyć wszystkie proponowane ceny FMIC?'))return;
 setBusy(true);setError('');setSaved('');
 try{const r=await fetch('/api/admin/suppliers/fmic',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({discount:value})});const d=await r.json();if(!r.ok)throw Error(d.error||'Błąd zapisu');await load(q);setSaved('Zapisano regułę. Przeliczono '+d.updated+' cen.')}catch(e){setError(String(e))}finally{setBusy(false)}
 }
 async function runImport(){
 if(!window.confirm('Pobrać aktualny feed FMIC i zapisać produkty w katalogu dostawcy? Produkty nie zostaną opublikowane.'))return;
 setBusy(true);setError('');setSaved('');setImportState({phase:'download',count:0,bytes:0,percent:null});
 try{
 const r=await fetch('/api/admin/suppliers/fmic/import',{method:'POST'});
 if(!r.ok||!r.body)throw Error('Nie udało się uruchomić importu (HTTP '+r.status+')');
 const reader=r.body.getReader(),decoder=new TextDecoder();let buffer='',completed=false;
 function handle(line:string){if(!line.trim())return;const d=JSON.parse(line);
 if(d.type==='progress')setImportState({phase:d.phase,count:d.count,bytes:d.bytes,percent:d.percent});
 if(d.type==='error')throw Error(d.error);
 if(d.type==='done'){completed=true;setImportState(old=>({phase:'done',count:d.imported,bytes:old?.bytes??0,percent:100}));setSaved('Zakończono import: '+d.imported+' produktów. Opublikowano: 0.')}
 }
 try{for(;;){const {done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const lines=buffer.split('\n');buffer=lines.pop()??'';for(const line of lines)handle(line)}buffer+=decoder.decode();if(buffer.trim())handle(buffer)}
 finally{await reader.cancel().catch(()=>{});reader.releaseLock()}
 if(!completed)throw Error('Połączenie przerwane. Wynik importu nieznany — sprawdź katalog i logi.');
 await load(q);
 }catch(e){setImportState(old=>({phase:'error',count:old?.count??0,bytes:old?.bytes??0,percent:old?.percent??null,error:e instanceof Error?e.message:String(e)}));setSaved('');setError(String(e))}
 finally{setBusy(false)}
 }
 useEffect(()=>{void load()},[]);
 return <section className="rpm-settings-card"><h2>FMIC — katalog XML</h2><p>Ceny proponowane brutto: −{data?.discount??5}%, zaokrąglenie w górę do pełnego PLN. Katalog dostawcy nie jest jeszcze publikowany w sklepie.</p>
 <button type="button" className="primary" disabled={busy||!data} onClick={()=>void runImport()}>Pobierz XML i importuj produkty FMIC</button>
 {error&&<p role="alert">{error}</p>}{saved&&<p role="status">{saved}</p>}
 <div className="rpm-settings-grid"><label>Obniżka od ceny FMIC (%)<input type="number" min="0" max="99.99" step="0.01" value={discount} onChange={e=>setDiscount(e.target.value)}/></label><div><p>Przykład: 1000 zł → {discount.trim()&&Number(discount)>=0&&Number(discount)<100?Math.ceil(1000*(100-Number(discount))/100-1e-9):'—'} zł brutto</p><button className="primary" disabled={busy||!data||!discount.trim()||Number(discount)<0||Number(discount)>99.99||!Number.isFinite(Number(discount))} onClick={()=>void saveDiscount()}>Zapisz i przelicz ceny</button></div></div>
 {data&&<><div className="rpm-settings-grid"><div>Produkty: <strong>{data.stats.total.toLocaleString('pl-PL')}</strong></div><div>Dostępne: <strong>{data.stats.available.toLocaleString('pl-PL')}</strong></div><div>Dopasowane: <strong>{data.stats.mapped.toLocaleString('pl-PL')}</strong></div><div>Do weryfikacji: <strong>{(data.stats.total-data.stats.mapped).toLocaleString('pl-PL')}</strong></div></div><p>Ostatnia aktualizacja: {data.stats.updated_at?new Date(data.stats.updated_at).toLocaleString('pl-PL'):'Brak importu'}</p></>}
 <form onSubmit={e=>{e.preventDefault();void load(q)}}><label>SKU lub nazwa <input value={q} onChange={e=>setQ(e.target.value)} maxLength={120}/></label> <button className="primary" disabled={busy}>Szukaj / odśwież</button></form>
 {data&&<><h3>Produkty (maks. 50 wyników)</h3><div style={{overflowX:'auto'}}><table><thead><tr><th>SKU</th><th>Produkt</th><th>FMIC</th><th>RPM brutto</th><th>Dostępność</th></tr></thead><tbody>{data.products.map(p=><tr key={p.sku}><td>{p.sku}</td><td>{p.name}</td><td>{p.source_price} zł</td><td>{p.proposed_gross} zł</td><td>{p.available?'Dostępny':'Niedostępny'}</td></tr>)}</tbody></table></div>
 <h3>Mapowanie kategorii</h3>
 <div className="rpm-settings-grid"><label>Szukaj kategorii<input value={categorySearch} onChange={e=>setCategorySearch(e.target.value)}/></label><label><input type="checkbox" checked={reviewOnly} onChange={e=>setReviewOnly(e.target.checked)}/> Tylko do weryfikacji</label></div>
 {data.groups.filter(g=>(!reviewOnly||!['exact','normalized','manual'].includes(g.mapping_status))&&g.source_category.toLocaleLowerCase('pl-PL').includes(categorySearch.toLocaleLowerCase('pl-PL'))).map(g=>{
 const selected=chosen[g.source_category]??JSON.stringify(g.target_category??[]);
 const blocked=!g.source_category.trim()||['default category','produkty bez kategorii'].includes(g.source_category.trim().toLowerCase());
 return <div key={g.source_category+'|'+g.mapping_status} className="rpm-admin-settings-hub-link" style={{display:'grid',gap:10,marginBottom:12}}><span><strong>{g.source_category||'Brak kategorii'}</strong><small>{g.total.toLocaleString('pl-PL')} produktów · {({exact:'Dokładne',normalized:'Znormalizowane',manual:'Zatwierdzone ręcznie',parent_review:'Sugestia nadrzędna',unmapped:'Brak mapowania'} as Record<string,string>)[g.mapping_status]??g.mapping_status}</small></span>
 {blocked?<small>Grupa ogólna — wymaga przypisania pojedynczych produktów (funkcja w przygotowaniu).</small>:<><label>Docelowa kategoria<select disabled={busy} value={selected} onChange={e=>setChosen(old=>({...old,[g.source_category]:e.target.value}))}><option value="[]">Wybierz kategorię</option>{paths.map(p=><option key={JSON.stringify(p)} value={JSON.stringify(p)}>{p.join(' > ')}</option>)}</select></label><button className="primary" disabled={busy||selected==='[]'||!paths.length} onClick={()=>void saveMapping(g.source_category,JSON.parse(selected),g.total)}>Zatwierdź mapowanie</button></>}
 </div>})}</>}

 <dialog ref={modal} aria-labelledby="fmic-import-title" onCancel={e=>{e.preventDefault();if(!importing){modal.current?.close();setImportState(null)}}} style={{width:'min(520px,calc(100% - 32px))',border:'1px solid #444',borderRadius:16,padding:28,background:'#18191e',color:'#fff',boxShadow:'0 0 0 100vmax rgba(0,0,0,.7)',margin:'auto'}}>
 {importState&&<><span className="eyebrow">RPM CUSTOM / FMIC</span><h2 id="fmic-import-title">{importState.phase==='done'?'Import zakończony':importState.phase==='error'?'Błąd importu':'Import produktów FMIC'}</h2>
 <p role="status">{({download:'Łączenie i pobieranie XML…',processing:'Przetwarzanie produktów i zapis partii…',commit:'Zatwierdzanie transakcji PostgreSQL…',done:'Zapis zakończony. Produkty nie zostały opublikowane.',error:importState.error} as Record<string,string|undefined>)[importState.phase]}</p>
 <div style={{fontSize:32,fontWeight:700,color:'#e3385b'}}>{importState.percent===null?'…':importState.percent+'%'}</div>
 <progress aria-label="Postęp pobierania XML" max={100} value={importState.percent??undefined} style={{width:'100%',height:16,accentColor:'#e3385b'}}/>
 <p style={{fontSize:13,color:'#bbb'}}>{importState.percent===null?'Rozmiar feeda nieznany — trwa przetwarzanie.':'Procent pobranych danych XML; 100% dopiero po zatwierdzeniu importu.'}</p>
 <p>Przetworzone produkty: <strong>{importState.count.toLocaleString('pl-PL')}</strong></p><p>Pobrane dane: {(importState.bytes/1048576).toFixed(1)} MB</p>
 {importing?<p>Nie zamykaj ani nie odświeżaj strony.</p>:<button className="primary" onClick={()=>{modal.current?.close();setImportState(null)}}>Zamknij</button>}</>}
 </dialog>
 </section>
}
