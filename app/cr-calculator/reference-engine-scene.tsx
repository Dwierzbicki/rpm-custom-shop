"use client";

import { useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import { Box3, Group, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { R6View } from "./r6-cutaway-scene";

type Props = { src: string; view: R6View; onStatus: (status: "loading" | "ready" | "error") => void };

function CameraPosition({ view }: { view: R6View }) {
  const { camera } = useThree();
  useEffect(() => {
    const views: Record<R6View, [number, number, number]> = {
      perspective: [5.8, 3.0, 12.3],
      front: [0, 0.6, 14],
      side: [14, 0.6, 0.1],
      top: [0.01, 14, 0.01],
    };
    camera.position.set(...views[view]);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, view]);
  return null;
}

function ImportedModel({ src, onStatus }: Pick<Props, "src" | "onStatus">) {
  const [object, setObject] = useState<Group | null>(null);

  useEffect(() => {
    let disposed = false;
    setObject(null);
    onStatus("loading");

    const loader = new GLTFLoader();
    loader.load(
      src,
      gltf => {
        if (disposed) return;
        const scene = gltf.scene;
        const bounding = new Box3().setFromObject(scene);
        const dimensions = new Vector3();
        const center = new Vector3();
        bounding.getSize(dimensions);
        bounding.getCenter(center);
        if (![dimensions.x, dimensions.y, dimensions.z].every(Number.isFinite) ||
            Math.max(dimensions.x, dimensions.y, dimensions.z) < 0.001) {
          onStatus("error");
          return;
        }

        // Normalize to the existing RPM MotoLab stage independently of file units.
        scene.position.sub(center);
        const wrapper = new Group();
        wrapper.add(scene);
        if (dimensions.z > dimensions.x * 1.2) wrapper.rotation.y = -Math.PI / 2;
        const horizontal = Math.max(dimensions.x, dimensions.z);
        const factor = Math.min(10.5 / horizontal, 5.2 / dimensions.y);
        wrapper.scale.setScalar(factor);
        setObject(wrapper);
        onStatus("ready");
      },
      undefined,
      () => { if (!disposed) onStatus("error"); },
    );
    return () => { disposed = true; };
  }, [src, onStatus]);

  return object ? <primitive object={object} /> : null;
}

export default function ReferenceEngineScene({ src, view, onStatus }: Props) {
  return <Canvas
    dpr={[1, 1.5]}
    camera={{ position: [0, 0.6, 14], fov: 47, near: 0.01, far: 100 }}
    gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
    fallback={<div style={{ padding: 20, color: "#fff" }}>Model GLB wymaga obsługi WebGL.</div>}
  >
    <color attach="background" args={["#0b121d"]} />
    <fog attach="fog" args={["#0b121d", 18, 36]} />
    <ambientLight intensity={1.1} />
    <hemisphereLight args={["#d1e8ff", "#293c52", 1.35]} />
    <directionalLight position={[5, 8, 8]} color="#fff7ed" intensity={3.5} />
    <directionalLight position={[-6, 4, 1]} color="#96c6ff" intensity={2.4} />
    <pointLight position={[3, -3, 6]} color="#f38176" intensity={12} distance={12} />
    <Grid position={[0, -3.7, 0]} args={[18, 18]} cellSize={0.8} sectionSize={4}
      cellColor="#1b3042" sectionColor="#304c60" fadeDistance={22} fadeStrength={1.4} />
    <ImportedModel src={src} onStatus={onStatus} />
    <CameraPosition view={view} />
    <OrbitControls target={[0, 0, 0]} enablePan={false} enableDamping dampingFactor={0.075}
      minDistance={4.5} maxDistance={28} minPolarAngle={0.08} maxPolarAngle={Math.PI - 0.12} />
  </Canvas>;
}
