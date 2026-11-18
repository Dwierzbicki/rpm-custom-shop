"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Grid, OrbitControls, Sparkles } from "@react-three/drei";
import { DoubleSide, Group, Mesh, Quaternion, Vector2, Vector3 } from "three";
import type { EngineParams } from "./model";
import { calculateCompression } from "./model";

export type CameraView = "perspective" | "front" | "side" | "top";

type Props = {
  params: EngineParams;
  running: boolean;
  rpm: number;
  angle: number;
  onAngle: (angle: number) => void;
  view: CameraView;
  xray: boolean;
  showGas: boolean;
};

const steel = { color: "#bcc6d0", metalness: 0.94, roughness: 0.26 };
const darkSteel = { color: "#3c4a58", metalness: 0.9, roughness: 0.37 };
const titanium = { color: "#8b99a8", metalness: 0.9, roughness: 0.3 };
const gold = { color: "#d9a24b", metalness: 0.8, roughness: 0.29 };

function CameraViews({ view }: { view: CameraView }) {
  const { camera } = useThree();
  useEffect(() => {
    const positions: Record<CameraView, [number, number, number]> = {
      perspective: [6.4, 2.2, 9.4],
      front: [0, 0.5, 11.2],
      side: [11, 0.6, 0.1],
      top: [0.01, 11.5, 0.01],
    };
    camera.position.set(...positions[view]);
    camera.lookAt(0, 0.1, 0);
    camera.updateProjectionMatrix();
  }, [camera, view]);
  return null;
}

function TorusRing({ y, radius, color = "#8ca0b5", thickness = 0.024 }: {
  y: number; radius: number; color?: string; thickness?: number;
}) {
  return <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, y, 0]}>
    <torusGeometry args={[radius, thickness, 9, 80]} />
    <meshStandardMaterial color={color} metalness={0.85} roughness={0.28} />
  </mesh>;
}

