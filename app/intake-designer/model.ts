export type EnginePreset = "2jz-gte" | "2jz-ge" | "m50-m52" | "m54" | "universal";
export type BuildMethod = "tig" | "cnc";
export type PlenumShape = "round" | "oval" | "box" | "wedge";
export type PortShape = "round" | "oval" | "rounded-rect";
export type ThrottleSide = "left" | "right";
export type TigPlenumFinish = "graphite" | "aluminum";

export type IntakeParameters = {
  engine: EnginePreset;
  method: BuildMethod;
  cylinderCount: number;
  portPitch: number;
  runnerInnerDiameter: number;
  runnerWall: number;
  runnerReach: number;
  runnerRise: number;
  runnerBend: number;
  runnerOffset: number;
  portShape: PortShape;
  plenumVolume: number;
  plenumShape: PlenumShape;
  plenumTaper: number;
  tigPlenumFinish: TigPlenumFinish;
  throttleDiameter: number;
  throttleSide: ThrottleSide;
  throttleAngle: number;
  injectorBosses: boolean;
  vacuumPorts: boolean;
  flangeThickness: number;
};

export const DEFAULT_INTAKE: IntakeParameters = {
  engine: "2jz-gte",
  method: "tig",
  cylinderCount: 6,
  portPitch: 92,
  runnerInnerDiameter: 43,
  runnerWall: 3,
  runnerReach: 145,
  runnerRise: 90,
  runnerBend: 58,
  runnerOffset: 0,
  portShape: "round",
  plenumVolume: 4.8,
  plenumShape: "round",
  plenumTaper: 24,
  tigPlenumFinish: "graphite",
  throttleDiameter: 80,
  throttleSide: "left",
  throttleAngle: 0,
  injectorBosses: false,
  vacuumPorts: false,
  flangeThickness: 12,
};

export const ENGINE_TEMPLATES: Record<EnginePreset, Pick<IntakeParameters, "cylinderCount" | "portPitch">> = {
  "2jz-gte": { cylinderCount: 6, portPitch: 92 },
  "2jz-ge": { cylinderCount: 6, portPitch: 92 },
  "m50-m52": { cylinderCount: 6, portPitch: 91 },
  m54: { cylinderCount: 6, portPitch: 91 },
  universal: { cylinderCount: 4, portPitch: 95 },
};

