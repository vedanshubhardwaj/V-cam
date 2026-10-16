import React from 'react';
import {
  Box,
  Pencil,
  RotateCcw,
  Trash2,
  Undo2,
  Grid,
  Ruler,
  Compass,
  Circle,
  Triangle,
  Cylinder,
  Globe,
  Radio,
  Cpu,
  Layers,
  Sparkles,
  Minus,
  Square,
} from 'lucide-react';
import {
  AppInteractionMode,
  BlueprintColorTheme,
  BlueprintDrawTool,
  BlueprintPresetType,
} from '../types/vision';
import { blueprintEngine } from '../utils/blueprintEngine';
import { soundFx } from '../utils/audio';

interface CreationDockProps {
  mode: AppInteractionMode;
  onModeChange: (mode: AppInteractionMode) => void;
  activePreset: BlueprintPresetType;
  onPresetChange: (preset: BlueprintPresetType) => void;
  drawTool: BlueprintDrawTool;
  onDrawToolChange: (tool: BlueprintDrawTool) => void;
  drawModeEnabled: boolean;
  onToggleDrawMode: () => void;
  colorTheme: BlueprintColorTheme;
  onColorThemeChange: (theme: BlueprintColorTheme) => void;
  gridVisible: boolean;
  onToggleGrid: () => void;
  dimensionsVisible: boolean;
  onToggleDimensions: () => void;
  axesVisible: boolean;
  onToggleAxes: () => void;
  onResetTransform: () => void;
  onUndoStroke: () => void;
  onClearDrawing: () => void;
}

