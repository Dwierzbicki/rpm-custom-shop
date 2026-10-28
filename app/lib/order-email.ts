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
   `${en?'Reference':'Tytuł'}: ${en?`RPM CUSTOM - Order #${order.orderId}`:`RPM CUSTOM - Zamówienie #${order.orderId}`}`);
  if(order.paymentInstructions.instructions.trim())lines.push(order.paymentInstructions.instructions.trim());
 }
 lines.push('',en?'RPM Custom team':'Zespół RPM Custom');
 const text=lines.join('\n');

 const row=(label:string,value:string)=>`<tr><td style="padding:9px 0;color:#687282;font-size:13px">${escapeHtml(label)}</td><td style="padding:9px 0;text-align:right;font-weight:600">${escapeHtml(value)}</td></tr>`;
 const products=order.items.map(item=>`<tr><td style="padding:14px 0;border-bottom:1px solid #e7e9ed"><strong>${escapeHtml(item.name)}</strong><div style="color:#76808c;font-size:12px">SKU: ${escapeHtml(item.sku)} · ${item.qty} × ${money(item.unitPrice)}</div>${Object.entries(item.options).map(([key,value])=>`<div style="color:#76808c;font-size:12px">${escapeHtml(key)}: ${escapeHtml(value)}</div>`).join('')}</td><td style="text-align:right;border-bottom:1px solid #e7e9ed;white-space:nowrap">${money(item.unitPrice*item.qty)}</td></tr>`).join('');
 const bank=order.paymentInstructions?`<div style="background:#f3f5f8;padding:20px;border-radius:10px;margin-top:24px"><h3 style="margin:0 0 12px">${en?'Bank transfer details':'Dane do przelewu'}</h3><div>${en?'Recipient':'Odbiorca'}: <strong>${escapeHtml(order.paymentInstructions.recipient)}</strong></div><div>${en?'Account':'Numer konta'}: <strong>${escapeHtml(order.paymentInstructions.account)}</strong></div><div>${en?'Reference':'Tytuł'}: <strong>${escapeHtml(en?`RPM CUSTOM - Order #${order.orderId}`:`RPM CUSTOM - Zamówienie #${order.orderId}`)}</strong></div>${order.paymentInstructions.instructions.trim()?`<p style="white-space:pre-wrap">${escapeHtml(order.paymentInstructions.instructions.trim())}</p>`:''}</div>`:'';
 const html=`<!doctype html><html lang="${order.language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f1f3f6;color:#20252d;font-family:Arial,Helvetica,sans-serif"><div style="max-width:620px;margin:30px auto;background:white;border-radius:14px;overflow:hidden"><div style="background:#111923;padding:30px;color:#fff"><div style="font-size:27px;font-weight:800;letter-spacing:2px">RPM <span style="color:#f3b52c">CUSTOM</span></div><div style="color:#aeb8c4;font-size:12px;margin-top:5px">PERFORMANCE PARTS</div></div><div style="padding:30px"><div style="font-size:12px;font-weight:700;color:#9a701a;letter-spacing:1px">${en?'ORDER CONFIRMATION':'POTWIERDZENIE ZAMÓWIENIA'}</div><h1 style="font-size:26px;margin:10px 0 20px">#${escapeHtml(order.orderId)}</h1><p>${escapeHtml(en?`Hello ${order.customerName},`:`Cześć ${order.customerName},`)}</p><p>${en?'Thank you for your order. Here is your summary.':'Dziękujemy za zamówienie. Poniżej znajdziesz jego podsumowanie.'}</p><table role="presentation" style="border-collapse:collapse;width:100%;margin-top:22px">${products}</table><table role="presentation" style="border-collapse:collapse;width:100%;margin-top:18px">${row(en?'Subtotal':'Produkty',money(order.subtotal))}${row(en?'Shipping':'Dostawa',money(order.shippingCost))}${row(en?'Payment':'Płatność',order.paymentMethod==='bank_transfer'?(en?'Bank transfer':'Przelew bankowy'):(en?'Pay on pickup':'Płatność przy odbiorze'))}</table><div style="background:#111923;color:white;padding:18px 20px;border-radius:10px;display:flex;justify-content:space-between;margin-top:12px"><span>${en?'Total':'Razem'}</span><strong style="font-size:22px">${money(order.total)}</strong></div>${bank}<p style="margin-top:30px;color:#667080">${en?'RPM Custom team':'Zespół RPM Custom'}</p></div><div style="padding:18px 30px;background:#f8f9fa;color:#77818d;font-size:12px;text-align:center">RPM Custom · rpmcustom.pl</div></div></body></html>`;

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

 if(mode==='test'){
  const key=process.env.RESEND_API_KEY;
  const recipient=process.env.EMAIL_TEST_RECIPIENT;
  if(!key||!recipient||!/^\S+@\S+\.\S+$/.test(recipient)){
   console.warn('[order-email] test mode not configured; no message sent',{orderId:order.orderId});
   return;
  }
  const response=await fetch('https://api.resend.com/emails',{
   method:'POST',
   headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
   body:JSON.stringify({
    from:process.env.EMAIL_FROM||'RPM Custom Test <onboarding@resend.dev>',
    to:[recipient],
    subject:`[TEST #${order.orderId}] ${preview.subject}`,
    html:preview.html,text:preview.text
   }),
   signal:AbortSignal.timeout(10000)
  });
  if(!response.ok){
   console.error('[order-email] Resend request failed',{orderId:order.orderId,status:response.status});
   return;
  }
  console.info('[order-email] test accepted by provider',{orderId:order.orderId,language:order.language});
  return;
 }
 if(mode==='production'){
  console.warn('[order-email] production sending disabled pending verified domain',{orderId:order.orderId});
  return;
 }

 console.warn('[order-email] invalid EMAIL_MODE; no message sent',{orderId:order.orderId});
}