// The pitches are concept placeholders, NOT OEM specifications. GE/GTE and BMW head face patterns must never be treated as interchangeable.
// M50 TIG is a visual design preset inspired by user-provided product photos, not a measured duplicate.
export function m50TigPreset(): IntakeParameters {
  return normalizeIntake({
    ...DEFAULT_INTAKE,
    engine: "m50-m52", method: "tig",
    portPitch: 91, runnerInnerDiameter: 43, runnerWall: 2.5,
    runnerReach: 175, runnerRise: 125, runnerBend: 75, runnerOffset: 12,
    portShape: "rounded-rect", plenumShape: "wedge", plenumTaper: 32,
    plenumVolume: 4.5, tigPlenumFinish: "aluminum",
    throttleSide: "right", throttleAngle: 10, throttleDiameter: 80,
    injectorBosses: false, vacuumPorts: true, flangeThickness: 12,
  });
}
export function intakePreset(name: EnginePreset): IntakeParameters {
  return { ...DEFAULT_INTAKE, ...ENGINE_TEMPLATES[name], engine: name };
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const numberOr = (input: unknown, fallback: number) => typeof input === "number" && Number.isFinite(input) ? input : fallback;
const oneOf = <T extends string>(value: unknown, choices: readonly T[], fallback: T): T =>
  choices.includes(value as T) ? value as T : fallback;

export function normalizeIntake(input: Partial<IntakeParameters>): IntakeParameters {
  const base = { ...DEFAULT_INTAKE, ...input };
  const engine = oneOf(base.engine, ["2jz-gte", "2jz-ge", "m50-m52", "m54", "universal"] as const, "2jz-gte");
  const count = Math.round(clamp(numberOr(base.cylinderCount, 6), 3, 12));
  const inner = clamp(numberOr(base.runnerInnerDiameter, 43), 25, 75);
  const wall = clamp(numberOr(base.runnerWall, 3), 1.5, 8);
  return {
    engine,
    method: oneOf(base.method, ["tig", "cnc"] as const, "tig"),
    cylinderCount: engine === "universal" ? count : 6,
    portPitch: clamp(numberOr(base.portPitch, 92), inner + 2 * wall + 5, 150),
    runnerInnerDiameter: inner,
    runnerWall: wall,
    runnerReach: clamp(numberOr(base.runnerReach, 145), 70, 320),
    runnerRise: clamp(numberOr(base.runnerRise, 90), 40, 200),
    runnerBend: clamp(numberOr(base.runnerBend, 58), 0, 100),
    runnerOffset: clamp(numberOr(base.runnerOffset, 0), -35, 35),
    portShape: oneOf(base.portShape, ["round", "oval", "rounded-rect"] as const, "round"),
    plenumVolume: clamp(numberOr(base.plenumVolume, 4.8), 1, 18),
    plenumShape: oneOf(base.plenumShape, ["round", "oval", "box", "wedge"] as const, "round"),
    plenumTaper: clamp(numberOr(base.plenumTaper, 24), 0, 45),
    tigPlenumFinish: oneOf(base.tigPlenumFinish, ["graphite", "aluminum"] as const, "graphite"),
    throttleDiameter: clamp(numberOr(base.throttleDiameter, 80), 40, 120),
    throttleSide: oneOf(base.throttleSide, ["left", "right"] as const, "left"),
    throttleAngle: clamp(numberOr(base.throttleAngle, 0), -25, 25),
    injectorBosses: base.injectorBosses === true,
    vacuumPorts: base.vacuumPorts === true,
    flangeThickness: clamp(numberOr(base.flangeThickness, 12), 6, 25),
  };
}

export type ManifoldDimensions = {
  runnerOutside: number;
  span: number;
  plenumLength: number;
  plenumRadius: number;
  plenumHeight: number;
  plenumDepth: number;
  totalLength: number;
  calculatedVolumeLiters: number;
};

export function calculateManifold(p: IntakeParameters): ManifoldDimensions {
  const runnerOutside = p.runnerInnerDiameter + p.runnerWall * 2;
  const span = (p.cylinderCount - 1) * p.portPitch;
  const plenumLength = span + 150;
  const mm3 = p.plenumVolume * 1_000_000;
  // Frustum volume correction keeps the nominal plenum volume closer to the target
  // when tapered toward the throttle. Exact effective volume still requires CAD booleans.
  const taperRatio = 1 - p.plenumTaper / 100;
  const taperAreaFactor = p.plenumShape === "box" ? 1 : p.plenumShape === "wedge" ? (1 + (1 - p.plenumTaper / 100)) / 2 : (1 + taperRatio + taperRatio * taperRatio) / 3;
  const area = mm3 / plenumLength / taperAreaFactor;
  let plenumHeight: number;
  let plenumDepth: number;
  if (p.plenumShape === "box" || p.plenumShape === "wedge") {
    const side = Math.sqrt(area * 1.2);
    plenumHeight = side;
    plenumDepth = area / side;
  } else if (p.plenumShape === "oval") {
    plenumHeight = 2 * Math.sqrt(area * 1.32 / Math.PI);
    plenumDepth = 4 * area / (Math.PI * plenumHeight);
  } else {
    plenumHeight = 2 * Math.sqrt(area / Math.PI);
    plenumDepth = plenumHeight;
  }
  return {
    runnerOutside,
    span,
    plenumLength,
    plenumRadius: plenumHeight / 2,
    plenumHeight,
    plenumDepth,
    totalLength: plenumLength + 115,
    calculatedVolumeLiters: p.plenumVolume,
  };
}

export function intakeSummary(p: IntakeParameters) {
  const d = calculateManifold(p);
  return {
    kind: "RPM_CUSTOM_INTAKE_MANIFOLD_CONCEPT_V1",
    status: "CONCEPT_ONLY_NOT_PRODUCTION_VALIDATED",
    disclaimer: "Engine port locations and flanges are schematics. No CFD, FEA, CAM paths, STEP or manufacturing-ready geometry is included.",
    savedAt: new Date().toISOString(),
    parameters: p,
    approximateDimensions: d,
  };
}
