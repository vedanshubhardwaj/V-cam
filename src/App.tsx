/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { CameraView } from './components/CameraView';
import { ExpressionPanel } from './components/ExpressionPanel';
import { GesturePanel } from './components/GesturePanel';
import { ProjectGuide } from './components/ProjectGuide';
import { SnapshotModal } from './components/SnapshotModal';
import { FireConfig, VisionDetectionResult } from './types/vision';
import { soundFx } from './utils/audio';
import { ShieldCheck, Cpu, Zap, Hand, Flame, Smile, Sparkles, BookOpen } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState<'studio' | 'guide'>('studio');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(0);
  const [isModelReady, setIsModelReady] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  const [fireConfig, setFireConfig] = useState<FireConfig>({
    scheme: 'classic',
    intensity: 1.1,
    sparksEnabled: true,
    smokeEnabled: true,
    punchBurstEnabled: true,
    flameTrailEnabled: true,
  });

  const [detectionResult, setDetectionResult] = useState<VisionDetectionResult>({
    face: null,
    hands: [],
    timestamp: 0,
  });

  const captureHandlerRef = React.useRef<(() => string | null) | null>(null);

  const handleRegisterCaptureHandler = useCallback((handler: () => string | null) => {
    captureHandlerRef.current = handler;
  }, []);

  const handleStartCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Webcam API is not supported in this browser.');
      return;
    }

    try {
      // Test permission and availability
      const testStream = await navigator.mediaDevices.getUserMedia({ video: true });
      testStream.getTracks().forEach((track) => track.stop());
      setIsStreaming(true);
    } catch (err: any) {
      console.error('Camera permission/access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(
          'Camera access was denied. Please grant camera permission in your browser URL bar or settings to use V CAM.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera device detected on your system. Please connect a webcam.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Your camera is currently in use by another application. Please close other camera apps and retry.');
      } else {
        setCameraError(`Camera error: ${err.message || 'Unable to access camera.'}`);
      }
    }
  };

  const handleStopCamera = () => {
    setIsStreaming(false);
    setDetectionResult({ face: null, hands: [], timestamp: 0 });
    setFps(0);
  };

  const handleSnapshot = () => {
    if (captureHandlerRef.current) {
      soundFx.playBeep(1200);
      const dataUrl = captureHandlerRef.current();
      if (dataUrl) {
        setSnapshotUrl(dataUrl);
      }
    }
  };

  const handleToggleMute = (muted: boolean) => {
    setIsMuted(muted);
    soundFx.setMuted(muted);
  };

  return (
    <div className="min-h-screen bg-[#060c18] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Top Futuristic Header */}
      <Header
        isStreaming={isStreaming}
        fps={fps}
        fireConfig={fireConfig}
        onFireConfigChange={setFireConfig}
        onSnapshot={handleSnapshot}
        isModelReady={isModelReady}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {/* Main Content Area */}
      {activeView === 'guide' ? (
        <main className="flex-1">
          <ProjectGuide onBackToStudio={() => setActiveView('studio')} />
        </main>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Central Camera Display */}
          <section aria-label="Camera Feed">
            <CameraView
              isStreaming={isStreaming}
              onStartCamera={handleStartCamera}
              onStopCamera={handleStopCamera}
              fireConfig={fireConfig}
              onDetectionUpdate={setDetectionResult}
              onFpsUpdate={setFps}
              onModelReadyUpdate={setIsModelReady}
              cameraError={cameraError}
              onClearError={() => setCameraError(null)}
              onRegisterCaptureHandler={handleRegisterCaptureHandler}
            />
          </section>

          {/* Quick Object & Gesture Tip Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#09142c]/90 border border-cyan-500/20 text-xs font-mono">
            <div className="flex items-center gap-2 text-cyan-300">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="font-bold">AR OBJECT CONTROLS:</span>
              <span className="text-slate-300 hidden sm:inline">
                Open Palm = Tractor Beam &bull; Pinch = Grab & Drag &bull; Fast Punch = Blast Launch
              </span>
            </div>
            <button
              onClick={() => {
                soundFx.playBeep(950);
                setActiveView('guide');
              }}
              className="text-cyan-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Open Project Dossier</span>
            </button>
          </div>

          {/* Telemetry Panels: Facial Mood & Hand Gesture */}
          <section
            aria-label="Vision Telemetry"
            className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6"
          >
            {/* Facial Expression Status Panel */}
            <ExpressionPanel face={detectionResult.face} isStreaming={isStreaming} />

            {/* Hand Gesture Status & Fire Controls Panel */}
            <GesturePanel
              hands={detectionResult.hands}
              isStreaming={isStreaming}
              fireConfig={fireConfig}
              onFireConfigChange={setFireConfig}
            />
          </section>

          {/* Neural Architecture & Guide Bar */}
          <section className="hud-panel rounded-xl p-4 sm:p-5 text-xs text-slate-400">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-white uppercase font-mono tracking-wider">
                    Edge Neural Pipeline
                  </span>
                  <p className="text-slate-400 text-[11px]">
                    MediaPipe Vision FaceLandmarker (52 blendshapes) + HandLandmarker (21 3D joints)
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Zero Server Uploads &bull; 100% Client-Side</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>60 FPS Particle Canvas FX</span>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* Snapshot Preview Modal */}
      <SnapshotModal imageUrl={snapshotUrl} onClose={() => setSnapshotUrl(null)} />

      {/* Futuristic Bottom Status Bar */}
      <footer className="w-full bg-[#050914] border-t border-cyan-500/10 py-3 px-4 text-center text-[11px] text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>V CAM &bull; Neural Vision, Fire Fist & Gesture Control Engine</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-400" /> Fist = Fire Fist
            </span>
            <span className="flex items-center gap-1">
              <Hand className="w-3 h-3 text-cyan-400" /> Palm = Tractor Beam
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" /> Pinch = Object Grab
            </span>
            <span className="flex items-center gap-1">
              <Smile className="w-3 h-3 text-amber-400" /> Face = Live Mood
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
