"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { IntakeParameters, ManifoldDimensions } from "./model";
import styles from "./intake.module.css";

type CameraView = "iso" | "front" | "side" | "top";
type OrbitHandle = ComponentRef<typeof OrbitControls>;

function buildHollowRunner(curve: THREE.CatmullRomCurve3, outside: number, inside: number): THREE.BufferGeometry {
  const sections = 44;
  const around = 24;
  const points = curve.getSpacedPoints(sections);
  const frames = curve.computeFrenetFrames(sections, false);
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= sections; i++) {
    const p = points[i];
    const n = frames.normals[i];
    const b = frames.binormals[i];
    for (let j = 0; j < around; j++) {
      const angle = 2 * Math.PI * j / around;
      const dx = n.x * Math.cos(angle) + b.x * Math.sin(angle);
      const dy = n.y * Math.cos(angle) + b.y * Math.sin(angle);
      const dz = n.z * Math.cos(angle) + b.z * Math.sin(angle);
      positions.push(p.x + dx * outside, p.y + dy * outside, p.z + dz * outside);
      positions.push(p.x + dx * inside, p.y + dy * inside, p.z + dz * inside);
    }
  }
  const vertex = (i: number, j: number, inner = 0) => i * around * 2 + (j % around) * 2 + inner;
  for (let i = 0; i < sections; i++) {
    for (let j = 0; j < around; j++) {
      const k = (j + 1) % around;
      indices.push(vertex(i,j), vertex(i+1,j), vertex(i,k));
      indices.push(vertex(i,k), vertex(i+1,j), vertex(i+1,k));
      indices.push(vertex(i,j,1), vertex(i,k,1), vertex(i+1,j,1));
      indices.push(vertex(i,k,1), vertex(i+1,k,1), vertex(i+1,j,1));
    }
  }
  for (let j = 0; j < around; j++) {
    const k = (j+1) % around;
    indices.push(vertex(0,j), vertex(0,k), vertex(0,j,1));
    indices.push(vertex(0,k), vertex(0,k,1), vertex(0,j,1));
    indices.push(vertex(sections,j), vertex(sections,j,1), vertex(sections,k));
    indices.push(vertex(sections,k), vertex(sections,j,1), vertex(sections,k,1));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function Runner({x, p, dims, ghost}:{x:number;p:IntakeParameters;dims:ManifoldDimensions;ghost:boolean}) {
  const geometry = useMemo(() => {
    const startZ = p.flangeThickness/2 + 4;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0,0,startZ),
      new THREE.Vector3(0,5,p.runnerReach*.25),
      new THREE.Vector3(0,p.runnerRise*.42,p.runnerReach*.65),
      new THREE.Vector3(0,p.runnerRise*.88,p.runnerReach*.88),
      new THREE.Vector3(0,p.runnerRise,p.runnerReach+dims.plenumDepth*.16),
    ]);
    return buildHollowRunner(curve, dims.runnerOutside/2, p.runnerInnerDiameter/2);
  },[p.flangeThickness,p.runnerReach,p.runnerRise,p.runnerInnerDiameter,dims.runnerOutside,dims.plenumDepth]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return (
    <group position={[x,0,0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color={p.method==="tig"?"#b7c4cb":"#8cb1d1"} metalness={.8} roughness={p.method==="tig"?.28:.36} side={THREE.DoubleSide} transparent={ghost} opacity={ghost?.42:1} depthWrite={!ghost}/>
      </mesh>
      <mesh position={[0,0,p.flangeThickness/2+6]} rotation={[0,0,0]}>
        <torusGeometry args={[dims.runnerOutside/2+1.5,1.65,8,36]}/>
        <meshStandardMaterial color={p.method==="tig"?"#e3e8ed":"#557e9b"} metalness={.75} roughness={.38}/>
      </mesh>
    </group>
  );
}

function CameraPose({view,revision,p,dims,orbit}:{view:CameraView;revision:number;p:IntakeParameters;dims:ManifoldDimensions;orbit:React.RefObject<OrbitHandle|null>}) {
  const {camera,invalidate}=useThree();
  const initial=useRef(false);
  useEffect(()=>{
    const controls=orbit.current;
    if (!controls || !(camera instanceof THREE.PerspectiveCamera)) return;
    const center=new THREE.Vector3(0,p.runnerRise*.48,(p.runnerReach+dims.plenumDepth)*.52);
    const distance=Math.max(400,dims.totalLength * 1.45);
    const directions:Record<CameraView,THREE.Vector3>={
      iso:new THREE.Vector3(.85,.55,1),
      front:new THREE.Vector3(0,.12,1),
      side:new THREE.Vector3(1,.12,0),
      top:new THREE.Vector3(0,1,.005),
    };
    // Preserve manual orbit/zoom while dragging sliders; only refit when changing views.
    controls.target.copy(center);
    camera.position.copy(center).addScaledVector(directions[view].normalize(),distance);
    camera.lookAt(center);
    camera.updateProjectionMatrix();
    controls.update();
    initial.current=true;
    invalidate();
  },[camera,revision,view,invalidate,orbit]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function Model({p,dims,ghost}:{p:IntakeParameters;dims:ManifoldDimensions;ghost:boolean}) {
  const stations=Array.from({length:p.cylinderCount},(_,i)=>(i-(p.cylinderCount-1)/2)*p.portPitch);
  const plenumZ=p.runnerReach+dims.plenumDepth/2;
  const isBox=p.plenumShape==="box";
  const outsideColor=p.method==="tig"?"#c4cbd4":"#819db4";
  const metal=.83;
  const throttleSign=p.throttleSide==="left"?-1:1;
  return <>
    <ambientLight intensity={1.6}/>
    <hemisphereLight intensity={.85} color="#c1defa" groundColor="#11151c"/>
    <directionalLight position={[320,500,260]} intensity={3.2}/>
    <pointLight position={[-220,190,320]} intensity={32000} distance={1100}/>
    <gridHelper args={[1200,24,"#29384b","#1c2735"]} position={[0,-75,110]}/>
    <mesh position={[0,0,0]} castShadow receiveShadow>
      <boxGeometry args={[dims.span+70,68,p.flangeThickness]}/>
      <meshStandardMaterial color={outsideColor} metalness={metal} roughness={.3}/>
    </mesh>
    {stations.map((x,i)=><Runner key={i} x={x} p={p} dims={dims} ghost={ghost}/>)}
    {[-1,1].map(edge=>(
      <group key={edge} position={[edge*(dims.span+48)/2,0,0]}>
        {[-22,22].map(y=><mesh key={y} position={[0,y,p.flangeThickness/2+.6]}>
          <torusGeometry args={[5,1,8,18]}/>
          <meshStandardMaterial color="#111c28" metalness={.3} roughness={.48}/>
        </mesh>)}
      </group>
    ))}
    {isBox ? (
      <mesh position={[0,p.runnerRise,plenumZ]} castShadow>
        <boxGeometry args={[dims.plenumLength,dims.plenumHeight,dims.plenumDepth]}/>
        <meshStandardMaterial color={outsideColor} metalness={metal} roughness={p.method==="tig"?.35:.24} transparent={ghost} opacity={ghost?.27:1} depthWrite={!ghost}/>
      </mesh>
    ):(
      <mesh position={[0,p.runnerRise,plenumZ]} rotation={[0,0,Math.PI/2]} scale={[1,1,dims.plenumDepth/dims.plenumHeight]} castShadow>
        <cylinderGeometry args={[dims.plenumHeight/2,dims.plenumHeight/2,dims.plenumLength,64,1,false]}/>
        <meshStandardMaterial color={outsideColor} metalness={metal} roughness={p.method==="tig"?.3:.24} transparent={ghost} opacity={ghost?.28:1} depthWrite={!ghost}/>
      </mesh>
    )}
    {p.method==="cnc" && [-1,1].map(s=>(
      <mesh key={s} position={[s*(dims.plenumLength/2-12),p.runnerRise,plenumZ]} rotation={[0,0,Math.PI/2]} scale={[1,1,dims.plenumDepth/dims.plenumHeight]}>
        <cylinderGeometry args={[dims.plenumHeight/2+3,dims.plenumHeight/2+3,7,64]}/>
        <meshStandardMaterial color="#385572" metalness={.82} roughness={.28} transparent={ghost} opacity={ghost?.35:1} depthWrite={!ghost}/>
      </mesh>
    ))}
    {p.method==="tig" && [-1,1].map(s=>(
      <mesh key={s} position={[s*(dims.plenumLength/2-7),p.runnerRise,plenumZ]} rotation={[0,0,Math.PI/2]} scale={[1,1,dims.plenumDepth/dims.plenumHeight]}>
        <cylinderGeometry args={[dims.plenumHeight/2+1,dims.plenumHeight/2+1,3,64]}/>
        <meshStandardMaterial color="#d9e0e7" metalness={.75} roughness={.32} transparent={ghost} opacity={ghost?.35:1} depthWrite={!ghost}/>
      </mesh>
    ))}
    <group position={[throttleSign*(dims.plenumLength/2+18),p.runnerRise,plenumZ]}>
      <mesh rotation={[0,0,Math.PI/2]}>
        <cylinderGeometry args={[p.throttleDiameter/2+4,p.throttleDiameter/2+4,44,48,1,true]}/>
        <meshStandardMaterial color="#c4d0db" metalness={.85} roughness={.25} side={THREE.DoubleSide}/>
      </mesh>
      <mesh position={[throttleSign*27,0,0]} rotation={[0,Math.PI/2,0]}>
        <torusGeometry args={[p.throttleDiameter/2+7,4,10,48]}/>
        <meshStandardMaterial color="#ee893d" metalness={.75} roughness={.27}/>
      </mesh>
    </group>
  </>;
}

export default function ManifoldScene({params,dims}:{params:IntakeParameters;dims:ManifoldDimensions}) {
  const [view,setView]=useState<CameraView>("iso");
  const [revision,setRevision]=useState(0);
  const [ghost,setGhost]=useState(false);
  const orbit=useRef<OrbitHandle|null>(null);
  const choose=(v:CameraView)=>{setView(v);setRevision(n=>n+1);};
  const views:readonly [CameraView,string][]=[["iso","3D"],["front","Przód"],["side","Bok"],["top","Góra"]];
  return <div className={styles.viewport}>
    <div className={styles.canvasArea} onDoubleClick={()=>choose("iso")}>
      <div className={styles.canvasCaption}>MODEL 3D <span>· LIVE</span></div>
      <Canvas camera={{position:[530,310,550],fov:42,near:.5,far:4000}} dpr={[1,1.8]} gl={{antialias:true}} shadows>
        <Model p={params} dims={dims} ghost={ghost}/>
        <OrbitControls ref={orbit} makeDefault enableRotate enableZoom enablePan minDistance={100} maxDistance={2200} enableDamping dampingFactor={.1}/>
        <CameraPose view={view} revision={revision} p={params} dims={dims} orbit={orbit}/>
      </Canvas>
    </div>
    <div className={styles.sceneToolbar} role="toolbar" aria-label="Widoki kolektora">
      {views.map(([id,label])=><button type="button" key={id} className={view===id?styles.sceneActive:styles.sceneButton} onClick={()=>choose(id)}>{label}</button>)}
      <button type="button" className={styles.sceneButton} onClick={()=>choose(view)}>⛶ Dopasuj</button>
      <button type="button" className={ghost?styles.sceneActive:styles.sceneButton} onClick={()=>setGhost(x=>!x)}>{ghost?"Prześwit: WŁ.":"Prześwit: WYŁ."}</button>
    </div>
  </div>;
}
