import {
  Blueprint3DState,
  BlueprintColorTheme,
  BlueprintDrawTool,
  BlueprintPresetType,
  BlueprintStroke3D,
  BlueprintVertex3D,
  DetectedHand,
} from '../types/vision';
import { soundFx } from './audio';

export class BlueprintEngine {
  private state: Blueprint3DState;
  private prevHandDistance: number | null = null;
  private prevHandPos: { x: number; y: number } | null = null;
  private activeStroke: BlueprintVertex3D[] = [];
  private strokeStartPoint: BlueprintVertex3D | null = null;
  private wasPinchingLastFrame: boolean = false;
  private isPointerDrawing: boolean = false;

  constructor() {
    this.state = {
      preset: 'cube',
      position: { x: 640, y: 360, z: 0 },
      rotation: { x: 0.35, y: 0.55, z: 0 },
      scale: 1.1,
      vertices: [],
      edges: [],
      freehandStrokes: [],
      isDrawing: false,
      activeDrawTool: 'freehand',
      drawModeEnabled: true,
      colorTheme: 'cyan',
      strokeWidth: 2,
      isManipulating: false,
      manipulationType: 'idle',
      lastGestureNote: '3D CAD Blueprint Engine Ready',
      gridVisible: true,
      dimensionsVisible: true,
      axesVisible: true,
    };

    this.loadPreset('cube');
  }

  public getState(): Blueprint3DState {
    return this.state;
  }

  public setPreset(preset: BlueprintPresetType) {
    this.state.preset = preset;
    if (preset === 'blank') {
      this.state.vertices = [];
      this.state.edges = [];
      this.state.lastGestureNote = 'Blank Canvas: Draw custom 3D blueprint in mid-air';
    } else {
      this.loadPreset(preset);
    }
  }

  public setColorTheme(theme: BlueprintColorTheme) {
    this.state.colorTheme = theme;
  }

  public setDrawTool(tool: BlueprintDrawTool) {
    this.state.activeDrawTool = tool;
    this.state.lastGestureNote = `Tool selected: ${tool.replace('_', ' ').toUpperCase()}`;
  }

  public setDrawModeEnabled(enabled: boolean) {
    this.state.drawModeEnabled = enabled;
    if (!enabled) {
      this.finishCurrentStroke();
    }
    this.state.lastGestureNote = enabled ? 'Draw Mode ON: Pinch to draw' : 'Navigate Mode: Fist to move, Palm to orbit';
  }

  public setStrokeWidth(width: number) {
    this.state.strokeWidth = width;
  }

  public toggleGrid() {
    this.state.gridVisible = !this.state.gridVisible;
  }

  public toggleDimensions() {
    this.state.dimensionsVisible = !this.state.dimensionsVisible;
  }

  public toggleAxes() {
    this.state.axesVisible = !this.state.axesVisible;
  }

  public resetTransform(canvasWidth = 1280, canvasHeight = 720) {
    this.state.position = { x: canvasWidth / 2, y: canvasHeight / 2, z: 0 };
    this.state.rotation = { x: 0.35, y: 0.55, z: 0 };
    this.state.scale = 1.1;
    this.state.lastGestureNote = 'Blueprint Re-aligned & Centered';
  }

  public undoStroke() {
    if (this.state.freehandStrokes.length > 0) {
      this.state.freehandStrokes.pop();
      soundFx.playBeep(640);
      this.state.lastGestureNote = 'Undid Last 3D CAD Stroke';
    }
  }

  public clearFreehand() {
    this.state.freehandStrokes = [];
    this.activeStroke = [];
    this.strokeStartPoint = null;
    soundFx.playBeep(520);
    this.state.lastGestureNote = 'All 3D Drawn Blueprint Strokes Cleared';
  }

