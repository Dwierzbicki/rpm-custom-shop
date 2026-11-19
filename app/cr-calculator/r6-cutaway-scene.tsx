"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import { DoubleSide, Group, Mesh, MeshBasicMaterial, Quaternion, Vector2, Vector3 } from "three";
import { calculateCompression, type EngineParams } from "./model";

export type R6View = "perspective" | "front" | "side" | "top";
export type R6Mode = "complete" | "bottom" | "head";
export type R6SceneProps = {
  params: EngineParams;
  running: boolean;
  rpm: number;
  angle: number;
  onAngle: (degrees: number) => void;
  view: R6View;
  mode: R6Mode;
  selectedCylinder: number;
  focusCylinder: boolean;
  xray: boolean;
  showGas: boolean;
};

// Front cylinder 1 is at the left, timing end at the right.
// Standard R6 1-5-3-6-2-4, power TDC offsets in a 720° cycle.
export const FIRING_ORDER = [1, 5, 3, 6, 2, 4] as const;
export const FIRING_AT = [0, 480, 240, 600, 120, 360] as const;
// Pairs 1/6, 2/5, 3/4 share crank throw planes (120° separation).
const CRANK_OFFSET = [0, 240, 120, 120, 240, 0] as const;
const WORLD_SCALE = 1.76 / 84;
const CAST = { color: "#526171", metalness: 0.76, roughness: 0.42 } as const;
const ALLOY = { color: "#c0c9d1", metalness: 0.84, roughness: 0.26 } as const;
const FORGED = { color: "#d9e1e7", metalness: 0.93, roughness: 0.23 } as const;
const STEEL = { color: "#8495a5", metalness: 0.85, roughness: 0.32 } as const;
const IRON = { color: "#344452", metalness: 0.66, roughness: 0.5 } as const;
const COPPER = { color: "#cd9064", metalness: 0.75, roughness: 0.32 } as const;
const near = (a: number) => ((a % 720) + 720) % 720;
const phaseFor = (angle: number, index: number) => near(angle - FIRING_AT[index]);
const liftFor = (phase: number, start: number, end: number) =>
  phase > start && phase < end ? Math.pow(Math.sin(Math.PI * (phase - start) / (end - start)), 2) * 0.23 : 0;

function Axle({ radius, length, tone = "steel" }: { radius: number; length: number; tone?: "steel" | "dark" | "copper" }) {
  return <mesh rotation={[0, 0, Math.PI / 2]}>
    <cylinderGeometry args={[radius, radius, length, 24]} />
    {tone === "dark" ? <meshStandardMaterial {...IRON} /> :
      tone === "copper" ? <meshStandardMaterial {...COPPER} /> : <meshStandardMaterial {...FORGED} />}
  </mesh>;
}

function Ring({ radius, y, dark = false }: { radius: number; y: number; dark?: boolean }) {
  return <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, y, 0]}>
    <torusGeometry args={[radius, 0.017, 7, 48]} />
    <meshStandardMaterial color={dark ? "#303944" : "#cda278"} metalness={0.9} roughness={0.23} />
  </mesh>;
}

