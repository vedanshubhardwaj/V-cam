import React, { useState } from 'react';
import {
  Hand,
  Smile,
  ShieldCheck,
  Cpu,
  Zap,
  Sparkles,
  Layers,
  ChevronRight,
  Eye,
  BookOpen,
  Play,
  RotateCcw,
  Box,
  Pencil,
  Move,
  Maximize2,
  Grid,
  Ruler,
  Compass,
} from 'lucide-react';

interface ProjectGuideProps {
  onBackToStudio: () => void;
}

export const ProjectGuide: React.FC<ProjectGuideProps> = ({ onBackToStudio }) => {
  const [activeTab, setActiveTab] = useState<'blueprints' | 'gestures' | 'drawing' | 'face_mood' | 'architecture'>('drawing');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn font-sans">
      {/* Top Banner */}
      <div className="relative hud-panel rounded-2xl p-6 sm:p-8 overflow-hidden border border-cyan-500/30">
        <div className="corner-bracket-tl" />
        <div className="corner-bracket-tr" />
        <div className="corner-bracket-bl" />
        <div className="corner-bracket-br" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 font-mono text-xs text-cyan-400">
              <BookOpen className="w-4 h-4" />
              <span>PROJECT DOSSIER & COMPREHENSIVE USER GUIDE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              V <span className="text-cyan-400">CAM</span> // 3D Blueprint CAD & Gesture Vision
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              V CAM is a futuristic, browser-native computer vision platform that allows you to construct,
              sketch, and manipulate 3D blueprints in mid-air using hand gestures and live facial analysis.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onBackToStudio}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs tracking-wider uppercase font-mono shadow-[0_0_20px_rgba(0,240,255,0.35)] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Enter Live Studio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Guide Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-[#091329] border border-cyan-500/20 font-mono text-xs">
        {[
          { id: 'drawing', label: '1. In-Air 3D Drawing', icon: Pencil },
          { id: 'gestures', label: '2. Spatial Hand Gestures', icon: Hand },
          { id: 'blueprints', label: '3. 3D Blueprint Models', icon: Box },
          { id: 'face_mood', label: '4. Face Mood Telemetry', icon: Smile },
          { id: 'architecture', label: '5. Edge AI & Privacy', icon: Cpu },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: In-Air 3D Drawing Guide */}
      {activeTab === 'drawing' && (
        <div className="space-y-6">
          <div className="hud-panel rounded-xl p-6 border border-cyan-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-400">
                <Pencil className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white font-mono uppercase tracking-wider">
                  How In-Air 3D Drawing Works
                </h2>
                <p className="text-xs text-cyan-300 font-mono">
                  Construct custom wireframes and mechanical parts in real-time space
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-[#0a152e] border border-cyan-500/20 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-mono font-bold">
                  1
                </div>
                <h3 className="font-semibold text-white text-sm">Aim with Index Finger</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Raise your hand and point your index finger. A high-precision holographic reticle crosshair
                  follows your fingertip with real-time CAD coordinates.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0a152e] border border-cyan-500/20 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-mono font-bold">
                  2
                </div>
                <h3 className="font-semibold text-white text-sm">Pinch to Touch Down Pen</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Touch your thumb and index fingertip together (Pinch gesture). This initiates <strong>Pen Down</strong>.
                  Move your hand to draw continuous 3D strokes or drag CAD lines.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0a152e] border border-cyan-500/20 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center font-mono font-bold">
                  3
                </div>
                <h3 className="font-semibold text-white text-sm">Release to Commit Stroke</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Open your pinch to lift the pen. Your drawn stroke snaps into the 3D model space and
                  rotates, moves, and zooms with the entire blueprint!
                </p>
              </div>
            </div>

            {/* Drawing Tools Details */}
            <div className="mt-8 pt-6 border-t border-cyan-500/20 space-y-4">
              <h3 className="text-sm font-bold text-cyan-300 font-mono uppercase">
                Available CAD Drawing Tools:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-[#071126] border border-slate-800">
                  <span className="text-cyan-400 font-bold block mb-1">✍️ Freehand Pen</span>
                  <span className="text-slate-400">Continuous smooth paths for organic shapes and hand sketches.</span>
                </div>
                <div className="p-3 rounded-lg bg-[#071126] border border-slate-800">
                  <span className="text-cyan-400 font-bold block mb-1">📏 Straight CAD Line</span>
                  <span className="text-slate-400">Pinch and drag to anchor precise straight line segments.</span>
                </div>
                <div className="p-3 rounded-lg bg-[#071126] border border-slate-800">
                  <span className="text-cyan-400 font-bold block mb-1">📦 3D Box Wireframe</span>
                  <span className="text-cyan-400 font-bold block mb-1"></span>
                  <span className="text-slate-400">Drag to generate full 3D cubic structures with bounding depth.</span>
                </div>
                <div className="p-3 rounded-lg bg-[#071126] border border-slate-800">
                  <span className="text-cyan-400 font-bold block mb-1">⭕ 3D Circular Ring</span>
                  <span className="text-slate-400">Create cylindrical hoops and rotational circular geometry.</span>
                </div>
              </div>
            </div>

            {/* Direct Canvas Mouse Drawing Support */}
            <div className="mt-4 p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/20 flex items-center gap-3 text-xs text-slate-300">
              <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
              <span>
                <strong>Desktop Mouse Support:</strong> In addition to mid-air gestures, you can click and drag directly
                on the camera canvas with your mouse or stylus for millimeter precision!
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Spatial Hand Gestures */}
      {activeTab === 'gestures' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="hud-panel rounded-xl p-5 border border-cyan-500/25 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm font-mono">Pinch (Thumb + Index)</h3>
                  <span className="text-[11px] text-teal-400 font-mono">Pen Down Drawing</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Touching thumb tip and index tip initiates the CAD stylus. Draw lines, shapes, or wireframe blueprints
                in real-time space.
              </p>
            </div>

            <div className="hud-panel rounded-xl p-5 border border-cyan-500/25 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300">
                  <Move className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm font-mono">Closed Fist</h3>
                  <span className="text-[11px] text-blue-400 font-mono">3D Grip &amp; Translate</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Clenching your fingers into a fist locks the CAD object in place. Moving your fist smoothly translates
                the blueprint across the screen.
              </p>
            </div>

            <div className="hud-panel rounded-xl p-5 border border-cyan-500/25 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300">
                  <Hand className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm font-mono">Open Palm</h3>
                  <span className="text-[11px] text-indigo-400 font-mono">3D Orbit &amp; Rotation</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Spreading open your palm engages the 3D rotation gimbal. Moving your hand horizontally rotates Yaw, and
                vertically rotates Pitch.
              </p>
            </div>

            <div className="hud-panel rounded-xl p-5 border border-cyan-500/25 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300">
                  <Maximize2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm font-mono">Dual Hands</h3>
                  <span className="text-[11px] text-cyan-400 font-mono">Zoom In / Zoom Out</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Raising both hands into view activates dual-hand scaling. Move your hands farther apart to zoom in, or
                closer together to zoom out.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: 3D Blueprint Models */}
      {activeTab === 'blueprints' && (
        <div className="space-y-6">
          <div className="hud-panel rounded-xl p-6 border border-cyan-500/30">
            <h2 className="text-base font-bold text-white font-mono uppercase mb-4">
              Included 3D Blueprint Schemas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-[#091530] border border-cyan-500/20 space-y-2">
                <span className="text-cyan-300 font-bold text-sm block">Blank Canvas</span>
                <p className="text-slate-400 leading-relaxed">
                  Start with zero preset geometry. 100% created by your own hand-drawn lines in 3D air.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#091530] border border-cyan-500/20 space-y-2">
                <span className="text-cyan-300 font-bold text-sm block">Cube &amp; Pyramid</span>
                <p className="text-slate-400 leading-relaxed">
                  Classic geometric wireframes with vertex nodes and automatic dimension callouts.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#091530] border border-cyan-500/20 space-y-2">
                <span className="text-cyan-300 font-bold text-sm block">Cylinder &amp; Sphere</span>
                <p className="text-slate-400 leading-relaxed">
                  Curved mathematical meshes computed with trigonometric ribs and geodesic vertices.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#091530] border border-cyan-500/20 space-y-2">
                <span className="text-cyan-300 font-bold text-sm block">Quadcopter Drone Chassis</span>
                <p className="text-slate-400 leading-relaxed">
                  Technical mechanical schematic featuring central fuselage and four rotor pylons.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#091530] border border-cyan-500/20 space-y-2">
                <span className="text-cyan-300 font-bold text-sm block">Arc Reactor Core</span>
                <p className="text-slate-400 leading-relaxed">
                  Dual toroidal ring reactor with magnetic confinement pillars and central focal node.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Facial Mood Telemetry */}
      {activeTab === 'face_mood' && (
        <div className="space-y-6">
          <div className="hud-panel rounded-xl p-6 border border-cyan-500/30">
            <h2 className="text-base font-bold text-white font-mono uppercase mb-4">
              Real-Time Facial Expression Estimation
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              V CAM tracks 478 3D facial landmarks and blendshapes to estimate visible expressions in real-time.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
              <div className="p-3 rounded-lg bg-[#091530] border border-cyan-500/20">
                <span className="text-2xl block mb-1">😊</span>
                <span className="text-xs text-emerald-400 font-bold">Happy</span>
                <p className="text-[10px] text-slate-400 mt-1">Lip corner puller blendshapes</p>
              </div>
              <div className="p-3 rounded-lg bg-[#091530] border border-cyan-500/20">
                <span className="text-2xl block mb-1">😐</span>
                <span className="text-xs text-slate-300 font-bold">Neutral</span>
                <p className="text-[10px] text-slate-400 mt-1">Baseline relaxed facial tension</p>
              </div>
              <div className="p-3 rounded-lg bg-[#091530] border border-cyan-500/20">
                <span className="text-2xl block mb-1">😢</span>
                <span className="text-xs text-blue-400 font-bold">Sad</span>
                <p className="text-[10px] text-slate-400 mt-1">Lip corner depressor activation</p>
              </div>
              <div className="p-3 rounded-lg bg-[#091530] border border-cyan-500/20">
                <span className="text-2xl block mb-1">😲</span>
                <span className="text-xs text-amber-400 font-bold">Surprised</span>
                <p className="text-[10px] text-slate-400 mt-1">Jaw drop and eyebrow elevation</p>
              </div>
            </div>

            <div className="mt-6 p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-200 font-mono">
              Notice: Mood results are approximate facial-expression estimates, not definitive conclusions about a person&apos;s actual emotional state.
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Architecture & Privacy */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="hud-panel rounded-xl p-6 border border-cyan-500/30 space-y-4">
            <h2 className="text-base font-bold text-white font-mono uppercase">
              100% On-Device Neural Edge Pipeline
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-[#091530] border border-cyan-500/20 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Zero Server Uploads</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Your webcam stream never leaves your device. All computer vision inference executes inside
                  your local WebAssembly/WebGL thread.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#091530] border border-cyan-500/20 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <Zap className="w-4 h-4" />
                  <span>60 FPS Hardware Acceleration</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  WebAssembly CPU SIMD and WebGL GPU shaders deliver low latency and high frame rates on modern
                  desktops, laptops, and mobile devices.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
