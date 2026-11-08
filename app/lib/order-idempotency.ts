import {createHash} from 'node:crypto';

/** A browser-generated UUID v4, scoped to one order submission attempt. */
export function isValidIdempotencyKey(value:unknown):value is string{
 return typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/** Deliberately excludes server-side prices, so a retry can replay the original receipt. */
export function orderRequestHash(payload:unknown):string{
 return createHash('sha256').update(JSON.stringify(payload),'utf8').digest('hex');
}
