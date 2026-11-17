"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";
import type { IntakeParameters, ManifoldDimensions } from "./model";
import styles from "./intake.module.css";
import {conceptualHeadFlange, conceptualThrottleFlange, wedgePlenumGeometry} from "./concept-geometry";

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
    const bend=p.runnerBend/100;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0,0,startZ),
      new THREE.Vector3(p.runnerOffset*.10,p.runnerRise*(.08+.12*(1-bend)),p.runnerReach*.20),
      new THREE.Vector3(p.runnerOffset*.42,p.runnerRise*(.27+.36*bend),p.runnerReach*.50),
      new THREE.Vector3(p.runnerOffset*.82,p.runnerRise*(.68+.20*bend),p.runnerReach*.80),
      new THREE.Vector3(p.runnerOffset,p.runnerRise,p.runnerReach+dims.plenumDepth*.16),
    ]);
    return buildHollowRunner(curve, dims.runnerOutside/2, p.runnerInnerDiameter/2);
  },[p.flangeThickness,p.runnerReach,p.runnerRise,p.runnerBend,p.runnerOffset,p.runnerInnerDiameter,dims.runnerOutside,dims.plenumDepth]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return (
    <group position={[x,0,0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color={p.method==="tig"?"#d4dce3":"#8cb1d1"} metalness={.74} roughness={p.method==="tig"?.27:.33} side={THREE.DoubleSide} transparent={ghost} opacity={ghost?.42:1} depthWrite={!ghost}/>
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
  useEffect(()=>{
    const controls=orbit.current;
    if (!controls || !(camera instanceof THREE.PerspectiveCamera)) return;
    const center=new THREE.Vector3(0,p.runnerRise*.48,(p.runnerReach+dims.plenumDepth)*.52);
    const distance=Math.max(400,dims.totalLength * 1.45);
    const directions:Record<CameraView,THREE.Vector3>={
      iso:new THREE.Vector3(.32,.72,1.38),
      front:new THREE.Vector3(0,.18,1),
      side:new THREE.Vector3(1,.20,.10),
      top:new THREE.Vector3(0,1,.005),
    };
    // Preserve manual orbit/zoom while dragging sliders; only refit when changing views.
    controls.target.copy(center);
    camera.position.copy(center).addScaledVector(directions[view].normalize(),distance);
    camera.lookAt(center);
    camera.updateProjectionMatrix();
    controls.update();
    invalidate();
  },[camera,revision,view,p.engine,p.cylinderCount,invalidate,orbit]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function Model({p,dims,ghost}:{p:IntakeParameters;dims:ManifoldDimensions;ghost:boolean}) {
  const stations=Array.from({length:p.cylinderCount},(_,i)=>(i-(p.cylinderCount-1)/2)*p.portPitch);
  const plenumZ=p.runnerReach+dims.plenumDepth/2;
  const isBox=p.plenumShape==="box";
  const isWedge=p.plenumShape==="wedge";
  const outsideColor=p.method==="tig"?"#c4d1d9":"#819db4";
  const plenumColor=p.method==="tig" && p.tigPlenumFinish==="graphite"?"#394351":outsideColor;
  const taperRatio=1-p.plenumTaper/100;
  const topRadius=dims.plenumHeight/2*(p.throttleSide==="left"?taperRatio:1);
  const bottomRadius=dims.plenumHeight/2*(p.throttleSide==="right"?taperRatio:1);
  const metal=.83;
  const throttleSign=p.throttleSide==="left"?-1:1;
  const flange=useMemo(()=>conceptualHeadFlange(p,dims),[p,dims]);
  const throttlePlate=useMemo(()=>conceptualThrottleFlange(p.throttleDiameter),[p.throttleDiameter]);
  const wedge=useMemo(()=>isWedge?wedgePlenumGeometry(dims,p.plenumTaper,p.throttleSide):null,[dims,isWedge,p.plenumTaper,p.throttleSide]);
  useEffect(()=>()=>{flange.dispose();},[flange]);
  useEffect(()=>()=>{throttlePlate.dispose();},[throttlePlate]);
  useEffect(()=>()=>{wedge?.dispose();},[wedge]);
  return <>
    <ambientLight intensity={1.6}/>
    <hemisphereLight intensity={1.15} color="#c1defa" groundColor="#17202d"/>
    <directionalLight position={[320,500,260]} intensity={3.6}/>
    <directionalLight position={[-250,250,340]} intensity={2.2}/>
    <pointLight position={[-220,190,320]} intensity={32000} distance={1100}/>
    <Environment preset="city" environmentIntensity={.85}/>
    <gridHelper args={[1200,24,"#29384b","#1c2735"]} position={[0,-75,110]}/>
    <mesh geometry={flange} position={[0,0,-p.flangeThickness/2]} castShadow receiveShadow>
      <meshStandardMaterial color={outsideColor} metalness={metal} roughness={.3} side={THREE.DoubleSide}/>
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
    {isWedge && wedge ? (
      <mesh geometry={wedge} position={[0,p.runnerRise,plenumZ]} castShadow receiveShadow>
        <meshStandardMaterial color={plenumColor} metalness={metal} roughness={p.method==="tig"?.31:.25} side={THREE.DoubleSide} transparent={ghost} opacity={ghost?.27:1} depthWrite={!ghost}/>
      </mesh>
    ):isBox ? (
      <mesh position={[0,p.runnerRise,plenumZ]} castShadow>
        <boxGeometry args={[dims.plenumLength,dims.plenumHeight,dims.plenumDepth]}/>
        <meshStandardMaterial color={plenumColor} metalness={metal} roughness={p.method==="tig"?.35:.24} transparent={ghost} opacity={ghost?.27:1} depthWrite={!ghost}/>
      </mesh>
    ):(
      <mesh position={[0,p.runnerRise,plenumZ]} rotation={[0,0,Math.PI/2]} scale={[1,1,dims.plenumDepth/dims.plenumHeight]} castShadow>
        <cylinderGeometry args={[topRadius,bottomRadius,dims.plenumLength,64,1,false]}/>
        <meshStandardMaterial color={plenumColor} metalness={metal} roughness={p.method==="tig"?.3:.24} transparent={ghost} opacity={ghost?.28:1} depthWrite={!ghost}/>
      </mesh>
    )}
    {p.method==="cnc" && !isWedge && !isBox && [-1,1].map(s=>(
      <mesh key={s} position={[s*(dims.plenumLength/2-12),p.runnerRise,plenumZ]} rotation={[0,0,Math.PI/2]} scale={[1,1,dims.plenumDepth/dims.plenumHeight]}>
        <cylinderGeometry args={[dims.plenumHeight/2+3,dims.plenumHeight/2+3,7,64]}/>
        <meshStandardMaterial color="#385572" metalness={.82} roughness={.28} transparent={ghost} opacity={ghost?.35:1} depthWrite={!ghost}/>
      </mesh>
    ))}
    {p.method==="tig" && !isWedge && !isBox && [-1,1].map(s=>(
      <mesh key={s} position={[s*(dims.plenumLength/2-7),p.runnerRise,plenumZ]} rotation={[0,0,Math.PI/2]} scale={[1,1,dims.plenumDepth/dims.plenumHeight]}>
        <cylinderGeometry args={[s===-1?topRadius+1:bottomRadius+1,s===-1?topRadius+1:bottomRadius+1,3,64]}/>
        <meshStandardMaterial color="#d9e0e7" metalness={.75} roughness={.32} transparent={ghost} opacity={ghost?.35:1} depthWrite={!ghost}/>
      </mesh>
    ))}
    {p.method==="tig" && stations.map((x,i)=>(
      <mesh key={"weld-"+i} position={[x+p.runnerOffset,p.runnerRise,p.runnerReach+2]}>
        <torusGeometry args={[dims.runnerOutside/2+1.2,1.5,8,48]}/>
        <meshStandardMaterial color="#d2dce3" metalness={.75} roughness={.34} transparent={ghost} opacity={ghost?.22:1} depthWrite={!ghost}/>
      </mesh>
    ))}
    {p.injectorBosses && <>
      {stations.map((x,i)=>(
        <group key={"injector-"+i} position={[x, p.runnerRise*.24, p.runnerReach*.32]}>
          <mesh rotation={[Math.PI*.28,0,0]}>
            <cylinderGeometry args={[9,10,30,16,1,true]}/>
            <meshStandardMaterial color="#c4d5df" metalness={.79} roughness={.3} side={THREE.DoubleSide}/>
          </mesh>
          <mesh position={[0,14,-8]} rotation={[Math.PI*.28,0,0]}>
            <cylinderGeometry args={[7,7,4,16]}/>
            <meshStandardMaterial color="#1e293b" metalness={.2} roughness={.7}/>
          </mesh>
        </group>
      ))}
      <mesh position={[0,-dims.runnerOutside*.95,p.runnerReach*.25]}>
        <boxGeometry args={[dims.span+75,12,15]}/>
        <meshStandardMaterial color="#202630" metalness={.62} roughness={.34}/>
      </mesh>
    </>}
    {p.vacuumPorts && [0,1].map((i)=>(
      <group key={"vacuum-"+i} position={[(i===0?.1:.3)*dims.span*-throttleSign,p.runnerRise+dims.plenumHeight*.48,plenumZ]}>
        <mesh>
          <cylinderGeometry args={[7,8,22,18,1,true]}/>
          <meshStandardMaterial color="#cad4dd" metalness={.77} roughness={.3} side={THREE.DoubleSide}/>
        </mesh>
        <mesh position={[0,12,0]} rotation={[Math.PI/2,0,0]}>
          <torusGeometry args={[7,1.6,7,18]}/>
          <meshStandardMaterial color="#dce3eb" metalness={.7} roughness={.3}/>
        </mesh>
      </group>
    ))}
    <group position={[throttleSign*(dims.plenumLength/2+18),p.runnerRise,plenumZ]} rotation={[0,0,p.throttleAngle*Math.PI/180]}>
      <mesh rotation={[0,0,Math.PI/2]}>
        <cylinderGeometry args={[p.throttleDiameter/2+4,p.throttleDiameter/2+4,44,48,1,true]}/>
        <meshStandardMaterial color="#c4d0db" metalness={.85} roughness={.25} side={THREE.DoubleSide}/>
      </mesh>
      <mesh geometry={throttlePlate} position={[throttleSign*26,0,0]} rotation={[0,throttleSign*Math.PI/2,0]}>
        <meshStandardMaterial color={p.method==="tig"?"#dee7ec":"#8facc2"} metalness={.79} roughness={.29} side={THREE.DoubleSide}/>
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
