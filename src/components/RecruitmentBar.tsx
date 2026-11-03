import React, { useState } from 'react';
import { GameEngine } from '../game/engine';
import { UNIT_BLUEPRINTS, isAirUnit } from '../data/units';
import { getQuestForUnit, getQuestProgressInfo } from '../data/quests';
import {
  Users,
  Shield,
  Plane,
  Wrench,
  Lock,
  Award,
} from 'lucide-react';

interface RecruitmentBarProps {
  engine: GameEngine;
  onSelectUnitToDeploy: (unitCode: string) => void;
  selectedUnitCode: string | null;
  currentGold: number;
  onOpenArmory: () => void;
  disabled?: boolean;
}

export const RecruitmentBar: React.FC<RecruitmentBarProps> = ({
  engine,
  onSelectUnitToDeploy,
  selectedUnitCode,
  currentGold,
  onOpenArmory,
  disabled = false,
}) => {
  const [filter, setFilter] = useState<'all' | 'infantry' | 'armor' | 'air' | 'support'>('all');

  const unitCodes = Object.keys(UNIT_BLUEPRINTS).filter((code) => !['H', 'O', 'W'].includes(code));

  const getCategory = (code: string): 'infantry' | 'armor' | 'air' | 'support' => {
    if (isAirUnit(code)) return 'air';
    if (['M', 'B', 'A', 'L', 'J', 'D', 'Q', 'AT', 'AC', 'FC', 'SP', 'SH', 'DW', 'HF', 'SR', 'GS'].includes(code)) {
      return 'armor';
    }
    if (['P', 'K', 'N', 'E', 'C', 'MR', 'NS', 'CH'].includes(code)) {
      return 'support';
    }
    return 'infantry';
  };

  const filtered = unitCodes.filter((code) => {
    if (filter === 'all') return true;
    return getCategory(code) === filter;
  });

  const selectedBp = selectedUnitCode ? engine.getBlueprint(selectedUnitCode) : null;

  return (
    <div className="bg-[#141a1e] border border-[#232c32] rounded-xl p-4 flex flex-col gap-3 shadow-lg">
      <div className="flex items-center justify-between border-b border-[#232c32] pb-2.5">
        <div>
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
            Recruit Reinforcements
          </h3>
          <p className="text-[11px] text-slate-400">
            Deploy from ready HQs and Barracks. Each source has its own cooldown.
          </p>
        </div>
        <div className="text-right font-mono">
          <span className="text-[10px] text-slate-400 block uppercase">Treasury</span>
          <span className="text-base font-extrabold text-amber-400 tabular-nums">
            {currentGold} <span className="text-xs font-normal text-slate-400">GOLD</span>
          </span>
        </div>
      </div>

      {selectedBp && (
        <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl flex items-center justify-between gap-3 text-xs font-mono animate-pulse">
          <div>
            <div className="font-bold text-amber-300">
              Ready to Deploy: {selectedBp.n} ({selectedBp.c}G)
            </div>
            <div className="text-[11px] text-slate-300">
              Tap any highlighted Gold tile on the map adjacent to your HQ.
            </div>
          </div>
          <button
            onClick={() => selectedUnitCode && onSelectUnitToDeploy(selectedUnitCode)}
            className="py-1 px-2.5 bg-slate-900/80 hover:bg-slate-900 text-amber-300 rounded border border-amber-500/30 text-xs shrink-0"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#0e1316] rounded-lg border border-[#232c32] overflow-x-auto text-xs font-mono">
        <button
          onClick={() => setFilter('all')}
          className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
            filter === 'all'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Units
        </button>
        <button
          onClick={() => setFilter('infantry')}
          className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap flex items-center gap-1 ${
            filter === 'infantry'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3 h-3" />
          <span>Infantry</span>
        </button>
        <button
          onClick={() => setFilter('armor')}
          className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap flex items-center gap-1 ${
            filter === 'armor'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3 h-3" />
          <span>Armor</span>
        </button>
        <button
          onClick={() => setFilter('air')}
          className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap flex items-center gap-1 ${
            filter === 'air'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Plane className="w-3 h-3" />
          <span>Air</span>
        </button>
        <button
          onClick={() => setFilter('support')}
          className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap flex items-center gap-1 ${
            filter === 'support'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wrench className="w-3 h-3" />
          <span>Support</span>
        </button>
      </div>

      {/* Units List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1">
        {filtered.map((code) => {
          const bp = engine.getBlueprint(code);
          const maxHp = engine.getMaxHealth(code, engine.cur);
          const isSelected = selectedUnitCode === code;
          const isUnlocked = engine.isUnitUnlocked(code);
          const canAfford = currentGold >= bp.c;

          if (!isUnlocked) {
            const quest = getQuestForUnit(code);
            const progress = quest ? getQuestProgressInfo(quest, engine.profile?.questProgress) : null;

            return (
              <div
                key={code}
                onClick={onOpenArmory}
                className="p-2.5 rounded-xl border border-amber-500/20 bg-[#0c1012] opacity-75 flex flex-col justify-between text-left cursor-pointer hover:border-amber-500/40 transition-colors"
                title="Locked behind Tactical Quest. Tap to view in Armory."
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-xs text-slate-300">{bp.n}</span>
                    <span className="text-[10px] font-mono text-amber-400 font-bold flex items-center gap-0.5">
                      <Lock className="w-3 h-3 text-amber-400" /> Quest Locked
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1">
                    {bp.description || 'Frontline unit.'}
                  </p>

                  {quest && progress && (
                    <div className="mt-1.5 pt-1.5 border-t border-[#1e252a]">
                      <div className="flex items-center justify-between text-[9px] font-mono text-amber-300">
                        <span className="truncate mr-1">QUEST: {quest.title}</span>
                        <span className="shrink-0">
                          {progress.current}/{progress.target}
                        </span>
                      </div>
                      <div className="w-full bg-[#182025] h-1 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-amber-400 h-full"
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[10px] font-mono text-amber-400 mt-2 flex items-center gap-1">
                  <Award className="w-3 h-3" /> View Quest in Armory →
                </div>
              </div>
            );
          }

          return (
            <button
              key={code}
              disabled={disabled || !canAfford}
              onClick={() => onSelectUnitToDeploy(code)}
              className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-amber-400 bg-amber-500/15 shadow-md shadow-amber-950/20'
                  : 'border-[#232c32] hover:border-[#384650] bg-[#0e1316]'
              } ${canAfford ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-xs text-slate-100">{bp.n}</span>
                  <span className="font-mono font-black text-xs text-amber-400 bg-[#161d20] px-1.5 py-0.5 rounded border border-amber-500/20">
                    {bp.c}G
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight mb-2 line-clamp-1">
                  {bp.description || 'Frontline unit.'}
                </p>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 border-t border-[#1b2327]">
                <span className="text-emerald-400 font-bold">{maxHp} HP</span>
                <span className="text-cyan-400 font-bold">Mv {bp.mv}</span>
                <span>{bp.ab.length} Wpn</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
