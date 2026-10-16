export type ExpressionType = 'Happy' | 'Neutral' | 'Sad' | 'Surprised';

export interface ExpressionScores {
  Happy: number;
  Neutral: number;
  Sad: number;
  Surprised: number;
}

export type GestureType = 'closed_fist' | 'open_palm' | 'pinch' | 'pointing' | 'unknown';

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
  isPointing: boolean;
  landmarks: { x: number; y: number; z: number }[];
  isFist: boolean;
  isOpenPalm: boolean;
  velocity: { vx: number; vy: number; speed: number };
}

export interface VisionDetectionResult {
  face: DetectedFace | null;
  hands: DetectedHand[];
  timestamp: number;
}

// 3D Holographic CAD Blueprint Types
export type BlueprintColorTheme = 'cyan' | 'emerald' | 'amber' | 'violet' | 'white';

export type AppInteractionMode = 'blueprint' | 'sculpt' | 'inspector';

export type BlueprintPresetType =
  | 'blank'
  | 'cube'
  | 'pyramid'
  | 'cylinder'
  | 'sphere'
  | 'drone'
  | 'reactor';

export type BlueprintDrawTool = 'freehand' | 'straight_line' | 'box_3d' | 'circle_3d';

export interface BlueprintVertex3D {
  x: number; // local coordinate
  y: number;
  z: number;
}

export interface BlueprintStroke3D {
  id: string;
  tool: BlueprintDrawTool;
  points: BlueprintVertex3D[];
  color: string;
  width: number;
}

export interface Blueprint3DState {
  preset: BlueprintPresetType;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: number; // Zoom level (0.35 to 3.5)
  vertices: BlueprintVertex3D[];
  edges: [number, number][];
  freehandStrokes: BlueprintStroke3D[];
  isDrawing: boolean;
  activeDrawTool: BlueprintDrawTool;
  drawModeEnabled: boolean;
  colorTheme: BlueprintColorTheme;
  strokeWidth: number;
  isManipulating: boolean;
  manipulationType: 'move' | 'zoom' | 'rotate' | 'draw' | 'idle';
  lastGestureNote: string;
  gridVisible: boolean;
  dimensionsVisible: boolean;
  axesVisible: boolean;
}