export const CreationDock: React.FC<CreationDockProps> = ({
  mode,
  onModeChange,
  activePreset,
  onPresetChange,
  drawTool,
  onDrawToolChange,
  drawModeEnabled,
  onToggleDrawMode,
  colorTheme,
  onColorThemeChange,
  gridVisible,
  onToggleGrid,
  dimensionsVisible,
  onToggleDimensions,
  axesVisible,
  onToggleAxes,
  onResetTransform,
  onUndoStroke,
  onClearDrawing,
}) => {
  const modes: { id: AppInteractionMode; label: string; icon: React.FC<{ className?: string }>; desc: string }[] = [
    {
      id: 'blueprint',
      label: '3D CAD Blueprint',
      icon: Box,
      desc: 'Full 3D modeling with hand gesture navigation',
    },
    {
      id: 'sculpt',
      label: 'Air Drawing Sculpt',
      icon: Pencil,
      desc: 'Freehand mid-air sketch pad for custom 3D wireframes',
    },
    {
      id: 'inspector',
      label: 'Structure Inspector',
      icon: Compass,
      desc: 'Analyze CAD dimensions, node vertices, and ground grid',
    },
  ];

  const presets: { id: BlueprintPresetType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'blank', label: 'Blank Canvas', icon: Sparkles },
    { id: 'cube', label: 'Cube', icon: Box },
    { id: 'pyramid', label: 'Pyramid', icon: Triangle },
    { id: 'cylinder', label: 'Cylinder', icon: Cylinder },
    { id: 'sphere', label: 'Sphere', icon: Globe },
    { id: 'drone', label: 'Drone Chassis', icon: Radio },
    { id: 'reactor', label: 'Arc Reactor', icon: Cpu },
  ];

  const drawTools: { id: BlueprintDrawTool; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'freehand', label: 'Freehand Pen', icon: Pencil },
    { id: 'straight_line', label: 'CAD Line', icon: Minus },
    { id: 'box_3d', label: '3D Box', icon: Square },
    { id: 'circle_3d', label: '3D Ring', icon: Circle },
  ];

  const colors: { id: BlueprintColorTheme; label: string; bg: string }[] = [
    { id: 'cyan', label: 'Cyan CAD', bg: 'bg-[#00f0ff]' },
    { id: 'emerald', label: 'Matrix Green', bg: 'bg-[#10b981]' },
    { id: 'amber', label: 'Laser Amber', bg: 'bg-[#f59e0b]' },
    { id: 'violet', label: 'Electric Violet', bg: 'bg-[#a855f7]' },
    { id: 'white', label: 'Tech White', bg: 'bg-[#ffffff]' },
  ];

  return (
    <div className="w-full bg-[#071126]/90 border border-cyan-500/25 rounded-2xl p-3 sm:p-4 backdrop-blur-md shadow-[0_0_25px_rgba(0,0,0,0.6)] flex flex-col gap-3 font-mono">
      {/* 1. Main Mode Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold hidden sm:inline">
            Studio Engine:
          </span>
          <div className="flex items-center flex-wrap gap-1.5">
            {modes.map((m) => {
              const Icon = m.icon;
              const isActive = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    soundFx.playBeep(isActive ? 880 : 1080);
                    onModeChange(m.id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                      : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live helper status text */}
        <div className="text-[10px] text-cyan-300 hidden md:flex items-center gap-3">
          <span>🤏 Pinch = Draw</span>
          <span>✊ Fist = Move</span>
          <span>🖐️ Palm = 3D Orbit</span>
          <span>👐 2 Hands = Zoom</span>
        </div>
      </div>

      {/* 2. Sub-dock: 3D Model Presets + CAD Drawing Tools Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Preset Models */}
        <div className="flex items-center flex-wrap gap-1">
          <span className="text-[10px] text-slate-400 mr-1 hidden sm:inline">3D Blueprint:</span>
          {presets.map((p) => {
            const Icon = p.icon;
            const isSelected = activePreset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  soundFx.playBeep(960);
                  onPresetChange(p.id);
                  blueprintEngine.setPreset(p.id);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/25 border border-cyan-400/60 text-cyan-300 font-bold shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800/60'
                }`}
              >
                <Icon className="w-3 h-3 text-cyan-400" />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Drawing Tools Selector */}
        <div className="flex items-center flex-wrap gap-1">
          <span className="text-[10px] text-slate-400 mr-1 hidden lg:inline">Draw Tool:</span>
          {drawTools.map((t) => {
            const Icon = t.icon;
            const isSelected = drawTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  soundFx.playBeep(1020);
                  onDrawToolChange(t.id);
                  blueprintEngine.setDrawTool(t.id);
                }}
                title={`Switch to ${t.label}`}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600/40 border border-cyan-400/70 text-white font-bold'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800/60'
                }`}
              >
                <Icon className="w-3 h-3 text-cyan-300" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Color Picker, Drawing Mode Toggle & CAD Canvas Utility Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-cyan-500/15 text-[11px]">
        {/* Left: Draw Mode Toggle & Color Theme Palette */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => {
              soundFx.playBeep(drawModeEnabled ? 750 : 1150);
              onToggleDrawMode();
              blueprintEngine.setDrawModeEnabled(!drawModeEnabled);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-bold transition-all cursor-pointer ${
              drawModeEnabled
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.25)]'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Pencil className="w-3.5 h-3.5 text-cyan-400" />
            <span>Draw Mode: {drawModeEnabled ? 'ACTIVE (Pinch)' : 'OFF'}</span>
          </button>

          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <span className="text-[10px] text-slate-400 hidden sm:inline">Color:</span>
            {colors.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  soundFx.playBeep(980);
                  onColorThemeChange(c.id);
                  blueprintEngine.setColorTheme(c.id);
                }}
                title={c.label}
                className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${c.bg} ${
                  colorTheme === c.id
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-[#071126] scale-110'
                    : 'opacity-70 hover:opacity-100'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right: Actions (Undo, Clear, Grid, Dimensions, Axes, Reset) */}
        <div className="flex items-center flex-wrap gap-1.5">
          {/* Undo Stroke */}
          <button
            onClick={() => {
              onUndoStroke();
              blueprintEngine.undoStroke();
            }}
            title="Undo last drawn stroke"
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            <Undo2 className="w-3 h-3" />
            <span>Undo</span>
          </button>

          {/* Clear Freehand */}
          <button
            onClick={() => {
              onClearDrawing();
              blueprintEngine.clearFreehand();
            }}
            title="Clear all drawn strokes"
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear Strokes</span>
          </button>

          <div className="w-[1px] h-4 bg-slate-800 mx-0.5" />

          {/* Grid Toggle */}
          <button
            onClick={() => {
              soundFx.playBeep(850);
              onToggleGrid();
            }}
            title="Toggle isometric ground grid"
            className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors cursor-pointer ${
              gridVisible
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Grid className="w-3 h-3 text-cyan-400" />
            <span>Grid</span>
          </button>

          {/* Dimensions Toggle */}
          <button
            onClick={() => {
              soundFx.playBeep(850);
              onToggleDimensions();
            }}
            title="Toggle measurement dimension callouts"
            className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors cursor-pointer ${
              dimensionsVisible
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Ruler className="w-3 h-3 text-cyan-400" />
            <span>Dims</span>
          </button>

          {/* Axes Toggle */}
          <button
            onClick={() => {
              soundFx.playBeep(850);
              onToggleAxes();
            }}
            title="Toggle 3D coordinate axes"
            className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors cursor-pointer ${
              axesVisible
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3 h-3 text-cyan-400" />
            <span>Axes</span>
          </button>

          {/* Reset Transform */}
          <button
            onClick={() => {
              soundFx.playBeep(920);
              onResetTransform();
            }}
            title="Center & align blueprint view"
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Align</span>
          </button>
        </div>
      </div>
    </div>
  );
};
