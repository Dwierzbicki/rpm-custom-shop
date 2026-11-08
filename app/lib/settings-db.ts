import {PaymentSettings,DEFAULT_PAYMENT_SETTINGS,validPaymentSettings} from './payment-settings';
import {CompanySettings,DEFAULT_COMPANY_SETTINGS,validCompanySettings} from './company-settings';
import {getDbPool} from './db';
import {DEFAULT_SHIPPING_SETTINGS,ShippingSettings,validShippingSettings} from './shipping';
export async function getShippingSettings():Promise<ShippingSettings>{
 await getDbPool().query("CREATE TABLE IF NOT EXISTS rpm_shop_settings (key TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
 const result=await getDbPool().query<{data:unknown}>("SELECT data FROM rpm_shop_settings WHERE key='shipping'");
 const value=result.rows[0]?.data;
 return validShippingSettings(value)?value:DEFAULT_SHIPPING_SETTINGS;
}
export async function saveShippingSettings(value:ShippingSettings){
 if(!validShippingSettings(value))throw Error('Invalid shipping settings');
 await getDbPool().query("CREATE TABLE IF NOT EXISTS rpm_shop_settings (key TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
 await getDbPool().query("INSERT INTO rpm_shop_settings(key,data,updated_at) VALUES('shipping',$1::jsonb,NOW()) ON CONFLICT(key) DO UPDATE SET data=EXCLUDED.data,updated_at=NOW()",[JSON.stringify(value)]);
}

export async function getCompanySettings():Promise<CompanySettings>{
 await getDbPool().query("CREATE TABLE IF NOT EXISTS rpm_shop_settings (key TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
 const result=await getDbPool().query<{data:unknown}>("SELECT data FROM rpm_shop_settings WHERE key='company'");
 return validCompanySettings(result.rows[0]?.data)?result.rows[0].data as CompanySettings:DEFAULT_COMPANY_SETTINGS;
}
export async function saveCompanySettings(value:CompanySettings){
 if(!validCompanySettings(value))throw Error('Invalid company settings');
 await getDbPool().query("CREATE TABLE IF NOT EXISTS rpm_shop_settings (key TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
 await getDbPool().query("INSERT INTO rpm_shop_settings(key,data,updated_at) VALUES('company',$1::jsonb,NOW()) ON CONFLICT(key) DO UPDATE SET data=EXCLUDED.data,updated_at=NOW()",[JSON.stringify(value)]);
}

export async function getPaymentSettings():Promise<PaymentSettings>{
 await getDbPool().query("CREATE TABLE IF NOT EXISTS rpm_shop_settings (key TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
 const result=await getDbPool().query<{data:unknown}>("SELECT data FROM rpm_shop_settings WHERE key='payments'");
 return validPaymentSettings(result.rows[0]?.data)?result.rows[0].data as PaymentSettings:DEFAULT_PAYMENT_SETTINGS;
}
export async function savePaymentSettings(value:PaymentSettings){
 if(!validPaymentSettings(value))throw Error('Invalid payment settings');
 await getDbPool().query("CREATE TABLE IF NOT EXISTS rpm_shop_settings (key TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
 await getDbPool().query("INSERT INTO rpm_shop_settings(key,data,updated_at) VALUES('payments',$1::jsonb,NOW()) ON CONFLICT(key) DO UPDATE SET data=EXCLUDED.data,updated_at=NOW()",[JSON.stringify(value)]);
}
