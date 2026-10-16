import React from 'react';
import { Eye, Volume2, VolumeX, Camera, BookOpen, Video, Palette } from 'lucide-react';
import { BlueprintColorTheme } from '../types/vision';
import { blueprintEngine } from '../utils/blueprintEngine';
import { soundFx } from '../utils/audio';

interface HeaderProps {
  isStreaming: boolean;
  fps: number;
  colorTheme: BlueprintColorTheme;
  onColorThemeChange: (theme: BlueprintColorTheme) => void;
  onSnapshot: () => void;
  isModelReady: boolean;
  isMuted: boolean;
  onToggleMute: (muted: boolean) => void;
  activeView: 'studio' | 'guide';
  onViewChange: (view: 'studio' | 'guide') => void;
}

export const Header: React.FC<HeaderProps> = ({
  isStreaming,
  fps,
  colorTheme,
  onColorThemeChange,
  onSnapshot,
  isModelReady,
  isMuted,
  onToggleMute,
  activeView,
  onViewChange,
}) => {
  const themes: { id: BlueprintColorTheme; label: string; color: string }[] = [
    { id: 'cyan', label: 'Cyan Blueprint', color: 'from-cyan-400 to-blue-600' },
    { id: 'emerald', label: 'Emerald Matrix', color: 'from-emerald-400 to-teal-600' },
    { id: 'amber', label: 'Laser Amber', color: 'from-amber-400 to-orange-600' },
    { id: 'violet', label: 'Electric Violet', color: 'from-purple-400 to-fuchsia-600' },
    { id: 'white', label: 'Technical White', color: 'from-slate-200 to-white' },
  ];

  return (
    <header className="w-full bg-[#070e1e]/90 border-b border-cyan-500/20 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundFx.playBeep(880);
              onViewChange('studio');
            }}
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <Eye className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-wider text-white">
                  V <span className="text-cyan-400">CAM</span>
                </h1>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                  CAD Vision v3.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                3D Blueprint Creation & Spatial Gesture Vision
              </p>
            </div>
          </button>
        </div>

        {/* View Switcher Tabs (Studio vs Guide) */}
        <div className="flex items-center bg-[#0a142c] p-1 rounded-xl border border-cyan-500/20 font-mono text-xs">
          <button
            onClick={() => {
              soundFx.playBeep(920);
              onViewChange('studio');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeView === 'studio'
                ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-400/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Studio</span>
          </button>
          <button
            onClick={() => {
              soundFx.playBeep(980);
              onViewChange('guide');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeView === 'guide'
                ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-400/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Project Guide</span>
          </button>
        </div>

        {/* Engine Telemetry & Controls */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* Engine Status indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0a142c] border border-cyan-500/20 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                !isStreaming
                  ? 'bg-slate-500'
                  : isModelReady
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  : 'bg-amber-400 animate-ping'
              }`}
            />
            <span className="text-slate-300 uppercase">
              {!isStreaming ? 'Standby' : isModelReady ? 'Live ML' : 'Loading Model'}
            </span>
            {isStreaming && (
              <span className="text-cyan-400 font-semibold pl-1 border-l border-slate-700">
                {fps} FPS
              </span>
            )}
          </div>

          {/* Blueprint Theme Selector */}
          <div className="flex items-center gap-1.5 bg-[#0a142c] border border-cyan-500/20 rounded-md p-1">
            <span className="text-[11px] font-mono text-slate-400 px-1 hidden md:inline">
              <Palette className="w-3.5 h-3.5 inline mr-1 text-cyan-400" />
              Theme:
            </span>
            <select
              value={colorTheme}
              onChange={(e) => {
                const t = e.target.value as BlueprintColorTheme;
                soundFx.playBeep(980);
                onColorThemeChange(t);
                blueprintEngine.setColorTheme(t);
              }}
              className="bg-[#0f1d3d] text-xs text-cyan-300 rounded px-2 py-1 outline-none border border-cyan-500/30 cursor-pointer font-mono"
            >
              {themes.map((th) => (
                <option key={th.id} value={th.id} className="bg-[#071126] text-white">
                  {th.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              onToggleMute(!isMuted);
              soundFx.playBeep(isMuted ? 880 : 440);
            }}
            title={isMuted ? 'Unmute SFX' : 'Mute SFX'}
            className="p-2 rounded-md bg-[#0a142c] border border-cyan-500/20 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Snapshot Button */}
          {isStreaming && (
            <button
              onClick={onSnapshot}
              title="Capture blueprint snapshot"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs tracking-wide font-mono shadow-[0_0_12px_rgba(0,240,255,0.3)] transition-all cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Snapshot</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
