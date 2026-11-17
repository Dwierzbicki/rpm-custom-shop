import * as THREE from "three";
import type { IntakeParameters, ManifoldDimensions } from "./model";

/** The preliminary inlet aperture is smaller than the throttle if the wedge throat is narrow. */
export function wedgeOutletBoreRadius(d: ManifoldDimensions, taperPercent: number, throttleDiameter: number): number {
  const reduction = Math.max(.55, 1 - taperPercent / 100);
  return Math.max(8, Math.min(
    throttleDiameter / 2,
    d.plenumHeight * reduction / 2 * .82,
    d.plenumDepth / 2 * (.96 + .04 * reduction) * .82,
  ));
}

/** The returned mesh is a conceptual shell, not a validated manufacturing solid. */
export function wedgePlenumGeometry(
  dimensions: ManifoldDimensions,
  taperPercent: number,
  throttleSide: "left" | "right",
  throttleDiameter: number,
): THREE.BufferGeometry {
  // Superellipse loft: softly rounded TIG plenum, not a sharp-edged six-face box.
  // The bottom remains aligned to the runners; the roof tapers toward the inlet.
  const axialStations = 24;
  const crossSections = 48;
  const halfLength = dimensions.plenumLength / 2;
  const halfDepth = dimensions.plenumDepth / 2;
  const bottom = -dimensions.plenumHeight / 2;
  const taper = Math.max(.55, 1 - taperPercent / 100);
  const exponent = 3.8;
  const signedPower = (v: number) => Math.sign(v) * Math.pow(Math.abs(v), 2 / exponent);
  const position: number[] = [];
  const index: number[] = [];

  const add = (x: number, y: number, z: number) => {
    const at = position.length / 3;
    position.push(x, y, z);
    return at;
  };
  const ring: number[][] = [];
  for (let station = 0; station <= axialStations; station++) {
    const u = station / axialStations;
    const towardThrottle = throttleSide === "right" ? u : 1 - u;
    const roofScale = 1 - (1 - taper) * towardThrottle;
    const height = dimensions.plenumHeight * roofScale;
    const centerY = bottom + height / 2;
    const halfH = height / 2;
    const halfD = halfDepth * (.96 + .04 * roofScale);
    const x = (u - .5) * dimensions.plenumLength;
    const ids: number[] = [];
    for (let j = 0; j < crossSections; j++) {
      const a = j / crossSections * Math.PI * 2;
      ids.push(add(x, centerY + halfH * signedPower(Math.cos(a)), halfD * signedPower(Math.sin(a))));
    }
    ring.push(ids);
  }

  // Outward-facing winding, no open seam, with smooth normals along each wall.
  for (let i = 0; i < axialStations; i++) {
    for (let j = 0; j < crossSections; j++) {
      const k = (j + 1) % crossSections;
      const a = ring[i][j], b = ring[i][k];
      const c = ring[i+1][j], d = ring[i+1][k];
      index.push(a, b, c, b, d, c);
    }
  }
  // Flat end caps have independent vertices so side normals stay rounded.
  for (const side of [0, axialStations]) {
    const u = side / axialStations;
    const towards = throttleSide === "right" ? u : 1 - u;
    const scale = 1 - (1 - taper) * towards;
    const height = dimensions.plenumHeight * scale;
    const x = side === 0 ? -halfLength : halfLength;
    const cy = bottom + height / 2;
    const perimeter: number[] = [];
    for (let j = 0; j < crossSections; j++) {
      const a = j / crossSections * Math.PI * 2;
      perimeter.push(add(x,cy + height/2 * signedPower(Math.cos(a)),halfDepth*(.96+.04*scale)*signedPower(Math.sin(a))));
    }
    const isThrottleEnd=(throttleSide==="left" && side===0)||(throttleSide==="right" && side===axialStations);
    if(isThrottleEnd){
      // The tube enters an actual circular opening rather than hitting a solid end cap.
      const radius=wedgeOutletBoreRadius(dimensions,taperPercent,throttleDiameter);
      const inner: number[]=[];
      for(let j=0;j<crossSections;j++){
        const angle=j/crossSections*Math.PI*2;
        inner.push(add(x,cy+radius*Math.cos(angle),radius*Math.sin(angle)));
      }
      for(let j=0;j<crossSections;j++){
        const k=(j+1)%crossSections;
        if(side===0)index.push(perimeter[j],inner[j],perimeter[k],perimeter[k],inner[j],inner[k]);
        else index.push(perimeter[j],perimeter[k],inner[j],perimeter[k],inner[k],inner[j]);
      }
    }else{
      const center=add(x,cy,0);
      for(let j=0;j<crossSections;j++){
        const k=(j+1)%crossSections;
        if(side===0)index.push(center,perimeter[k],perimeter[j]);
        else index.push(center,perimeter[j],perimeter[k]);
      }
    }
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position",new THREE.Float32BufferAttribute(position,3));
  geom.setIndex(index);
  geom.computeVertexNormals();
  return geom;
}

function roundedRectangle(path:THREE.Shape|THREE.Path,x:number,y:number,w:number,h:number,rad:number,clockwise=false){
  const r=Math.min(Math.max(rad,0),w/2,h/2);
  if(clockwise){
    path.moveTo(x+r,y);
    path.quadraticCurveTo(x,y,x,y+r);
    path.lineTo(x,y+h-r);
    path.quadraticCurveTo(x,y+h,x+r,y+h);
    path.lineTo(x+w-r,y+h);
    path.quadraticCurveTo(x+w,y+h,x+w,y+h-r);
    path.lineTo(x+w,y+r);
    path.quadraticCurveTo(x+w,y,x+w-r,y);
    path.lineTo(x+r,y);
  }else{
    path.moveTo(x+r,y);
    path.lineTo(x+w-r,y);
    path.quadraticCurveTo(x+w,y,x+w,y+r);
    path.lineTo(x+w,y+h-r);
    path.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    path.lineTo(x+r,y+h);
    path.quadraticCurveTo(x,y+h,x,y+h-r);
    path.lineTo(x,y+r);
    path.quadraticCurveTo(x,y,x+r,y);
  }
}

/**
 * Illustrative flange cut-outs; bolt and port coordinates are not OEM dimensions.
 * STEP/DXF must not be generated from these placeholders for fabrication.
 */
export function conceptualHeadFlange(p:IntakeParameters,d:ManifoldDimensions):THREE.ExtrudeGeometry{
  const width=d.span+74;
  const height=75;
  const shape=new THREE.Shape();
  roundedRectangle(shape,-width/2,-height/2,width,height,8);
  for(let i=0;i<p.cylinderCount;i++){
    const x=(i-(p.cylinderCount-1)/2)*p.portPitch;
    const port=new THREE.Path();
    if(p.portShape==="round"){
      port.absellipse(x,0,p.runnerInnerDiameter/2,p.runnerInnerDiameter/2,0,Math.PI*2,true,0);
    }else if(p.portShape==="oval"){
      port.absellipse(x,0,Math.min(p.runnerInnerDiameter*.62,p.portPitch*.40),p.runnerInnerDiameter*.39,0,Math.PI*2,true,0);
    }else{
      const w=Math.min(p.portPitch-9,p.runnerInnerDiameter*1.18);
      const h=p.runnerInnerDiameter*.76;
      roundedRectangle(port,x-w/2,-h/2,w,h,Math.min(9,h*.25),true);
    }
    shape.holes.push(port);
  }
  for(const side of [-1,1]){
    for(const y of [-23,23]){
      const hole=new THREE.Path();
      hole.absellipse(side*(d.span/2+23),y,4.5,4.5,0,Math.PI*2,true,0);
      shape.holes.push(hole);
    }
  }
  return new THREE.ExtrudeGeometry(shape,{
    depth:p.flangeThickness,bevelEnabled:false,steps:1,curveSegments:12,
  });
}

/** Square throttle flange with an illustrative central opening and four bolt holes. */
export function conceptualThrottleFlange(diameter:number):THREE.ExtrudeGeometry{
  const width=diameter+36;
  const shape=new THREE.Shape();
  roundedRectangle(shape,-width/2,-width/2,width,width,10);
  const bore=new THREE.Path();
  bore.absellipse(0,0,diameter/2,diameter/2,0,Math.PI*2,true,0);
  shape.holes.push(bore);
  for(const x of [-1,1])for(const y of [-1,1]){
    const hole=new THREE.Path();
    hole.absellipse(x*(width/2-10),y*(width/2-10),3.7,3.7,0,Math.PI*2,true,0);
    shape.holes.push(hole);
  }
  return new THREE.ExtrudeGeometry(shape,{depth:8,bevelEnabled:false,steps:1,curveSegments:14});
}
