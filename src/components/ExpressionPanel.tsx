import React from 'react';
import { Smile, Meh, Frown, AlertCircle, Sparkles, UserCheck, UserX } from 'lucide-react';
import { DetectedFace, ExpressionType } from '../types/vision';

interface ExpressionPanelProps {
  face: DetectedFace | null;
  isStreaming: boolean;
}

export const ExpressionPanel: React.FC<ExpressionPanelProps> = ({ face, isStreaming }) => {
  const getExpressionIcon = (type: ExpressionType) => {
    switch (type) {
      case 'Happy':
        return <Smile className="w-5 h-5 text-amber-400" />;
      case 'Surprised':
        return <Sparkles className="w-5 h-5 text-cyan-400 animate-spin" />;
      case 'Sad':
        return <Frown className="w-5 h-5 text-blue-400" />;
      case 'Neutral':
      default:
        return <Meh className="w-5 h-5 text-teal-300" />;
    }
  };

  const getExpressionBadgeColor = (type: ExpressionType) => {
    switch (type) {
      case 'Happy':
        return 'bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]';
      case 'Surprised':
        return 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]';
      case 'Sad':
        return 'bg-blue-500/10 border-blue-500/40 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.2)]';
      case 'Neutral':
      default:
        return 'bg-teal-500/10 border-teal-500/40 text-teal-300 shadow-[0_0_12px_rgba(20,184,166,0.2)]';
    }
  };

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
            Facial Mood Telemetry
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono">
          {face ? (
            <span className="flex items-center gap-1 text-emerald-400">
              <UserCheck className="w-3.5 h-3.5" />
              LOCKED
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-500">
              <UserX className="w-3.5 h-3.5" />
              NO TARGET
            </span>
          )}
        </div>
      </div>

      {/* Main Status Display */}
      {!isStreaming ? (
        <div className="py-6 text-center text-slate-500 font-mono text-xs">
          Camera offline. Start camera to initialize facial telemetry.
        </div>
      ) : !face ? (
        <div className="py-6 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mb-2">
            <UserX className="w-6 h-6 text-slate-500 animate-pulse" />
          </div>
          <p className="text-sm font-medium text-slate-400">Face not detected</p>
          <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
            Position your face within the camera viewport with adequate lighting.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Dominant Expression Highlight */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#071126]/90 border border-cyan-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-[#0b1735]">
                {getExpressionIcon(face.dominantExpression)}
              </div>
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase">
                  Dominant Expression
                </span>
                <div className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                  <span>{face.dominantExpression}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getExpressionBadgeColor(
                      face.dominantExpression
                    )}`}
                  >
                    {face.confidence}% Match
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Expressions Breakdown Bars */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase block">
              Confidence Spectrum
            </span>

            {/* Happy */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-amber-300 flex items-center gap-1">
                  <Smile className="w-3 h-3" /> Happy
                </span>
                <span className="text-slate-300">{face.expressions.Happy}%</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300 ease-out"
                  style={{ width: `${face.expressions.Happy}%` }}
                />
              </div>
            </div>

            {/* Neutral */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-teal-300 flex items-center gap-1">
                  <Meh className="w-3 h-3" /> Neutral
                </span>
                <span className="text-slate-300">{face.expressions.Neutral}%</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300 ease-out"
                  style={{ width: `${face.expressions.Neutral}%` }}
                />
              </div>
            </div>

            {/* Surprised */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-cyan-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Surprised
                </span>
                <span className="text-slate-300">{face.expressions.Surprised}%</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-300 ease-out"
                  style={{ width: `${face.expressions.Surprised}%` }}
                />
              </div>
            </div>

            {/* Sad */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-blue-300 flex items-center gap-1">
                  <Frown className="w-3 h-3" /> Sad
                </span>
                <span className="text-slate-300">{face.expressions.Sad}%</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 transition-all duration-300 ease-out"
                  style={{ width: `${face.expressions.Sad}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scientific/Fairness Disclaimer */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-start gap-2 text-[10px] text-slate-400 leading-tight">
        <AlertCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
        <p>
          Notice: Facial mood values are approximate geometrical blendshape estimates and do not determine actual human emotions.
        </p>
      </div>
    </div>
  );
};
