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


 const row=(label:string,value:string)=>'<tr><td style="padding:10px 0;color:#717b89;font-size:13px">'+escapeHtml(label)+'</td><td align="right" style="padding:10px 0;font-size:14px;font-weight:700;color:#17191f">'+escapeHtml(value)+'</td></tr>';
 const products=order.items.map(item=>'<tr><td style="padding:17px 0;border-bottom:1px solid #e5e7ec"><div style="font-weight:700;font-size:15px;color:#181a20">'+escapeHtml(item.name)+'</div><div style="font-size:12px;color:#7a8491;padding-top:5px">SKU: '+escapeHtml(item.sku)+' &nbsp;·&nbsp; '+item.qty+' × '+money(item.unitPrice)+'</div>'+Object.entries(item.options).map(([key,value])=>'<div style="font-size:12px;color:#7a8491">'+escapeHtml(key)+': '+escapeHtml(value)+'</div>').join('')+'</td><td align="right" style="padding:17px 0;border-bottom:1px solid #e5e7ec;white-space:nowrap;font-weight:700;font-size:14px">'+money(item.unitPrice*item.qty)+'</td></tr>').join('');
 const transferReference=en?'RPM CUSTOM - Order #'+order.orderId:'RPM CUSTOM - Zamówienie #'+order.orderId;
 const bank=order.paymentInstructions?'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:24px;background:#f3f4f7;border-radius:10px"><tr><td style="padding:22px"><div style="font-size:16px;font-weight:800;margin-bottom:15px;color:#17191f">'+(en?'Bank transfer details':'Dane do przelewu')+'</div><div style="font-size:12px;color:#727b89;margin-bottom:4px">'+(en?'Recipient':'Odbiorca')+'</div><div style="font-size:14px;font-weight:700;margin-bottom:13px">'+escapeHtml(order.paymentInstructions.recipient)+'</div><div style="font-size:12px;color:#727b89;margin-bottom:4px">'+(en?'Account number':'Numer rachunku')+'</div><div style="font-size:14px;font-weight:700;overflow-wrap:anywhere;word-break:break-word;margin-bottom:13px">'+escapeHtml(order.paymentInstructions.account)+'</div><div style="font-size:12px;color:#727b89;margin-bottom:4px">'+(en?'Transfer reference':'Tytuł przelewu')+'</div><div style="font-size:14px;font-weight:700">'+escapeHtml(transferReference)+'</div>'+(order.paymentInstructions.instructions.trim()?'<div style="font-size:13px;line-height:1.6;margin-top:16px;white-space:pre-wrap;overflow-wrap:anywhere">'+escapeHtml(order.paymentInstructions.instructions.trim())+'</div>':'')+'</td></tr></table>':'';
 const html='<!doctype html><html lang="'+order.language+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#eef0f4;color:#17191f;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef0f4;border-collapse:collapse"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#ffffff;border-collapse:collapse"><tr><td style="background:#090a0d;padding:29px 30px;border-bottom:4px solid #e72f59"><div style="font-size:28px;letter-spacing:2px;font-weight:900;color:#ffffff">RPM <span style="color:#e72f59">CUSTOM</span></div><div style="font-size:10px;letter-spacing:2px;color:#b7bcc6;margin-top:7px">PERFORMANCE PARTS &amp; ENGINEERING</div></td></tr><tr><td style="padding:30px 30px 36px"><div style="font-size:11px;font-weight:800;letter-spacing:1.6px;color:#e72f59">'+(en?'ORDER CONFIRMATION':'POTWIERDZENIE ZAMÓWIENIA')+'</div><h1 style="font-size:29px;line-height:1.2;margin:12px 0 20px;color:#111319">'+(en?'Order #':'Zamówienie #')+escapeHtml(order.orderId)+'</h1><p style="font-size:14px;line-height:1.7;margin:0 0 8px">'+escapeHtml(en?'Hello '+order.customerName+',':'Cześć '+order.customerName+',')+'</p><p style="font-size:14px;line-height:1.7;margin:0 0 22px">'+(en?'Thank you for your order. Here is your summary.':'Dziękujemy za zamówienie. Poniżej znajdziesz jego podsumowanie.')+'</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">'+products+'</table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:20px">'+row(en?'Subtotal':'Produkty',money(order.subtotal))+row(en?'Shipping':'Dostawa',money(order.shippingCost))+row(en?'Payment':'Płatność',order.paymentMethod==='bank_transfer'?(en?'Bank transfer':'Przelew bankowy'):(en?'Pay on pickup':'Płatność przy odbiorze'))+'</table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#17191f;margin-top:17px;border-radius:8px"><tr><td style="padding:19px 20px;color:#ffffff;font-size:13px;font-weight:700">'+(en?'TOTAL TO PAY':'DO ZAPŁATY')+'</td><td align="right" style="padding:19px 20px;color:#e72f59;font-size:23px;font-weight:900;white-space:nowrap">'+money(order.total)+'</td></tr></table>'+bank+'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:28px"><tr><td align="center" style="padding:13px 12px;background:#e72f59;border-radius:7px"><a href="https://rpmcustom.pl" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;display:block">'+(en?'VISIT RPM CUSTOM':'ODWIEDŹ RPM CUSTOM')+'</a></td></tr></table><p style="font-size:13px;color:#6d7684;margin:24px 0 0">'+(en?'Thank you for choosing RPM Custom!':'Dziękujemy za zaufanie!')+'</p></td></tr><tr><td align="center" style="background:#111318;padding:21px;color:#b5bbc5;font-size:12px">RPM Custom &nbsp;·&nbsp; <a href="https://rpmcustom.pl" style="color:#e72f59;text-decoration:none">rpmcustom.pl</a></td></tr></table></td></tr></table></body></html>';

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
