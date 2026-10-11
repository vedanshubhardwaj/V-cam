import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  FlipHorizontal,
  Maximize2,
  Minimize2,
  Layers,
  AlertTriangle,
  RefreshCw,
  Flame,
  Hand,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Box,
  Shield,
  Zap,
} from 'lucide-react';
import { visionEngine } from '../services/visionEngine';
import { FireEffectSystem } from '../utils/particleSystem';
import { soundFx } from '../utils/audio';
import { controlledObjectManager } from '../utils/controlledObject';
import {
  ControlledObjectType,
  DetectedFace,
  DetectedHand,
  FireConfig,
  VisionDetectionResult,
} from '../types/vision';

interface CameraViewProps {
  isStreaming: boolean;
  onStartCamera: () => void;
  onStopCamera: () => void;
  fireConfig: FireConfig;
  onDetectionUpdate: (data: VisionDetectionResult) => void;
  onFpsUpdate: (fps: number) => void;
  onModelReadyUpdate: (ready: boolean) => void;
  cameraError: string | null;
  onClearError: () => void;
  onRegisterCaptureHandler?: (handler: () => string | null) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  isStreaming,
  onStartCamera,
  onStopCamera,
  fireConfig,
  onDetectionUpdate,
  onFpsUpdate,
  onModelReadyUpdate,
  cameraError,
  onClearError,
  onRegisterCaptureHandler,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [showHud, setShowHud] = useState<boolean>(true);
  const [showObject, setShowObject] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [modelStatusText, setModelStatusText] = useState<string>('Initializing...');
  const [isModelLoading, setIsModelLoading] = useState<boolean>(false);
  const [palmQuenchedFlash, setPalmQuenchedFlash] = useState<boolean>(false);
  const [punchStrikeFlash, setPunchStrikeFlash] = useState<string | null>(null);

  const [activeObjectType, setActiveObjectType] = useState<ControlledObjectType>('fire_orb');

  // References for animation loop
  const animFrameId = useRef<number | null>(null);
  const fireSystemRef = useRef<FireEffectSystem>(new FireEffectSystem());
  const previousGestures = useRef<Map<string, 'closed_fist' | 'open_palm' | 'pinch' | 'unknown'>>(new Map());
  const fpsCounter = useRef<{ count: number; lastTime: number }>({ count: 0, lastTime: performance.now() });

  // Stream state
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize Vision Models
  useEffect(() => {
    let mounted = true;
    setIsModelLoading(true);

    visionEngine
      .initialize((status) => {
        if (mounted) setModelStatusText(status);
      })
      .then((ready) => {
        if (mounted) {
          setIsModelLoading(false);
          onModelReadyUpdate(ready);
        }
      })
      .catch((err) => {
        console.error('Vision initialization error:', err);
        if (mounted) {
          setIsModelLoading(false);
          setModelStatusText('Error loading models');
        }
      });

    return () => {
      mounted = false;
    };
  }, [onModelReadyUpdate]);

