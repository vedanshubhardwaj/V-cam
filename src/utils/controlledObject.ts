import { ControlledObjectState, ControlledObjectType, DetectedHand, FireColorScheme } from '../types/vision';

export class ControlledObjectManager {
  private state: ControlledObjectState;
  private trail: { x: number; y: number; alpha: number; size: number }[] = [];
  private pulsePhase: number = 0;

  constructor() {
    this.state = {
      type: 'fire_orb',
      x: 640,
      y: 360,
      vx: 0,
      vy: 0,
      radius: 48,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      isGrabbed: false,
      grabbedByHand: null,
      isAttracted: false,
      energyCharge: 0.5,
      colorScheme: 'classic',
      physicsMode: 'magnetic',
      lastInteractionText: 'Ready for Gesture Control',
    };
  }

  public getState(): ControlledObjectState {
    return this.state;
  }

  public setType(type: ControlledObjectType) {
    this.state.type = type;
  }

  public setPhysicsMode(mode: 'magnetic' | 'kinetic' | 'orbit') {
    this.state.physicsMode = mode;
  }

  public resetPosition(canvasWidth: number, canvasHeight: number) {
    this.state.x = canvasWidth / 2;
    this.state.y = canvasHeight / 2;
    this.state.vx = 0;
    this.state.vy = 0;
    this.state.isGrabbed = false;
    this.state.grabbedByHand = null;
    this.state.lastInteractionText = 'Repositioned to Center';
  }

  /**
   * Update object physics and react to detected hands and gestures
   */
  public update(
    canvasWidth: number,
    canvasHeight: number,
    hands: DetectedHand[],
    onPunchHit?: () => void,
    onEnergyLock?: () => void
  ) {
    this.pulsePhase += 0.05;
    this.state.rotationY += 0.03;
    this.state.rotationX += 0.02;

    // Reset interaction flags
    const wasGrabbed = this.state.isGrabbed;
    this.state.isGrabbed = false;
    this.state.grabbedByHand = null;
    this.state.isAttracted = false;

    // Dual-hand scaling
    if (hands.length >= 2) {
      const h1 = hands[0];
      const h2 = hands[1];
      const dist = Math.hypot(h1.palmCenter.x - h2.palmCenter.x, h1.palmCenter.y - h2.palmCenter.y);
      // Map hand distance (approx 100px - 800px) to radius (28px - 90px)
      const targetRadius = Math.max(28, Math.min(95, dist * 0.16));
      this.state.radius = this.state.radius * 0.9 + targetRadius * 0.1;
      this.state.lastInteractionText = `Dual-Hand Scale: ${Math.round(this.state.radius)}px`;
    }

    // Process each hand's gesture interaction
    for (const hand of hands) {
      const handPos = hand.isFist ? hand.fistCenter : hand.palmCenter;
      const distToObject = Math.hypot(handPos.x - this.state.x, handPos.y - this.state.y);

      // 1. PUNCH / FIRE FIST STRIKE
      if (hand.isPunching || (hand.isFist && hand.velocity.speed > 550)) {
        if (distToObject < this.state.radius * 2.2 + hand.radius) {
          // Punch impulse
          const impulseX = hand.velocity.vx * 0.045 || (Math.random() - 0.5) * 20;
          const impulseY = hand.velocity.vy * 0.045 || -18;
          this.state.vx = impulseX;
          this.state.vy = impulseY;
          this.state.energyCharge = 1.0;
          this.state.lastInteractionText = `🔥 FIRE FIST PUNCH STRIKE! (${Math.round(hand.velocity.speed)} px/s)`;
          onPunchHit?.();
          break;
        }
      }

      // 2. GRAB (Pinch gesture OR Fist close to object)
      const grabThreshold = this.state.radius * 1.5 + 40;
      if ((hand.isPinching || hand.isFist) && distToObject < grabThreshold) {
        this.state.isGrabbed = true;
        this.state.grabbedByHand = hand.handedness;
        this.state.x = this.state.x * 0.65 + handPos.x * 0.35;
        this.state.y = this.state.y * 0.65 + handPos.y * 0.35;
        this.state.vx = hand.velocity.vx * 0.015;
        this.state.vy = hand.velocity.vy * 0.015;
        this.state.lastInteractionText = `Locked in ${hand.handedness} ${hand.isPinching ? 'Pinch Grip' : 'Fist Hold'}`;
        if (!wasGrabbed) {
          onEnergyLock?.();
        }
        break;
      }

      // 3. TRACTOR BEAM / ATTRACT (Open Palm)
      if (hand.isOpenPalm && !this.state.isGrabbed) {
        this.state.isAttracted = true;
        const dx = handPos.x - this.state.x;
        const dy = handPos.y - this.state.y;
        const angle = Math.atan2(dy, dx);
        const force = Math.min(14, distToObject * 0.035);

        this.state.vx += Math.cos(angle) * force;
        this.state.vy += Math.sin(angle) * force;
        this.state.lastInteractionText = `Tractor Beam Levitation (${hand.handedness} Palm)`;
      }
    }

    // Physics integration if not directly grabbed
    if (!this.state.isGrabbed) {
      if (this.state.physicsMode === 'orbit') {
        // Smooth cosmic orbital hover around center
        const cx = canvasWidth / 2;
        const cy = canvasHeight / 2;
        const orbitAngle = this.pulsePhase * 0.8;
        const targetX = cx + Math.cos(orbitAngle) * 160;
        const targetY = cy + Math.sin(orbitAngle) * 90;
        this.state.vx += (targetX - this.state.x) * 0.04;
        this.state.vy += (targetY - this.state.y) * 0.04;
      }

      this.state.x += this.state.vx;
      this.state.y += this.state.vy;

      // Friction / drag
      this.state.vx *= 0.94;
      this.state.vy *= 0.94;

      // Elastic bounce on canvas walls
      const pad = this.state.radius;
      if (this.state.x < pad) {
        this.state.x = pad;
        this.state.vx = -this.state.vx * 0.8;
      } else if (this.state.x > canvasWidth - pad) {
        this.state.x = canvasWidth - pad;
        this.state.vx = -this.state.vx * 0.8;
      }

      if (this.state.y < pad) {
        this.state.y = pad;
        this.state.vy = -this.state.vy * 0.8;
      } else if (this.state.y > canvasHeight - pad) {
        this.state.y = canvasHeight - pad;
        this.state.vy = -this.state.vy * 0.8;
      }
    }

    // Energy charge dissipation
    this.state.energyCharge = Math.max(0.2, this.state.energyCharge * 0.98);

    // Record trail point
    this.trail.unshift({
      x: this.state.x,
      y: this.state.y,
      alpha: 1.0,
      size: this.state.radius * 0.8,
    });
    if (this.trail.length > 18) {
      this.trail.pop();
    }
  }

