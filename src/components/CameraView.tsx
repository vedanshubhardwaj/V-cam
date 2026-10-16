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
  Hand,
  RotateCcw,
  Box,
  Pencil,
  Crosshair,
  Sparkles,
  Smile,
} from 'lucide-react';
import { visionEngine } from '../services/visionEngine';
import { soundFx } from '../utils/audio';
import { blueprintEngine } from '../utils/blueprintEngine';
import {
  AppInteractionMode,
  DetectedFace,
  DetectedHand,
  VisionDetectionResult,
} from '../types/vision';

interface CameraViewProps {
  isStreaming: boolean;
  onStartCamera: () => void;
  onStopCamera: () => void;
  interactionMode?: AppInteractionMode;
  onDetectionUpdate: (data: VisionDetectionResult) => void;
  onFpsUpdate: (fps: number) => void;
  onModelReadyUpdate: (ready: boolean) => void;
  cameraError: string | null;
  onClearError: () => void;
  onCameraError?: (error: string) => void;
  onRegisterCaptureHandler?: (handler: () => string | null) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  isStreaming,
  onStartCamera,
  onStopCamera,
  onDetectionUpdate,
  onFpsUpdate,
  onModelReadyUpdate,
  cameraError,
  onClearError,
  onCameraError,
  onRegisterCaptureHandler,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [showHud, setShowHud] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [modelStatusText, setModelStatusText] = useState<string>('Initializing AI Engine...');
  const [isModelLoading, setIsModelLoading] = useState<boolean>(false);

