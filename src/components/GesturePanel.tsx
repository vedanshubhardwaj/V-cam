import React from 'react';
import { Flame, Hand, Sliders, Sparkles, CloudRain, Info, Zap, Box, Shield } from 'lucide-react';
import { ControlledObjectType, DetectedHand, FireConfig } from '../types/vision';
import { controlledObjectManager } from '../utils/controlledObject';
import { soundFx } from '../utils/audio';

interface GesturePanelProps {
  hands: DetectedHand[];
  isStreaming: boolean;
  fireConfig: FireConfig;
  onFireConfigChange: (config: FireConfig) => void;
}

export const GesturePanel: React.FC<GesturePanelProps> = ({
  hands,
  isStreaming,
  fireConfig,
  onFireConfigChange,
}) => {
  const isAnyFist = hands.some((h) => h.isFist);
  const isAnyPalm = hands.some((h) => h.isOpenPalm);
  const isAnyPinch = hands.some((h) => h.isPinching);
  const isAnyPunch = hands.some((h) => h.isPunching);

  const maxSpeed = hands.reduce((max, h) => Math.max(max, h.velocity.speed), 0);
  const objState = controlledObjectManager.getState();

  return (
    <div className="relative hud-panel rounded-xl p-4 sm:p-5 flex flex-col justify-between overflow-hidden">
      {/* Sci-Fi Decorative Corner Brackets */}
      <div className="corner-bracket-tl" />
      <div className="corner-bracket-tr" />
      <div className="corner-bracket-bl" />
      <div className="corner-bracket-br" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="text-sm font-semibold tracking-wide text-cyan-300 uppercase font-mono">
            Fire Fist & Gesture FX
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {hands.length > 0 ? `${hands.length} HAND${hands.length > 1 ? 'S' : ''} TRACKED` : 'IDLE'}
        </span>
      </div>

      {/* Main Gesture Status Display */}
      {!isStreaming ? (
        <div className="py-6 text-center text-slate-500 font-mono text-xs">
          Camera offline. Start camera to initialize hand gesture tracking.
        </div>
      ) : hands.length === 0 ? (
        <div className="py-6 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mb-2">
            <Hand className="w-6 h-6 text-slate-500 animate-pulse" />
          </div>
          <p className="text-sm font-medium text-slate-400">No hands in view</p>
          <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
            Raise your hand into the frame. Clench into a fist to summon fire.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Gesture State Card */}
          <div
            className={`p-3 rounded-lg border transition-all duration-300 ${
              isAnyPunch
                ? 'bg-gradient-to-r from-red-950/90 to-orange-950/90 border-red-500/80 shadow-[0_0_25px_rgba(239,68,68,0.5)]'
                : isAnyFist
                ? 'bg-gradient-to-r from-orange-950/70 to-red-950/70 border-orange-500/60 shadow-[0_0_20px_rgba(255,100,0,0.35)]'
                : isAnyPinch
                ? 'bg-gradient-to-r from-purple-950/70 to-indigo-950/70 border-purple-400/50 shadow-[0_0_15px_rgba(192,132,252,0.25)]'
                : isAnyPalm
                ? 'bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                : 'bg-[#071126]/90 border-slate-700/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-md ${
                    isAnyPunch
                      ? 'bg-red-500/20 text-red-400 animate-bounce'
                      : isAnyFist
                      ? 'bg-orange-500/20 text-orange-400'
                      : isAnyPinch
                      ? 'bg-purple-500/20 text-purple-300'
                      : isAnyPalm
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isAnyFist ? (
                    <Flame className="w-6 h-6 fill-orange-500" />
                  ) : isAnyPinch ? (
                    <Sparkles className="w-6 h-6" />
                  ) : (
                    <Hand className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    Gesture State
                  </span>
                  <div className="text-sm sm:text-base font-bold tracking-wide">
                    {isAnyPunch ? (
                      <span className="text-red-400 flex items-center gap-1.5 drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]">
                        💥 PUNCH STRIKE BLAST!
                      </span>
                    ) : isAnyFist ? (
                      <span className="text-orange-400 flex items-center gap-1.5 drop-shadow-[0_0_10px_rgba(255,120,0,0.8)]">
                        🔥 FIRE FIST IGNITED
                      </span>
                    ) : isAnyPinch ? (
                      <span className="text-purple-300 flex items-center gap-1.5">
                        🤏 PINCH — OBJECT GRIP
                      </span>
                    ) : isAnyPalm ? (
                      <span className="text-cyan-300 flex items-center gap-1.5">
                        ✋ OPEN PALM — TRACTOR BEAM
                      </span>
                    ) : (
                      <span className="text-slate-300">TRANSITIONAL GESTURE</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 text-cyan-300 uppercase block mb-1">
                  {hands.map((h) => h.handedness).join(' + ')}
                </span>
                <span className="text-[9px] font-mono text-slate-400 block">
                  {maxSpeed} px/s
                </span>
              </div>
            </div>
          </div>

          {/* Interactive AR Object Telemetry */}
          <div className="bg-[#071126]/80 rounded-lg p-3 border border-cyan-500/20 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Controlled AR Object:
              </span>
              <span className="text-slate-400 text-[10px] uppercase">
                {objState.type.replace('_', ' ')}
              </span>
            </div>

            <div className="text-[11px] font-mono text-slate-300 bg-[#091530] p-2 rounded border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 truncate mr-2">Status:</span>
              <span
                className={`font-semibold ${
                  objState.isGrabbed
                    ? 'text-purple-300'
                    : objState.isAttracted
                    ? 'text-cyan-300'
                    : 'text-amber-300'
                }`}
              >
                {objState.lastInteractionText}
              </span>
            </div>

            {/* Quick Switcher for Controlled Object */}
            <div className="grid grid-cols-4 gap-1 pt-1">
              {[
                { id: 'fire_orb', label: 'Orb', icon: Flame },
                { id: 'cyber_cube', label: 'Cube', icon: Box },
                { id: 'phoenix_core', label: 'Phoenix', icon: Sparkles },
                { id: 'quantum_shield', label: 'Shield', icon: Shield },
              ].map((obj) => {
                const Icon = obj.icon;
                const active = objState.type === obj.id;
                return (
                  <button
                    key={obj.id}
                    onClick={() => {
                      soundFx.playBeep(1000);
                      controlledObjectManager.setType(obj.id as ControlledObjectType);
                    }}
                    className={`py-1 px-1.5 rounded text-[10px] font-mono flex items-center justify-center gap-1 transition-all ${
                      active
                        ? 'bg-cyan-500/25 border border-cyan-400/50 text-cyan-300 font-bold'
                        : 'bg-slate-900/60 text-slate-400 hover:text-white border border-transparent'
                    }`}
                  >
                    <Icon className="w-3 h-3 text-cyan-400" />
                    <span>{obj.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Finger Curl Flexion Gauges */}
          {hands[0] && (
            <div className="bg-[#071126]/70 rounded-lg p-3 border border-cyan-500/15">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase">
                  Finger Flexion ({hands[0].handedness} Hand)
                </span>
                <span className="text-[10px] font-mono text-cyan-400">
                  {hands[0].isPunching
                    ? 'PUNCH IMPACT'
                    : hands[0].isFist
                    ? 'FIST LOCKED'
                    : hands[0].isPinching
                    ? 'PINCHING'
                    : hands[0].isOpenPalm
                    ? 'OPEN PALM'
                    : 'FLEXING'}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5 text-center">
                {(['thumb', 'index', 'middle', 'ring', 'pinky'] as const).map((finger) => {
                  const val = hands[0].fingerCurls[finger];
                  const isCurled = val > 0.6;
                  return (
                    <div
                      key={finger}
                      className="bg-[#091530] p-1.5 rounded border border-slate-800 text-[10px] font-mono"
                    >
                      <div className="text-slate-400 capitalize truncate mb-1">{finger}</div>
                      <div className="h-9 bg-slate-900 rounded relative overflow-hidden flex flex-col justify-end">
                        <div
                          className={`w-full transition-all duration-150 ${
                            isCurled ? 'bg-orange-500' : 'bg-cyan-500'
                          }`}
                          style={{ height: `${Math.round(val * 100)}%` }}
                        />
                      </div>
                      <div className="mt-1 text-[9px] text-slate-300">
                        {Math.round(val * 100)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fire Particles FX Controller */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <Sliders className="w-3.5 h-3.5" /> Flame Intensity
              </span>
              <span className="text-cyan-400 font-bold">{fireConfig.intensity}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={fireConfig.intensity}
              onChange={(e) => {
                onFireConfigChange({
                  ...fireConfig,
                  intensity: parseFloat(e.target.value),
                });
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />

            <div className="flex items-center justify-between gap-3 pt-1">
              {/* Sparks Toggle */}
              <button
                onClick={() => {
                  soundFx.playBeep(800);
                  onFireConfigChange({
                    ...fireConfig,
                    sparksEnabled: !fireConfig.sparksEnabled,
                  });
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md border text-xs font-mono transition-all ${
                  fireConfig.sparksEnabled
                    ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                Sparks {fireConfig.sparksEnabled ? 'ON' : 'OFF'}
              </button>

              {/* Smoke Toggle */}
              <button
                onClick={() => {
                  soundFx.playBeep(750);
                  onFireConfigChange({
                    ...fireConfig,
                    smokeEnabled: !fireConfig.smokeEnabled,
                  });
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md border text-xs font-mono transition-all ${
                  fireConfig.smokeEnabled
                    ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <CloudRain className="w-3 h-3" />
                Smoke {fireConfig.smokeEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guide tooltip */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
        <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span>Fist = Fire Fist &bull; Palm = Tractor Beam &bull; Punch = Blast</span>
      </div>
    </div>
  );
};
