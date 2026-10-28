import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'RPM Custom Shop — DEMO',description:'Prototyp sklepu RPM Custom. Dane demonstracyjne.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pl"><body>{children}</body></html>}
