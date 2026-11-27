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

/** Atomic compare-and-swap for the per-record admin editor. Legacy callers remain compatible. */
export async function saveGuideSettingsIfCurrent(value:GuideSettings,expected:GuideSettings){
 if(!validGuideSettings(value)||!validGuideSettings(expected))throw Error('Invalid power guide settings');
 const db=getDbPool();
 const r=await db.query("UPDATE rpm_shop_settings SET data=$1::jsonb,updated_at=NOW() WHERE key='power_guides' AND data=$2::jsonb RETURNING key",[JSON.stringify(value),JSON.stringify(expected)]);
 if(r.rowCount===1)return true;
 // Missing settings row is the only acceptable initial default; never overwrite malformed/existing data.
 if(expected.discountPercent!==DEFAULT_GUIDE_SETTINGS.discountPercent||expected.parts.length)return false;
 const inserted=await db.query("INSERT INTO rpm_shop_settings(key,data,updated_at) VALUES('power_guides',$1::jsonb,NOW()) ON CONFLICT(key) DO NOTHING RETURNING key",[JSON.stringify(value)]);
 return inserted.rowCount===1;
}
