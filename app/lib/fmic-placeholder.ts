// Conservative silhouette of the pale Magento placeholder observed on the storefront.
// Never classify a picture solely because it is light or low contrast.
const template="0000000000000001100000000000000000000000000000111110000000000000000000000001111111111000000000000000000001111111111111100000000000000001111111110111111110000000000000111111110000111111110000000001111111110000000001111111100000111111110000000000001111111100111111110000000000000000111111111111110000000000000000000011111111110000000011000011000000001111111100000001110000111000000011111111000011111100001111110000111111110000111111000011111100001111111100001111110000111111000011111111000011111100001111110000111111110000111111000011111100001111111100001111110000111111000011111111000011111100001111110000111111110000111111000011111100001111111100001111110000111111000011111111000011111100001111110000111111110000111111000011111100001111111100001111110000111111000011110111000011111100001111110000111000010000111111000011111100001000000000001111110000111111000000000000000011111100001111110000000000000000011111100111111000000000000000000001111111111100000000000000000000000111111000000000000000000000000000011100000000000000";
export function isMagentoPlaceholder(pixels:Uint8Array):boolean{
 const size=96;
 if(pixels.length!==size*size*3)return false;
 const gray=new Uint8Array(size*size),hist=new Uint32Array(256);
 for(let i=0;i<gray.length;i++){
  const r=pixels[i*3],g=pixels[i*3+1],b=pixels[i*3+2];
  if(Math.min(r,g,b)<225||Math.max(r,g,b)-Math.min(r,g,b)>5)return false;
  const v=Math.round((r+g+b)/3);gray[i]=v;hist[v]++;
 }
 function percentile(p:number){let n=0;for(let v=0;v<256;v++){n+=hist[v];if(n>=p*gray.length)return v}return 255}
 const low=percentile(.08),high=percentile(.65);
 if(high-low<3||high-low>25)return false;
 const cutoff=(low+high)/2;
 let left=size,right=-1,top=size,bottom=-1;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(gray[y*size+x]<cutoff){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
 const w=right-left+1,h=bottom-top+1;
 if(w<16||h<16||w/h<.60||w/h>1.15)return false;
 let intersection=0,union=0;
 for(let y=0;y<32;y++)for(let x=0;x<32;x++){
  const observed=gray[(top+Math.min(h-1,Math.floor((y+.5)*h/32)))*size+left+Math.min(w-1,Math.floor((x+.5)*w/32))]<cutoff;
  const expected=template[y*32+x]==='1';
  if(observed&&expected)intersection++;
  if(observed||expected)union++;
 }
 return union>0&&intersection/union>=.86;
}
