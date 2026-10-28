import type {PaymentMethod} from './payment-settings';

export type OrderMailData={
 orderId:string;language:'pl'|'en';customerName:string;customerEmail:string;
 items:{sku:string;name:string;qty:number;unitPrice:number;options:Record<string,string>}[];
 subtotal:number;shippingCost:number;total:number;shippingMethod:'pickup'|'courier';
 paymentMethod:PaymentMethod;
 paymentInstructions:{recipient:string;account:string;instructions:string;title:string}|null;
};
export type MailPreview={to:string;subject:string;text:string;html:string};
const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]??char));
const money=(value:number)=>new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN'}).format(value);
export function orderMailPreview(order:OrderMailData):MailPreview{
 const en=order.language==='en';
 const subject=en?`RPM Custom — Order #${order.orderId} confirmation`:`RPM Custom — Potwierdzenie zamówienia #${order.orderId}`;
 const lines=[
  en?`Hello ${order.customerName},`:`Cześć ${order.customerName},`,
  en?`Thank you for your order #${order.orderId}.`:`Dziękujemy za zamówienie #${order.orderId}.`,
  '',
  ...(order.items.flatMap(item=>[
   `${item.name} (${item.sku}) × ${item.qty} — ${money(item.unitPrice*item.qty)}`,
   ...Object.entries(item.options).map(([key,value])=>`  ${key}: ${value}`)
  ])),
  '',
  `${en?'Subtotal':'Produkty'}: ${money(order.subtotal)}`,
  `${en?'Shipping':'Dostawa'} (${order.shippingMethod==='pickup'?(en?'Pickup':'Odbiór osobisty'):(en?'Courier':'Kurier')}): ${money(order.shippingCost)}`,
  `${en?'Total':'Razem'}: ${money(order.total)}`,
  `${en?'Payment':'Płatność'}: ${order.paymentMethod==='bank_transfer'?(en?'Bank transfer':'Przelew bankowy'):(en?'Pay on pickup':'Płatność przy odbiorze')}`,
 ];
 if(order.paymentInstructions){
  lines.push('',en?'Bank transfer details:':'Dane do przelewu:',
   `${en?'Recipient':'Odbiorca'}: ${order.paymentInstructions.recipient}`,
   `${en?'Account':'Numer konta'}: ${order.paymentInstructions.account}`,
   `${en?'Reference':'Tytuł'}: ${order.paymentInstructions.title}`);
  if(order.paymentInstructions.instructions.trim())lines.push(order.paymentInstructions.instructions.trim());
 }
 lines.push('',en?'RPM Custom team':'Zespół RPM Custom');
 const text=lines.join('\n');
 const html=`<!doctype html><html lang="${order.language}"><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;line-height:1.6;color:#222"><div style="max-width:620px;margin:auto;padding:24px"><h1 style="color:#111">RPM CUSTOM</h1><h2>${escapeHtml(subject)}</h2>${lines.map(line=>line? `<p style="margin:5px 0">${escapeHtml(line)}</p>`:'<div style="height:12px"></div>').join('')}</div></body></html>`;
 return {to:order.customerEmail,subject,text,html};
}
export async function handleOrderEmail(order:OrderMailData):Promise<void>{
 const mode=process.env.EMAIL_MODE??'mock';
 const preview=orderMailPreview(order);
 if(mode==='mock'){
  // Do not log customer PII, bank details or email content in production logs.
  console.info('[order-email] mock preview generated',{orderId:order.orderId,language:order.language,subject:preview.subject,itemCount:order.items.length});
  return;
 }
 if(mode==='test'||mode==='production'){
  // Fail closed until a real provider and recipient policy are implemented.
  console.warn('[order-email] delivery not configured; no message sent',{orderId:order.orderId,mode});
  return;
 }
 console.warn('[order-email] invalid EMAIL_MODE; no message sent',{orderId:order.orderId});
}