  // --- Presets Initializer ---
  private loadPreset(preset: BlueprintPresetType) {
    const vertices: BlueprintVertex3D[] = [];
    const edges: [number, number][] = [];

    switch (preset) {
      case 'blank':
        // Empty
        break;

      case 'pyramid': {
        // Square base + apex
        vertices.push(
          { x: -0.75, y: 0.75, z: -0.75 },
          { x: 0.75, y: 0.75, z: -0.75 },
          { x: 0.75, y: 0.75, z: 0.75 },
          { x: -0.75, y: 0.75, z: 0.75 },
          { x: 0, y: -0.85, z: 0 }
        );
        edges.push(
          [0, 1], [1, 2], [2, 3], [3, 0],
          [0, 4], [1, 4], [2, 4], [3, 4]
        );
        break;
      }

      case 'cylinder': {
        const segments = 12;
        for (let i = 0; i < segments; i++) {
          const a = (i / segments) * Math.PI * 2;
          vertices.push({ x: Math.cos(a) * 0.75, y: -0.75, z: Math.sin(a) * 0.75 });
        }
        for (let i = 0; i < segments; i++) {
          const a = (i / segments) * Math.PI * 2;
          vertices.push({ x: Math.cos(a) * 0.75, y: 0.75, z: Math.sin(a) * 0.75 });
        }
        for (let i = 0; i < segments; i++) {
          const next = (i + 1) % segments;
          edges.push([i, next]);
          edges.push([i + segments, next + segments]);
          edges.push([i, i + segments]);
        }
        break;
      }

      case 'sphere': {
        const phi = (1 + Math.sqrt(5)) / 2;
        const norm = 1 / Math.sqrt(1 + phi * phi);
        const v = 1 * norm;
        const p = phi * norm;

        vertices.push(
          { x: -v, y: p, z: 0 }, { x: v, y: p, z: 0 }, { x: -v, y: -p, z: 0 }, { x: v, y: -p, z: 0 },
          { x: 0, y: -v, z: p }, { x: 0, y: v, z: p }, { x: 0, y: -v, z: -p }, { x: 0, y: v, z: -p },
          { x: p, y: 0, z: -v }, { x: p, y: 0, z: v }, { x: -p, y: 0, z: -v }, { x: -p, y: 0, z: v }
        );

        edges.push(
          [0, 11], [0, 5], [0, 1], [0, 7], [0, 10],
          [1, 5], [5, 11], [11, 10], [10, 7], [7, 1],
          [3, 9], [3, 4], [3, 2], [3, 6], [3, 8],
          [9, 4], [4, 2], [2, 6], [6, 8], [8, 9],
          [4, 5], [5, 9], [9, 1], [1, 8], [8, 7],
          [7, 6], [6, 10], [10, 2], [2, 11], [11, 4]
        );
        break;
      }

      case 'drone': {
        // Fuselage
        vertices.push(
          { x: -0.3, y: -0.15, z: -0.3 }, { x: 0.3, y: -0.15, z: -0.3 },
          { x: 0.3, y: 0.15, z: -0.3 }, { x: -0.3, y: 0.15, z: -0.3 },
          { x: -0.3, y: -0.15, z: 0.3 }, { x: 0.3, y: -0.15, z: 0.3 },
          { x: 0.3, y: 0.15, z: 0.3 }, { x: -0.3, y: 0.15, z: 0.3 }
        );
        // Rotor arm tips
        vertices.push(
          { x: -0.9, y: 0, z: -0.9 }, { x: 0.9, y: 0, z: -0.9 },
          { x: -0.9, y: 0, z: 0.9 }, { x: 0.9, y: 0, z: 0.9 }
        );
        edges.push(
          [0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4],
          [0, 4], [1, 5], [2, 6], [3, 7],
          [0, 8], [1, 9], [4, 10], [5, 11]
        );
        break;
      }

      case 'reactor': {
        const seg = 12;
        for (let i = 0; i < seg; i++) {
          const a = (i / seg) * Math.PI * 2;
          vertices.push({ x: Math.cos(a) * 0.45, y: Math.sin(a) * 0.45, z: 0 });
          vertices.push({ x: Math.cos(a) * 0.9, y: Math.sin(a) * 0.9, z: 0 });
        }
        for (let i = 0; i < seg; i++) {
          const next = (i + 1) % seg;
          edges.push([i * 2, next * 2]);
          edges.push([i * 2 + 1, next * 2 + 1]);
          edges.push([i * 2, i * 2 + 1]);
        }
        vertices.push({ x: 0, y: 0, z: -0.35 });
        edges.push([seg * 2, 0], [seg * 2, 4], [seg * 2, 8]);
        break;
      }

      case 'cube':
      default: {
        vertices.push(
          { x: -0.75, y: -0.75, z: -0.75 },
          { x: 0.75, y: -0.75, z: -0.75 },
          { x: 0.75, y: 0.75, z: -0.75 },
          { x: -0.75, y: 0.75, z: -0.75 },
          { x: -0.75, y: -0.75, z: 0.75 },
          { x: 0.75, y: -0.75, z: 0.75 },
          { x: 0.75, y: 0.75, z: 0.75 },
          { x: -0.75, y: 0.75, z: 0.75 }
        );
        edges.push(
          [0, 1], [1, 2], [2, 3], [3, 0],
          [4, 5], [5, 6], [6, 7], [7, 4],
          [0, 4], [1, 5], [2, 6], [3, 7]
        );
        break;
      }
    }

    this.state.vertices = vertices;
    this.state.edges = edges;
    this.state.lastGestureNote = `Loaded ${preset.toUpperCase()} Schema`;
  }

