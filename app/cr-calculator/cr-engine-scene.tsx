"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import {
  DoubleSide, Group, Mesh, MeshBasicMaterial, Quaternion, Vector2, Vector3,
} from "three";
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

// Every piece is deliberately built from geometry rather than a static video.
// For visibility, this is ONE engine cylinder in a cutaway, not the entire R6.
const alloy = { color: "#9cabb9", metalness: 0.84, roughness: 0.3 } as const;
const forged = { color: "#d8e0e6", metalness: 0.93, roughness: 0.22 } as const;
const cast = { color: "#445565", metalness: 0.67, roughness: 0.49 } as const;
const iron = { color: "#293846", metalness: 0.78, roughness: 0.38 } as const;
const journal = { color: "#b6c5d1", metalness: 0.9, roughness: 0.21 } as const;
const copper = { color: "#c17f50", metalness: 0.77, roughness: 0.32 } as const;
const bolt = { color: "#d5dce4", metalness: 0.88, roughness: 0.25 } as const;
const SCALE = 1.76 / 84;

function CameraViews({ view }: { view: CameraView }) {
  const { camera } = useThree();
  useEffect(() => {
    const positions: Record<CameraView, [number, number, number]> = {
      perspective: [6.6, 3.2, 12],
      front: [0, 0.4, 13.7],
      side: [12.5, 0.9, 2],
      top: [0.01, 13.5, 1.4],
    };
    camera.position.set(...positions[view]);
    camera.lookAt(0, 0.35, 0);
    camera.updateProjectionMatrix();
  }, [camera, view]);
  return null;
}

function Cylinder({
  radius, height, material = "steel", radial = 36,
}: {
  radius: number;
  height: number;
  material?: "steel" | "cast" | "journal" | "black" | "copper";
  radial?: number;
}) {
  return <mesh>
    <cylinderGeometry args={[radius, radius, height, radial]} />
    {material === "cast" ? <meshStandardMaterial {...cast} /> :
      material === "journal" ? <meshStandardMaterial {...journal} /> :
      material === "black" ? <meshStandardMaterial {...iron} /> :
      material === "copper" ? <meshStandardMaterial {...copper} /> :
      <meshStandardMaterial {...forged} />}
  </mesh>;
}

function Shaft({ radius, length, material = "steel" }: {
  radius: number; length: number; material?: "steel" | "cast" | "journal" | "black" | "copper";
}) {
  return <group rotation={[Math.PI / 2, 0, 0]}>
    <Cylinder radius={radius} height={length} material={material} />
  </group>;
}

// A cutaway always leaves the front sector of the cylinder open.
// The piston and connecting rod remain physically visible through the block.
function CutSleeve({ radius, height, y, xray }: { radius: number; height: number; y: number; xray: boolean }) {
  return <group position={[0, y, 0]}>
    <mesh>
      <cylinderGeometry args={[radius + 0.12, radius + 0.12, height, 80, 1, true, 1.08, Math.PI * 2 - 2.16]} />
      <meshStandardMaterial {...cast} transparent opacity={xray ? 0.13 : 0.88} side={DoubleSide} depthWrite={!xray} />
    </mesh>
    <mesh>
      <cylinderGeometry args={[radius + 0.015, radius + 0.015, height - 0.02, 80, 1, true, 1.08, Math.PI * 2 - 2.16]} />
      <meshStandardMaterial color="#cad2d8" metalness={0.91} roughness={0.22} transparent opacity={xray ? 0.18 : 0.66} side={DoubleSide} depthWrite={false} />
    </mesh>
    {[-1, 1].map(side => <group key={side} position={[side * (radius + 0.09), 0, radius * 0.42]}>
      <mesh>
        <boxGeometry args={[0.09, height, 0.09]} />
        <meshStandardMaterial {...alloy} />
      </mesh>
    </group>)}
  </group>;
}

