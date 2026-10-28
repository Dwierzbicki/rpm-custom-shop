import {NextResponse} from 'next/server';
import {createHash,createHmac} from 'node:crypto';
export const runtime='nodejs';
const maxSize=5*1024*1024;
export async function POST(request:Request){
 try{
  const origin=request.headers.get('origin'),host=request.headers.get('host');
  if(origin&&(!host||new URL(origin).host!==host))return NextResponse.json({error:'Niedozwolone pochodzenie'},{status:403});
  const cloud=process.env.CLOUDINARY_CLOUD_NAME,key=process.env.CLOUDINARY_API_KEY,secret=process.env.CLOUDINARY_API_SECRET;
  if(!cloud||!key||!secret)return NextResponse.json({error:'Skonfiguruj CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY i CLOUDINARY_API_SECRET w Renderze.'},{status:503});
  if(!request.headers.get('content-type')?.includes('multipart/form-data'))return NextResponse.json({error:'Wymagany plik'},{status:415});
  const form=await request.formData();const file=form.get('file');
  if(!(file instanceof File))return NextResponse.json({error:'Wybierz zdjęcie'},{status:400});
  if(file.size===0||file.size>maxSize)return NextResponse.json({error:'Zdjęcie musi mieć maksymalnie 5 MB'},{status:413});
  const bytes=Buffer.from(await file.arrayBuffer());
  const jpeg=bytes.length>3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
  const png=bytes.length>8&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const webp=bytes.length>12&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
  if(!jpeg&&!png&&!webp)return NextResponse.json({error:'Obsługiwane formaty: JPG, PNG, WEBP'},{status:415});
  const timestamp=Math.floor(Date.now()/1000),folder='rpm-custom/products';
  const signature=createHash('sha1').update('folder='+folder+'&timestamp='+timestamp+secret).digest('hex');
  const upload=new FormData();upload.set('file',new Blob([bytes],{type:jpeg?'image/jpeg':png?'image/png':'image/webp'}),'product-image');upload.set('api_key',key);upload.set('timestamp',String(timestamp));upload.set('folder',folder);upload.set('signature',signature);
  const response=await fetch('https://api.cloudinary.com/v1_1/'+encodeURIComponent(cloud)+'/image/upload',{method:'POST',body:upload});
  const data=await response.json();
  if(!response.ok||typeof data.secure_url!=='string')return NextResponse.json({error:'Cloudinary odrzucił zdjęcie. Sprawdź konfigurację konta.'},{status:502});
  return NextResponse.json({url:data.secure_url},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Nie udało się przesłać zdjęcia'},{status:500})}
}
