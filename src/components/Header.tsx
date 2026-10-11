import React from 'react';
import { Flame, Eye, Volume2, VolumeX, Camera, BookOpen, Video } from 'lucide-react';
import { FireColorScheme, FireConfig } from '../types/vision';
import { soundFx } from '../utils/audio';

interface HeaderProps {
  isStreaming: boolean;
  fps: number;
  fireConfig: FireConfig;
  onFireConfigChange: (config: FireConfig) => void;
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
  fireConfig,
  onFireConfigChange,
  onSnapshot,
  isModelReady,
  isMuted,
  onToggleMute,
  activeView,
  onViewChange,
}) => {
  const schemes: { id: FireColorScheme; label: string; color: string }[] = [
    { id: 'classic', label: 'Inferno Orange', color: 'from-amber-500 to-orange-600' },
    { id: 'plasma', label: 'Plasma Cyan', color: 'from-cyan-400 to-blue-600' },
    { id: 'violet', label: 'Void Violet', color: 'from-purple-400 to-fuchsia-600' },
    { id: 'emerald', label: 'Emerald Green', color: 'from-emerald-400 to-teal-600' },
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
                  Neural FX v2.5
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Fire Fist & Gesture-Controlled AR Engine
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

          {/* Fire Preset Selector */}
          <div className="flex items-center gap-1.5 bg-[#0a142c] border border-cyan-500/20 rounded-md p-1">
            <span className="text-[11px] font-mono text-slate-400 px-1 hidden md:inline">
              <Flame className="w-3.5 h-3.5 inline mr-1 text-orange-400" />
              FX:
            </span>
            <select
              value={fireConfig.scheme}
              onChange={(e) => {
                soundFx.playBeep(980);
                onFireConfigChange({
                  ...fireConfig,
                  scheme: e.target.value as FireColorScheme,
                });
              }}
              className="bg-[#0f1d3d] text-xs text-cyan-300 rounded px-2 py-1 outline-none border border-cyan-500/30 cursor-pointer font-mono"
            >
              {schemes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Audio Mute Button */}
          <button
            onClick={() => onToggleMute(!isMuted)}
            title={isMuted ? 'Unmute SFX' : 'Mute SFX'}
            className="p-2 rounded-md bg-[#0a142c] border border-cyan-500/20 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/40 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-slate-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            )}
          </button>

          {/* Snapshot Button */}
          {isStreaming && (
            <button
              onClick={onSnapshot}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs shadow-[0_0_12px_rgba(0,240,255,0.3)] transition-all cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Capture</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
