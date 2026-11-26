/** Presentation only: price and quantity still validated by existing cart/server logic. */
export function purchaseSummary(base:number,unit:number,quantity:number){
 return {base,extra:Math.round((unit-base)*100)/100,total:Math.round(unit*quantity*100)/100};
}
/** Reveal the secondary CTA only after the primary purchase controls have passed above the viewport. */
export function showMobilePurchaseBar(purchaseBottom:number,visibleTop:number){
 return Number.isFinite(purchaseBottom)&&Number.isFinite(visibleTop)&&purchaseBottom<=visibleTop;
}
