import { FireConfig } from '../types/vision';

interface FlameParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  initialSize: number;
  type: 'flame' | 'spark' | 'smoke' | 'core';
  rotation: number;
  rotationSpeed: number;
  colorIndex: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  scheme: FireConfig['scheme'];
}

export class FireEffectSystem {
  private particles: FlameParticle[] = [];
  private shockwaves: Shockwave[] = [];
  private maxParticles: number = 400;
  private prevPositions: Map<string, { x: number; y: number }> = new Map();

  constructor() {
    // Pre-allocate particle pool to eliminate GC frame drops
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        size: 1,
        initialSize: 1,
        type: 'flame',
        rotation: 0,
        rotationSpeed: 0,
        colorIndex: 0,
      });
    }
  }

  private getColorRamp(scheme: FireConfig['scheme'], progress: number): string {
    // progress is 0.0 (fresh born / hot core) to 1.0 (dying tip)
    switch (scheme) {
      case 'plasma':
        if (progress < 0.25) return `rgba(240, 255, 255, ${1 - progress})`;
        if (progress < 0.6) return `rgba(40, 215, 255, ${0.9 - progress * 0.7})`;
        if (progress < 0.85) return `rgba(10, 110, 255, ${0.7 - progress * 0.6})`;
        return `rgba(5, 40, 160, ${(1 - progress) * 0.4})`;

      case 'violet':
        if (progress < 0.25) return `rgba(255, 240, 255, ${1 - progress})`;
        if (progress < 0.6) return `rgba(235, 60, 255, ${0.9 - progress * 0.7})`;
        if (progress < 0.85) return `rgba(145, 20, 245, ${0.7 - progress * 0.6})`;
        return `rgba(70, 0, 150, ${(1 - progress) * 0.4})`;

      case 'emerald':
        if (progress < 0.25) return `rgba(240, 255, 240, ${1 - progress})`;
        if (progress < 0.6) return `rgba(40, 255, 130, ${0.9 - progress * 0.7})`;
        if (progress < 0.85) return `rgba(10, 180, 70, ${0.7 - progress * 0.6})`;
        return `rgba(5, 80, 30, ${(1 - progress) * 0.4})`;

      case 'classic':
      default:
        if (progress < 0.2) return `rgba(255, 255, 220, ${1 - progress})`;
        if (progress < 0.5) return `rgba(255, 175, 25, ${0.95 - progress * 0.6})`;
        if (progress < 0.8) return `rgba(245, 65, 10, ${0.8 - progress * 0.6})`;
        return `rgba(120, 20, 5, ${(1 - progress) * 0.4})`;
    }
  }

  private spawnParticle(
    x: number,
    y: number,
    radius: number,
    type: 'flame' | 'spark' | 'smoke' | 'core',
    config: FireConfig
  ) {
    const p = this.particles.find((item) => !item.active);
    if (!p) return;

    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * radius * 0.75;
    const px = x + Math.cos(angle) * dist;
    const py = y + Math.sin(angle) * dist;

    const intensity = config.intensity || 1.0;

    p.active = true;
    p.type = type;
    p.x = px;
    p.y = py;
    p.rotation = Math.random() * Math.PI * 2;
    p.rotationSpeed = (Math.random() - 0.5) * 0.08;

    if (type === 'core') {
      p.maxLife = 12 + Math.random() * 8;
      p.life = p.maxLife;
      p.size = radius * 0.8 * intensity;
      p.initialSize = p.size;
      p.vx = (Math.random() - 0.5) * 0.6;
      p.vy = -Math.random() * 1.0 - 0.5;
    } else if (type === 'spark') {
      p.maxLife = 20 + Math.random() * 25;
      p.life = p.maxLife;
      p.size = (2 + Math.random() * 3.5) * (radius / 50) * intensity;
      p.initialSize = p.size;
      const speed = (2.5 + Math.random() * 4.5) * (radius / 60);
      const sparkAngle = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
      p.vx = Math.cos(sparkAngle) * speed;
      p.vy = Math.sin(sparkAngle) * speed;
    } else if (type === 'smoke') {
      p.maxLife = 35 + Math.random() * 25;
      p.life = p.maxLife;
      p.size = (10 + Math.random() * 14) * (radius / 50) * intensity;
      p.initialSize = p.size;
      p.vx = (Math.random() - 0.5) * 1.2;
      p.vy = -1.2 - Math.random() * 1.5;
    } else {
      // standard flame tongue
      p.maxLife = 18 + Math.random() * 16;
      p.life = p.maxLife;
      p.size = (12 + Math.random() * 18) * (radius / 45) * intensity;
      p.initialSize = p.size;
      p.vx = (Math.random() - 0.5) * 1.8 * (radius / 50);
      p.vy = (-2.5 - Math.random() * 3.8) * (radius / 50);
    }
  }

  public emitFromHand(
    handId: string,
    x: number,
    y: number,
    radius: number,
    config: FireConfig
  ) {
    const prev = this.prevPositions.get(handId) || { x, y };

    // Emit along interpolated steps to prevent gaps when hand moves fast
    const steps = 3;
    for (let step = 0; step < steps; step++) {
      const interpX = prev.x + (x - prev.x) * (step / steps);
      const interpY = prev.y + (y - prev.y) * (step / steps);

      // Core bloom particle
      this.spawnParticle(interpX, interpY, radius * 0.4, 'core', config);

      // Main flame tongues
      const flameCount = Math.floor(4 * (config.intensity || 1.0));
      for (let i = 0; i < flameCount; i++) {
        this.spawnParticle(interpX, interpY, radius, 'flame', config);
      }

      // Sparks / Embers
      if (config.sparksEnabled && Math.random() < 0.65) {
        this.spawnParticle(interpX, interpY, radius * 0.6, 'spark', config);
      }

      // Smoke puffs
      if (config.smokeEnabled && Math.random() < 0.35) {
        this.spawnParticle(interpX, interpY - radius * 0.5, radius * 0.8, 'smoke', config);
      }
    }

    this.prevPositions.set(handId, { x, y });
  }

  public updateAndRender(
    ctx: CanvasRenderingContext2D,
    config: FireConfig,
    activeHands: { id: string; x: number; y: number; radius: number }[]
  ) {
    const activeHandIds = new Set(activeHands.map((h) => h.id));
    for (const key of Array.from(this.prevPositions.keys())) {
      if (!activeHandIds.has(key)) {
        this.prevPositions.delete(key);
      }
    }

    // First: draw ambient radiance glow under the fists
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const hand of activeHands) {
      const glowGrad = ctx.createRadialGradient(
        hand.x,
        hand.y,
        0,
        hand.x,
        hand.y,
        hand.radius * 2.8 * config.intensity
      );

      const colorCore =
        config.scheme === 'plasma'
          ? 'rgba(0, 220, 255, 0.4)'
          : config.scheme === 'violet'
          ? 'rgba(210, 50, 255, 0.4)'
          : config.scheme === 'emerald'
          ? 'rgba(30, 255, 120, 0.4)'
          : 'rgba(255, 140, 20, 0.45)';

      glowGrad.addColorStop(0, colorCore);
      glowGrad.addColorStop(0.5, colorCore.replace('0.4', '0.15').replace('0.45', '0.15'));
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(hand.x, hand.y, hand.radius * 2.8 * config.intensity, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Second: Render particles with additive lighter blend mode for high incandescent flame fidelity
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const p of this.particles) {
      if (!p.active) continue;

      p.life--;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }

      const progress = 1 - p.life / p.maxLife;

      // Physics update
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;

      // Convective thermal turbulence
      if (p.type === 'flame') {
        p.vx += (Math.random() - 0.5) * 0.4;
        p.vy -= 0.08; // upward buoyancy
        p.size = p.initialSize * (1 - progress * 0.7);
      } else if (p.type === 'spark') {
        p.vx += (Math.random() - 0.5) * 0.6;
        p.vy += 0.03; // slight gravity deceleration
        p.size = p.initialSize * (1 - progress * 0.5);
      } else if (p.type === 'smoke') {
        p.vx += (Math.random() - 0.5) * 0.2;
        p.size = p.initialSize * (1 + progress * 1.5);
      } else if (p.type === 'core') {
        p.size = p.initialSize * (1 - progress * 0.3);
      }

      // Drawing
      if (p.type === 'smoke') {
        // Smoke is drawn softer
        const alpha = (1 - progress) * 0.18;
        ctx.fillStyle = `rgba(35, 45, 60, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'spark') {
        // Bright glowing spark
        const color =
          config.scheme === 'plasma'
            ? `rgba(200, 245, 255, ${1 - progress})`
            : config.scheme === 'violet'
            ? `rgba(255, 210, 255, ${1 - progress})`
            : config.scheme === 'emerald'
            ? `rgba(210, 255, 220, ${1 - progress})`
            : `rgba(255, 230, 160, ${1 - progress})`;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Flame tongue / Core
        const rad = Math.max(1, p.size);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
        const colCenter = this.getColorRamp(config.scheme, progress * 0.6);
        const colOuter = this.getColorRamp(config.scheme, Math.min(1, progress + 0.35));

        grad.addColorStop(0, colCenter);
        grad.addColorStop(0.65, colOuter);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Render explosive punch shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life--;
      if (sw.life <= 0) {
        this.shockwaves.splice(i, 1);
        continue;
      }

      const progress = 1 - sw.life / sw.maxLife;
      const currentRadius = sw.radius + (sw.maxRadius - sw.radius) * progress;
      const alpha = (1 - progress) * 0.8;

      ctx.save();
      ctx.lineWidth = 4 * (1 - progress);
      const ringCol =
        sw.scheme === 'plasma'
          ? `rgba(0, 240, 255, ${alpha})`
          : sw.scheme === 'violet'
          ? `rgba(225, 50, 255, ${alpha})`
          : sw.scheme === 'emerald'
          ? `rgba(40, 255, 120, ${alpha})`
          : `rgba(255, 120, 20, ${alpha})`;

      ctx.strokeStyle = ringCol;
      ctx.shadowColor = ringCol;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, currentRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Explodes a fiery burst shockwave and flying sparks when user throws a punch
   */
  public triggerPunchBurst(
    x: number,
    y: number,
    radius: number,
    config: FireConfig
  ) {
    // Add expanding shockwave ring
    this.shockwaves.push({
      x,
      y,
      radius: radius * 0.8,
      maxRadius: radius * 3.2,
      life: 16,
      maxLife: 16,
      scheme: config.scheme,
    });

    // Spawn 24 high-velocity omnidirectional explosive sparks
    for (let i = 0; i < 24; i++) {
      const p = this.particles.find((item) => !item.active);
      if (!p) break;

      const angle = (i / 24) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 6 + Math.random() * 8;

      p.active = true;
      p.type = 'spark';
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.maxLife = 22 + Math.random() * 12;
      p.life = p.maxLife;
      p.size = 3.5 + Math.random() * 3;
      p.initialSize = p.size;
      p.rotation = 0;
      p.rotationSpeed = 0;
      p.colorIndex = 0;
    }
  }

  public clear() {
    for (const p of this.particles) {
      p.active = false;
    }
    this.shockwaves = [];
    this.prevPositions.clear();
  }
}

