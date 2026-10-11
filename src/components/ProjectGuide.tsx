import React, { useState } from 'react';
import {
  Flame,
  Hand,
  Smile,
  ShieldCheck,
  Cpu,
  Zap,
  Sparkles,
  Layers,
  ChevronRight,
  Eye,
  Radio,
  BookOpen,
  Play,
  RotateCcw,
} from 'lucide-react';

interface ProjectGuideProps {
  onBackToStudio: () => void;
  onLaunchTutorial?: () => void;
}

export const ProjectGuide: React.FC<ProjectGuideProps> = ({ onBackToStudio }) => {
  const [activeTab, setActiveTab] = useState<'gestures' | 'fire_fist' | 'objects' | 'face_mood' | 'architecture'>('gestures');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn">
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
              <span>PROJECT DOSSIER & COMPREHENSIVE GUIDE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              V <span className="text-cyan-400">CAM</span> // Neural Vision & Gesture FX
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Explore the full system manual for V CAM. Learn how to ignite and punch with the
              Fire Fist, levitate and control interactive holographic AR objects with your hands,
              and analyze real-time facial expressions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onBackToStudio}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs tracking-wider uppercase font-mono shadow-[0_0_20px_rgba(0,240,255,0.35)] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Enter Live Camera</span>
            </button>
          </div>
        </div>
      </div>

      {/* Guide Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-[#091329] border border-cyan-500/20 font-mono text-xs">
        {[
          { id: 'gestures', label: '1. Hand Gestures', icon: Hand },
          { id: 'fire_fist', label: '2. The Fire Fist & Punch', icon: Flame },
          { id: 'objects', label: '3. Gesture-Controlled Objects', icon: Sparkles },
          { id: 'face_mood', label: '4. Facial Mood Telemetry', icon: Smile },
          { id: 'architecture', label: '5. Neural Architecture & Privacy', icon: Cpu },
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

      {/* Tab 1: Hand Gestures */}
      {activeTab === 'gestures' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Gesture Card: Closed Fist */}
            <div className="hud-panel rounded-xl p-5 border border-orange-500/30 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center mb-4 text-orange-400">
                  <Flame className="w-6 h-6" />
                </div>
                <div className="text-xs font-mono text-orange-400 uppercase tracking-wider mb-1">
                  Primary Trigger
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Closed Fist (Fire Ignition)</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Clench all five fingers into a tight or semi-tight fist. The neural model tracks
                  flexion on thumb, index, middle, ring, and pinky to erupt multi-layer flames around
                  your hand in real time.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-orange-300 flex items-center gap-1.5">
                <ChevronRight className="w-3.5 h-3.5" />
                <span>Result: Fire Fist Ignited 🔥</span>
              </div>
            </div>

            {/* Gesture Card: Open Palm */}
            <div className="hud-panel rounded-xl p-5 border border-cyan-500/30 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center mb-4 text-cyan-300">
                  <Hand className="w-6 h-6" />
                </div>
                <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
                  Quench & Attract
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Open Palm (Quench & Tractor)</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Spread your fingers open facing the camera. This quenches all fire instantly and
                  activates the <strong>Tractor Beam</strong>, pulling interactive objects toward your
                  hand like magnetic telekinesis!
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-cyan-300 flex items-center gap-1.5">
                <ChevronRight className="w-3.5 h-3.5" />
                <span>Result: Flames Quenched ✋ + Object Attracted</span>
              </div>
            </div>

            {/* Gesture Card: Pinch & Grab */}
            <div className="hud-panel rounded-xl p-5 border border-purple-500/30 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center mb-4 text-purple-300">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="text-xs font-mono text-purple-400 uppercase tracking-wider mb-1">
                  Tactile Lock
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Pinch / Proximity Hold</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Bring your thumb and index tips together (pinch) near the interactive object, or hold
                  your fist close to it. The object snaps into your hand grip so you can drag and steer
                  it across the screen!
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-purple-300 flex items-center gap-1.5">
                <ChevronRight className="w-3.5 h-3.5" />
                <span>Result: Object Grabbed & Dragged 🤏</span>
              </div>
            </div>
          </div>

          {/* Dual-Hand Mechanics Card */}
          <div className="hud-panel rounded-xl p-6 border border-cyan-500/20">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Advanced Dual-Hand Controls</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              V CAM tracks <strong>both hands simultaneously</strong> at 60 FPS:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 rounded-lg bg-[#071126] border border-cyan-500/20">
                <div className="text-cyan-300 font-bold mb-1">Dual Fire Fists</div>
                <p className="text-slate-400 text-[11px]">
                  Close both left and right hands into fists to ignite dual blazing fireballs at the
                  same time!
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#071126] border border-cyan-500/20">
                <div className="text-cyan-300 font-bold mb-1">Dual-Hand Object Scaling</div>
                <p className="text-slate-400 text-[11px]">
                  Spread both hands far apart to expand the interactive object up to 95px diameter.
                  Bring hands together to concentrate it down to a dense micro-core!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: The Fire Fist & Punch */}
      {activeTab === 'fire_fist' && (
        <div className="space-y-6">
          <div className="hud-panel rounded-xl p-6 border border-orange-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-orange-500/20 border border-orange-400/40 text-orange-400">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">The Fire Fist Engine Mechanics</h2>
                <p className="text-xs text-slate-400">
                  How real-time knuckle combustion, particle buoyancy, and kinetic punching work
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              <div className="p-4 rounded-lg bg-[#071126] border border-slate-800 space-y-2">
                <div className="font-mono font-bold text-orange-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  1. Knuckle Combustion Grid
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  When you clench your fist, MediaPipe landmarks 5, 9, 13, and 17 (the MCP knuckle
                  joints) ignite into concentrated heat nodes. The system draws from an object-pooled
                  particle system with zero garbage collection lag.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#071126] border border-slate-800 space-y-2">
                <div className="font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  2. Kinetic Punch Strike
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  When you thrust your closed fist forward or across the frame at over 550 pixels per
                  second, the engine detects a <strong>Punch Strike</strong>! This triggers an expanding
                  shockwave ring, 24 high-velocity spark fragments, and an explosive sound blast.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#071126] border border-slate-800 space-y-2">
                <div className="font-mono font-bold text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  3. Distance & Depth Scaling
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  The flame effect measures the physical distance between wrist landmark 0 and middle
                  knuckle 9. Move your fist close to the camera for an immense screen-filling blaze,
                  or step back for a tight, concentrated flame.
                </p>
              </div>
            </div>
          </div>

          {/* Color Schemes */}
          <div className="hud-panel rounded-xl p-6 border border-cyan-500/20">
            <h3 className="text-sm font-mono font-bold text-cyan-300 uppercase tracking-wider mb-3">
              Flame Color Presets Available in Header
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono text-xs">
              <div className="p-3 rounded-lg bg-[#081226] border border-amber-500/30 text-amber-300">
                <div className="w-4 h-4 mx-auto rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b] mb-2" />
                <span className="font-bold block">Inferno Orange</span>
                <span className="text-[10px] text-slate-400">Classic blazing fire</span>
              </div>
              <div className="p-3 rounded-lg bg-[#081226] border border-cyan-500/30 text-cyan-300">
                <div className="w-4 h-4 mx-auto rounded-full bg-cyan-400 shadow-[0_0_10px_#00f0ff] mb-2" />
                <span className="font-bold block">Plasma Cyan</span>
                <span className="text-[10px] text-slate-400">Futuristic cyber flame</span>
              </div>
              <div className="p-3 rounded-lg bg-[#081226] border border-purple-500/30 text-purple-300">
                <div className="w-4 h-4 mx-auto rounded-full bg-purple-400 shadow-[0_0_10px_#c084fc] mb-2" />
                <span className="font-bold block">Void Violet</span>
                <span className="text-[10px] text-slate-400">Mystical phoenix flame</span>
              </div>
              <div className="p-3 rounded-lg bg-[#081226] border border-emerald-500/30 text-emerald-300">
                <div className="w-4 h-4 mx-auto rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] mb-2" />
                <span className="font-bold block">Emerald Green</span>
                <span className="text-[10px] text-slate-400">Alchemical green fire</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Controlled Objects */}
      {activeTab === 'objects' && (
        <div className="space-y-6">
          <div className="hud-panel rounded-xl p-6 border border-cyan-500/30">
            <h2 className="text-lg font-bold text-white mb-2">
              Gesture-Controlled AR Objects
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              V CAM spawns responsive virtual objects directly into the camera workspace that obey
              physical gravity, friction, and hand forces. You can switch between 4 different objects:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#071126] border border-amber-500/30 space-y-2">
                <div className="font-bold text-amber-300 font-mono">1. Fire Plasma Orb</div>
                <p className="text-slate-400 text-[11px]">
                  A blazing miniature star with swirling solar flare rings, incandescent corona, and
                  particle smoke tail.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#071126] border border-cyan-500/30 space-y-2">
                <div className="font-bold text-cyan-300 font-mono">2. Holographic Cyber Cube</div>
                <p className="text-slate-400 text-[11px]">
                  A 3D rotating isometric wireframe cube that spins along 3 axes with glowing vertices
                  and central power glyph.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#071126] border border-fuchsia-500/30 space-y-2">
                <div className="font-bold text-fuchsia-300 font-mono">3. Phoenix Core</div>
                <p className="text-slate-400 text-[11px]">
                  An ethereal fire bird entity with flapping glowing wings and an incandescent white
                  energy core.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#071126] border border-teal-500/30 space-y-2">
                <div className="font-bold text-teal-300 font-mono">4. Quantum Shield</div>
                <p className="text-slate-400 text-[11px]">
                  A hexagonal defensive plasma shield with pulsating concentric barrier rings and
                  energy deflection fields.
                </p>
              </div>
            </div>

            {/* How to interact */}
            <div className="mt-6 p-4 rounded-xl bg-[#091530] border border-cyan-500/20 space-y-3">
              <div className="font-mono font-bold text-cyan-300 text-xs">
                INTERACTIVE GESTURE MATRIX FOR OBJECTS
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-mono">&bull;</span>
                  <span>
                    <strong>Open Palm Attraction:</strong> Point an open palm towards the object to
                    project a tractor beam and summon it across the screen.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-mono">&bull;</span>
                  <span>
                    <strong>Pinch / Fist Lock:</strong> Pinch or bring your fist within touching
                    range to lock onto the object. Move your hand to guide it anywhere.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-mono">&bull;</span>
                  <span>
                    <strong>Fire Fist Punch Blast:</strong> Punch towards the object to impart huge
                    kinetic momentum! The object will ricochet off canvas boundaries with elastic
                    bouncing.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Facial Mood Telemetry */}
      {activeTab === 'face_mood' && (
        <div className="space-y-6">
          <div className="hud-panel rounded-xl p-6 border border-cyan-500/20">
            <h2 className="text-lg font-bold text-white mb-2">Facial Expression Architecture</h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Using MediaPipe FaceLandmarker with 52 geometric blendshapes, V CAM analyzes muscle
              activations across the lips, brow, eyes, and jaw to categorize 4 distinct expressions:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-lg bg-[#071126] border border-amber-500/30">
                <div className="font-bold text-amber-400 mb-1">Happy 😊</div>
                <p className="text-slate-400 text-[11px]">
                  Detected via <code>mouthSmileLeft</code> and <code>mouthSmileRight</code> blendshapes.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#071126] border border-teal-500/30">
                <div className="font-bold text-teal-300 mb-1">Neutral 😐</div>
                <p className="text-slate-400 text-[11px]">
                  Detected during relaxed resting facial baseline with low activation on smiles or frowns.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#071126] border border-blue-500/30">
                <div className="font-bold text-blue-300 mb-1">Sad 😔</div>
                <p className="text-slate-400 text-[11px]">
                  Detected via <code>mouthFrownLeft/Right</code>, <code>browDown</code>, and <code>mouthPress</code>.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#071126] border border-cyan-500/30">
                <div className="font-bold text-cyan-300 mb-1">Surprised 😲</div>
                <p className="text-slate-400 text-[11px]">
                  Detected via <code>jawOpen</code>, <code>browInnerUp</code>, and <code>eyeWide</code> blendshapes.
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-[#061022] border border-slate-800 text-xs text-slate-300">
              <div className="font-mono font-bold text-cyan-400 mb-1">
                Flicker-Free Exponential Moving Average (EMA)
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Raw computer vision scores can fluctuate frame-to-frame. V CAM applies an EMA temporal
                filter (factor &alpha; = 0.25) across frames to provide smooth, stable confidence
                meters without jitter.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Architecture & Privacy */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="hud-panel rounded-xl p-6 border border-cyan-500/20">
            <h2 className="text-lg font-bold text-white mb-2">
              Privacy by Design & Technical Specifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4 text-xs">
              <div className="p-4 rounded-lg bg-[#071126] border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold">
                  <ShieldCheck className="w-5 h-5" />
                  <span>100% Client-Side</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  No video streams, face frames, or biometric vectors are ever sent to an external
                  server. Every calculation executes in-memory inside your local browser via WebAssembly.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#071126] border border-cyan-500/30 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold">
                  <Cpu className="w-5 h-5" />
                  <span>WASM + WebGL GPU</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  MediaPipe Vision tasks utilize hardware-accelerated WebGL / GPU delegates for
                  sub-16ms inference latency, preserving a smooth 60 FPS refresh rate.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#071126] border border-blue-500/30 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-mono font-bold">
                  <Radio className="w-5 h-5" />
                  <span>Web Audio Synthesis</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Audio sound effects (ignite whooshes, steam quenches, punch explosions) are synthesized
                  algorithmically via the Web Audio API without needing external MP3 downloads.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