function EngineMechanics({ params, running, rpm, angle, onAngle, xray, showGas }: Omit<Props, "view">) {
  const compression = useMemo(() => calculateCompression(params), [params]);
  const scale = 1.76 / 84; // Fixed world scale: changing the bore changes the visible cylinder.
  const radius = params.bore * scale / 2;
  const deckY = 2.05;
  const crankRadius = params.stroke * scale / 2;
  const rodLength = params.rodLength * scale;
  const pinToCrown = 0.56;
  const crankCenterY = deckY - params.deckClearance * scale - pinToCrown - (rodLength + crankRadius);
  const chamberEquivalentHeight = compression.valid
    ? Math.max(0.08, compression.clearance * 1000 / (Math.PI * params.bore * params.bore / 4) * scale)
    : 0.14;
  const roofY = deckY + chamberEquivalentHeight;
  const linerHeight = params.stroke * scale + 1.18;
  const angleRef = useRef(angle);
  const ticker = useRef(0);
  const pistonRef = useRef<Group>(null);
  const wristRef = useRef<Group>(null);
  const rodRef = useRef<Group>(null);
  const crankRef = useRef<Group>(null);
  const gasRef = useRef<Mesh>(null);
  const rodDirection = useMemo(() => new Vector3(), []);
  const upright = useMemo(() => new Vector3(0, 1, 0), []);
  const rodRotation = useMemo(() => new Quaternion(), []);

  useEffect(() => {
    if (!running) angleRef.current = angle;
  }, [angle, running]);

  useFrame((_, delta) => {
    if (running) {
      // Animation is visually capped to avoid huge jumps after a suspended tab.
      angleRef.current = (angleRef.current + Math.min(delta, 0.04) * rpm * 6) % 360;
    }
    const a = angleRef.current * Math.PI / 180;
    const x = crankRadius * Math.sin(a);
    const crankPinY = crankCenterY + crankRadius * Math.cos(a);
    const wristY = crankPinY + Math.sqrt(Math.max(0, rodLength * rodLength - x * x));
    const pistonTop = wristY + pinToCrown;

    if (pistonRef.current) pistonRef.current.position.set(0, pistonTop - 0.38, 0);
    if (wristRef.current) wristRef.current.position.set(0, wristY, 0);
    if (crankRef.current) crankRef.current.rotation.z = -a;
    if (rodRef.current) {
      rodRef.current.position.set(x / 2, (crankPinY + wristY) / 2, 0);
      rodDirection.set(-x, wristY - crankPinY, 0).normalize();
      rodRotation.setFromUnitVectors(upright, rodDirection);
      rodRef.current.quaternion.copy(rodRotation);
    }
    if (gasRef.current) {
      const height = Math.max(0.015, roofY - pistonTop);
      gasRef.current.position.y = (pistonTop + roofY) / 2;
      gasRef.current.scale.y = height;
      gasRef.current.visible = showGas && compression.valid;
    }
    if (running) {
      ticker.current += delta;
      if (ticker.current >= 0.09) {
        onAngle(angleRef.current);
        ticker.current = 0;
      }
    }
  });

  return <group>
    {/* A deliberately open front quarter of the liner reveals the actual mechanism. */}
    <mesh position={[0, deckY - linerHeight / 2, 0]}>
      <cylinderGeometry args={[radius + 0.12, radius + 0.12, linerHeight, 84, 1, true, 0.78, Math.PI * 2 - 1.56]} />
      <meshPhysicalMaterial color="#536878" metalness={0.72} roughness={0.25} transparent opacity={xray ? 0.12 : 0.42} side={DoubleSide} depthWrite={false} />
    </mesh>
    <mesh position={[0, deckY - linerHeight / 2, 0]}>
      <cylinderGeometry args={[radius + 0.012, radius + 0.012, linerHeight - 0.03, 84, 1, true, 0.78, Math.PI * 2 - 1.56]} />
      <meshPhysicalMaterial color="#c2d1de" metalness={0.9} roughness={0.17} transparent opacity={xray ? 0.15 : 0.52} side={DoubleSide} depthWrite={false} />
    </mesh>
    <TorusRing y={deckY} radius={radius + 0.08} color="#e2e6e8" thickness={0.037} />
    <TorusRing y={deckY - linerHeight} radius={radius + 0.1} color="#64798b" thickness={0.035} />
    <TorusRing y={deckY - linerHeight * 0.5} radius={radius + 0.14} color="#596675" thickness={0.03} />
    <TorusRing y={deckY + params.gasketThickness * scale * 0.45} radius={radius + 0.065} color="#f9a749" thickness={Math.max(0.015, params.gasketThickness * scale * 0.55)} />

    {/* Cylinder head: back wall, two side pillars, roof and valve hardware. */}
    <mesh position={[0, roofY + 0.3, -0.62]} castShadow>
      <boxGeometry args={[radius * 2 + 0.65, 0.67, 0.35]} />
      <meshStandardMaterial {...darkSteel} />
    </mesh>
    {[-1, 1].map(side => <mesh key={side} position={[side * (radius + 0.22), roofY + 0.12, -0.18]} castShadow>
      <boxGeometry args={[0.27, 0.77, 0.83]} />
      <meshStandardMaterial {...darkSteel} />
    </mesh>)}
    <mesh position={[0, roofY + 0.63, -0.12]} castShadow>
      <boxGeometry args={[radius * 2 + 0.72, 0.18, 1.7]} />
      <meshStandardMaterial {...steel} />
    </mesh>
    <mesh position={[0, roofY + 0.71, -0.1]}>
      <boxGeometry args={[radius * 2 + 0.4, 0.075, 1.5]} />
      <meshStandardMaterial color="#1a2838" metalness={0.7} roughness={0.34} />
    </mesh>
    {[-0.54, 0.54].map((offset, i) => <group key={i} position={[offset, roofY + 0.03, -0.38]}>
      <mesh rotation={[0, 0, offset * 0.2]}>
        <cylinderGeometry args={[0.065, 0.065, 0.45, 24]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.17, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.07, 32]} />
        <meshStandardMaterial {...titanium} />
      </mesh>
    </group>)}
    <group position={[0, roofY + 0.35, 0.16]} rotation={[0, 0, -0.13]}>
      <mesh>
        <cylinderGeometry args={[0.075, 0.075, 0.66, 16]} />
        <meshStandardMaterial color="#e7e1c8" metalness={0.3} roughness={0.38} />
      </mesh>
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.035, 0.055, 0.18, 14]} />
        <meshStandardMaterial {...gold} />
      </mesh>
    </group>

    {/* This highlighted volume has the same equivalent bore-area clearance
        volume as the calculator, even though the head chamber is schematic. */}
    <mesh ref={gasRef} position={[0, roofY - 0.1, 0]}>
      <cylinderGeometry args={[radius - 0.048, radius - 0.048, 1, 72, 1, false]} />
      <meshPhysicalMaterial color="#ff6535" emissive="#ff2c10" emissiveIntensity={0.55} transparent opacity={0.17} roughness={0.25} depthWrite={false} />
    </mesh>
    <pointLight position={[0, deckY + 0.1, 0.35]} color="#ff6b2d" intensity={showGas ? 2.2 : 0.3} distance={3.4} />

    {/* Piston crown, barrel, ring pack, skirt and wrist pin all move together. */}
    <group ref={pistonRef}>
      <mesh castShadow>
        <cylinderGeometry args={[radius - 0.045, radius - 0.065, 0.75, 72, 1, true]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      {params.pistonCc > 0.2 ? (
        <mesh castShadow>
          <latheGeometry args={[[
            new Vector2(0, 0.39 - Math.min(0.22, params.pistonCc * 0.012)),
            new Vector2(radius * 0.35, 0.39 - Math.min(0.2, params.pistonCc * 0.01)),
            new Vector2(radius * 0.69, 0.39 - Math.min(0.11, params.pistonCc * 0.006)),
            new Vector2(radius * 0.86, 0.39),
            new Vector2(radius - 0.04, 0.39),
          ], 72]} />
          <meshStandardMaterial color="#dce4e9" metalness={0.95} roughness={0.2} side={DoubleSide} />
        </mesh>
      ) : (
        <mesh position={[0, 0.39, 0]} castShadow>
          <cylinderGeometry args={[radius - 0.04, radius - 0.04, 0.045, 72]} />
          <meshStandardMaterial color="#dce4e9" metalness={0.95} roughness={0.18} />
        </mesh>
      )}
      {params.pistonCc < -0.2 && <mesh position={[0, 0.41, 0]} scale={[radius * 0.78, Math.min(0.28, -params.pistonCc * 0.013), radius * 0.78]} castShadow>
        <sphereGeometry args={[1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#d2dce5" metalness={0.95} roughness={0.22} />
      </mesh>}
      {[-0.02, -0.12, -0.22].map((pos, i) => (
        <mesh key={i} position={[0, pos, 0]}>
          <cylinderGeometry args={[radius - 0.023, radius - 0.023, 0.028, 72]} />
          <meshStandardMaterial color={i === 2 ? "#b0a384" : "#232f3e"} metalness={0.9} roughness={0.22} />
        </mesh>
      ))}
      <mesh position={[0, -0.35, 0]} castShadow>
        <cylinderGeometry args={[radius - 0.13, radius - 0.14, 0.31, 72]} />
        <meshStandardMaterial {...titanium} />
      </mesh>
    </group>
    <group ref={wristRef}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, radius * 1.75, 36]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      <mesh position={[0, 0, radius * 0.88]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.045, 36]} />
        <meshStandardMaterial color="#2c3846" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>

    {/* Crank and rod follow the exact slider-crank motion used by volumeAtAngle. */}
    <group ref={rodRef}>
      <mesh castShadow>
        <cylinderGeometry args={[0.18, 0.25, rodLength - 0.17, 14]} />
        <meshStandardMaterial {...titanium} />
      </mesh>
      {[-1, 1].map((end, i) => <group key={i} position={[0, end * rodLength / 2, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[end > 0 ? 0.23 : 0.34, end > 0 ? 0.23 : 0.34, 0.32, 36]} />
          <meshStandardMaterial {...steel} />
        </mesh>
        <mesh position={[0, 0, 0.17]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[end > 0 ? 0.12 : 0.2, 0.055, 10, 48]} />
          <meshStandardMaterial {...gold} />
        </mesh>
      </group>)}
    </group>
    <group position={[0, crankCenterY, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.23, 0.23, 2.05, 42]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      <group ref={crankRef}>
        {[-0.35, 0.35].map((z, i) => <group key={i} position={[0, 0, z]}>
          <mesh position={[0, crankRadius * 0.21, 0]} castShadow>
            <boxGeometry args={[0.48, crankRadius * 1.6, 0.19]} />
            <meshStandardMaterial {...darkSteel} />
          </mesh>
          <mesh position={[0, -crankRadius * 0.45, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.53, 0.45, 0.2, 32]} />
            <meshStandardMaterial {...titanium} />
          </mesh>
          <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.29, 0.29, 0.22, 36]} />
            <meshStandardMaterial {...steel} />
          </mesh>
        </group>)}
        <mesh position={[0, crankRadius, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.92, 36]} />
          <meshStandardMaterial {...gold} />
        </mesh>
      </group>
      <mesh position={[0, 0, -0.85]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.58, 0.58, 0.11, 52]} />
        <meshStandardMaterial {...darkSteel} />
      </mesh>
      <mesh position={[0, 0, -0.92]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.43, 0.045, 10, 70]} />
        <meshStandardMaterial {...steel} />
      </mesh>
    </group>

    {/* A few stationary details give the cutaway its technical scale. */}
    <mesh position={[-radius - 0.28, deckY - linerHeight / 2, -0.62]}>
      <boxGeometry args={[0.15, linerHeight + 0.13, 0.24]} />
      <meshStandardMaterial {...darkSteel} />
    </mesh>
    <mesh position={[radius + 0.28, deckY - linerHeight / 2, -0.62]}>
      <boxGeometry args={[0.15, linerHeight + 0.13, 0.24]} />
      <meshStandardMaterial {...darkSteel} />
    </mesh>
  </group>;
}

