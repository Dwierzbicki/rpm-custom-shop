import {getDbPool} from './db';
import {DEFAULT_GUIDE_SETTINGS,GuideSettings,validGuideSettings} from './power-guides';
export async function getGuideSettings():Promise<GuideSettings>{
 const db=getDbPool();await db.query("CREATE TABLE IF NOT EXISTS rpm_shop_settings (key TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
 const r=await db.query<{data:unknown}>("SELECT data FROM rpm_shop_settings WHERE key='power_guides'");
 return validGuideSettings(r.rows[0]?.data)?r.rows[0].data as GuideSettings:DEFAULT_GUIDE_SETTINGS;
}
export async function saveGuideSettings(value:GuideSettings){
 if(!validGuideSettings(value))throw Error('Invalid power guide settings');
 const db=getDbPool();await db.query("CREATE TABLE IF NOT EXISTS rpm_shop_settings (key TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
 await db.query("INSERT INTO rpm_shop_settings(key,data,updated_at) VALUES('power_guides',$1::jsonb,NOW()) ON CONFLICT(key) DO UPDATE SET data=EXCLUDED.data,updated_at=NOW()",[JSON.stringify(value)]);
}
