import {getDbPool} from './db';
import {AppearanceSettings,DEFAULT_APPEARANCE_SETTINGS,validAppearanceSettings} from './appearance-settings';
const ensure=()=>getDbPool().query("CREATE TABLE IF NOT EXISTS rpm_shop_settings (key TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
export async function getAppearanceSettings():Promise<AppearanceSettings>{
 await ensure();
 const r=await getDbPool().query<{data:unknown}>("SELECT data FROM rpm_shop_settings WHERE key='appearance'");
 const data=r.rows[0]?.data;
 return validAppearanceSettings(data)?{logoLaserEnabled:data.logoLaserEnabled}:DEFAULT_APPEARANCE_SETTINGS;
}
export async function saveAppearanceSettings(value:AppearanceSettings){
 if(!validAppearanceSettings(value))throw Error('Invalid appearance settings');
 await ensure();
 await getDbPool().query("INSERT INTO rpm_shop_settings(key,data,updated_at) VALUES('appearance',$1::jsonb,NOW()) ON CONFLICT(key) DO UPDATE SET data=EXCLUDED.data,updated_at=NOW()",[JSON.stringify({logoLaserEnabled:value.logoLaserEnabled})]);
}
