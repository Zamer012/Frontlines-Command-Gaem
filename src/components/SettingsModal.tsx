import React from 'react';
import { GameSettings } from '../types/game';
import { AudioService } from '../services/audio';
import {
  Sliders,
  Volume2,
  Monitor,
  Gauge,
  X,
  Sparkles,
  Camera,
  Layers,
} from 'lucide-react';

interface SettingsModalProps {
  settings: GameSettings;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSettings: (settings: GameSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const QUALITY_NAMES = [
    'Minimalist (1x scale, lowest battery usage)',
    'Low Performance (Smooth 1x, basic FX)',
    'Reduced (1.25x scale, soft shadows)',
    'Balanced (1.25x scale, water ripples)',
    'Standard (1.5x sharp scaling, full particles)',
    'Tactical High (1.5x sharp scaling, dynamic FX)',
    'Cinematic (2x Retina crisp, glowing lasers)',
    'Ultra Master (2x Retina, max particles & magma glow)',
  ];

  const SPEED_OPTIONS = [0.5, 1, 1.5, 2, 3, 5];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#12171a] border border-[#232c32] rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-5 border-t-2 border-t-amber-400">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#232c32] pb-3">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">Battlefield Settings</h2>
          </div>
          <button
            onClick={() => {
              AudioService.play('click');
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Graphics Quality Preset Slider */}
        <div className="space-y-2 bg-[#0b0e10] p-3.5 rounded-xl border border-[#232c32]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-cyan-400" />
              <span>Graphics Fidelity Engine (Fixed & Responsive)</span>
            </span>
            <span className="text-xs font-mono font-bold text-amber-400">
              Level {settings.quality} / 8
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={settings.quality}
            onChange={(e) => {
              AudioService.play('click');
              onUpdateSettings({ ...settings, quality: parseInt(e.target.value, 10) });
            }}
            className="w-full accent-amber-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
          <div className="text-[11px] font-mono text-cyan-300 bg-[#141b20] p-2 rounded border border-[#232c32] mt-1">
            {QUALITY_NAMES[settings.quality - 1] || 'Tactical High'}
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>Level 1: Minimalist (Battery Saver)</span>
            <span>Level 8: Ultra Retina (Max FX)</span>
          </div>
        </div>

        {/* Audio Acoustics Profile */}
        <div className="space-y-2">
          <span className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Audio Acoustics Profile</span>
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 0, label: 'Fog Echo (Default)', desc: 'Muffled distant fire in fog' },
              { id: 1, label: 'Full Reverb', desc: 'All battlefield shots echo' },
              { id: 2, label: 'Quiet Recon', desc: 'Silent muffled in fog' },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => {
                  AudioService.play('tab');
                  onUpdateSettings({ ...settings, soundMode: mode.id });
                }}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  settings.soundMode === mode.id
                    ? 'border-amber-400 bg-amber-500/15 text-amber-300'
                    : 'border-[#232c32] bg-[#0c1012] text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-bold font-mono">{mode.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{mode.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Animation Speed */}
        <div className="space-y-2">
          <span className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span>Combat Animation Speed</span>
          </span>
          <div className="flex gap-2">
            {SPEED_OPTIONS.map((speed) => (
              <button
                key={speed}
                onClick={() => {
                  AudioService.play('speed');
                  onUpdateSettings({ ...settings, gameSpeed: speed });
                }}
                className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg border transition-colors cursor-pointer ${
                  settings.gameSpeed === speed
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-[#0c1012] border-[#232c32] text-slate-300 hover:bg-[#161c20]'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Volume Controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300">
            <span>Master Volume</span>
            <span className="text-amber-400">{Math.round(settings.masterVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.masterVolume}
            onChange={(e) => {
              const val = Number(e.target.value);
              onUpdateSettings({ ...settings, masterVolume: val });
            }}
            className="w-full accent-amber-500"
          />

          <div className="flex items-center justify-between text-xs font-mono text-slate-300">
            <span>Sound Effects Volume</span>
            <span className="text-amber-400">{Math.round(settings.sfxVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.sfxVolume}
            onChange={(e) => {
              const val = Number(e.target.value);
              onUpdateSettings({ ...settings, sfxVolume: val });
            }}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Screen Shake Checkbox */}
        <label className="flex items-center gap-3 p-3 bg-[#0b0e10] rounded-xl border border-[#232c32] cursor-pointer">
          <input
            type="checkbox"
            checked={settings.screenShake}
            onChange={(e) => {
              AudioService.play('click');
              onUpdateSettings({ ...settings, screenShake: e.target.checked });
            }}
            className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
          />
          <div>
            <div className="text-xs font-bold text-slate-200 font-mono">Camera Screen Shake</div>
            <div className="text-[11px] text-slate-400">
              Vibrate canvas during artillery impacts, bombs, and heavy explosions
            </div>
          </div>
        </label>
      </div>
    </div>
  );
};