function Housing({ radius, deck, bottom, crankY, roof, gasket, xray }: {
  radius: number; deck: number; bottom: number; crankY: number; roof: number; gasket: number; xray: boolean;
}) {
  const blockH = deck - crankY + 0.38;
  const blockMid = (deck + crankY - 0.38) / 2;
  return <group>
    <CutSleeve radius={radius} height={deck - bottom} y={(deck + bottom) / 2} xray={xray} />
    {/* Cast block, rear water jacket, four reinforced cylinder-wall corners. */}
    <mesh position={[0, blockMid, -radius - 0.16]}>
      <boxGeometry args={[radius * 2 + 0.55, blockH, 0.24]} />
      <meshStandardMaterial {...cast} transparent opacity={xray ? 0.09 : 1} depthWrite={!xray} />
    </mesh>
    {[-1, 1].map(side => <group key={side}>
      <mesh position={[side * (radius + 0.21), blockMid, -0.32]}>
        <boxGeometry args={[0.34, blockH, 1.14]} />
        <meshStandardMaterial {...cast} transparent opacity={xray ? 0.14 : 1} depthWrite={!xray} />
      </mesh>
      {[0.22, 0.66, 1.1, 1.54].map((step, i) => <mesh key={i} position={[side * (radius + 0.42), deck - step, -0.18]}>
        <boxGeometry args={[0.16, 0.13, 1.11]} />
        <meshStandardMaterial {...alloy} transparent opacity={xray ? 0.17 : 0.84} />
      </mesh>)}
      {[-0.5, 0.1, 0.7].map((z, i) => <group key={i} position={[side * (radius + 0.32), deck - 0.09, z]}>
        <Cylinder radius={0.075} height={0.1} material="journal" />
      </group>)}
    </group>)}
    <mesh position={[0, deck + 0.035, -radius - 0.12]}>
      <boxGeometry args={[radius * 2 + 0.7, 0.12, 0.46]} />
      <meshStandardMaterial {...alloy} />
    </mesh>
    {/* Horizontal honed bore edge and gasket, consistent with settings. */}
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, deck + 0.02, 0]}>
      <torusGeometry args={[radius + 0.025, 0.046, 12, 82]} />
      <meshStandardMaterial {...forged} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, deck + 0.07 + gasket * SCALE, 0]}>
      <torusGeometry args={[radius + 0.075, Math.max(0.017, gasket * SCALE * 0.45), 12, 82]} />
      <meshStandardMaterial {...copper} />
    </mesh>
    {/* Main bearing girdle and open crankcase section. */}
    {[-1, 1].map(side => <group key={side}>
      <mesh position={[side * (radius + 0.14), crankY - 0.02, -0.32]}>
        <boxGeometry args={[0.32, 0.96, 1.2]} />
        <meshStandardMaterial {...cast} />
      </mesh>
      <group position={[side * (radius + 0.14), crankY - 0.12, 0.36]} rotation={[Math.PI / 2, 0, 0]}>
        <Cylinder radius={0.12} height={0.12} material="journal" />
      </group>
    </group>)}
    {/* Hollow sump and thin pan floor; the counterweights do not clip a solid box. */}
    <mesh position={[0, crankY - 1.45, -0.32]}>
      <boxGeometry args={[radius * 2 + 0.69, 0.19, 1.64]} />
      <meshStandardMaterial {...iron} />
    </mesh>
    <mesh position={[0, crankY - 1.17, -1.04]}>
      <boxGeometry args={[radius * 2 + 0.69, 0.52, 0.18]} />
      <meshStandardMaterial {...cast} />
    </mesh>
    {[-1, 1].map(side => <group key={side}>
      <mesh position={[side * (radius + 0.27), crankY - 1.15, -0.32]}>
        <boxGeometry args={[0.15, 0.52, 1.61]} />
        <meshStandardMaterial {...cast} />
      </mesh>
      {[-0.58, 0, 0.58].map((z, i) => <mesh key={i} position={[side * (radius + 0.37), crankY - 1.18, z]}>
        <boxGeometry args={[0.055, 0.36, 0.075]} />
        <meshStandardMaterial {...alloy} />
      </mesh>)}
    </group>)}
    {/* Genuine-looking head deck and deep aluminum casting with exposed combustion zone. */}
    <mesh position={[0, roof + 0.32, -0.72]}>
      <boxGeometry args={[radius * 2 + 0.85, 0.68, 0.39]} />
      <meshStandardMaterial {...alloy} />
    </mesh>
    {[-1, 1].map(side => <group key={side}>
      <mesh position={[side * (radius + 0.23), roof + 0.37, -0.16]}>
        <boxGeometry args={[0.34, 0.82, 1.43]} />
        <meshStandardMaterial {...alloy} />
      </mesh>
      <mesh position={[side * (radius + 0.34), roof + 0.72, -0.13]}>
        <boxGeometry args={[0.27, 0.19, 1.42]} />
        <meshStandardMaterial {...cast} />
      </mesh>
    </group>)}
    <mesh position={[0, roof + 1.34, -0.31]}>
      <boxGeometry args={[radius * 2 + 0.92, 0.14, 1.64]} />
      <meshStandardMaterial {...iron} />
    </mesh>
    <mesh position={[0, roof + 1.44, -0.31]}>
      <boxGeometry args={[radius * 2 + 0.74, 0.1, 1.53]} />
      <meshStandardMaterial {...cast} />
    </mesh>
    {[-0.61, 0.61].map((x, i) => <group key={i} position={[x, roof + 1.5, 0.15]}>
      <Shaft radius={0.09} length={0.14} material="journal" />
    </group>)}
    {/* Exhaust and intake port stubs on the rear: symmetric but deliberately schematic. */}
    {[-1, 1].map((side, i) => <group key={i} position={[side * 0.48, roof + 0.32, -1.04]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[0.22, 0.24, 0.47, 32, 1, true]} />
        <meshStandardMaterial {...iron} side={DoubleSide} />
      </mesh>
    </group>)}
  </group>;
}

