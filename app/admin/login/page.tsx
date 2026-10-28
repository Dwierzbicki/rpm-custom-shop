'use client';
import {useState} from 'react';
export default function AdminLogin(){
 const [username,setUsername]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{const res=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});const data=await res.json();if(!res.ok)throw Error(data.error||'Błąd logowania');window.location.assign('/admin/overview')}catch(e){setError(e instanceof Error?e.message:'Błąd logowania')}finally{setBusy(false)}}
 return <main className="rpm-login-page"><form className="rpm-login-card" onSubmit={submit}><span className="eyebrow">RPM CUSTOM / BACK OFFICE</span><h1>Logowanie administratora</h1><p>Zaloguj się, aby zarządzać sklepem.</p><label>Login<input autoComplete="username" required value={username} onChange={e=>setUsername(e.target.value)}/></label><label>Hasło<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p role="alert" className="rpm-settings-error">{error}</p>}<button className="primary" disabled={busy}>{busy?'Logowanie...':'Zaloguj się'}</button></form></main>;
}