  /**
   * Transforms a 2D screen coordinate into the model's local 3D coordinate space.
   * Inverts perspective, scale, translation, and 3D rotation with 100% mathematical fidelity.
   * Any point drawn at screenX, screenY renders exactly at screenX, screenY!
   */
  public screenToLocal3D(
    screenX: number,
    screenY: number,
    depthOffset = 0
  ): BlueprintVertex3D {
    const baseRadius = 130 * this.state.scale;
    const fov = 800;

    // The reference plane depth in rotated space:
    const z2 = depthOffset * baseRadius;
    const persp = fov / (fov + z2);

    // 1. Untranslate & unproject perspective
    const x3 = (screenX - this.state.position.x) / persp;
    const y3 = (screenY - this.state.position.y) / persp;

    // 2. Unrotate around Z (roll: -rotation.z)
    const cosZ = Math.cos(this.state.rotation.z);
    const sinZ = Math.sin(this.state.rotation.z);
    const x1 = x3 * cosZ + y3 * sinZ;
    const y2 = -x3 * sinZ + y3 * cosZ;

    // 3. Unrotate around X (pitch: -rotation.x)
    const cosX = Math.cos(this.state.rotation.x);
    const sinX = Math.sin(this.state.rotation.x);
    const y = y2 * cosX + z2 * sinX;
    const z1 = -y2 * sinX + z2 * cosX;

    // 4. Unrotate around Y (yaw: -rotation.y)
    const cosY = Math.cos(this.state.rotation.y);
    const sinY = Math.sin(this.state.rotation.y);
    const x = x1 * cosY - z1 * sinY;
    const z = x1 * sinY + z1 * cosY;

    // 5. Unscale to normalized unit space
    return {
      x: x / baseRadius,
      y: y / baseRadius,
      z: z / baseRadius,
    };
  }

  /**
   * Direct Canvas Pointer/Mouse drawing handlers for desktop precision
   */
  public handlePointerDown(screenX: number, screenY: number) {
    this.isPointerDrawing = true;
    const pt = this.screenToLocal3D(screenX, screenY);
    this.strokeStartPoint = pt;
    this.activeStroke = [pt];
    this.state.isDrawing = true;
    soundFx.playDrawStart();
  }

  public handlePointerMove(screenX: number, screenY: number) {
    if (!this.isPointerDrawing || !this.strokeStartPoint) return;
    const pt = this.screenToLocal3D(screenX, screenY);

    if (this.state.activeDrawTool === 'freehand') {
      const last = this.activeStroke[this.activeStroke.length - 1];
      const dist = Math.hypot(last.x - pt.x, last.y - pt.y, last.z - pt.z);
      if (dist > 0.03) {
        this.activeStroke.push(pt);
        soundFx.playDrawPoint();
      }
    } else if (this.state.activeDrawTool === 'straight_line') {
      this.activeStroke = [this.strokeStartPoint, pt];
    } else if (this.state.activeDrawTool === 'box_3d') {
      this.activeStroke = this.generateBoxWireframe(this.strokeStartPoint, pt);
    } else if (this.state.activeDrawTool === 'circle_3d') {
      this.activeStroke = this.generateCircleWireframe(this.strokeStartPoint, pt);
    }
  }

  public handlePointerUp() {
    if (!this.isPointerDrawing) return;
    this.isPointerDrawing = false;
    this.finishCurrentStroke();
  }

