'use client';
import {useState} from 'react';
import type {Product} from '../../../data';
import {describeConfiguration,configuredCartLine} from '../../../lib/product-configuration';
export function useProductConfiguration(initialProduct:Product){
 const [selected,setSelected]=useState<Product>(initialProduct);
 const [chosenOptions,setChosenOptions]=useState<Record<string,string>>({});
 const [photoIndex,setPhotoIndex]=useState(0);
 const [lightbox,setLightbox]=useState(false);
 const [engine,setEngine]=useState(''),[flange,setFlange]=useState(''),[wg,setWg]=useState(''),[egt,setEgt]=useState(false),[qty,setQty]=useState(1);
 const configuration={chosenOptions,engine,flange,wg,egt,qty};
 const details=describeConfiguration(selected,configuration);
 const resetProduct=(p:Product)=>{setSelected(p);setChosenOptions({});setPhotoIndex(0);setLightbox(false);setEngine('');setFlange('');setWg('');setEgt(false);setQty(1)};
 const buildLine=()=>configuredCartLine(selected,configuration);
 return {selected,setSelected,chosenOptions,setChosenOptions,photoIndex,setPhotoIndex,lightbox,setLightbox,engine,setEngine,flange,setFlange,wg,setWg,egt,setEgt,qty,setQty,...details,resetProduct,buildLine};
}
