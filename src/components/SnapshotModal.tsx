import React from 'react';
import { Download, X } from 'lucide-react';

interface SnapshotModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const SnapshotModal: React.FC<SnapshotModalProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `v-cam-capture-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative max-w-2xl w-full bg-[#0a1226] border border-cyan-500/40 rounded-2xl p-5 shadow-[0_0_40px_rgba(0,240,255,0.25)] flex flex-col">
        {/* Corner Accents */}
        <div className="corner-bracket-tl" />
        <div className="corner-bracket-tr" />
        <div className="corner-bracket-bl" />
        <div className="corner-bracket-br" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-4">
          <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-cyan-300">
            Neural FX Snapshot Captured
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Preview */}
        <div className="relative rounded-lg overflow-hidden border border-cyan-500/20 mb-4 bg-black">
          <img src={imageUrl} alt="Captured V CAM Snapshot" className="w-full h-auto object-contain" />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Snapshot
          </button>
        </div>
      </div>
    </div>
  );
};