  // References for animation loop
  const animFrameId = useRef<number | null>(null);
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
        console.warn('Vision initialization note:', err);
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
        console.warn('Webcam stream notice:', err);
        let msg = 'Unable to access camera.';
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          msg = 'Camera access was denied. Please grant camera permission in your browser URL bar or settings to use V CAM.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          msg = 'No camera device detected on your system. Please connect a webcam.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          msg = 'Your camera is currently in use by another application. Please close other camera apps and retry.';
        } else {
          msg = `Camera issue: ${err.message || 'Unable to start camera stream.'}`;
        }
        onCameraError?.(msg);
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

    // Draw HUD & Blueprint CAD layer
    ctx.drawImage(canvasRef.current, 0, 0);

    return exportCanvas.toDataURL('image/png');
  }, [isMirrored]);

  useEffect(() => {
    if (onRegisterCaptureHandler) {
      onRegisterCaptureHandler(captureSnapshot);
    }
  }, [captureSnapshot, onRegisterCaptureHandler]);

  // Direct canvas pointer event handlers for mouse/stylus drawing
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isStreaming) return;
    const { x, y } = getCanvasCoords(e);
    blueprintEngine.handlePointerDown(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isStreaming) return;
    const { x, y } = getCanvasCoords(e);
    blueprintEngine.handlePointerMove(x, y);
  };

  const handlePointerUp = () => {
    if (!isStreaming) return;
    blueprintEngine.handlePointerUp();
  };

  // Main Real-Time Vision & Render Loop
  useEffect(() => {
    let isRunning = true;

    const renderLoop = () => {
      if (!isRunning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (
        isStreaming &&
        video &&
        canvas &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.videoWidth > 0
      ) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // 1. Run MediaPipe Detection (Face + Hand Landmarkers)
          const detection = visionEngine.processFrame(
            video,
            canvas.width,
            canvas.height,
            isMirrored
          );
          onDetectionUpdate(detection);

          const currentHands = detection.hands;

          // 2. Update & Render 3D CAD Blueprint with Hand Gestures
          blueprintEngine.update(canvas.width, canvas.height, currentHands);
          blueprintEngine.render(ctx, currentHands);

          // 3. Render Futuristic HUD Overlays
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
  }, [isStreaming, isMirrored, showHud, onDetectionUpdate, onFpsUpdate]);

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

      // Render hand skeleton lines
      const skeletonConnections = [
        [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
        [0, 5], [5, 6], [6, 7], [7, 8], // Index
        [5, 9], [9, 10], [10, 11], [11, 12], // Middle
        [9, 13], [13, 14], [14, 15], [15, 16], // Ring
        [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
        [0, 17], // Palm base
      ];

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = 1;
      skeletonConnections.forEach(([i, j]) => {
        const p1 = hand.landmarks[i];
        const p2 = hand.landmarks[j];
        if (p1 && p2) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      });

      // Finger tip nodes
      [4, 8, 12, 16, 20].forEach((idx) => {
        const pt = hand.landmarks[idx];
        if (pt) {
          ctx.fillStyle = idx === 8 ? '#00f0ff' : 'rgba(0, 240, 255, 0.6)';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, idx === 8 ? 3.5 : 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      if (hand.isFist) {
        // Fist: 3D CAD Move / Translation Reticle
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(hand.fistCenter.x, hand.fistCenter.y, hand.radius * 0.95, 0, Math.PI * 2);
        ctx.stroke();

        // Knuckle nodes (landmarks 5, 9, 13, 17)
        [5, 9, 13, 17].forEach((idx) => {
          if (hand.landmarks[idx]) {
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(hand.landmarks[idx].x, hand.landmarks[idx].y, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // Move Grip Label
        const label = `✊ FIST: MOVE / TRANSLATE [${Math.round(hand.velocity.speed)} px/s]`;
        ctx.font = 'bold 11px monospace';
        const w = ctx.measureText(label).width + 16;
        const lx = hand.fistCenter.x - w / 2;
        const ly = hand.fistCenter.y + hand.radius + 18;

        ctx.fillStyle = 'rgba(7, 14, 30, 0.9)';
        ctx.fillRect(lx, ly - 14, w, 20);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(lx, ly - 14, w, 20);

        ctx.fillStyle = '#00f0ff';
        ctx.fillText(label, lx + 8, ly);
      } else if (hand.isPinching) {
        // Pinching: 3D CAD Pen Down Drawing
        const tip = hand.landmarks[8];
        const thumb = hand.landmarks[4];
        if (tip && thumb) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(tip.x, tip.y, 14, 0, Math.PI * 2);
          ctx.stroke();

          const label = `🤏 PINCH: DRAWING 3D BLUEPRINT`;
          ctx.font = 'bold 11px monospace';
          const w = ctx.measureText(label).width + 14;
          const lx = tip.x - w / 2;
          const ly = tip.y - 20;

          ctx.fillStyle = 'rgba(7, 14, 30, 0.9)';
          ctx.fillRect(lx, ly - 14, w, 18);
          ctx.strokeStyle = '#00f0ff';
          ctx.strokeRect(lx, ly - 14, w, 18);

          ctx.fillStyle = '#00f0ff';
          ctx.fillText(label, lx + 7, ly);
        }
      } else if (hand.isOpenPalm) {
        // Open palm: 3D Orbit / Rotation Reticle
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
        ctx.moveTo(cx - r - 6, cy); ctx.lineTo(cx - r + 6, cy);
        ctx.moveTo(cx + r - 6, cy); ctx.lineTo(cx + r + 6, cy);
        ctx.moveTo(cx, cy - r - 6); ctx.lineTo(cx, cy - r + 6);
        ctx.moveTo(cx, cy + r - 6); ctx.lineTo(cx, cy + r + 6);
        ctx.stroke();

        // Palm Label
        const label = `✋ OPEN PALM: 3D ORBIT / ROTATE`;
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
      } else if (hand.isPointing) {
        // Pointing gesture: 3D Holographic CAD Stylus Aiming
        const tip = hand.landmarks[8];
        if (tip) {
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(tip.x, tip.y, 14, 0, Math.PI * 2);
          ctx.stroke();

          // Laser crosshair ticks
          ctx.beginPath();
          ctx.moveTo(tip.x - 20, tip.y); ctx.lineTo(tip.x + 20, tip.y);
          ctx.moveTo(tip.x, tip.y - 20); ctx.lineTo(tip.x + 20, tip.y);
          ctx.stroke();

          const label = `☝️ CAD STYLUS [PINCH TO DRAW]`;
          ctx.font = 'bold 11px monospace';
          const w = ctx.measureText(label).width + 14;
          const lx = tip.x - w / 2;
          const ly = tip.y - 24;

          ctx.fillStyle = 'rgba(7, 14, 30, 0.9)';
          ctx.fillRect(lx, ly - 14, w, 18);
          ctx.strokeStyle = '#00f0ff';
          ctx.strokeRect(lx, ly - 14, w, 18);

          ctx.fillStyle = '#00f0ff';
          ctx.fillText(label, lx + 7, ly);
        }
      }

      ctx.restore();
    });

    // Dual-hand Zoom Measurement Span
    if (hands.length >= 2) {
      ctx.save();
      const p1 = hands[0].isFist ? hands[0].fistCenter : hands[0].palmCenter;
      const p2 = hands[1].isFist ? hands[1].fistCenter : hands[1].palmCenter;
      const dist = Math.round(Math.hypot(p1.x - p2.x, p1.y - p2.y));

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const zoomText = `↔ DUAL-HAND ZOOM [${dist}px]`;
      ctx.font = 'bold 10px monospace';
      const zw = ctx.measureText(zoomText).width + 14;

      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(6, 12, 26, 0.9)';
      ctx.fillRect(midX - zw / 2, midY - 10, zw, 16);
      ctx.strokeStyle = '#00f0ff';
      ctx.strokeRect(midX - zw / 2, midY - 10, zw, 16);

      ctx.fillStyle = '#00f0ff';
      ctx.fillText(zoomText, midX - zw / 2 + 7, midY + 2);
      ctx.restore();
    }
  };

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

      {/* High-Resolution Overlay Canvas with Pointer Events for Direct Drawing */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`absolute inset-0 w-full h-full object-cover z-10 cursor-crosshair ${
          isStreaming ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Welcome & Permission Prompt Overlay (when camera not streaming) */}
      {!isStreaming && !cameraError && (
        <div className="relative z-20 text-center max-w-lg p-6 sm:p-8 flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-blue-600/20 to-teal-500/20 border border-cyan-400/40 flex items-center justify-center mb-5 shadow-[0_0_25px_rgba(0,240,255,0.25)]">
            <Camera className="w-10 h-10 text-cyan-400 animate-pulse" />
          </div>

          <h2 className="text-2xl font-black tracking-wide text-white mb-2">
            WELCOME TO <span className="text-cyan-400">V CAM</span>
          </h2>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            Real-time browser neural vision engine. Detects facial expressions, analyzes hand gestures,
            and allows you to <strong>draw & control 3D blueprints in mid-air</strong>.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-3 w-full mb-6 text-left">
            <div className="p-3 rounded-lg bg-[#0b1735]/80 border border-cyan-500/20 flex items-start gap-2.5">
              <Pencil className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-white">In-Air 3D CAD Drawing</div>
                <div className="text-[11px] text-slate-400">Pinch or mouse-drag to construct 3D blueprints</div>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#0b1735]/80 border border-cyan-500/20 flex items-start gap-2.5">
              <Hand className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-white">Spatial Gestures</div>
                <div className="text-[11px] text-slate-400">Fist = Move &bull; Palm = Orbit &bull; 2 Hands = Zoom</div>
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

          {/* Reset Transform */}
          <button
            onClick={() => {
              soundFx.playBeep(920);
              if (canvasRef.current) {
                blueprintEngine.resetTransform(canvasRef.current.width, canvasRef.current.height);
              }
            }}
            title="Center & Reset Blueprint 3D View"
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-cyan-300 text-xs transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
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
