/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { CameraView } from './components/CameraView';
import { CreationDock } from './components/CreationDock';
import { ExpressionPanel } from './components/ExpressionPanel';
import { GesturePanel } from './components/GesturePanel';
import { ProjectGuide } from './components/ProjectGuide';
import { SnapshotModal } from './components/SnapshotModal';
import {
  AppInteractionMode,
  BlueprintColorTheme,
  BlueprintDrawTool,
  BlueprintPresetType,
  VisionDetectionResult,
} from './types/vision';
import { blueprintEngine } from './utils/blueprintEngine';
import { soundFx } from './utils/audio';
import { ShieldCheck, Cpu, Zap, Hand, Smile, Box, Pencil, Move } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState<'studio' | 'guide'>('studio');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(0);
  const [isModelReady, setIsModelReady] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  // Creation Engine Mode & 3D Blueprint State
  const [interactionMode, setInteractionMode] = useState<AppInteractionMode>('blueprint');
  const [blueprintPreset, setBlueprintPreset] = useState<BlueprintPresetType>('cube');
  const [drawTool, setDrawTool] = useState<BlueprintDrawTool>('freehand');
  const [drawModeEnabled, setDrawModeEnabled] = useState<boolean>(true);
  const [colorTheme, setColorTheme] = useState<BlueprintColorTheme>('cyan');
  const [gridVisible, setGridVisible] = useState<boolean>(true);
  const [dimensionsVisible, setDimensionsVisible] = useState<boolean>(true);
  const [axesVisible, setAxesVisible] = useState<boolean>(true);

  const [detectionResult, setDetectionResult] = useState<VisionDetectionResult>({
    face: null,
    hands: [],
    timestamp: 0,
  });

  const captureHandlerRef = React.useRef<(() => string | null) | null>(null);

  const handleRegisterCaptureHandler = useCallback((handler: () => string | null) => {
    captureHandlerRef.current = handler;
  }, []);

  const handleStartCamera = () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Webcam API is not supported in this browser.');
      return;
    }
    setIsStreaming(true);
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

  const handleModeChange = (mode: AppInteractionMode) => {
    setInteractionMode(mode);
    if (mode === 'sculpt') {
      blueprintEngine.setPreset('blank');
      setBlueprintPreset('blank');
      setDrawModeEnabled(true);
      blueprintEngine.setDrawModeEnabled(true);
    }
  };

  const handlePresetChange = (preset: BlueprintPresetType) => {
    setBlueprintPreset(preset);
    blueprintEngine.setPreset(preset);
  };

  const handleDrawToolChange = (tool: BlueprintDrawTool) => {
    setDrawTool(tool);
    blueprintEngine.setDrawTool(tool);
  };

  const handleToggleDrawMode = () => {
    const next = !drawModeEnabled;
    setDrawModeEnabled(next);
    blueprintEngine.setDrawModeEnabled(next);
  };

  const handleColorThemeChange = (theme: BlueprintColorTheme) => {
    setColorTheme(theme);
    blueprintEngine.setColorTheme(theme);
  };

  const handleToggleGrid = () => {
    setGridVisible(!gridVisible);
    blueprintEngine.toggleGrid();
  };

  const handleToggleDimensions = () => {
    setDimensionsVisible(!dimensionsVisible);
    blueprintEngine.toggleDimensions();
  };

  const handleToggleAxes = () => {
    setAxesVisible(!axesVisible);
    blueprintEngine.toggleAxes();
  };

  const handleResetTransform = () => {
    blueprintEngine.resetTransform();
  };

  const handleUndoStroke = () => {
    blueprintEngine.undoStroke();
  };

  const handleClearDrawing = () => {
    blueprintEngine.clearFreehand();
  };

  return (
    <div className="min-h-screen bg-[#060c18] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Top Futuristic Header */}
      <Header
        isStreaming={isStreaming}
        fps={fps}
        colorTheme={colorTheme}
        onColorThemeChange={handleColorThemeChange}
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
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
          {/* Central Camera Display */}
          <section aria-label="Camera Feed">
            <CameraView
              isStreaming={isStreaming}
              onStartCamera={handleStartCamera}
              onStopCamera={handleStopCamera}
              interactionMode={interactionMode}
              onDetectionUpdate={setDetectionResult}
              onFpsUpdate={setFps}
              onModelReadyUpdate={setIsModelReady}
              cameraError={cameraError}
              onClearError={() => setCameraError(null)}
              onCameraError={setCameraError}
              onRegisterCaptureHandler={handleRegisterCaptureHandler}
            />
          </section>

          {/* Interactive Creation Dock (3D Blueprint CAD & Drawing Controls) */}
          <section aria-label="Creation Engine Dock">
            <CreationDock
              mode={interactionMode}
              onModeChange={handleModeChange}
              activePreset={blueprintPreset}
              onPresetChange={handlePresetChange}
              drawTool={drawTool}
              onDrawToolChange={handleDrawToolChange}
              drawModeEnabled={drawModeEnabled}
              onToggleDrawMode={handleToggleDrawMode}
              colorTheme={colorTheme}
              onColorThemeChange={handleColorThemeChange}
              gridVisible={gridVisible}
              onToggleGrid={handleToggleGrid}
              dimensionsVisible={dimensionsVisible}
              onToggleDimensions={handleToggleDimensions}
              axesVisible={axesVisible}
              onToggleAxes={handleToggleAxes}
              onResetTransform={handleResetTransform}
              onUndoStroke={handleUndoStroke}
              onClearDrawing={handleClearDrawing}
            />
          </section>

          {/* Telemetry Panels: Facial Mood & Hand Gesture */}
          <section
            aria-label="Vision Telemetry"
            className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6"
          >
            {/* Facial Expression Status Panel */}
            <ExpressionPanel face={detectionResult.face} isStreaming={isStreaming} />

            {/* Hand Gesture Status & CAD Controls Panel */}
            <GesturePanel
              hands={detectionResult.hands}
              isStreaming={isStreaming}
            />
          </section>

          {/* Neural Architecture & System Pipeline Bar */}
          <section className="hud-panel rounded-xl p-4 sm:p-5 text-xs text-slate-400">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-white uppercase font-mono tracking-wider">
                    Edge Neural Pipeline & 3D Blueprint CAD Engine
                  </span>
                  <p className="text-slate-400 text-[11px]">
                    MediaPipe FaceLandmarker + HandLandmarker &bull; Real-time Mid-Air Drawing &amp; Spatial Gestures
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
                  <span>60 FPS Holographic CAD Canvas</span>
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
          <span>V CAM &bull; 3D Blueprint CAD & Gesture Vision</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Pencil className="w-3 h-3 text-teal-300" /> Pinch = Draw 3D Lines
            </span>
            <span className="flex items-center gap-1">
              <Move className="w-3 h-3 text-cyan-400" /> Fist = Grip & Move
            </span>
            <span className="flex items-center gap-1">
              <Hand className="w-3 h-3 text-indigo-400" /> Palm = 3D Orbit
            </span>
            <span className="flex items-center gap-1">
              <Box className="w-3 h-3 text-cyan-300" /> 2 Hands = Zoom Scale
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
