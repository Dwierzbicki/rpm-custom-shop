import {getDbPool} from './db';
import {DEFAULT_COMMUNITY,validCommunity,type CommunitySettings} from './community-settings';
let setup:Promise<unknown>|undefined;
async function ensure(){if(!setup)setup=getDbPool().query("CREATE TABLE IF NOT EXISTS rpm_shop_settings (key TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())").catch(e=>{setup=undefined;throw e});await setup}
export async function getCommunity():Promise<CommunitySettings>{await ensure();const r=await getDbPool().query("SELECT data FROM rpm_shop_settings WHERE key='community'");return validCommunity(r.rows[0]?.data)?r.rows[0].data:DEFAULT_COMMUNITY}
export async function saveCommunity(value:CommunitySettings){if(!validCommunity(value))throw Error('Invalid settings');await ensure();await getDbPool().query("INSERT INTO rpm_shop_settings(key,data,updated_at) VALUES('community',$1::jsonb,NOW()) ON CONFLICT(key) DO UPDATE SET data=EXCLUDED.data,updated_at=NOW()",[JSON.stringify(value)])}
