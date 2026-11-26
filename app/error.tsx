'use client';
import {useEffect,useState} from 'react';
import './styles/error-recovery.css';
export default function AppError({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
 const [english,setEnglish]=useState(false);
 useEffect(()=>{try{setEnglish(localStorage.getItem('rpm-language')==='en')}catch{}window.dispatchEvent(new CustomEvent('rpm:chunk-error',{detail:error}))},[error]);
 return <main className="rpm-error-recovery"><section aria-labelledby="rpm-error-title"><span className="eyebrow">RPM CUSTOM</span>
 <h1 id="rpm-error-title">{english?'The page could not load':'Nie udało się wczytać strony'}</h1>
 <p>{english?'The shop may have been updated or a temporary error occurred. Try loading this page again.':'Sklep mógł zostać zaktualizowany lub wystąpił chwilowy błąd. Spróbuj ponownie wczytać tę stronę.'}</p>
 <div className="rpm-error-actions"><button className="primary" type="button" onClick={()=>window.location.reload()}>{english?'Reload page':'Odśwież stronę'}</button><button className="outline" type="button" onClick={reset}>{english?'Try again':'Spróbuj ponownie'}</button><a className="outline" href="/sklep">{english?'Back to shop':'Wróć do sklepu'}</a></div></section></main>
}