function Ring({ radius, y, color }: { radius: number; y: number; color: string }) {
  return <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, y, 0]}>
    <torusGeometry args={[radius, 0.019, 8, 80]} />
    <meshStandardMaterial color={color} metalness={0.87} roughness={0.23} />
  </mesh>;
}

function Piston({ radius, pistonCc }: { radius: number; pistonCc: number }) {
  const dish = Math.min(0.18, Math.max(0, pistonCc) * 0.007);
  const dome = Math.min(0.2, Math.max(0, -pistonCc) * 0.011);
  const points = useMemo(() => [
    new Vector2(0, 0.405 - dish),
    new Vector2(radius * 0.33, 0.404 - dish * 0.85),
    new Vector2(radius * 0.72, 0.404 - dish * 0.24),
    new Vector2(radius - 0.065, 0.404),
    new Vector2(radius - 0.055, 0.39),
  ], [radius, dish]);
  return <group>
    {/* Lightweight forged piston with open underside, ring land and lower skirt. */}
    <mesh>
      <cylinderGeometry args={[radius - 0.055, radius - 0.09, 0.78, 72, 1, true]} />
      <meshStandardMaterial {...forged} side={DoubleSide} />
    </mesh>
    <mesh>
      <latheGeometry args={[points, 72]} />
      <meshStandardMaterial {...forged} side={DoubleSide} />
    </mesh>
    {dome > 0.005 && <mesh position={[0, 0.402, 0]} scale={[radius * 0.68, dome, radius * 0.68]}>
      <sphereGeometry args={[1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial {...forged} />
    </mesh>}
    <Ring radius={radius - 0.035} y={0.28} color="#333e4b" />
    <Ring radius={radius - 0.035} y={0.18} color="#333e4b" />
    <Ring radius={radius - 0.035} y={0.065} color="#a68960" />
    <mesh position={[0, -0.36, 0]}>
      <cylinderGeometry args={[radius - 0.12, radius - 0.15, 0.29, 72, 1, true]} />
      <meshStandardMaterial {...alloy} side={DoubleSide} />
    </mesh>
    {[-1, 1].map(side => <group key={side} position={[0, -0.18, side * (radius - 0.07)]}>
      <Shaft radius={0.19} length={0.075} material="journal" />
    </group>)}
  </group>;
}

function Rod({ length }: { length: number }) {
  return <group>
    {/* Forged H-beam: outer shoulders, recessed web and split big-end cap. */}
    <mesh>
      <boxGeometry args={[0.36, Math.max(0.6, length - 0.48), 0.17]} />
      <meshStandardMaterial {...alloy} />
    </mesh>
    {[-1, 1].map(z => <mesh key={z} position={[0, 0, z * 0.12]}>
      <boxGeometry args={[0.5, Math.max(0.6, length - 0.54), 0.065]} />
      <meshStandardMaterial {...forged} />
    </mesh>)}
    <mesh position={[0, length / 2, 0]}>
      <Shaft radius={0.225} length={0.36} material="steel" />
    </mesh>
    <mesh position={[0, length / 2, 0.2]}>
      <Shaft radius={0.12} length={0.055} material="journal" />
    </mesh>
    <mesh position={[0, -length / 2, 0]}>
      <Shaft radius={0.36} length={0.4} material="cast" />
    </mesh>
    <mesh position={[0, -length / 2, 0.22]}>
      <Shaft radius={0.21} length={0.075} material="copper" />
    </mesh>
    <mesh position={[0, -length / 2 - 0.055, 0.0]}>
      <boxGeometry args={[0.58, 0.1, 0.5]} />
      <meshStandardMaterial {...alloy} />
    </mesh>
    {[-0.22, 0.22].map(x => <group key={x} position={[x, -length / 2 - 0.06, 0.26]}>
      <Shaft radius={0.047} length={0.07} material="journal" />
    </group>)}
  </group>;
}

function Crankshaft({ throwRadius }: { throwRadius: number }) {
  return <group>
    {/* Continuous crank journal with two web cheeks and the eccentric rod journal. */}
    <Shaft radius={0.28} length={2.4} material="journal" />
    {[-0.34, 0.34].map(z => <group key={z} position={[0, 0, z]}>
      <mesh position={[0, throwRadius * 0.09, 0]}>
        <boxGeometry args={[0.51, throwRadius * 1.55 + 0.6, 0.23]} />
        <meshStandardMaterial {...cast} />
      </mesh>
      <mesh position={[0, -throwRadius * 0.51, 0]}>
        <Shaft radius={0.42} length={0.25} material="cast" />
      </mesh>
      <mesh position={[0, -throwRadius * 0.67, 0]}>
        <Shaft radius={0.12} length={0.28} material="black" />
      </mesh>
    </group>)}
    <mesh position={[0, throwRadius, 0]}>
      <Shaft radius={0.22} length={0.85} material="journal" />
    </mesh>
    <mesh position={[0, 0, -1.15]}>
      <Shaft radius={0.68} length={0.2} material="cast" />
    </mesh>
    <mesh position={[0, 0, -1.25]}>
      <Shaft radius={0.5} length={0.1} material="journal" />
    </mesh>
    <mesh position={[0, 0, 1.14]}>
      <Shaft radius={0.38} length={0.22} material="black" />
    </mesh>
  </group>;
}

function Valve({ x, y, z, groupRef, springRef }: {
  x: number; y: number; z: number;
  groupRef: React.RefObject<Group | null>;
  springRef: React.RefObject<Group | null>;
}) {
  return <group position={[x, y, z]}>
    {/* Valve stem moves together with its head; coil compresses above. */}
    <group ref={groupRef}>
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.88, 18]} />
        <meshStandardMaterial {...journal} />
      </mesh>
      <mesh position={[0, -0.29, 0]}>
        <cylinderGeometry args={[0.08, 0.21, 0.13, 24]} />
        <meshStandardMaterial {...forged} />
      </mesh>
      <mesh position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.21, 0.21, 0.042, 24]} />
        <meshStandardMaterial {...forged} />
      </mesh>
      <mesh position={[0, 0.58, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.085, 24]} />
        <meshStandardMaterial {...alloy} />
      </mesh>
    </group>
    <group ref={springRef} position={[0, 0.3, 0]}>
      {Array.from({ length: 7 }, (_, i) => <mesh key={i} position={[0, i * 0.075 - 0.225, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.13, 0.026, 7, 22]} />
        <meshStandardMaterial {...journal} />
      </mesh>)}
    </group>
    <mesh position={[0, -0.4, 0]}>
      <torusGeometry args={[0.2, 0.026, 8, 28]} />
      <meshStandardMaterial {...copper} />
    </mesh>
  </group>;
}

