import React, { useEffect } from 'react';
import { GameEngine } from '../game/engine';
import { FACTION_COLORS, FACTION_NAMES } from '../data/skins';
import { Shield, Play, Users, Coins, Eye, EyeOff } from 'lucide-react';
import { AudioService } from '../services/audio';

interface PassAndPlayModalProps {
  engine: GameEngine;
  onReady: () => void;
  onTogglePrivacy?: () => void;
}

export const PassAndPlayModal: React.FC<PassAndPlayModalProps> = ({
  engine,
  onReady,
  onTogglePrivacy,
}) => {
  const cur = engine.cur;
  const factionName = FACTION_NAMES[cur] || `Faction ${cur + 1}`;
  const factionColor = FACTION_COLORS[cur] || '#38bdf8';
  const playerNumber = cur + 1;
  const isSetup = engine.ph === 'setup';

  // Units count and HQ status
  const friendlyUnits = engine.U.filter((u) => u.o === cur);
  const friendlyHq = friendlyUnits.find((u) => u.t === 'H');
  const hqHpPercent = friendlyHq ? Math.round((friendlyHq.hp / friendlyHq.maxHp) * 100) : 0;
  const currentGold = engine.gold[cur] || 0;

  // Keyboard shortcut: Space or Enter to proceed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onReady();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onReady]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pass and play turn transition"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05080b]/92 backdrop-blur-xl animate-in fade-in duration-200 select-none"
    >
      <div
        className="w-full max-w-lg bg-[#0e1317] border border-[#232f38] rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden"
        style={{ borderTop: `4px solid ${factionColor}` }}
      >
        {/* Subtle decorative glow */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: factionColor }}
        />

        {/* Handover Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border shadow-xl relative"
          style={{
            backgroundColor: `${factionColor}18`,
            borderColor: `${factionColor}50`,
          }}
        >
          <Users className="w-8 h-8" style={{ color: factionColor }} />
          <span
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0e1317] border flex items-center justify-center text-xs font-mono font-black"
            style={{ borderColor: factionColor, color: factionColor }}
          >
            P{playerNumber}
          </span>
        </div>

        {/* Status Chip */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs font-mono mb-2">
          <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: factionColor }} />
          <span className="text-slate-300 font-bold uppercase tracking-wider">
            {isSetup ? 'Deployment Phase' : `Round Turn ${engine.turn}`}
          </span>
        </div>

        {/* Heading */}
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
          Pass Device to Player {playerNumber}
        </h2>
        <p className="text-sm font-bold mt-1 tracking-wide" style={{ color: factionColor }}>
          {factionName}
        </p>

        <p className="text-xs text-slate-400 mt-2 max-w-md">
          {isSetup
            ? 'Hand the device to Player ' +
              playerNumber +
              ' to deploy starter forces. Your opponent cannot see this screen.'
            : 'Opponent finished their moves. Take the device to command your forces.'}
        </p>

        {/* Turn Briefing Cards */}
        <div className="grid grid-cols-3 gap-2.5 w-full my-6 font-mono text-left">
          <div className="p-3 rounded-xl bg-[#141b20] border border-[#232f38]">
            <span className="text-[10px] text-slate-400 block uppercase">Gold Treasury</span>
            <div className="flex items-center gap-1 text-amber-400 font-black text-sm mt-0.5">
              <Coins className="w-3.5 h-3.5" />
              <span>{currentGold}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#141b20] border border-[#232f38]">
            <span className="text-[10px] text-slate-400 block uppercase">Active Units</span>
            <span className="font-bold text-slate-200 text-sm block mt-0.5">
              {friendlyUnits.length} forces
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#141b20] border border-[#232f38]">
            <span className="text-[10px] text-slate-400 block uppercase">HQ Integrity</span>
            <span
              className={`font-bold text-sm block mt-0.5 ${
                hqHpPercent > 50 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {hqHpPercent}% HP
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            AudioService.play('turnReady');
            onReady();
          }}
          className="w-full py-4 px-6 rounded-xl font-black text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-2xl transition-all transform active:scale-[0.98] cursor-pointer"
          style={{
            backgroundColor: factionColor,
            color: '#05080b',
            boxShadow: `0 10px 25px -5px ${factionColor}40`,
          }}
        >
          <Play className="w-5 h-5 fill-current" />
          <span>Ready — Start Player {playerNumber}&apos;s Turn</span>
        </button>

        {/* Privacy shield info / toggle */}
        <div className="flex items-center justify-between w-full mt-4 pt-4 border-t border-[#1f2930] text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            {engine.privacyShieldEnabled ? (
              <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>Privacy Curtain: {engine.privacyShieldEnabled ? 'Active' : 'Off'}</span>
          </div>

          {onTogglePrivacy && (
            <button
              onClick={() => {
                AudioService.play('click');
                onTogglePrivacy();
              }}
              className="text-[11px] text-slate-300 hover:text-white underline decoration-slate-600 hover:decoration-white transition-colors"
            >
              Toggle Privacy Screen
            </button>
          )}
        </div>

        <div className="text-[10px] text-slate-500 font-mono mt-2">
          Tip: You can also press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Space</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Enter</kbd> to start.
        </div>
      </div>
    </div>
  );
};