  // --- Hand Gesture Blueprint Controller ---
  public update(
    canvasWidth: number,
    canvasHeight: number,
    hands: DetectedHand[]
  ) {
    this.state.isManipulating = false;
    this.state.manipulationType = 'idle';

    if (hands.length === 0) {
      this.prevHandDistance = null;
      this.prevHandPos = null;
      if (this.wasPinchingLastFrame) {
        this.finishCurrentStroke();
        this.wasPinchingLastFrame = false;
      }
      return;
    }

    // --- 1. DUAL-HAND ZOOM / SCALE ---
    if (hands.length >= 2) {
      if (this.wasPinchingLastFrame) {
        this.finishCurrentStroke();
        this.wasPinchingLastFrame = false;
      }

      const h1 = hands[0];
      const h2 = hands[1];
      const p1 = h1.isFist ? h1.fistCenter : h1.palmCenter;
      const p2 = h2.isFist ? h2.fistCenter : h2.palmCenter;

      const currentDistance = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const centerMidX = (p1.x + p2.x) / 2;
      const centerMidY = (p1.y + p2.y) / 2;

      if (this.prevHandDistance !== null) {
        const deltaDist = currentDistance - this.prevHandDistance;
        if (Math.abs(deltaDist) > 2) {
          const scaleFactor = 1 + deltaDist * 0.006;
          const nextScale = Math.max(0.35, Math.min(3.5, this.state.scale * scaleFactor));
          this.state.scale = nextScale;
          this.state.isManipulating = true;
          this.state.manipulationType = 'zoom';
          this.state.lastGestureNote = `Dual-Hand Zoom: ${Math.round(this.state.scale * 100)}%`;
          soundFx.playZoomTone(this.state.scale);
        }

        // Slight rotation along angle
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        this.state.rotation.z += angle * 0.015;
      }

      this.prevHandDistance = currentDistance;
      this.prevHandPos = { x: centerMidX, y: centerMidY };
      return;
    }

    // --- 2. SINGLE HAND INTERACTIONS ---
    this.prevHandDistance = null;
    const hand = hands[0];
    const handPos = hand.isFist ? hand.fistCenter : hand.palmCenter;

    // --- A. DRAWING GESTURE: PINCH (Thumb tip touches Index tip) ---
    // When draw mode is enabled, Pinch is the deliberate "Pen Down" gesture!
    const isPenDown = this.state.drawModeEnabled && hand.isPinching;
    const indexTip = hand.landmarks[8]; // Landmark 8 = Index fingertip

    if (isPenDown && indexTip) {
      this.state.isDrawing = true;
      this.state.isManipulating = true;
      this.state.manipulationType = 'draw';

      const localPoint = this.screenToLocal3D(indexTip.x, indexTip.y, indexTip.z || 0);

      if (!this.wasPinchingLastFrame) {
        // Just started pinch
        soundFx.playDrawStart();
        this.strokeStartPoint = localPoint;
        this.activeStroke = [localPoint];
        this.wasPinchingLastFrame = true;
      } else if (this.strokeStartPoint) {
        // Continuous pinch
        if (this.state.activeDrawTool === 'freehand') {
          const last = this.activeStroke[this.activeStroke.length - 1];
          const dist = Math.hypot(last.x - localPoint.x, last.y - localPoint.y, last.z - localPoint.z);
          if (dist > 0.035) {
            this.activeStroke.push(localPoint);
            soundFx.playDrawPoint();
          }
          this.state.lastGestureNote = `Freehand Stylus: Drawing 3D Path (${this.activeStroke.length} pts)`;
        } else if (this.state.activeDrawTool === 'straight_line') {
          this.activeStroke = [this.strokeStartPoint, localPoint];
          this.state.lastGestureNote = 'Straight Line: Dragging end point...';
        } else if (this.state.activeDrawTool === 'box_3d') {
          this.activeStroke = this.generateBoxWireframe(this.strokeStartPoint, localPoint);
          this.state.lastGestureNote = '3D Box Wireframe: Sizing box...';
        } else if (this.state.activeDrawTool === 'circle_3d') {
          this.activeStroke = this.generateCircleWireframe(this.strokeStartPoint, localPoint);
          this.state.lastGestureNote = '3D Circle Ring: Sizing radius...';
        }
      }

      this.prevHandPos = { x: handPos.x, y: handPos.y };
      return;
    } else {
      // Pen is up
      if (this.wasPinchingLastFrame) {
        this.finishCurrentStroke();
        this.wasPinchingLastFrame = false;
      }
    }

    // --- B. MOVE / TRANSLATE (Closed Fist Grip) ---
    if (hand.isFist) {
      if (this.prevHandPos) {
        const dx = handPos.x - this.prevHandPos.x;
        const dy = handPos.y - this.prevHandPos.y;

        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          this.state.position.x += dx;
          this.state.position.y += dy;
          this.state.isManipulating = true;
          this.state.manipulationType = 'move';
          this.state.lastGestureNote = `Fist Grip: Translating Model [${Math.round(this.state.position.x)}, ${Math.round(this.state.position.y)}]`;
        }
      } else {
        soundFx.playGrip();
      }
      this.prevHandPos = { x: handPos.x, y: handPos.y };
      return;
    }