function Mechanics({ params, running, rpm, angle, onAngle, xray, showGas }: Omit<Props, "view">) {
  const c = useMemo(() => calculateCompression(params), [params]);
  const radius = params.bore * SCALE / 2;
  const throwRadius = params.stroke * SCALE / 2;
  const rodLength = params.rodLength * SCALE;
  const pinDrop = 0.56;
  const deck = 2.0;
  const crankY = deck - params.deckClearance * SCALE - pinDrop - (rodLength + throwRadius);
  const linerBottom = deck - params.stroke * SCALE - 1.14;
  // Roof is placed above the ACTUAL TDC piston crown; avoids counting deck clearance twice.
  const pistonTdc = deck - params.deckClearance * SCALE;
  const roof = pistonTdc + (c.valid ? Math.max(0.07, c.clearance * 1000 / (Math.PI * params.bore * params.bore / 4) * SCALE) : 0.18);
  const angleRef = useRef(angle);
  const ticker = useRef(0);
  const pistonRef = useRef<Group>(null);
  const pinRef = useRef<Group>(null);
  const rodRef = useRef<Group>(null);
  const crankRef = useRef<Group>(null);
  const gasRef = useRef<Mesh>(null);
  const intakeRefs = [useRef<Group>(null), useRef<Group>(null)];
  const exhaustRefs = [useRef<Group>(null), useRef<Group>(null)];
  const intakeSprings = [useRef<Group>(null), useRef<Group>(null)];
  const exhaustSprings = [useRef<Group>(null), useRef<Group>(null)];
  const camRefs = [useRef<Group>(null), useRef<Group>(null)];
  const vec = useMemo(() => new Vector3(), []);
  const axis = useMemo(() => new Vector3(0, 1, 0), []);
  const quaternion = useMemo(() => new Quaternion(), []);

  useEffect(() => { if (!running) angleRef.current = angle; }, [angle, running]);

  useFrame((_, delta) => {
    if (running) angleRef.current = (angleRef.current + Math.min(delta, 0.045) * rpm * 6) % 720;
    const a = angleRef.current * Math.PI / 180;
    const x = throwRadius * Math.sin(a);
    const crankPinY = crankY + throwRadius * Math.cos(a);
    const wristY = crankPinY + Math.sqrt(Math.max(0, rodLength * rodLength - x * x));
    const pistonTop = wristY + pinDrop;

    if (pistonRef.current) pistonRef.current.position.set(0, pistonTop - 0.405, 0);
    if (pinRef.current) pinRef.current.position.set(0, wristY, 0);
    if (crankRef.current) crankRef.current.rotation.z = -a;
    if (rodRef.current) {
      rodRef.current.position.set(x / 2, (wristY + crankPinY) / 2, 0);
      vec.set(-x, wristY - crankPinY, 0).normalize();
      quaternion.setFromUnitVectors(axis, vec);
      rodRef.current.quaternion.copy(quaternion);
    }

    // Four-stroke engine: intake / compression / power / exhaust in 720°.
    const phase = angleRef.current % 720;
    const lift = (value: number, start: number, end: number) =>
      value >= start && value <= end ? Math.pow(Math.sin(Math.PI * (value - start) / (end - start)), 2) * 0.25 : 0;
    const inletLift = lift(phase, 0, 205);
    const outletLift = lift(phase, 515, 720);
    intakeRefs.forEach(ref => { if (ref.current) ref.current.position.y = -inletLift; });
    exhaustRefs.forEach(ref => { if (ref.current) ref.current.position.y = -outletLift; });
    intakeSprings.forEach(ref => { if (ref.current) ref.current.scale.y = 1 - inletLift * 0.65; });
    exhaustSprings.forEach(ref => { if (ref.current) ref.current.scale.y = 1 - outletLift * 0.65; });
    camRefs.forEach(ref => { if (ref.current) ref.current.rotation.z = -a / 2; });

    if (gasRef.current) {
      const h = Math.max(0.009, roof - pistonTop);
      gasRef.current.position.y = pistonTop + h / 2;
      gasRef.current.scale.y = h;
      gasRef.current.visible = showGas && c.valid;
      const mat = gasRef.current.material as MeshBasicMaterial;
      const fill = phase < 180 ? "#4faeff" : phase < 360 ? "#ffd17c" : phase < 540 ? "#ff703f" : "#aab5bf";
      mat.color.set(fill);
    }
    if (running) {
      ticker.current += delta;
      if (ticker.current > 0.09) {
        onAngle(angleRef.current);
        ticker.current = 0;
      }
    }
  });

  return <group>
    <Housing radius={radius} deck={deck} bottom={linerBottom} crankY={crankY} roof={roof} gasket={params.gasketThickness} xray={xray} />

    <mesh ref={gasRef} position={[0, roof - 0.1, 0]}>
      <cylinderGeometry args={[Math.max(radius - 0.075, 0.15), Math.max(radius - 0.075, 0.15), 1, 64, 1, false]} />
      <meshBasicMaterial color="#ff6e41" transparent opacity={0.14} depthWrite={false} />
    </mesh>

    <group ref={pistonRef}>
      <Piston radius={radius} pistonCc={params.pistonCc} />
    </group>
    <group ref={pinRef}>
      <Shaft radius={0.18} length={radius * 1.78} material="journal" />
    </group>
    <group ref={rodRef}>
      <Rod length={rodLength} />
    </group>

    <group position={[0, crankY, 0]}>
      <group ref={crankRef}>
        <Crankshaft throwRadius={throwRadius} />
      </group>
      {/* Main bearings are fixed; only the crank rotates. */}
      {[-0.88, 0.88].map(z => <group key={z} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <torusGeometry args={[0.35, 0.065, 10, 40]} />
          <meshStandardMaterial {...alloy} />
        </mesh>
      </group>)}
    </group>

    {/* The head has 4 poppet valves with visible springs and two camshafts. */}
    {([-1, 1] as const).map((side, sideIdx) => <group key={side}>
      {[0, 1].map(i => {
        const x = side * radius * 0.52;
        const z = -0.62 + i * 0.58;
        const refs = side < 0 ? intakeRefs : exhaustRefs;
        const springs = side < 0 ? intakeSprings : exhaustSprings;
        return <Valve key={i} x={x} y={roof + 0.33} z={z}
          groupRef={refs[i]} springRef={springs[i]} />;
      })}
      <group position={[side * radius * 0.52, roof + 1.03, -0.18]}>
        <group ref={camRefs[sideIdx]}>
          <Shaft radius={0.13} length={1.5} material="journal" />
          {[0.28, -0.29].map(z => <group key={z} position={[0, 0, z]}>
            <mesh position={[0, 0.11, 0]}>
              <boxGeometry args={[0.24, 0.32, 0.14]} />
              <meshStandardMaterial {...alloy} />
            </mesh>
            <Shaft radius={0.17} length={0.17} material="cast" />
          </group>)}
        </group>
        <mesh position={[0, 0, 0.77]}>
          <Shaft radius={0.25} length={0.09} material="cast" />
        </mesh>
      </group>
    </group>)}
    {/* Center ignition and threaded spark-plug sleeve. */}
    <group position={[0, roof + 0.51, 0.24]} rotation={[0, 0, 0.03]}>
      <Cylinder radius={0.095} height={0.67} material="steel" />
      <mesh position={[0, -0.34, 0]}>
        <Cylinder radius={0.055} height={0.19} material="copper" />
      </mesh>
    </group>
  </group>;
}

