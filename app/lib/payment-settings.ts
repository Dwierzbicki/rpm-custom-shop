export type PaymentMethod='bank_transfer'|'pay_on_pickup';
export type PaymentSettings={bankTransferEnabled:boolean;payOnPickupEnabled:boolean;bankAccount:string;transferRecipient:string;transferInstructions:string};
export const DEFAULT_PAYMENT_SETTINGS:PaymentSettings={bankTransferEnabled:false,payOnPickupEnabled:true,bankAccount:'',transferRecipient:'',transferInstructions:''};
export function validPaymentSettings(value:unknown):value is PaymentSettings{
 if(!value||typeof value!=='object')return false;
 const v=value as Record<string,unknown>;
 return typeof v.bankTransferEnabled==='boolean'&&typeof v.payOnPickupEnabled==='boolean'&&typeof v.bankAccount==='string'&&v.bankAccount.length<=64&&typeof v.transferRecipient==='string'&&v.transferRecipient.length<=160&&typeof v.transferInstructions==='string'&&v.transferInstructions.length<=500&&(!v.bankTransferEnabled||Boolean(v.bankAccount.trim()&&v.transferRecipient.trim()));
}
export function availablePaymentMethods(settings:PaymentSettings,shippingMethod:'courier'|'pickup'):PaymentMethod[]{
 const methods:PaymentMethod[]=[];
 if(settings.bankTransferEnabled)methods.push('bank_transfer');
 if(shippingMethod==='pickup'&&settings.payOnPickupEnabled)methods.push('pay_on_pickup');
 return methods;
}