function Piston({ radius, pistonCc }: { radius: number; pistonCc: number }) {
  const dish = Math.min(0.18, Math.max(0, pistonCc) * 0.0065);
  const dome = Math.min(0.18, Math.max(0, -pistonCc) * 0.01);
  const points = useMemo(() => [
    new Vector2(0, 0.405 - dish), new Vector2(radius * 0.42, 0.405 - dish * 0.8),
    new Vector2(radius * 0.78, 0.405 - dish * 0.13),
    new Vector2(radius - 0.045, 0.405),
  ], [radius, dish]);
  return <group>
    <mesh>
      <cylinderGeometry args={[radius - 0.05, radius - 0.095, 0.77, 50, 1, true]} />
      <meshStandardMaterial {...FORGED} side={DoubleSide} />
    </mesh>
    <mesh><latheGeometry args={[points, 50]} /><meshStandardMaterial {...FORGED} side={DoubleSide} /></mesh>
    {dome > 0 && <mesh position={[0, 0.402, 0]} scale={[radius * 0.72, dome, radius * 0.72]}>
      <sphereGeometry args={[1, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial {...ALLOY} />
    </mesh>}
    <Ring radius={radius - 0.034} y={0.29} dark />
    <Ring radius={radius - 0.034} y={0.19} dark />
    <Ring radius={radius - 0.034} y={0.07} />
    <mesh position={[0, -0.34, 0]}>
      <cylinderGeometry args={[radius - 0.1, radius - 0.14, 0.29, 48, 1, true]} />
      <meshStandardMaterial {...ALLOY} side={DoubleSide} />
    </mesh>
    <group position={[0, -0.13, 0]}><Axle radius={0.15} length={radius * 1.64} /></group>
    {[-1, 1].map(side => <group key={side} position={[side * (radius - 0.07), -0.13, 0]}>
      <Axle radius={0.18} length={0.05} tone="dark" />
    </group>)}
  </group>;
}

function Rod({ length }: { length: number }) {
  return <group>
    <mesh><boxGeometry args={[0.18, Math.max(0.4, length - 0.42), 0.25]} /><meshStandardMaterial {...ALLOY} /></mesh>
    {[-1, 1].map(side => <mesh key={side} position={[side * 0.105, 0, 0]}>
      <boxGeometry args={[0.09, Math.max(0.4, length - 0.46), 0.34]} />
      <meshStandardMaterial {...FORGED} />
    </mesh>)}
    <group position={[0, length / 2, 0]}>
      <Axle radius={0.18} length={0.31} />
      <Axle radius={0.115} length={0.38} tone="copper" />
    </group>
    <group position={[0, -length / 2, 0]}>
      <Axle radius={0.32} length={0.42} tone="dark" />
      <Axle radius={0.2} length={0.47} tone="copper" />
      <mesh position={[0, -0.07, 0]}>
        <boxGeometry args={[0.44, 0.09, 0.58]} />
        <meshStandardMaterial {...ALLOY} />
      </mesh>
      {[-0.2, 0.2].map(z => <group key={z} position={[0, -0.13, z]}>
        <Axle radius={0.047} length={0.5} />
      </group>)}
    </group>
  </group>;
}

function CrankThrow({ throwRadius }: { throwRadius: number }) {
  return <group>
    {[-0.28, 0.28].map(x => <group key={x} position={[x, 0, 0]}>
      <mesh position={[0, throwRadius * 0.07, 0]}>
        <boxGeometry args={[0.13, throwRadius * 1.4 + 0.38, 0.4]} />
        <meshStandardMaterial {...CAST} />
      </mesh>
      <group position={[0, -throwRadius * 0.48, 0]}>
        <Axle radius={0.36} length={0.15} tone="dark" />
      </group>
      <group position={[0, 0, 0]}><Axle radius={0.25} length={0.19} /></group>
    </group>)}
    <group position={[0, throwRadius, 0]}><Axle radius={0.20} length={0.72} tone="copper" /></group>
  </group>;
}

function Liner({ radius, top, bottom, xray, emphasis }: {
  radius: number; top: number; bottom: number; xray: boolean; emphasis: boolean;
}) {
  const height = top - bottom;
  return <group position={[0, (top + bottom) / 2, 0]}>
    {/* Missing front 125° sector: visible piston, wall thickness and cut edge. */}
    <mesh>
      <cylinderGeometry args={[radius + 0.115, radius + 0.115, height, 56, 1, true, 2.68, 3.95]} />
      <meshStandardMaterial {...CAST} side={DoubleSide} transparent opacity={xray ? 0.14 : 0.92} depthWrite={!xray} />
    </mesh>
    <mesh>
      <cylinderGeometry args={[radius + 0.013, radius + 0.013, height - 0.03, 56, 1, true, 2.68, 3.95]} />
      <meshStandardMaterial color="#b2c1cc" metalness={0.86} roughness={0.24}
        side={DoubleSide} transparent opacity={xray ? 0.2 : 0.85} depthWrite={false} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height / 2, 0]}>
      <torusGeometry args={[radius + 0.046, 0.035, 8, 48, Math.PI * 2]} />
      <meshStandardMaterial color={emphasis ? "#eaa66e" : "#c1c9d0"} metalness={0.89} roughness={0.24} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -height / 2, 0]}>
      <torusGeometry args={[radius + 0.06, 0.031, 8, 48]} />
      <meshStandardMaterial {...STEEL} />
    </mesh>
  </group>;
}

