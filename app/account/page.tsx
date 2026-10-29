'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
export default function Account(){
 const [user,setUser]=useState<{email:string|null;display_name:string|null}|null>(null);
 const [loading,setLoading]=useState(true);
 useEffect(()=>{fetch('/api/auth/me',{cache:'no-store'}).then(r=>r.json()).then(data=>setUser(data.user||null)).catch(()=>{}).finally(()=>setLoading(false))},[]);
 if(loading)return <main className="rpm-login-page"><div className="rpm-login-card">Ładowanie konta…</div></main>;
 if(!user)return <main className="rpm-login-page"><div className="rpm-login-card"><h1>Twoje konto</h1><p>Zaloguj się, aby zobaczyć swój profil.</p><Link href="/login">Przejdź do logowania</Link></div></main>;
 return <main className="rpm-login-page"><section className="rpm-login-card"><span className="eyebrow">RPM CUSTOM / KONTO</span><h1>Cześć, {user.display_name||'Kierowco'}!</h1><p>{user.email}</p><p>Twoje konto jest aktywne. Historia zamówień pojawi się po podłączeniu zamówień do konta.</p><Link href="/">Wróć do sklepu</Link><button className="outline" onClick={async()=>{await fetch('/api/auth/logout',{method:'POST'});window.location.assign('/')}}>Wyloguj się</button></section></main>;
}
