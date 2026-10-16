import React from 'react';
import { Hand, Box, Pencil, Sparkles, Compass, Move, Maximize2 } from 'lucide-react';
import { DetectedHand } from '../types/vision';
import { blueprintEngine } from '../utils/blueprintEngine';

interface GesturePanelProps {
  hands: DetectedHand[];
  isStreaming: boolean;
}

export const GesturePanel: React.FC<GesturePanelProps> = ({ hands, isStreaming }) => {
  const isAnyFist = hands.some((h) => h.isFist);
  const isAnyPalm = hands.some((h) => h.isOpenPalm);
  const isAnyPinch = hands.some((h) => h.isPinching);
  const isAnyPointing = hands.some((h) => h.isPointing);
  const isDualHands = hands.length >= 2;

  const bpState = blueprintEngine.getState();
  const leadHand = hands[0];

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
            3D Spatial Gesture Telemetry
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {hands.length > 0 ? `${hands.length} HAND${hands.length > 1 ? 'S' : ''} TRACKED` : 'STANDBY'}
        </span>
      </div>

      {/* Main Gesture Status Display */}
      {!isStreaming ? (
        <div className="py-6 text-center text-slate-500 font-mono text-xs">
          Camera offline. Start camera to initialize hand tracking and 3D CAD gestures.
        </div>
      ) : hands.length === 0 ? (
        <div className="py-6 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mb-2">
            <Hand className="w-6 h-6 text-slate-500 animate-pulse" />
          </div>
          <p className="text-sm font-medium text-slate-400">No hands detected</p>
          <p className="text-xs text-slate-500 mt-1 max-w-[260px]">
            Raise hand into camera view. Pinch to draw, clench fist to move, open palm to rotate.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Gesture State Card */}
          <div
            className={`p-3.5 rounded-lg border transition-all duration-300 ${
              isDualHands
                ? 'bg-gradient-to-r from-blue-950/80 to-cyan-950/80 border-cyan-400/60 shadow-[0_0_20px_rgba(0,240,255,0.25)]'
                : isAnyPinch
                ? 'bg-gradient-to-r from-teal-950/80 to-cyan-950/80 border-teal-400/60 shadow-[0_0_20px_rgba(20,184,166,0.3)]'
                : isAnyFist
                ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border-cyan-500/60 shadow-[0_0_20px_rgba(0,240,255,0.25)]'
                : isAnyPalm
                ? 'bg-gradient-to-r from-indigo-950/70 to-blue-950/70 border-indigo-400/50 shadow-[0_0_15px_rgba(99,102,241,0.25)]'
                : 'bg-[#071126]/90 border-slate-700/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-md ${
                    isDualHands
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : isAnyPinch
                      ? 'bg-teal-500/20 text-teal-300'
                      : isAnyFist
                      ? 'bg-blue-500/20 text-blue-300'
                      : isAnyPalm
                      ? 'bg-indigo-500/20 text-indigo-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isDualHands ? (
                    <Maximize2 className="w-6 h-6" />
                  ) : isAnyPinch ? (
                    <Pencil className="w-6 h-6" />
                  ) : isAnyFist ? (
                    <Move className="w-6 h-6" />
                  ) : (
                    <Hand className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    Active CAD Gesture
                  </span>
                  <div className="text-sm sm:text-base font-bold tracking-wide">
                    {isDualHands ? (
                      <span className="text-cyan-300 flex items-center gap-1.5">
                        ↔ DUAL HANDS — 3D ZOOM & SCALE
                      </span>
                    ) : isAnyPinch ? (
                      <span className="text-teal-300 flex items-center gap-1.5 drop-shadow-[0_0_10px_rgba(20,184,166,0.6)]">
                        ✍️ PINCH — DRAWING 3D BLUEPRINT
                      </span>
                    ) : isAnyFist ? (
                      <span className="text-cyan-300 flex items-center gap-1.5">
                        ✊ FIST GRIP — TRANSLATING 3D MODEL
                      </span>
                    ) : isAnyPointing ? (
                      <span className="text-teal-300 flex items-center gap-1.5">
                        ☝️ STYLUS POINTER — AIMING RETICLE
                      </span>
                    ) : isAnyPalm ? (
                      <span className="text-indigo-300 flex items-center gap-1.5">
                        ✋ OPEN PALM — 3D ORBIT & ROTATE
                      </span>
                    ) : (
                      <span className="text-slate-400">Tracking hand movement...</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Handedness Badge */}
              {leadHand && (
                <div className="text-right font-mono">
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-cyan-500/30 text-[10px] text-cyan-300 uppercase">
                    {leadHand.handedness} Hand
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Finger Flexion Analysis Telemetry */}
          {leadHand && (
            <div className="p-3 rounded-lg bg-[#071126]/90 border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                <span className="text-cyan-400 font-semibold">Finger Joint Flexion (%):</span>
                <span className="text-slate-400">
                  Speed: {Math.round(leadHand.velocity.speed)} px/s
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2 text-center font-mono">
                {[
                  { name: 'Thumb', val: leadHand.fingerCurls.thumb },
                  { name: 'Index', val: leadHand.fingerCurls.index },
                  { name: 'Middle', val: leadHand.fingerCurls.middle },
                  { name: 'Ring', val: leadHand.fingerCurls.ring },
                  { name: 'Pinky', val: leadHand.fingerCurls.pinky },
                ].map((f) => {
                  const pct = Math.round((1 - f.val) * 100);
                  return (
                    <div key={f.name} className="space-y-1">
                      <div className="h-10 w-full bg-slate-900 rounded-sm overflow-hidden flex flex-col justify-end p-0.5 border border-slate-800">
                        <div
                          className="w-full bg-gradient-to-t from-cyan-600 to-teal-400 rounded-xs transition-all duration-150"
                          style={{ height: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block">{f.name}</span>
                      <span className="text-[9px] text-cyan-300 font-bold">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3D Blueprint Spatial Stats */}
          <div className="p-3 rounded-lg bg-[#071126]/90 border border-cyan-500/20 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-cyan-400 font-semibold text-[11px]">
              <span className="flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5" />
                <span>3D Blueprint Telemetry:</span>
              </span>
              <span className="text-slate-400 uppercase text-[10px]">
                Preset: {bpState.preset}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Zoom Scale</span>
                <span className="text-xs font-bold text-cyan-300">
                  {Math.round(bpState.scale * 100)}%
                </span>
              </div>
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Drawn Strokes</span>
                <span className="text-xs font-bold text-teal-300">
                  {bpState.freehandStrokes.length}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Vertices</span>
                <span className="text-xs font-bold text-white">
                  {bpState.vertices.length}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Status</span>
                <span className="text-xs font-bold text-emerald-400">
                  {bpState.isDrawing ? 'DRAWING' : 'IDLE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
