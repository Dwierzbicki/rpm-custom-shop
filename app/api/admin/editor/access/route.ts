import {NextResponse} from 'next/server';
export const dynamic='force-dynamic';
// Protected by the shared /api/admin/* session middleware.
export function GET(){return NextResponse.json({admin:true},{headers:{'Cache-Control':'no-store'}})}