    // --- C. ROTATE 3D (Open Palm Orbit) ---
    if (hand.isOpenPalm) {
      if (this.prevHandPos) {
        const dx = handPos.x - this.prevHandPos.x;
        const dy = handPos.y - this.prevHandPos.y;

        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          this.state.rotation.y += dx * 0.012;
          this.state.rotation.x -= dy * 0.012;
          this.state.isManipulating = true;
          this.state.manipulationType = 'rotate';
          this.state.lastGestureNote = `3D Palm Orbit: Yaw ${(this.state.rotation.y % (Math.PI * 2)).toFixed(2)}, Pitch ${(this.state.rotation.x % (Math.PI * 2)).toFixed(2)}`;
        }
      }
      this.prevHandPos = { x: handPos.x, y: handPos.y };
      return;
    }

    // Aiming state with pointing finger
    if (this.state.drawModeEnabled && hand.isPointing) {
      this.state.lastGestureNote = 'CAD Aiming: Pinch thumb & index to draw!';
    }

    this.prevHandPos = { x: handPos.x, y: handPos.y };
  }

  private generateBoxWireframe(start: BlueprintVertex3D, end: BlueprintVertex3D): BlueprintVertex3D[] {
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);
    const depth = Math.max(0.15, Math.hypot(maxX - minX, maxY - minY) * 0.5);
    const minZ = start.z - depth / 2;
    const maxZ = start.z + depth / 2;

    // Single continuous connected path representing box wireframe edges
    return [
      { x: minX, y: minY, z: minZ },
      { x: maxX, y: minY, z: minZ },
      { x: maxX, y: maxY, z: minZ },
      { x: minX, y: maxY, z: minZ },
      { x: minX, y: minY, z: minZ },
      { x: minX, y: minY, z: maxZ },
      { x: maxX, y: minY, z: maxZ },
      { x: maxX, y: maxY, z: maxZ },
      { x: minX, y: maxY, z: maxZ },
      { x: minX, y: minY, z: maxZ },
      { x: maxX, y: minY, z: maxZ },
      { x: maxX, y: minY, z: minZ },
      { x: maxX, y: maxY, z: minZ },
      { x: maxX, y: maxY, z: maxZ },
      { x: minX, y: maxY, z: maxZ },
      { x: minX, y: maxY, z: minZ },
    ];
  }

  private generateCircleWireframe(center: BlueprintVertex3D, edge: BlueprintVertex3D): BlueprintVertex3D[] {
    const radius = Math.hypot(edge.x - center.x, edge.y - center.y);
    const segments = 24;
    const points: BlueprintVertex3D[] = [];

    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      points.push({
        x: center.x + Math.cos(a) * radius,
        y: center.y + Math.sin(a) * radius,
        z: center.z,
      });
    }

    return points;
  }

  private finishCurrentStroke() {
    if (this.activeStroke.length > 1) {
      this.state.freehandStrokes.push({
        id: `stroke_${Date.now()}_${Math.random()}`,
        tool: this.state.activeDrawTool,
        points: [...this.activeStroke],
        color: this.getColorHex(this.state.colorTheme),
        width: this.state.strokeWidth,
      });
      soundFx.playDrawFinish();
    }
    this.activeStroke = [];
    this.strokeStartPoint = null;
    this.state.isDrawing = false;
  }

  public getColorHex(theme: BlueprintColorTheme): string {
    switch (theme) {
      case 'emerald':
        return '#10b981';
      case 'amber':
        return '#f59e0b';
      case 'violet':
        return '#a855f7';
      case 'white':
        return '#ffffff';
      case 'cyan':
      default:
        return '#00f0ff';
    }
  }

  // --- 3D Projection Math & Rendering ---
  public render(ctx: CanvasRenderingContext2D, hands: DetectedHand[]) {
    const { position, rotation, scale, vertices, edges, freehandStrokes, colorTheme } =
      this.state;

    const baseRadius = 130 * scale;
    const themeColor = this.getColorHex(colorTheme);

    // 1. Render Isometric Ground Grid Plane
    if (this.state.gridVisible) {
      this.renderGridPlane(ctx, position.x, position.y + baseRadius * 1.05, baseRadius * 1.5);
    }

    // 2. 3D Project Point Helper
    const projectPoint = (v: BlueprintVertex3D) => {
      const x = v.x * baseRadius;
      const y = v.y * baseRadius;
      const z = v.z * baseRadius;

      // Rotate Y (Yaw)
      const cosY = Math.cos(rotation.y);
      const sinY = Math.sin(rotation.y);
      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;

      // Rotate X (Pitch)
      const cosX = Math.cos(rotation.x);
      const sinX = Math.sin(rotation.x);
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      // Rotate Z (Roll)
      const cosZ = Math.cos(rotation.z);
      const sinZ = Math.sin(rotation.z);
      const x3 = x1 * cosZ - y2 * sinZ;
      const y3 = x1 * sinZ + y2 * cosZ;

      const fov = 800;
      const persp = fov / (fov + z2);

      return {
        x: position.x + x3 * persp,
        y: position.y + y3 * persp,
        z: z2,
        persp,
      };
    };

    const projVerts = vertices.map(projectPoint);

    // 3. Render 3D Coordinate Axes at Origin
    if (this.state.axesVisible) {
      this.renderOriginAxes(ctx, projectPoint);
    }

    // 4. Render Preset Blueprint Model Edges
    if (edges.length > 0) {
      ctx.save();
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 1.8;
      ctx.shadowColor = themeColor;
      ctx.shadowBlur = 8;

      edges.forEach(([i, j]) => {
        if (projVerts[i] && projVerts[j]) {
          ctx.beginPath();
          ctx.moveTo(projVerts[i].x, projVerts[i].y);
          ctx.lineTo(projVerts[j].x, projVerts[j].y);
          ctx.stroke();
        }
      });
      ctx.restore();
    }

    // 5. Render All Freehand Strokes (Saved + Currently Drawing)
    const allStrokes = [...freehandStrokes];
    if (this.activeStroke.length > 0) {
      allStrokes.push({
        id: 'active',
        tool: this.state.activeDrawTool,
        points: this.activeStroke,
        color: themeColor,
        width: this.state.strokeWidth + 1,
      });
    }

    allStrokes.forEach((stroke) => {
      if (stroke.points.length > 1) {
        ctx.save();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width || 2;
        ctx.shadowColor = stroke.color;
        ctx.shadowBlur = stroke.id === 'active' ? 14 : 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();

        const first = projectPoint(stroke.points[0]);
        ctx.moveTo(first.x, first.y);

        for (let i = 1; i < stroke.points.length; i++) {
          const pt = projectPoint(stroke.points[i]);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        ctx.restore();
      }
    });

    // 6. Render Vertex Nodes for Preset
    projVerts.forEach((pv) => {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = themeColor;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(pv.x, pv.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // 7. Render 3D CAD Laser Stylus Crosshairs & Status on Hand
    const leadHand = hands[0];
    if (leadHand && this.state.drawModeEnabled) {
      const tip = leadHand.landmarks[8];
      const thumb = leadHand.landmarks[4];

      if (tip) {
        ctx.save();
        const isDrawingNow = leadHand.isPinching || this.activeStroke.length > 0;
        const stylusColor = isDrawingNow ? '#ffffff' : themeColor;

        ctx.strokeStyle = stylusColor;
        ctx.lineWidth = isDrawingNow ? 2.5 : 1.5;
        ctx.shadowColor = themeColor;
        ctx.shadowBlur = isDrawingNow ? 16 : 8;

        // Outer reticle circle
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, isDrawingNow ? 14 : 10, 0, Math.PI * 2);
        ctx.stroke();

        // Inner core
        ctx.fillStyle = stylusColor;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, isDrawingNow ? 5 : 3, 0, Math.PI * 2);
        ctx.fill();

        // Crosshairs
        ctx.beginPath();
        ctx.moveTo(tip.x - 20, tip.y); ctx.lineTo(tip.x - 12, tip.y);
        ctx.moveTo(tip.x + 12, tip.y); ctx.lineTo(tip.x + 20, tip.y);
        ctx.moveTo(tip.x, tip.y - 20); ctx.lineTo(tip.x, tip.y - 12);
        ctx.moveTo(tip.x, tip.y + 12); ctx.lineTo(tip.x, tip.y + 20);
        ctx.stroke();

        // Connected laser line between thumb & index during pinch
        if (thumb) {
          ctx.strokeStyle = isDrawingNow ? 'rgba(0, 240, 255, 0.8)' : 'rgba(0, 240, 255, 0.25)';
          ctx.lineWidth = isDrawingNow ? 2 : 1;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(thumb.x, thumb.y);
          ctx.lineTo(tip.x, tip.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Live CAD Coordinate Callout Tag
        const coordTag = isDrawingNow
          ? `✍️ DRAWING [${Math.round(tip.x)}, ${Math.round(tip.y)}]`
          : `🎯 PINCH TO DRAW [${Math.round(tip.x)}, ${Math.round(tip.y)}]`;

        ctx.font = 'bold 9px monospace';
        const tagW = ctx.measureText(coordTag).width + 10;
        ctx.fillStyle = 'rgba(7, 14, 30, 0.9)';
        ctx.fillRect(tip.x + 16, tip.y - 16, tagW, 16);
        ctx.strokeStyle = themeColor;
        ctx.strokeRect(tip.x + 16, tip.y - 16, tagW, 16);
        ctx.fillStyle = isDrawingNow ? '#00f0ff' : '#94a3b8';
        ctx.fillText(coordTag, tip.x + 21, tip.y - 4);

        ctx.restore();
      }
    }

    // 8. Render Fist Grip Translation Reticle (when translating with fist)
    if (leadHand && leadHand.isFist) {
      ctx.save();
      const fc = leadHand.fistCenter;
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;

      // Grip ring
      ctx.beginPath();
      ctx.arc(fc.x, fc.y, leadHand.radius * 0.9, 0, Math.PI * 2);
      ctx.stroke();

      // Cardinal translation arrows
      const r = leadHand.radius * 0.9;
      ctx.fillStyle = '#00f0ff';
      // Left arrow
      ctx.beginPath();
      ctx.moveTo(fc.x - r - 12, fc.y); ctx.lineTo(fc.x - r - 4, fc.y - 5); ctx.lineTo(fc.x - r - 4, fc.y + 5); ctx.fill();
      // Right arrow
      ctx.beginPath();
      ctx.moveTo(fc.x + r + 12, fc.y); ctx.lineTo(fc.x + r + 4, fc.y - 5); ctx.lineTo(fc.x + r + 4, fc.y + 5); ctx.fill();
      // Up arrow
      ctx.beginPath();
      ctx.moveTo(fc.x, fc.y - r - 12); ctx.lineTo(fc.x - 5, fc.y - r - 4); ctx.lineTo(fc.x + 5, fc.y - r - 4); ctx.fill();
      // Down arrow
      ctx.beginPath();
      ctx.moveTo(fc.x, fc.y + r + 12); ctx.lineTo(fc.x - 5, fc.y + r + 4); ctx.lineTo(fc.x + 5, fc.y + r + 4); ctx.fill();

      // Grip Label
      const gripTag = '✊ FIST GRIP — TRANSLATING';
      ctx.font = 'bold 9px monospace';
      const gw = ctx.measureText(gripTag).width + 10;
      ctx.fillStyle = 'rgba(7, 14, 30, 0.9)';
      ctx.fillRect(fc.x - gw / 2, fc.y - r - 26, gw, 16);
      ctx.strokeStyle = '#00f0ff';
      ctx.strokeRect(fc.x - gw / 2, fc.y - r - 26, gw, 16);
      ctx.fillStyle = '#00f0ff';
      ctx.fillText(gripTag, fc.x - gw / 2 + 5, fc.y - r - 14);

      ctx.restore();
    }

    // 9. Technical Dimensions Callout Lines
    if (this.state.dimensionsVisible) {
      const allPointsToBound: { x: number; y: number }[] = [...projVerts];
      allStrokes.forEach((st) => {
        st.points.forEach((p) => allPointsToBound.push(projectPoint(p)));
      });

      if (allPointsToBound.length > 0) {
        this.renderDimensions(ctx, allPointsToBound);
      }
    }

    // 10. Blueprint HUD Status Header
    this.renderBlueprintHUD(ctx, position.x, position.y, baseRadius, themeColor);
  }

  // --- Sub-renderers ---

  private renderOriginAxes(
    ctx: CanvasRenderingContext2D,
    projectPoint: (v: BlueprintVertex3D) => { x: number; y: number }
  ) {
    ctx.save();
    const origin = projectPoint({ x: 0, y: 0, z: 0 });
    const xAxis = projectPoint({ x: 0.45, y: 0, z: 0 });
    const yAxis = projectPoint({ x: 0, y: -0.45, z: 0 });
    const zAxis = projectPoint({ x: 0, y: 0, z: 0.45 });

    // X: Red
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y); ctx.lineTo(xAxis.x, xAxis.y);
    ctx.stroke();

    // Y: Green
    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y); ctx.lineTo(yAxis.x, yAxis.y);
    ctx.stroke();

    // Z: Blue
    ctx.strokeStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y); ctx.lineTo(zAxis.x, zAxis.y);
    ctx.stroke();

    ctx.restore();
  }

  private renderGridPlane(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number
  ) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.16)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    const lines = 6;
    for (let i = -lines; i <= lines; i++) {
      const offset = (i / lines) * radius;
      ctx.beginPath();
      ctx.moveTo(cx + offset, cy - radius * 0.35);
      ctx.lineTo(cx + offset * 1.35, cy + radius * 0.35);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx - radius * 1.1, cy + offset * 0.35);
      ctx.lineTo(cx + radius * 1.1, cy + offset * 0.35);
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderDimensions(
    ctx: CanvasRenderingContext2D,
    projVerts: { x: number; y: number }[]
  ) {
    ctx.save();
    let minX = 9999, maxX = -9999, minY = 9999, maxY = -9999;
    projVerts.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });

    const w = Math.round(maxX - minX);
    const h = Math.round(maxY - minY);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    // Bottom Dimension Bar (Width)
    const dimY = maxY + 18;
    ctx.beginPath();
    ctx.moveTo(minX, dimY);
    ctx.lineTo(maxX, dimY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(minX, dimY - 4); ctx.lineTo(minX, dimY + 4);
    ctx.moveTo(maxX, dimY - 4); ctx.lineTo(maxX, dimY + 4);
    ctx.stroke();

    // Right Dimension Bar (Height)
    const dimX = maxX + 18;
    ctx.beginPath();
    ctx.moveTo(dimX, minY);
    ctx.lineTo(dimX, maxY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(dimX - 4, minY); ctx.lineTo(dimX + 4, minY);
    ctx.moveTo(dimX - 4, maxY); ctx.lineTo(dimX + 4, maxY);
    ctx.stroke();

    // Callout Text
    ctx.setLineDash([]);
    ctx.font = '10px monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(`W: ${w}mm`, (minX + maxX) / 2 - 20, dimY + 12);
    ctx.fillText(`H: ${h}mm`, dimX + 6, (minY + maxY) / 2 + 3);

    ctx.restore();
  }

  private renderBlueprintHUD(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    baseRadius: number,
    themeColor: string
  ) {
    ctx.save();
    const totalStrokes = this.state.freehandStrokes.length;
    const tag = `3D BLUEPRINT // ${this.state.preset.toUpperCase()} [${Math.round(
      this.state.scale * 100
    )}%] ${totalStrokes > 0 ? `• ${totalStrokes} STROKES` : ''}`;

    ctx.font = 'bold 10px monospace';
    const tagW = ctx.measureText(tag).width + 16;
    const tagX = x - tagW / 2;
    const tagY = y - baseRadius - 16;

    ctx.fillStyle = 'rgba(6, 12, 26, 0.9)';
    ctx.fillRect(tagX, tagY - 12, tagW, 16);
    ctx.strokeStyle = themeColor;
    ctx.strokeRect(tagX, tagY - 12, tagW, 16);

    ctx.fillStyle = themeColor;
    ctx.fillText(tag, tagX + 8, tagY);

    if (this.state.isManipulating) {
      const note = `✋ ${this.state.manipulationType.toUpperCase()} MODE`;
      ctx.font = 'bold 9px monospace';
      const nw = ctx.measureText(note).width + 12;
      ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.fillRect(x - nw / 2, tagY - 28, nw, 14);
      ctx.strokeStyle = '#00f0ff';
      ctx.strokeRect(x - nw / 2, tagY - 28, nw, 14);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(note, x - nw / 2 + 6, tagY - 18);
    }

    ctx.restore();
  }
}

export const blueprintEngine = new BlueprintEngine();