  /**
   * Render the controlled object and interactive force fields onto the canvas
   */
  public render(
    ctx: CanvasRenderingContext2D,
    hands: DetectedHand[],
    scheme: FireColorScheme
  ) {
    const { x, y, radius, isGrabbed, isAttracted } = this.state;

    // 1. Render Tractor Beam / Force Links to Hands
    for (const hand of hands) {
      const handPos = hand.isFist ? hand.fistCenter : hand.palmCenter;
      if (hand.isOpenPalm || isGrabbed) {
        ctx.save();
        ctx.strokeStyle = hand.isFist
          ? 'rgba(255, 120, 20, 0.45)'
          : 'rgba(0, 240, 255, 0.45)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);

        ctx.beginPath();
        ctx.moveTo(handPos.x, handPos.y);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Energy pulses along the beam
        const midX = (handPos.x + x) / 2;
        const midY = (handPos.y + y) / 2;
        ctx.fillStyle = hand.isFist ? '#ff841f' : '#00f0ff';
        ctx.shadowColor = hand.isFist ? '#ff841f' : '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(midX, midY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 2. Render Motion Trail
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < this.trail.length; i++) {
      const pt = this.trail[i];
      const trailAlpha = (1 - i / this.trail.length) * 0.35;
      const trailRadius = pt.size * (1 - i / this.trail.length);

      const trailGrad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, Math.max(1, trailRadius));
      const col =
        scheme === 'plasma'
          ? `rgba(0, 220, 255, ${trailAlpha})`
          : scheme === 'violet'
          ? `rgba(220, 50, 255, ${trailAlpha})`
          : scheme === 'emerald'
          ? `rgba(40, 255, 130, ${trailAlpha})`
          : `rgba(255, 130, 20, ${trailAlpha})`;

      trailGrad.addColorStop(0, col);
      trailGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = trailGrad;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, Math.max(1, trailRadius), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. Render Specific Controlled Object Geometry
    ctx.save();
    switch (this.state.type) {
      case 'cyber_cube':
        this.renderCyberCube(ctx, x, y, radius, scheme);
        break;
      case 'phoenix_core':
        this.renderPhoenixCore(ctx, x, y, radius, scheme);
        break;
      case 'quantum_shield':
        this.renderQuantumShield(ctx, x, y, radius, scheme);
        break;
      case 'fire_orb':
      default:
        this.renderFireOrb(ctx, x, y, radius, scheme);
        break;
    }
    ctx.restore();

    // 4. Render Holographic HUD Reticle & State Tag around Object
    ctx.save();
    ctx.strokeStyle = isGrabbed
      ? '#ff841f'
      : isAttracted
      ? '#00f0ff'
      : 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.35, 0, Math.PI * 2);
    ctx.stroke();

    // Reticle brackets
    ctx.setLineDash([]);
    ctx.strokeStyle = isGrabbed ? '#ff841f' : '#00f0ff';
    ctx.lineWidth = 2;
    const br = radius * 1.35;
    const bLen = 10;
    // Top
    ctx.beginPath();
    ctx.moveTo(x - bLen, y - br);
    ctx.lineTo(x + bLen, y - br);
    ctx.stroke();
    // Bottom
    ctx.beginPath();
    ctx.moveTo(x - bLen, y + br);
    ctx.lineTo(x + bLen, y + br);
    ctx.stroke();

    // State Badge Pill
    const tag = `OBJ // ${this.state.type.replace('_', ' ').toUpperCase()}${isGrabbed ? ' [GRABBED]' : isAttracted ? ' [TRACTOR]' : ''}`;
    ctx.font = 'bold 10px monospace';
    const tagW = ctx.measureText(tag).width + 14;
    const tagX = x - tagW / 2;
    const tagY = y + radius * 1.5 + 14;

    ctx.fillStyle = 'rgba(6, 12, 26, 0.9)';
    ctx.fillRect(tagX, tagY - 12, tagW, 16);
    ctx.strokeStyle = isGrabbed ? '#ff841f' : '#00f0ff';
    ctx.strokeRect(tagX, tagY - 12, tagW, 16);

    ctx.fillStyle = isGrabbed ? '#ffb347' : '#00f0ff';
    ctx.fillText(tag, tagX + 7, tagY);
    ctx.restore();
  }

