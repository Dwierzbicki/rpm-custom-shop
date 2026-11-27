'use client';
import {useEffect,useState} from 'react';
import {useUnsavedChanges} from '../power-guides/useUnsavedChanges';
import Link from 'next/link';
import {LogoLaser} from '../../../components/storefront/LogoLaser';
export default function AppearancePage(){
 const [baseline,setBaseline]=useState<boolean|null>(null);
 const [enabled,setEnabled]=useState(false),[loaded,setLoaded]=useState(false),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('');
 useUnsavedChanges(baseline!==null&&baseline!==enabled);
 useEffect(()=>{
  const c=new AbortController();
  fetch('/api/admin/settings/appearance',{cache:'no-store',signal:c.signal}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||'Błąd pobierania');if(!c.signal.aborted){setEnabled(d.appearance.logoLaserEnabled===true);setBaseline(d.appearance.logoLaserEnabled===true);setLoaded(true)}}).catch(e=>{if(!c.signal.aborted)setError(e.message)}).finally(()=>{if(!c.signal.aborted)setLoading(false)});
  return()=>c.abort();
 },[]);
 async function save(e:React.FormEvent){
  e.preventDefault();if(!loaded||saving)return;
  setSaving(true);setError('');setSuccess('');
  try{
   const r=await fetch('/api/admin/settings/appearance',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({appearance:{logoLaserEnabled:enabled}})});
   const d=await r.json();if(!r.ok)throw Error(d.error||'Błąd zapisu');
   setEnabled(d.appearance.logoLaserEnabled===true);setBaseline(d.appearance.logoLaserEnabled===true);setSuccess('Zapisano. Zmiana będzie widoczna po odświeżeniu sklepu.');
  }catch(e){setError(e instanceof Error?e.message:'Błąd zapisu')}finally{setSaving(false)}
 }
 return <main className="admin-page rpm-settings-page"><div className="admin-top"><div><Link href="/admin/settings" className="admin-back">← Wszystkie ustawienia</Link><span className="eyebrow">RPM CUSTOM / USTAWIENIA</span><h1>Wygląd sklepu</h1><p>Zarządzaj efektami wizualnymi sklepu bez ponownego wdrożenia.</p></div></div>
 {loading?<p>Ładowanie...</p>:<form className="rpm-settings-card" onSubmit={save}><h2>Logo w nagłówku — Red Laser</h2><p>Czerwony laser, rozgrzany ślad i iskry na obrysie logo.</p><div className="rpm-settings-toggles"><label><input type="checkbox" role="switch" checked={enabled} disabled={!loaded||saving} onChange={e=>{setEnabled(e.target.checked);setSuccess('')}}/> Animacja lasera: {enabled?'włączona':'wyłączona'}</label></div><div className="rpm-laser-admin-preview"><img src="/optimized/logo.webp" width={1024} height={350} alt="Podgląd logo RPM Custom"/>{enabled&&<LogoLaser/>}</div><p className="rpm-shipping-note">Podgląd na żywo. Cykl co 10 sekund, przejazd 4,5 sekundy. Na komputerze animacja uruchamia się również po najechaniu na logo. Ustawienia ograniczonego ruchu są respektowane.</p><button className="primary" disabled={!loaded||saving}>{saving?'Zapisywanie...':'Zapisz ustawienia'}</button>{success&&<p role="status" className="rpm-settings-success">{success}</p>}{error&&<p role="alert" className="rpm-settings-error">{error}</p>}</form>}
 </main>;
}
