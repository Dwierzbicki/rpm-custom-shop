'use client';
import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import {Suspense} from 'react';
function LoginContent(){
 const params=useSearchParams();
 return <main className="rpm-login-page"><section className="rpm-login-card"><span className="eyebrow">RPM CUSTOM / TWOJE KONTO</span><h1>Witaj w RPM Custom</h1><p>Zaloguj się bez zakładania hasła. Do zakupów nie wymagamy konta.</p>
 <a className="primary rpm-customer-google" href="/api/auth/google">Kontynuuj z Google</a>
 <p className="rpm-login-note">Facebook i Apple dodamy w kolejnych etapach. Apple pokażemy tylko na urządzeniach Apple.</p>
 {params.get('error')&&<p role="alert" className="rpm-settings-error">Nie udało się zalogować przez Google. Spróbuj ponownie.</p>}
 <Link href="/">Wróć do sklepu i kupuj bez logowania</Link></section></main>
}
export default function Login(){return <Suspense fallback={<main className="rpm-login-page"/>}><LoginContent/></Suspense>}