  // Handle Camera Stream Start / Stop
  useEffect(() => {
    let active = true;

    const startWebcam = async () => {
      if (!isStreaming) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err: any) {
        console.error('Failed to get user media:', err);
      }
    };

    if (isStreaming) {
      startWebcam();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      fireSystemRef.current.clear();
    }

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isStreaming]);

  // Snapshot capture handler
  const captureSnapshot = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvasRef.current.width;
    exportCanvas.height = canvasRef.current.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return null;

    // Draw video background
    ctx.save();
    if (isMirrored) {
      ctx.translate(exportCanvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoRef.current, 0, 0, exportCanvas.width, exportCanvas.height);
    ctx.restore();

    // Draw HUD, Object & Fire layer
    ctx.drawImage(canvasRef.current, 0, 0);

    // Add V CAM watermark
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = 'rgba(0, 240, 255, 0.9)';
    ctx.fillText('V CAM // NEURAL FX & FIRE FIST', 24, exportCanvas.height - 24);

    return exportCanvas.toDataURL('image/png');
  }, [isMirrored]);

  useEffect(() => {
    if (onRegisterCaptureHandler) {
      onRegisterCaptureHandler(captureSnapshot);
    }
  }, [onRegisterCaptureHandler, captureSnapshot]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Main Processing & Animation Loop
  useEffect(() => {
    if (!isStreaming) {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      return;
    }

    let isRunning = true;

    const renderLoop = (timestamp: number) => {
      if (!isRunning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2) {
        // Sync canvas resolution to video dimensions
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 1280;
          canvas.height = video.videoHeight || 720;
          controlledObjectManager.resetPosition(canvas.width, canvas.height);
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // 1. Process Computer Vision Frame
          const detection = visionEngine.processVideoFrame(
            video,
            timestamp,
            canvas.width,
            canvas.height,
            isMirrored
          );

          onDetectionUpdate(detection);

          // 2. Audio Triggers & Gesture State Transitions
          const currentHands = detection.hands;
          const activeFistsForFire: { id: string; x: number; y: number; radius: number }[] = [];

          currentHands.forEach((hand, idx) => {
            const handId = `hand_${idx}_${hand.handedness}`;
            const prevGesture = previousGestures.current.get(handId) || 'unknown';

            // Transition into Closed Fist -> Ignite flame!
            if (hand.isFist && prevGesture !== 'closed_fist') {
              soundFx.playIgnite();
            }

            // Transition into Open Palm -> Quench flame!
            if (hand.isOpenPalm && prevGesture === 'closed_fist') {
              soundFx.playQuench();
              setPalmQuenchedFlash(true);
              setTimeout(() => setPalmQuenchedFlash(false), 800);
            }

            // Punch Strike Blast Trigger
            if (hand.isPunching) {
              soundFx.playPunch();
              fireSystemRef.current.triggerPunchBurst(
                hand.fistCenter.x,
                hand.fistCenter.y,
                hand.radius,
                fireConfig
              );
              setPunchStrikeFlash(`🔥 PUNCH STRIKE (${hand.velocity.speed} px/s)`);
              setTimeout(() => setPunchStrikeFlash(null), 700);
            }

            previousGestures.current.set(handId, hand.gesture);

            // If fist is closed: emit realistic fire particles!
            if (hand.isFist) {
              fireSystemRef.current.emitFromHand(
                handId,
                hand.fistCenter.x,
                hand.fistCenter.y,
                hand.radius,
                fireConfig
              );

              activeFistsForFire.push({
                id: handId,
                x: hand.fistCenter.x,
                y: hand.fistCenter.y,
                radius: hand.radius,
              });
            }
          });

          // 3. Update & Render Interactive Controlled Object
          if (showObject) {
            controlledObjectManager.update(
              canvas.width,
              canvas.height,
              currentHands,
              () => {
                // Punch hit callback
                soundFx.playPunch();
                const objState = controlledObjectManager.getState();
                fireSystemRef.current.triggerPunchBurst(
                  objState.x,
                  objState.y,
                  objState.radius * 1.4,
                  fireConfig
                );
              },
              () => {
                // Energy grab callback
                soundFx.playEnergyLock();
              }
            );

            controlledObjectManager.render(ctx, currentHands, fireConfig.scheme);
          }

          // 4. Render Fire Particle System
          fireSystemRef.current.updateAndRender(ctx, fireConfig, activeFistsForFire);

          // 5. Render Futuristic HUD Overlays
          if (showHud) {
            renderFaceHud(ctx, detection.face);
            renderHandsHud(ctx, currentHands);
          }
        }
      }

      // Compute FPS
      fpsCounter.current.count++;
      const now = performance.now();
      if (now - fpsCounter.current.lastTime >= 1000) {
        onFpsUpdate(fpsCounter.current.count);
        fpsCounter.current.count = 0;
        fpsCounter.current.lastTime = now;
      }

      animFrameId.current = requestAnimationFrame(renderLoop);
    };

    animFrameId.current = requestAnimationFrame(renderLoop);

    return () => {
      isRunning = false;
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [isStreaming, isMirrored, showHud, showObject, fireConfig, onDetectionUpdate, onFpsUpdate]);

  // Draw Face Bounding Box & HUD
  const renderFaceHud = (ctx: CanvasRenderingContext2D, face: DetectedFace | null) => {
    if (!face) return;

    const { x, y, width, height } = face.boundingBox;
    const cornerSize = Math.min(24, width * 0.2, height * 0.2);

    ctx.save();

    // High-tech sci-fi corner brackets
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(x, y + cornerSize);
    ctx.lineTo(x, y);
    ctx.lineTo(x + cornerSize, y);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(x + width - cornerSize, y);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width, y + cornerSize);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(x, y + height - cornerSize);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x + cornerSize, y + height);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(x + width - cornerSize, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x + width, y + height - cornerSize);
    ctx.stroke();

    // Subtle face bounding box boundary
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.strokeRect(x, y, width, height);

    // Crosshair target in center of face
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(centerX - 8, centerY);
    ctx.lineTo(centerX + 8, centerY);
    ctx.moveTo(centerX, centerY - 8);
    ctx.lineTo(centerX, centerY + 8);
    ctx.stroke();

    // HUD Label Pill on Top of Bounding Box
    const labelText = `FACE: ${face.dominantExpression.toUpperCase()} (${face.confidence}%)`;
    ctx.font = 'bold 12px monospace';
    const textMetrics = ctx.measureText(labelText);
    const badgeW = textMetrics.width + 16;
    const badgeH = 22;
    const badgeX = x;
    const badgeY = Math.max(10, y - badgeH - 6);

    ctx.fillStyle = 'rgba(7, 14, 30, 0.85)';
    ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
    ctx.strokeStyle = '#00f0ff';
    ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

    ctx.fillStyle = '#00f0ff';
    ctx.fillText(labelText, badgeX + 8, badgeY + 15);

    ctx.restore();
  };

  // Draw Hand Gesture HUD Indicators
  const renderHandsHud = (ctx: CanvasRenderingContext2D, hands: DetectedHand[]) => {
    hands.forEach((hand) => {
      ctx.save();

      if (hand.isFist) {
        // Fist is engulfed in fire; draw fiery knuckle targeting reticle and combustion points
        ctx.strokeStyle = 'rgba(255, 140, 20, 0.8)';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ff841f';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(hand.fistCenter.x, hand.fistCenter.y, hand.radius * 1.15, 0, Math.PI * 2);
        ctx.stroke();

        // Knuckle nodes (landmarks 5, 9, 13, 17)
        [5, 9, 13, 17].forEach((idx) => {
          if (hand.landmarks[idx]) {
            ctx.fillStyle = '#fff7c2';
            ctx.shadowColor = '#ff841f';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(hand.landmarks[idx].x, hand.landmarks[idx].y, 4.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // Fist Badge & Velocity indicator
        const label = `🔥 FIRE FIST [${hand.velocity.speed > 550 ? 'PUNCHING' : 'CHARGED'}] ${hand.velocity.speed} px/s`;
        ctx.font = 'bold 11px monospace';
        const w = ctx.measureText(label).width + 16;
        const lx = hand.fistCenter.x - w / 2;
        const ly = hand.fistCenter.y + hand.radius + 20;

        ctx.fillStyle = 'rgba(20, 8, 0, 0.9)';
        ctx.fillRect(lx, ly - 14, w, 20);
        ctx.strokeStyle = hand.isPunching ? '#ef4444' : '#ff841f';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(lx, ly - 14, w, 20);

        ctx.fillStyle = hand.isPunching ? '#fca5a5' : '#ffb347';
        ctx.fillText(label, lx + 8, ly);
      } else if (hand.isPinching) {
        // Pinching indicator (Object Grab)
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(hand.landmarks[4].x, hand.landmarks[4].y, 14, 0, Math.PI * 2);
        ctx.stroke();

        const label = `🤏 PINCH [OBJECT GRIP]`;
        ctx.font = 'bold 11px monospace';
        const w = ctx.measureText(label).width + 14;
        const lx = hand.landmarks[4].x - w / 2;
        const ly = hand.landmarks[4].y - 20;

        ctx.fillStyle = 'rgba(20, 10, 30, 0.9)';
        ctx.fillRect(lx, ly - 14, w, 18);
        ctx.strokeStyle = '#c084fc';
        ctx.strokeRect(lx, ly - 14, w, 18);

        ctx.fillStyle = '#e9d5ff';
        ctx.fillText(label, lx + 7, ly);
      } else if (hand.isOpenPalm) {
        // Open palm: display clean cyan holographic ring confirming gesture
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(hand.palmCenter.x, hand.palmCenter.y, hand.radius * 0.9, 0, Math.PI * 2);
        ctx.stroke();

        // 4 crosshair ticks around palm
        const r = hand.radius * 0.9;
        const cx = hand.palmCenter.x;
        const cy = hand.palmCenter.y;
        ctx.beginPath();
        ctx.moveTo(cx - r - 6, cy);
        ctx.lineTo(cx - r + 6, cy);
        ctx.moveTo(cx + r - 6, cy);
        ctx.lineTo(cx + r + 6, cy);
        ctx.moveTo(cx, cy - r - 6);
        ctx.lineTo(cx, cy - r + 6);
        ctx.moveTo(cx, cy + r - 6);
        ctx.lineTo(cx, cy + r + 6);
        ctx.stroke();

        // Palm Label
        const label = `✋ OPEN PALM [TRACTOR BEAM]`;
        ctx.font = 'bold 11px monospace';
        const w = ctx.measureText(label).width + 14;
        const lx = cx - w / 2;
        const ly = cy + r + 18;

        ctx.fillStyle = 'rgba(7, 14, 30, 0.85)';
        ctx.fillRect(lx, ly - 14, w, 18);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
        ctx.strokeRect(lx, ly - 14, w, 18);

        ctx.fillStyle = '#00f0ff';
        ctx.fillText(label, lx + 7, ly);
      }

      ctx.restore();
    });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] sm:aspect-[16/10] md:aspect-[16/9] max-h-[720px] rounded-2xl bg-[#050b16] border border-cyan-500/25 overflow-hidden shadow-[0_0_30px_rgba(0,240,255,0.1)] flex items-center justify-center group"
    >
      {/* Sci-Fi Decorative Corner Accents */}
      <div className="corner-bracket-tl z-20" />
      <div className="corner-bracket-tr z-20" />
      <div className="corner-bracket-bl z-20" />
      <div className="corner-bracket-br z-20" />

      {/* Holographic Scanline Overlay */}
      <div className="absolute inset-0 scanlines z-10 pointer-events-none opacity-40" />

      {/* Hidden Live Video Element */}
      <video
        ref={videoRef}
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-transform duration-200 ${
          isMirrored ? 'scale-x-[-1]' : ''
        } ${isStreaming ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* High-Resolution Overlay Canvas */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none z-10 ${
          isStreaming ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Palm Quenched Flash Confirmation Effect */}
      {palmQuenchedFlash && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/90 border border-cyan-400 text-cyan-300 font-mono text-xs shadow-[0_0_20px_#00f0ff] animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>PALM CONFIRMED — FLAME QUENCHED</span>
        </div>
      )}

      {/* Punch Strike Flash Alert */}
      {punchStrikeFlash && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-red-950/90 via-orange-950/90 to-red-950/90 border border-orange-500 text-orange-300 font-mono text-xs shadow-[0_0_25px_rgba(255,80,0,0.8)] animate-bounce">
          <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
          <span>{punchStrikeFlash}</span>
        </div>
      )}

      {/* Interactive Object Floating Toolbar (Top Right) */}
      {isStreaming && (
        <div className="absolute top-4 right-4 z-30 flex flex-col gap-1.5 p-2 rounded-xl bg-[#071126]/85 border border-cyan-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.6)]">
          <div className="text-[10px] font-mono text-cyan-400 px-1 font-bold flex items-center justify-between">
            <span>AR OBJECT:</span>
            <button
              onClick={() => {
                soundFx.playBeep(900);
                if (canvasRef.current) {
                  controlledObjectManager.resetPosition(canvasRef.current.width, canvasRef.current.height);
                }
              }}
              title="Reset Object Position to Center"
              className="text-slate-400 hover:text-cyan-300 p-0.5"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
            {[
              { id: 'fire_orb', label: 'Orb', icon: Flame },
              { id: 'cyber_cube', label: 'Cube', icon: Box },
              { id: 'phoenix_core', label: 'Phoenix', icon: Sparkles },
              { id: 'quantum_shield', label: 'Shield', icon: Shield },
            ].map((obj) => {
              const Icon = obj.icon;
              const isSelected = activeObjectType === obj.id;
              return (
                <button
                  key={obj.id}
                  onClick={() => {
                    soundFx.playBeep(1050);
                    setActiveObjectType(obj.id as ControlledObjectType);
                    controlledObjectManager.setType(obj.id as ControlledObjectType);
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                    isSelected
                      ? 'bg-cyan-500/25 border border-cyan-400/50 text-cyan-300 font-bold'
                      : 'bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3 h-3 text-cyan-400" />
                  <span>{obj.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Welcome & Permission Prompt Overlay (when camera not streaming) */}
      {!isStreaming && !cameraError && (
        <div className="relative z-20 text-center max-w-lg p-6 sm:p-8 flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-blue-600/20 to-orange-500/20 border border-cyan-400/40 flex items-center justify-center mb-5 shadow-[0_0_25px_rgba(0,240,255,0.25)]">
            <Camera className="w-10 h-10 text-cyan-400 animate-pulse" />
          </div>

          <h2 className="text-2xl font-black tracking-wide text-white mb-2">
            WELCOME TO <span className="text-cyan-400">V CAM</span>
          </h2>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            Real-time browser vision neural engine. Detects facial expressions, triggers the
            tracked <strong>Fire Fist</strong>, and lets you <strong>control interactive AR objects</strong> with hand gestures.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-3 w-full mb-6 text-left">
            <div className="p-3 rounded-lg bg-[#0b1735]/80 border border-cyan-500/20 flex items-start gap-2.5">
              <Flame className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-white">Fire Fist & Punch</div>
                <div className="text-[11px] text-slate-400">Clench fist to ignite flame; punch to blast</div>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#0b1735]/80 border border-cyan-500/20 flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-white">Object Telekinesis</div>
                <div className="text-[11px] text-slate-400">Attract with palm, grab with pinch, strike</div>
              </div>
            </div>
          </div>

          {/* Model Loading State or Start Camera Button */}
          {isModelLoading ? (
            <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-mono text-sm">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              <span>{modelStatusText}</span>
            </div>
          ) : (
            <button
              onClick={() => {
                soundFx.playBeep(1100);
                onStartCamera();
              }}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(0,240,255,0.4)] transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-2.5"
            >
              <Camera className="w-5 h-5" />
              <span>Start Camera</span>
            </button>
          )}

          <div className="mt-4 text-[11px] font-mono text-slate-400">
            Private & Safe: All video processing runs 100% locally on your browser.
          </div>
        </div>
      )}

      {/* Camera Error & Permission Denied View */}
      {cameraError && (
        <div className="relative z-20 text-center max-w-md p-6 bg-[#160c14]/90 border border-rose-500/40 rounded-xl shadow-[0_0_30px_rgba(244,63,94,0.2)]">
          <div className="w-14 h-14 rounded-full bg-rose-950/80 border border-rose-500/40 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-7 h-7 text-rose-400" />
          </div>
          <h3 className="text-base font-bold text-rose-200 mb-1">Camera Access Issue</h3>
          <p className="text-xs text-rose-300 mb-4 leading-relaxed">{cameraError}</p>
          <div className="p-3 rounded bg-slate-950/80 text-left text-[11px] text-slate-300 font-mono mb-4 border border-slate-800 space-y-1">
            <div className="text-cyan-400 font-semibold">How to enable:</div>
            <div>1. Click the camera/lock icon in your browser URL bar.</div>
            <div>2. Change Camera permission to &quot;Allow&quot;.</div>
            <div>3. Click &quot;Try Again&quot; below.</div>
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                onClearError();
                onStartCamera();
              }}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onClearError}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* In-Stream HUD Floating Controls Bar */}
      {isStreaming && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 p-1.5 rounded-xl bg-[#071126]/85 border border-cyan-500/30 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          {/* Stop Camera */}
          <button
            onClick={() => {
              soundFx.playBeep(700);
              onStopCamera();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-[0_0_10px_rgba(225,29,72,0.3)]"
          >
            <CameraOff className="w-3.5 h-3.5" />
            <span>Stop Camera</span>
          </button>

          <div className="w-[1px] h-5 bg-slate-700 mx-1" />

          {/* Object Toggle */}
          <button
            onClick={() => {
              soundFx.playBeep(800);
              setShowObject(!showObject);
            }}
            title={showObject ? 'Hide Controlled Object' : 'Show Controlled Object'}
            className={`p-2 rounded-lg text-xs font-mono transition-colors ${
              showObject
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Mirror Toggle */}
          <button
            onClick={() => {
              soundFx.playBeep(850);
              setIsMirrored(!isMirrored);
            }}
            title={isMirrored ? 'Disable Mirroring' : 'Enable Mirroring'}
            className={`p-2 rounded-lg text-xs font-mono transition-colors ${
              isMirrored
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>

          {/* HUD Overlay Toggle */}
          <button
            onClick={() => {
              soundFx.playBeep(900);
              setShowHud(!showHud);
            }}
            title={showHud ? 'Hide HUD' : 'Show HUD'}
            className={`p-2 rounded-lg text-xs font-mono transition-colors ${
              showHud
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => {
              soundFx.playBeep(950);
              toggleFullscreen();
            }}
            title="Toggle Fullscreen"
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
};
