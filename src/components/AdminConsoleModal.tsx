import React, { useState } from 'react';
import { PlayerProfile } from '../types/game';
import { GameEngine } from '../game/engine';
import { UNIT_BLUEPRINTS } from '../data/units';
import { FACTION_NAMES } from '../data/skins';
import {
  ShieldAlert,
  Coins,
  Plus,
  Trash2,
  Eye,
  RotateCcw,
  Skull,
  X,
  Lock,
  Unlock,
  KeyRound,
  Shield,
  Waves,
} from 'lucide-react';

interface AdminConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  engine: GameEngine;
  profile: PlayerProfile;
  onProfileUpdated: (profile: PlayerProfile) => void;
  isCampaignMode: boolean;
  activeTool: number | null;
  setActiveTool: (tool: number | null) => void;
  adminSpawnUnit: string;
  setAdminSpawnUnit: (u: string) => void;
  adminSpawnFaction: number;
  setAdminSpawnFaction: (f: number) => void;
}

export const AdminConsoleModal: React.FC<AdminConsoleModalProps> = ({
  isOpen,
  onClose,
  engine,
  profile,
  onProfileUpdated,
  isCampaignMode,
  activeTool,
  setActiveTool,
  adminSpawnUnit,
  setAdminSpawnUnit,
  adminSpawnFaction,
  setAdminSpawnFaction,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [authError, setAuthError] = useState('');
  const [mitsUnlocked, setMitsUnlocked] = useState(false);
  const [mitsPasswordInput, setMitsPasswordInput] = useState('');
  const [mitsAuthError, setMitsAuthError] = useState('');

  if (!isOpen) return null;

  const checkPassword = (pwd: string) => pwd.trim() === 'Shawn@67';

  const handleUnlockCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkPassword(passwordInput)) {
      setIsUnlocked(true);
      setMitsUnlocked(true);
      setAuthError('');
    } else {
      setAuthError('Access Denied: Invalid clearance password.');
    }
  };

  const handleUnlockMits = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkPassword(mitsPasswordInput)) {
      setMitsUnlocked(true);
      setMitsAuthError('');
    } else {
      setMitsAuthError('Access Denied: Invalid clearance password.');
    }
  };

  const hasAccess = !isCampaignMode || isUnlocked;

  const handleAdjustMits = (amount: number) => {
    engine.cheatTainted = true;
    const updated = {
      ...profile,
      mits: Math.max(0, profile.mits + amount),
      credits: Math.max(0, (profile.credits || profile.mits) + amount),
    };
    onProfileUpdated(updated);
  };

  const handleAdjustGold = (faction: number, amount: number) => {
    engine.cheatTainted = true;
    if (faction === -1) {
      for (let i = 0; i < engine.NP; i++) {
        engine.gold[i] = Math.max(0, engine.gold[i] + amount);
      }
    } else {
      engine.gold[faction] = Math.max(0, engine.gold[faction] + amount);
    }
    engine.triggerChange();
  };

  const handleHealAll = () => {
    engine.cheatTainted = true;
    engine.U.forEach((u) => {
      u.hp = u.maxHp;
      if (u.maxFu != null) u.fu = u.maxFu;
      if (u.maxAm != null) u.am = u.maxAm;
      u.cd = 0;
      u.spawnCd = 0;
      u.fz = 0;
      u.sp = 0;
    });
    engine.note = 'Admin: All unit hulls, fuel, and munitions restored.';
    engine.recalculateHighlights();
    engine.triggerChange();
  };

  const handleToggleFog = () => {
    engine.cheatTainted = true;
    engine.fogOff = !engine.fogOff;
    engine.recalculateHighlights();
    engine.triggerChange();
  };

  const handleClearObstacles = () => {
    engine.cheatTainted = true;
    let count = 0;
    engine.ob.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          row[x] = 0;
          count++;
        }
      });
    });
    engine.note = `Admin: Cleared ${count} terrain obstacles.`;
    engine.recalculateHighlights();
    engine.triggerChange();
  };

  const handleDestroyHq = (faction: number) => {
    engine.cheatTainted = true;
    const targetHq = engine.U.find((u) => u.t === 'H' && u.o === faction);
    if (targetHq) {
      engine.applyDamage(targetHq, targetHq.hp);
      engine.recalculateHighlights();
      engine.triggerChange();
    }
  };

  const spawnUnitCodes = Object.keys(UNIT_BLUEPRINTS).filter((code) => !['H', 'O', 'W'].includes(code));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#12171b] border border-[#232c32] rounded-2xl shadow-2xl p-5 sm:p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto text-slate-200 font-sans border-t-2 border-t-amber-400">
        <div className="flex items-center justify-between border-b border-[#232c32] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
              {hasAccess ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 uppercase tracking-wide">
                Admin Console
              </h2>
              <span className="text-[11px] font-mono text-slate-400">
                {isCampaignMode ? 'CAMPAIGN MISSION ACCESS' : 'SANDBOX / SKIRMISH ACCESS'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {hasAccess ? (
          <div className="space-y-5">
            {/* 1. Mits Treasury */}
            <div className="bg-[#0b0f12] border border-[#232c32] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-amber-400 font-bold uppercase flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>Strategic Mits Treasury ({profile.mits.toLocaleString()} MITS)</span>
                </span>
                {mitsUnlocked ? (
                  <button
                    onClick={() => setMitsUnlocked(false)}
                    className="text-[10px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 py-0.5 px-2 bg-slate-800 rounded border border-slate-700"
                  >
                    <Lock className="w-2.5 h-2.5" />
                    <span>Lock Mits</span>
                  </button>
                ) : (
                  <span className="text-[10px] font-mono bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                    <Lock className="w-3 h-3" />
                    <span>PASSWORD REQUIRED</span>
                  </span>
                )}
              </div>

              {mitsUnlocked ? (
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <Unlock className="w-3 h-3" />
                    <span>Security clearance verified:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAdjustMits(500)}
                      className="flex-1 py-2 px-3 bg-[#182126] hover:bg-[#202c34] text-amber-400 border border-[#2d383f] rounded-xl text-xs font-mono font-bold transition-colors"
                    >
                      +500 Mits
                    </button>
                    <button
                      onClick={() => handleAdjustMits(2000)}
                      className="flex-1 py-2 px-3 bg-[#182126] hover:bg-[#202c34] text-amber-400 border border-[#2d383f] rounded-xl text-xs font-mono font-bold transition-colors"
                    >
                      +2,000 Mits
                    </button>
                    <button
                      onClick={() => handleAdjustMits(5000)}
                      className="flex-1 py-2 px-3 bg-[#182126] hover:bg-[#202c34] text-amber-400 border border-[#2d383f] rounded-xl text-xs font-mono font-bold transition-colors"
                    >
                      +5,000 Mits
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUnlockMits} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={mitsPasswordInput}
                      onChange={(e) => setMitsPasswordInput(e.target.value)}
                      placeholder="Enter password..."
                      className="flex-1 bg-[#141b20] border border-[#28353d] focus:border-amber-400 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 outline-none"
                    />
                    <button
                      type="submit"
                      className="py-2 px-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Authorize</span>
                    </button>
                  </div>
                  {mitsAuthError && (
                    <p className="text-[11px] font-mono text-red-400">{mitsAuthError}</p>
                  )}
                </form>
              )}
            </div>

            {/* 2. In-Battle Gold */}
            <div>
              <span className="text-xs font-mono text-slate-400 block mb-2 uppercase">
                2. In-Battle Gold Treasury
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleAdjustGold(engine.cur, 50)}
                  className="py-2 px-3 bg-[#182126] hover:bg-[#202c34] text-slate-200 border border-[#2d383f] rounded-xl text-xs font-mono font-bold"
                >
                  +50 Current
                </button>
                <button
                  onClick={() => handleAdjustGold(engine.cur, 200)}
                  className="py-2 px-3 bg-[#182126] hover:bg-[#202c34] text-slate-200 border border-[#2d383f] rounded-xl text-xs font-mono font-bold"
                >
                  +200 Current
                </button>
                <button
                  onClick={() => handleAdjustGold(-1, 100)}
                  className="py-2 px-3 bg-[#182126] hover:bg-[#202c34] text-slate-200 border border-[#2d383f] rounded-xl text-xs font-mono"
                >
                  +100 All Factions
                </button>
              </div>
            </div>

            {/* 3. Placement Tools */}
            <div className="space-y-2 border-t border-[#232c32] pt-4">
              <span className="text-xs font-mono text-slate-400 block uppercase">
                3. Battlefield Unit Placement Tool
              </span>
              <div className="flex gap-2">
                <select
                  value={adminSpawnUnit}
                  onChange={(e) => setAdminSpawnUnit(e.target.value)}
                  className="flex-1 bg-[#0b0e10] border border-[#2c373e] text-xs font-mono rounded-xl p-2 text-slate-200 outline-none"
                >
                  {spawnUnitCodes.map((code) => (
                    <option key={code} value={code}>
                      {UNIT_BLUEPRINTS[code]?.n} ({code})
                    </option>
                  ))}
                </select>

                <select
                  value={adminSpawnFaction}
                  onChange={(e) => setAdminSpawnFaction(+e.target.value)}
                  className="flex-1 bg-[#0b0e10] border border-[#2c373e] text-xs font-mono rounded-xl p-2 text-slate-200 outline-none"
                >
                  {FACTION_NAMES.slice(0, engine.NP).map((fName, idx) => (
                    <option key={idx} value={idx}>
                      {fName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    setActiveTool(activeTool === 1 ? null : 1);
                    onClose();
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    activeTool === 1
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-[#182126] text-slate-300 border border-[#2d383f]'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{activeTool === 1 ? 'Spawn Tool ACTIVE' : 'Place Unit'}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTool(activeTool === 2 ? null : 2);
                    onClose();
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    activeTool === 2
                      ? 'bg-red-500 text-white font-black'
                      : 'bg-[#182126] text-slate-300 border border-[#2d383f]'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{activeTool === 2 ? 'Delete Tool ACTIVE' : 'Delete Unit'}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTool(activeTool === 3 ? null : 3);
                    onClose();
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    activeTool === 3
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'bg-[#182126] text-slate-300 border border-[#2d383f]'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{activeTool === 3 ? 'Barrier ACTIVE' : 'Add Barrier'}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTool(activeTool === 5 ? null : 5);
                    onClose();
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    activeTool === 5
                      ? 'bg-sky-400 text-slate-950 font-black'
                      : 'bg-[#182126] text-sky-400 border border-sky-800/60'
                  }`}
                >
                  <Waves className="w-3.5 h-3.5" />
                  <span>{activeTool === 5 ? 'Water ACTIVE' : 'Add Water'}</span>
                </button>
              </div>

              <div className="pt-1">
                <button
                  onClick={() => {
                    setActiveTool(activeTool === 4 ? null : 4);
                    onClose();
                  }}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    activeTool === 4
                      ? 'bg-slate-300 text-slate-950 font-black'
                      : 'bg-[#182126] text-slate-400 border border-[#2d383f]'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{activeTool === 4 ? 'Clear Tool ACTIVE' : 'Clear Terrain Obstacle / Water'}</span>
                </button>
              </div>
            </div>

            {/* 4. God-Mode Actions */}
            <div className="space-y-2 border-t border-[#232c32] pt-4">
              <span className="text-xs font-mono text-slate-400 block uppercase">
                4. God-Mode Actions
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleToggleFog}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    engine.fogOff
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-[#182126] text-slate-300 border border-[#2d383f]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{engine.fogOff ? 'Fog: REVEALED' : 'Reveal Map'}</span>
                </button>

                <button
                  onClick={handleHealAll}
                  className="py-2 px-3 bg-[#182126] hover:bg-[#202c34] text-emerald-400 border border-[#2d383f] rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Heal & Refill All</span>
                </button>

                <button
                  onClick={handleClearObstacles}
                  className="py-2 px-3 bg-[#182126] hover:bg-[#202c34] text-slate-300 border border-[#2d383f] rounded-xl text-xs font-mono flex items-center justify-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Clear Obstacles</span>
                </button>

                {FACTION_NAMES.slice(0, engine.NP).map((fName, idx) =>
                  engine.alive[idx] ? (
                    <button
                      key={idx}
                      onClick={() => handleDestroyHq(idx)}
                      className="py-2 px-3 bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/60 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5"
                    >
                      <Skull className="w-3.5 h-3.5" />
                      <span>Destroy {fName.split(' ')[0]} HQ</span>
                    </button>
                  ) : null
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-[#182126] hover:bg-[#222e35] text-slate-300 border border-[#2c373e] font-bold rounded-xl text-xs font-mono uppercase tracking-wider"
              >
                Close Console
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUnlockCampaign} className="space-y-4 py-2">
            <div className="p-3 bg-[#0c1012] border border-[#232c32] rounded-xl text-xs text-slate-300 leading-relaxed">
              <p>Security clearance required to access administrative controls during campaign operations.</p>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                CLEARANCE PASSWORD
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter clearance password..."
                className="w-full bg-[#0a0d0f] border border-[#2a343b] focus:border-amber-400 rounded-xl py-2.5 px-3 text-sm text-slate-200 outline-none font-mono"
                autoFocus
              />
              {authError && <p className="text-xs font-mono text-red-400 mt-1.5">{authError}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-950/20"
            >
              <KeyRound className="w-4 h-4" />
              <span>Unlock Admin Controls</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