function Valve({
  index, position, register,
}: {
  index: number;
  position: [number, number, number];
  register: (index: number, el: Group | null) => void;
}) {
  return <group position={position}>
    <group ref={el => { register(index, el); }}>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.039, 0.039, 0.65, 12]} />
        <meshStandardMaterial {...FORGED} />
      </mesh>
      <mesh position={[0, -0.21, 0]}>
        <cylinderGeometry args={[0.058, 0.17, 0.12, 20]} />
        <meshStandardMaterial {...FORGED} />
      </mesh>
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.038, 20]} />
        <meshStandardMaterial {...ALLOY} />
      </mesh>
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.065, 20]} />
        <meshStandardMaterial {...STEEL} />
      </mesh>
    </group>
    {[0, 1, 2, 3].map(i => <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.13 + i * 0.076, 0]}>
      <torusGeometry args={[0.11, 0.018, 6, 17]} />
      <meshStandardMaterial {...STEEL} />
    </mesh>)}
  </group>;
}

function CameraRig({ view, mode, focus, selectedCylinder, pitch }: {
  view: R6View; mode: R6Mode; focus: boolean; selectedCylinder: number; pitch: number;
}) {
  const { camera, size } = useThree();
  const x = focus ? (selectedCylinder - 3.5) * pitch : 0;
  const targetY = mode === "head" ? 2.9 : mode === "bottom" ? -0.8 : 0.1;
  useEffect(() => {
    const narrow = size.width / Math.max(1, size.height) < 1.35;
    const distance = focus ? 8.7 : mode === "head" ? 14.1 : mode === "bottom" ? 15.5 : narrow ? 17.5 : 17.8;
    const positions: Record<R6View, [number, number, number]> = {
      perspective: [x + (focus ? 2.0 : 3.5), 2.8, distance],
      front: [x, 0.3, distance],
      side: [x + distance, 0.5, 1],
      top: [x + 0.01, distance, 0.01],
    };
    camera.position.set(...positions[view]);
    camera.lookAt(x, targetY, 0);
    camera.updateProjectionMatrix();
  }, [camera, view, mode, focus, x, targetY, size.width, size.height]);
  return null;
}