export default function CrEngineScene(props: Props) {
  return <Canvas
    dpr={[1, 1.55]}
    camera={{ position: [6.6, 3.2, 12], fov: 38, near: 0.1, far: 65 }}
    gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    fallback={<div style={{ padding: 24, color: "#fff" }}>Podgląd 3D wymaga przeglądarki WebGL.</div>}
  >
    <color attach="background" args={["#0b111a"]} />
    <fog attach="fog" args={["#0b111a", 16, 30]} />
    <ambientLight intensity={0.8} />
    <hemisphereLight args={["#d6e8fc", "#2b3542", 1.5]} />
    <directionalLight position={[5.5, 8, 7]} color="#fff7ee" intensity={4.2} />
    <directionalLight position={[-5, 2, 5]} color="#83b1d8" intensity={2.7} />
    <pointLight position={[2.8, -2, -2]} color="#f77b67" intensity={12} distance={10} />
    <Grid position={[0, -4.25, 0]} args={[14, 14]} cellSize={0.85} sectionSize={3.4}
      cellColor="#182938" sectionColor="#27445a" fadeDistance={16} fadeStrength={1.5} />
    <Mechanics {...props} />
    <CameraViews view={props.view} />
    <OrbitControls target={[0, 0.35, 0]} enablePan={false} enableDamping dampingFactor={0.075}
      minDistance={5.5} maxDistance={20} minPolarAngle={0.08} maxPolarAngle={Math.PI - 0.12} />
  </Canvas>;
}
