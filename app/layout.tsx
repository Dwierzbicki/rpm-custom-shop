import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={metadataBase:new URL('https://rpmcustom.pl'),title:{default:'RPM Custom – części tuningowe i motorsport',template:'%s | RPM Custom'},description:'Części samochodowe, tuning silników, turbosprężarki, układy dolotowe i wydechowe. RPM Custom.',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pl"><body>{children}</body></html>}