function RealisticR6({
  params, running, rpm, angle, onAngle, mode, selectedCylinder, xray, showGas,
}: Omit<R6SceneProps, "view" | "focusCylinder">) {
  const ratio = useMemo(() => calculateCompression(params), [params]);
  const boreRadius = params.bore * WORLD_SCALE / 2;
  const pitch = params.bore * WORLD_SCALE + 0.22;
  const positions = useMemo(() => Array.from({ length: 6 }, (_, i) => (i - 2.5) * pitch), [pitch]);
  const throwRadius = params.stroke * WORLD_SCALE / 2;
  const rodLength = params.rodLength * WORLD_SCALE;
  const deck = 1.96;
  const pinToCrown = 0.53;
  const crankY = deck - params.deckClearance * WORLD_SCALE - pinToCrown - rodLength - throwRadius;
  const boreBottom = deck - params.stroke * WORLD_SCALE - 0.96;
  const pistonTdc = deck - params.deckClearance * WORLD_SCALE;
  const equivalentHeight = ratio.valid
    ? Math.max(0.05, ratio.clearance * 1000 / (Math.PI * params.bore * params.bore / 4) * WORLD_SCALE) : 0.12;
  const roof = pistonTdc + equivalentHeight;
  const width = positions[5] - positions[0] + boreRadius * 2 + 0.95;
  const left = positions[0] - boreRadius - 0.46;
  const right = positions[5] + boreRadius + 0.46;
  const midY = (deck + crankY) / 2;
  const blockH = deck - crankY + 0.44;

  const crankAngle = useRef(angle);
  const tick = useRef(0);
  const pistons = useRef<(Group | null)[]>([]);
  const rods = useRef<(Group | null)[]>([]);
  const crankThrows = useRef<(Group | null)[]>([]);
  const volumes = useRef<(Mesh | null)[]>([]);
  const valves = useRef<(Group | null)[]>([]);
  const cams = useRef<(Group | null)[]>([]);
  const flywheel = useRef<Group>(null);
  const camGearA = useRef<Group>(null);
  const camGearB = useRef<Group>(null);
  const v = useMemo(() => new Vector3(), []);
  const up = useMemo(() => new Vector3(0, 1, 0), []);
  const q = useMemo(() => new Quaternion(), []);

  useEffect(() => { if (!running) crankAngle.current = angle; }, [running, angle]);

  useFrame((_, delta) => {
    if (running) crankAngle.current = near(crankAngle.current + Math.min(delta, 0.045) * rpm * 6);
    const radians = Math.PI / 180;
    const theta = crankAngle.current;
    for (let i = 0; i < 6; i++) {
      const crankA = (theta + CRANK_OFFSET[i]) * radians;
      const pinZ = throwRadius * Math.sin(crankA);
      const pinY = crankY + throwRadius * Math.cos(crankA);
      const wristY = pinY + Math.sqrt(Math.max(0, rodLength * rodLength - pinZ * pinZ));
      const top = wristY + pinToCrown;
      if (pistons.current[i]) pistons.current[i].position.y = top - 0.405;
      if (crankThrows.current[i]) crankThrows.current[i].rotation.x = crankA;
      if (rods.current[i]) {
        const r = rods.current[i];
        r.position.set(positions[i], (pinY + wristY) / 2, pinZ / 2);
        v.set(0, wristY - pinY, -pinZ).normalize();
        q.setFromUnitVectors(up, v);
        r.quaternion.copy(q);
      }
      const gas = volumes.current[i];
      if (gas) {
        const h = Math.max(0.01, roof - top);
        gas.position.y = top + h / 2;
        gas.scale.y = h;
        gas.visible = ratio.valid && showGas && mode === "complete";
        const phase = phaseFor(theta, i);
        const mat = gas.material as MeshBasicMaterial;
        mat.color.set(phase < 180 ? "#ff6436" : phase < 360 ? "#b2beca" : phase < 540 ? "#419de9" : "#e5b964");
        mat.opacity = selectedCylinder === i + 1 ? 0.26 : 0.11;
      }
      const phase = phaseFor(theta, i);
      // Four-valve head, two intake and two exhaust valves for each cylinder.
      const exhaustLift = liftFor(phase, 170, 372);
      const intakeLift = liftFor(phase, 348, 555);
      for (let k = 0; k < 4; k++) {
        const valve = valves.current[i * 4 + k];
        if (valve) valve.position.y = k < 2 ? -intakeLift : -exhaustLift;
      }
    }
    cams.current.forEach(cam => { if (cam) cam.rotation.x = theta * radians * 0.5; });
    if (camGearA.current) camGearA.current.rotation.x = theta * radians * 0.5;
    if (camGearB.current) camGearB.current.rotation.x = theta * radians * 0.5;
    if (flywheel.current) flywheel.current.rotation.x = theta * radians;
    if (running) {
      tick.current += delta;
      if (tick.current > 0.09) {
        onAngle(crankAngle.current);
        tick.current = 0;
      }
    }
  });

  const showBottom = mode !== "head";
  const showHead = mode !== "bottom";
  const valveRegister = (i: number, el: Group | null) => { valves.current[i] = el; };

  return <group>
    {/* Continuous cast block, genuinely OPEN towards viewer, not six separate blocks. */}
    {showBottom && <group>
      <mesh position={[0, midY, -boreRadius - 0.23]}>
        <boxGeometry args={[width, blockH, 0.24]} />
        <meshStandardMaterial {...CAST} transparent opacity={xray ? 0.12 : 1} depthWrite={!xray} />
      </mesh>
      <mesh position={[0, deck + 0.08, -boreRadius - 0.2]}>
        <boxGeometry args={[width, 0.18, 0.5]} />
        <meshStandardMaterial {...ALLOY} />
      </mesh>
      {[left, right].map(x => <group key={x} position={[x, midY, -0.36]}>
        <mesh><boxGeometry args={[0.23, blockH, 1.34]} /><meshStandardMaterial {...CAST} transparent opacity={xray ? 0.18 : 1} /></mesh>
      </group>)}
      {positions.slice(0, 5).map((xi, i) => <mesh key={i} position={[xi + pitch / 2, midY, -boreRadius * 0.6]}>
        <boxGeometry args={[0.19, blockH, 0.65]} />
        <meshStandardMaterial {...CAST} transparent opacity={xray ? 0.18 : 0.94} />
      </mesh>)}
      {positions.map((x, i) => <group key={i} position={[x, 0, 0]}>
        <Liner radius={boreRadius} top={deck} bottom={boreBottom} xray={xray} emphasis={i + 1 === selectedCylinder} />
        <mesh position={[0, deck + 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[boreRadius + 0.07, 0.022, 7, 45]} />
          <meshStandardMaterial {...COPPER} />
        </mesh>
        <group ref={el => { pistons.current[i] = el; }}>
          <Piston radius={boreRadius} pistonCc={params.pistonCc} />
        </group>
        <group ref={el => { rods.current[i] = el; }}>
          <Rod length={rodLength} />
        </group>
      </group>)}
      {/* Seven mains and six throws on ONE in-line crankshaft, rotating about the X axis. */}
      <group position={[0, crankY, 0]}>
        <Axle radius={0.23} length={width + 1.3} />
        {positions.map((x, i) => <group key={i} position={[x, 0, 0]} ref={el => { crankThrows.current[i] = el; }}>
          <CrankThrow throwRadius={throwRadius} />
        </group>)}
        {Array.from({ length: 7 }, (_, i) => <group key={i} position={[positions[0] - pitch / 2 + i * pitch, 0, 0]}>
          <Axle radius={0.30} length={0.21} tone="dark" />
        </group>)}
        <group position={[left - 0.43, 0, 0]} ref={flywheel}>
          <Axle radius={1.08} length={0.21} tone="dark" />
          <Axle radius={0.84} length={0.25} />
          {Array.from({ length: 12 }, (_, i) => {
            const a = i * Math.PI / 6;
            return <group key={i} position={[-0.13, Math.cos(a) * 0.87, Math.sin(a) * 0.87]}>
              <Axle radius={0.075} length={0.1} tone="dark" />
            </group>;
          })}
        </group>
        <group position={[right + 0.43, 0, 0]}>
          <Axle radius={0.48} length={0.29} tone="dark" />
          <Axle radius={0.34} length={0.33} />
        </group>
      </group>
      {/* Open oil sump: side rails, lower floor, NOT a slab through the crank. */}
      <mesh position={[0, crankY - 1.52, -0.26]}>
        <boxGeometry args={[width + 0.14, 0.18, 1.6]} />
        <meshStandardMaterial {...IRON} />
      </mesh>
      {[-1, 1].map(side => <mesh key={side} position={[0, crankY - 1.15, side * (boreRadius + 0.18)]}>
        <boxGeometry args={[width + 0.16, 0.62, 0.12]} />
        <meshStandardMaterial {...CAST} transparent opacity={side > 0 ? (xray ? 0.05 : 0.19) : 1} depthWrite={side < 0} />
      </mesh>)}
    </group>}

    {showHead && <group>
      <mesh position={[0, roof + 0.42, -boreRadius - 0.22]}>
        <boxGeometry args={[width + 0.12, 0.84, 0.33]} />
        <meshStandardMaterial {...ALLOY} transparent opacity={xray ? 0.18 : 1} />
      </mesh>
      <mesh position={[0, roof + 1.28, -0.12]}>
        <boxGeometry args={[width + 0.19, 0.17, 1.52]} />
        <meshStandardMaterial {...IRON} transparent opacity={xray ? 0.2 : 1} />
      </mesh>
      {[left, right].map(x => <group key={x}>
        <mesh position={[x, roof + 0.45, -0.21]}>
          <boxGeometry args={[0.24, 0.84, 1.33]} />
          <meshStandardMaterial {...CAST} />
        </mesh>
      </group>)}
      {positions.map((x, i) => <group key={i} position={[x, 0, 0]}>
        {[0, 1, 2, 3].map(k => {
          const isIntake = k < 2;
          const xOffset = ((k % 2) - 0.5) * 0.47;
          const zOffset = isIntake ? -0.39 : 0.39;
          return <Valve key={k} index={i * 4 + k}
            position={[xOffset, roof + 0.35, zOffset]} register={valveRegister} />;
        })}
        {/* High central spark plug, one per combustion chamber. */}
        <group position={[0, roof + 0.57, 0.04]}>
          <mesh><cylinderGeometry args={[0.074, 0.074, 0.61, 12]} /><meshStandardMaterial color="#f1e5cd" roughness={0.4} metalness={0.22} /></mesh>
          <mesh position={[0, -0.3, 0]}><cylinderGeometry args={[0.044, 0.054, 0.17, 12]} /><meshStandardMaterial {...COPPER} /></mesh>
        </group>
        <mesh ref={el => { volumes.current[i] = el; }}>
          <cylinderGeometry args={[Math.max(0.1, boreRadius - 0.075), Math.max(0.1, boreRadius - 0.075), 1, 36]} />
          <meshBasicMaterial color="#e45d3e" transparent opacity={0.11} depthWrite={false} />
        </mesh>
      </group>)}
      {/* Two continuous camshafts, their lobes rotate at half crankshaft speed. */}
      {[-0.39, 0.39].map((z, row) => <group key={z} position={[0, roof + 1.03, z]}>
        <Axle radius={0.115} length={width + 0.38} />
        <group ref={el => { cams.current[row] = el; }}>
          {positions.map((x, i) => [-0.22, 0.22].map(offset => <group key={i + ":" + offset} position={[x + offset, 0, 0]}>
            <mesh position={[0, 0.09, 0]}>
              <boxGeometry args={[0.16, 0.28, 0.13]} />
              <meshStandardMaterial {...STEEL} />
            </mesh>
          </group>))}
        </group>
        <group position={[right + 0.51, 0, 0]} ref={row === 0 ? camGearA : camGearB}>
          <Axle radius={0.4} length={0.19} tone="dark" />
          {Array.from({ length: 8 }, (_, j) => {
            const a = j * Math.PI / 4;
            return <group key={j} position={[0.13, Math.cos(a) * 0.32, Math.sin(a) * 0.32]}>
              <Axle radius={0.043} length={0.11} />
            </group>;
          })}
        </group>
      </group>)}
      {positions.slice(0, 5).map((x, i) => <mesh key={i} position={[x + pitch / 2, roof + 0.44, -0.67]}>
        <boxGeometry args={[0.12, 0.8, 0.57]} />
        <meshStandardMaterial {...CAST} />
      </mesh>)}
    </group>}
  </group>;
}

export default function R6CutawayScene(props: R6SceneProps) {
  const pitch = props.params.bore * WORLD_SCALE + 0.22;
  const cameraTargetX = props.focusCylinder ? (props.selectedCylinder - 3.5) * pitch : 0;
  return <Canvas
    dpr={[1, 1.45]}
    camera={{ position: [3.5, 2.8, 17.8], fov: 43, near: 0.1, far: 90 }}
    gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
    fallback={<div style={{ padding: 24, color: "#fff" }}>Podgląd 3D wymaga WebGL.</div>}
  >
    <color attach="background" args={["#0a1018"]} />
    <fog attach="fog" args={["#0a1018", 24, 45]} />
    <ambientLight intensity={1.0} />
    <hemisphereLight args={["#d8e7f4", "#34465a", 1.3]} />
    <directionalLight position={[4, 9, 9]} color="#fff4ec" intensity={3.2} />
    <directionalLight position={[-5, 3, 5]} color="#a1d8ff" intensity={2} />
    <pointLight position={[0, -3, -1]} color="#e85b52" intensity={9} distance={17} />
    <Grid position={[0, -4.35, 0]} args={[22, 14]} cellSize={0.85} sectionSize={4}
      cellColor="#1c3043" sectionColor="#37536a" fadeDistance={24} fadeStrength={1.4} />
    <RealisticR6 {...props} />
    <CameraRig view={props.view} mode={props.mode} selectedCylinder={props.selectedCylinder}
      pitch={pitch} focus={props.focusCylinder} />
    <OrbitControls target={[cameraTargetX, props.mode === "head" ? 2.9 : props.mode === "bottom" ? -0.8 : 0.1, 0]} enablePan={false} enableDamping dampingFactor={0.07}
      minDistance={4.2} maxDistance={35} minPolarAngle={0.1} maxPolarAngle={Math.PI - 0.2} />
  </Canvas>;
}
