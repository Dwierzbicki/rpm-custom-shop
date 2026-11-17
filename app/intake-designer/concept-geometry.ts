import * as THREE from "three";
import type { IntakeParameters, ManifoldDimensions } from "./model";

/** The returned mesh is a conceptual shell, not a watertight manufacturing solid. */
export function wedgePlenumGeometry(
  dimensions: ManifoldDimensions,
  taperPercent: number,
  throttleSide: "left" | "right",
): THREE.BufferGeometry {
  const halfLength=dimensions.plenumLength/2;
  const halfDepth=dimensions.plenumDepth/2;
  const bottom=-dimensions.plenumHeight/2;
  const reduction=Math.max(.52,1-taperPercent/100);
  const leftScale=throttleSide==="left"?reduction:1;
  const rightScale=throttleSide==="right"?reduction:1;
  const end=(x:number,scale:number)=>[
    new THREE.Vector3(x,bottom,-halfDepth),
    new THREE.Vector3(x,bottom,halfDepth),
    new THREE.Vector3(x,bottom+dimensions.plenumHeight*scale,-halfDepth*(.8+.2*scale)),
    new THREE.Vector3(x,bottom+dimensions.plenumHeight*scale,halfDepth*(.8+.2*scale)),
  ];
  const corners=[...end(-halfLength,leftScale),...end(halfLength,rightScale)];
  const positions:number[]=[];
  function triangle(a:number,b:number,c:number){
    for(const idx of [a,b,c])positions.push(corners[idx].x,corners[idx].y,corners[idx].z);
  }
  function quad(a:number,b:number,c:number,d:number){
    triangle(a,b,c);triangle(a,c,d);
  }
  quad(0,4,5,1); // bottom
  quad(2,3,7,6); // top ramp
  quad(0,2,6,4); // near side
  quad(1,5,7,3); // far side
  quad(0,1,3,2); // end cap
  quad(4,6,7,5); // throttle end cap
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  geometry.computeVertexNormals();
  return geometry;
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