export default function CrEngineScene(props: Props) {
  return <Canvas
    dpr={[1, 1.8]}
    camera={{ position: [6.4, 2.2, 9.4], fov: 34, near: 0.1, far: 70 }}
    gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    fallback={<div style={{ padding: 24, color: "#fff" }}>Podgląd 3D wymaga przeglądarki obsługującej WebGL.</div>}
  >
    <color attach="background" args={["#090e16"]} />
    <fog attach="fog" args={["#090e16", 10, 21]} />
    <ambientLight intensity={0.76} />
    <hemisphereLight args={["#c7e3ff", "#1e2732", 1.3]} />
    <directionalLight position={[4.5, 8, 6]} color="#fff4ea" intensity={4.0} castShadow />
    <spotLight position={[-5, 3, 5]} color="#6baefc" intensity={90} angle={0.55} penumbra={0.75} distance={20} />
    <pointLight position={[2.8, -2.5, -2]} color="#eb3555" intensity={9} distance={9} />
    <Sparkles count={32} scale={[8, 7, 4]} size={1.5} speed={0.18} color="#627f9e" />
    <Grid position={[0, -3.5, 0]} args={[16, 16]} cellSize={0.7} sectionSize={3.5} cellColor="#1d2a37" sectionColor="#32485b" fadeDistance={13} fadeStrength={1.6} infiniteGrid={false} />
    <EngineMechanics {...props} />
    <CameraViews view={props.view} />
    <OrbitControls target={[0, 0.1, 0]} enablePan={false} enableDamping dampingFactor={0.08} minDistance={5.0} maxDistance={16} minPolarAngle={0.08} maxPolarAngle={Math.PI - 0.15} />
  </Canvas>;
}
