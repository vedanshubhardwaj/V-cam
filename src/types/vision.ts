export type ExpressionType = 'Happy' | 'Neutral' | 'Sad' | 'Surprised';

export interface ExpressionScores {
  Happy: number;
  Neutral: number;
  Sad: number;
  Surprised: number;
}

export type GestureType = 'closed_fist' | 'open_palm' | 'pinch' | 'unknown';

export interface DetectedFace {
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  dominantExpression: ExpressionType;
  confidence: number;
  expressions: ExpressionScores;
  keyPoints?: { x: number; y: number }[];
}

export interface DetectedHand {
  handedness: 'Left' | 'Right';
  gesture: GestureType;
  fistCenter: { x: number; y: number; z?: number };
  palmCenter: { x: number; y: number; z?: number };
  radius: number;
  fingerCurls: {
    thumb: number; // 0 (extended) to 1 (curled)
    index: number;
    middle: number;
    ring: number;
    pinky: number;
  };
  pinchDistance: number;
  isPinching: boolean;
  landmarks: { x: number; y: number; z: number }[];
  isFist: boolean;
  isOpenPalm: boolean;
  velocity: { vx: number; vy: number; speed: number };
  isPunching: boolean;
}

export interface VisionDetectionResult {
  face: DetectedFace | null;
  hands: DetectedHand[];
  timestamp: number;
}

export type FireColorScheme = 'classic' | 'plasma' | 'violet' | 'emerald';

export interface FireConfig {
  scheme: FireColorScheme;
  intensity: number; // 0.5 to 2.0
  sparksEnabled: boolean;
  smokeEnabled: boolean;
  punchBurstEnabled: boolean;
  flameTrailEnabled: boolean;
}

export type ControlledObjectType = 'fire_orb' | 'cyber_cube' | 'phoenix_core' | 'quantum_shield';

export interface ControlledObjectState {
  type: ControlledObjectType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  isGrabbed: boolean;
  grabbedByHand: string | null;
  isAttracted: boolean;
  energyCharge: number; // 0 to 1
  colorScheme: FireColorScheme;
  physicsMode: 'magnetic' | 'kinetic' | 'orbit';
  lastInteractionText: string;
}