  // --- Specific Object Renderers ---

  private renderFireOrb(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    scheme: FireColorScheme
  ) {
    ctx.globalCompositeOperation = 'lighter';

    // Core radiant bloom
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.4);
    const c1 = scheme === 'plasma' ? '#ffffff' : scheme === 'violet' ? '#ffffff' : '#fff7c2';
    const c2 = scheme === 'plasma' ? '#00f0ff' : scheme === 'violet' ? '#e032ff' : scheme === 'emerald' ? '#22c55e' : '#ff841f';
    const c3 = scheme === 'plasma' ? '#034a9e' : scheme === 'violet' ? '#6200a3' : scheme === 'emerald' ? '#065f46' : '#991b1b';

    grad.addColorStop(0, c1);
    grad.addColorStop(0.35, c2);
    grad.addColorStop(0.8, c3);
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Swirling solar flare rings
    const ringCount = 3;
    for (let i = 0; i < ringCount; i++) {
      const angle = this.pulsePhase * (i + 1) * 0.7;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.scale(1, 0.35 + i * 0.15);

      ctx.strokeStyle = c2;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = c2;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, radius * (0.9 + i * 0.2), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderCyberCube(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    scheme: FireColorScheme
  ) {
    const col = scheme === 'classic' ? '#ff841f' : '#00f0ff';
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.shadowColor = col;
    ctx.shadowBlur = 12;

    const size = radius * 0.9;
    const rot = this.state.rotationY;

    // Projected 3D cube vertices
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);

    ctx.save();
    ctx.translate(x, y);

    // Draw rotating 3D isometric frame
    for (let layer = -1; layer <= 1; layer += 2) {
      const zOffset = layer * 15;
      ctx.strokeRect(-size / 2 + sin * zOffset, -size / 2 + cos * zOffset, size, size);
    }

    // Connect corner diagonals
    ctx.beginPath();
    ctx.moveTo(-size / 2 - sin * 15, -size / 2 - cos * 15);
    ctx.lineTo(-size / 2 + sin * 15, -size / 2 + cos * 15);
    ctx.moveTo(size / 2 - sin * 15, size / 2 - cos * 15);
    ctx.lineTo(size / 2 + sin * 15, size / 2 + cos * 15);
    ctx.stroke();

    // Inner glowing core
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private renderPhoenixCore(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    scheme: FireColorScheme
  ) {
    ctx.globalCompositeOperation = 'lighter';
    const col = scheme === 'plasma' ? '#00f0ff' : scheme === 'violet' ? '#e032ff' : '#ff841f';

    // Flapping wings
    const flap = Math.sin(this.pulsePhase * 4) * (radius * 0.7);

    ctx.save();
    ctx.translate(x, y);

    // Left wing
    ctx.fillStyle = col;
    ctx.shadowColor = col;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-radius * 1.6, -radius + flap, -radius * 2.2, 0);
    ctx.quadraticCurveTo(-radius * 1.2, radius * 0.6, 0, 0);
    ctx.fill();

    // Right wing
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(radius * 1.6, -radius + flap, radius * 2.2, 0);
    ctx.quadraticCurveTo(radius * 1.2, radius * 0.6, 0, 0);
    ctx.fill();

    // Radiant core body
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private renderQuantumShield(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    scheme: FireColorScheme
  ) {
    const col = scheme === 'classic' ? '#ff841f' : '#00f0ff';
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = col;
    ctx.shadowBlur = 14;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.pulsePhase * 0.5);

    // Draw Hexagon shield
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const hx = Math.cos(angle) * radius * 1.1;
      const hy = Math.sin(angle) * radius * 1.1;
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();

    // Inner concentric ring
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}

export const controlledObjectManager = new ControlledObjectManager();
