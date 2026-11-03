import React, { useState, useRef, useEffect } from 'react';
import { PlayerProfile, TechUpgrade, TacticalQuest } from '../types/game';
import { UNIT_BLUEPRINTS, STARTER_UNITS } from '../data/units';
import { SKINS_CATALOG } from '../data/skins';
import { TACTICAL_QUESTS, getQuestForUnit, getQuestProgressInfo } from '../data/quests';
import { TECH_UPGRADES } from '../data/upgrades';
import { render2DUnit } from './Unit2DRenderer';
import {
  Briefcase,
  Coins,
  Star,
  Award,
  Zap,
  Target,
  Palette,
  RotateCcw,
  CheckCircle2,
  Lock,
  Unlock,
  Check,
  ChevronRight,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { AudioService } from '../services/audio';

interface ArmoryViewProps {
  profile: PlayerProfile;
  onUpgrade: (upgrade: TechUpgrade) => void;
  onUnlockUnit: (unitCode: string, costMits: number) => void;
  onUnlockBranch: (branchId: string, costMits: number) => void;
  onUnlockSkin: (skinId: string, costMits: number) => void;
  onEquipSkin: (skinId: string) => void;
  onResetUpgrades: () => void;
  onClaimQuest: (quest: TacticalQuest) => void;
}

export const ArmoryView: React.FC<ArmoryViewProps> = ({
  profile,
  onUpgrade,
  onUnlockUnit,
  onUnlockBranch,
  onUnlockSkin,
  onEquipSkin,
  onResetUpgrades,
  onClaimQuest,
}) => {
  const [activeTab, setActiveTab] = useState<'quests' | 'units' | 'skins' | 'upgrades'>('quests');
  const [tierFilter, setTierFilter] = useState<'all' | number>('all');
  const [questCategory, setQuestCategory] = useState<'all' | string>('all');

  const unitCodes = Object.keys(UNIT_BLUEPRINTS).filter((code) => !['H', 'O', 'W'].includes(code));
  const filteredUnitCodes = unitCodes.filter((code) => {
    const bp = UNIT_BLUEPRINTS[code];
    if (tierFilter === 'all') return true;
    return (bp?.tier || 1) === tierFilter;
  });

  const filteredQuests = TACTICAL_QUESTS.filter((q) => {
    if (questCategory === 'all') return true;
    return q.category === questCategory;
  });

  const claimableQuestsCount = TACTICAL_QUESTS.filter((q) => {
    const isClaimed =
      (profile.claimedQuests || []).includes(q.id) || profile.unlockedUnits.includes(q.rewardUnitCode);
    if (isClaimed) return false;
    return getQuestProgressInfo(q, profile.questProgress).completed;
  }).length;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Armory Header */}
      <div className="bg-gradient-to-r from-[#141b20] to-[#101417] border border-[#232c32] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
            <Briefcase className="w-4 h-4" />
            <span>INVENTORY, TACTICAL QUESTS & WEAPON TECH TREE</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
            Inventory & Armory
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mt-1 leading-relaxed">
            Standard support units (Suppliers, Engineers, Transports) are fully operational. Heavy and apex titans are unlocked by completing{' '}
            <strong className="text-amber-400 font-semibold">Tactical Quests</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 border-t md:border-t-0 md:border-l border-[#232c32] pt-4 md:pt-0 md:pl-8 text-sm font-mono shrink-0">
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Treasury</span>
            <div className="flex items-center gap-1.5 text-2xl font-black text-amber-400 tabular-nums">
              <Coins className="w-5 h-5 text-amber-400" />
              <span>{profile.mits.toLocaleString()}</span>
              <span className="text-xs font-normal text-slate-400">MITS</span>
            </div>
          </div>
          <span className="text-slate-700 hidden sm:inline">·</span>
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Research Intel</span>
            <div className="flex items-center gap-1.5 text-xl font-bold text-cyan-400 tabular-nums">
              <Star className="w-4 h-4 fill-cyan-400/30 text-cyan-400" />
              <span>{profile.intel} INTEL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-[#0f1418] rounded-xl border border-[#232c32] overflow-x-auto text-xs font-mono">
        <button
          onClick={() => setActiveTab('quests')}
          className={`px-4 py-2 font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'quests'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Tactical Quests</span>
          {claimableQuestsCount > 0 && (
            <span className="px-1.5 py-0.2 bg-red-600 text-white font-black text-[10px] rounded-full animate-pulse ml-1">
              {claimableQuestsCount} READY
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('units')}
          className={`px-4 py-2 font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'units'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>
            Combat Roster ({profile.unlockedUnits.length}/{unitCodes.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('skins')}
          className={`px-4 py-2 font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'skins'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>
            Equip Skins ({profile.unlockedSkins.length}/{SKINS_CATALOG.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('upgrades')}
          className={`px-4 py-2 font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'upgrades'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Tech Upgrades</span>
        </button>
      </div>

      {/* 1. QUESTS TAB */}
      {activeTab === 'quests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1 text-xs font-mono">
              <span className="text-slate-400 mr-1">CATEGORY:</span>
              {['all', 'combat', 'tactics', 'objectives', 'apex'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setQuestCategory(cat)}
                  className={`px-2.5 py-1 rounded transition-colors uppercase ${
                    questCategory === cat
                      ? 'bg-[#222d34] text-amber-400 font-bold border border-amber-400/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="text-xs font-mono text-slate-400">
              <span className="text-emerald-400 font-bold">
                {profile.unlockedUnits.length - STARTER_UNITS.length}
              </span>{' '}
              Quests Completed ·{' '}
              <span className="text-amber-400 font-bold">
                {TACTICAL_QUESTS.length - (profile.unlockedUnits.length - STARTER_UNITS.length)}
              </span>{' '}
              In Progress
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredQuests.map((quest) => {
              const bp = UNIT_BLUEPRINTS[quest.rewardUnitCode];
              const isClaimed =
                (profile.claimedQuests || []).includes(quest.id) ||
                profile.unlockedUnits.includes(quest.rewardUnitCode);
              const progress = getQuestProgressInfo(quest, profile.questProgress);

              return (
                <div
                  key={quest.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isClaimed
                      ? 'border-emerald-500/30 bg-[#0d1612]'
                      : progress.completed
                      ? 'border-amber-400 bg-[#171c15] shadow-lg shadow-amber-950/20'
                      : 'border-[#1e252a] bg-[#0c1012]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <UnitBadge unitCode={quest.rewardUnitCode} />
                        <div>
                          <h3 className="font-bold text-slate-100 text-sm">{quest.title}</h3>
                          <span className="text-[10px] font-mono text-amber-400 uppercase">
                            Reward: {bp?.n || quest.rewardUnitCode} (T{bp?.tier || 1})
                          </span>
                        </div>
                      </div>
                      {isClaimed ? (
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> CLAIMED
                        </span>
                      ) : progress.completed ? (
                        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/20 border border-amber-500/50 px-2 py-0.5 rounded animate-pulse">
                          READY
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400 bg-[#161d20] border border-[#232c32] px-2 py-0.5 rounded">
                          {progress.percentage}%
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-3">
                      {quest.description}
                    </p>

                    <div className="space-y-1 mb-3">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-400">PROGRESS</span>
                        <span className={`font-bold ${progress.completed ? 'text-emerald-400' : 'text-slate-300'}`}>
                          {progress.current} / {progress.target}
                        </span>
                      </div>
                      <div className="w-full bg-[#182025] h-2 rounded-full overflow-hidden border border-[#232c32]">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isClaimed
                              ? 'bg-emerald-500'
                              : progress.completed
                              ? 'bg-amber-400 animate-pulse'
                              : 'bg-cyan-500'
                          }`}
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-2 bg-[#080b0d] rounded-lg border border-[#1b2226] text-[10px] font-mono text-slate-400">
                      <span className="text-amber-400/80 mr-1 font-bold">HINT:</span>
                      {quest.hint}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1c2429] flex items-center justify-between">
                    <div className="text-[11px] font-mono text-amber-400 font-bold flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />
                      <span>+{quest.rewardMits} MITS</span>
                    </div>

                    {isClaimed ? (
                      <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Unit Deployed
                      </span>
                    ) : progress.completed ? (
                      <button
                        onClick={() => onClaimQuest(quest)}
                        className="py-1.5 px-3 rounded-lg text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-950/30 transition-all animate-bounce"
                      >
                        Claim & Unlock!
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        {bp?.mitsCost ? (
                          <button
                            onClick={() => onUnlockUnit(quest.rewardUnitCode, bp.mitsCost || 0)}
                            disabled={profile.mits < (bp.mitsCost || 0)}
                            className={`py-1 px-2.5 rounded text-[11px] font-mono font-bold transition-all ${
                              profile.mits >= (bp.mitsCost || 0)
                                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-sm font-black'
                                : 'bg-[#182025] text-slate-500 border border-[#243038] cursor-not-allowed'
                            }`}
                            title={profile.mits >= (bp.mitsCost || 0) ? `Unlock unit immediately with ${bp.mitsCost} Mits` : `Need ${bp.mitsCost} Mits`}
                          >
                            Buy ({bp.mitsCost} Mits)
                          </button>
                        ) : null}
                        <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. UNITS ROSTER TAB */}
      {activeTab === 'units' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1 text-xs font-mono">
              <span className="text-slate-400 mr-1">FILTER TIER:</span>
              {['all', 1, 2, 3, 4].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setTierFilter(tier as any)}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    tierFilter === tier
                      ? 'bg-[#222d34] text-amber-400 font-bold border border-amber-400/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tier === 'all' ? 'All Tiers' : `Tier ${tier}`}
                </button>
              ))}
            </div>

            <div className="text-xs font-mono text-slate-400">
              <span className="text-emerald-400 font-bold">{profile.unlockedUnits.length}</span> Units Unlocked
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUnitCodes.map((code) => {
              const bp = UNIT_BLUEPRINTS[code];
              const isUnlocked = profile.unlockedUnits.includes(code);
              const isStarter = STARTER_UNITS.includes(code);
              const quest = getQuestForUnit(code);
              const progress = quest ? getQuestProgressInfo(quest, profile.questProgress) : null;

              return (
                <div
                  key={code}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isUnlocked
                      ? 'border-[#232c32] bg-[#12181c]'
                      : 'border-[#1b2226] bg-[#0c1012] opacity-85'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <UnitBadge unitCode={code} />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-100 text-sm">{bp.n}</h3>
                            <span className="text-[10px] font-mono text-amber-400 font-bold">
                              T{bp.tier || 1}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-amber-400 font-extrabold block">
                            Deploy Cost: {bp.c} Gold
                          </span>
                        </div>
                      </div>

                      {isUnlocked ? (
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> UNLOCKED
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                          <Lock className="w-3 h-3" /> QUEST LOCKED
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                      {bp.description || 'Frontline tactical combat unit.'}
                    </p>

                    <div className="grid grid-cols-4 gap-1 p-2 bg-[#090c0e] rounded-lg border border-[#1e252a] text-center text-[10px] font-mono text-slate-300 mt-2.5">
                      <div>
                        <span className="text-slate-500 block">HP</span>
                        <span className="font-bold text-emerald-400">{bp.hp}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">MOVE</span>
                        <span className="font-bold text-cyan-400">{bp.mv}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">FUEL</span>
                        <span className="font-bold text-amber-400">{bp.fu ?? 'INF'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">AMMO</span>
                        <span className="font-bold text-slate-200">{bp.am ?? 'INF'}</span>
                      </div>
                    </div>

                    <div className="mt-2.5 space-y-1">
                      <span className="text-[10px] font-mono text-slate-500 block uppercase">
                        Loadout Abilities ({bp.ab.length})
                      </span>
                      {bp.ab.map((ab, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-[#0e1316] px-2 py-1 rounded border border-[#1c2429]"
                        >
                          <span className="text-slate-300">{ab.n}</span>
                          <span className="text-amber-400">
                            {ab.d} DMG · R{ab.rg}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1e262c] flex items-center justify-between">
                    <div>
                      {isUnlocked ? (
                        <span className="text-xs font-mono text-slate-400">
                          {isStarter ? 'Standard Issue (Free)' : 'Requisition Active'}
                        </span>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-xs font-mono text-amber-400 font-bold">
                            {progress?.completed ? 'Quest Ready to Claim' : bp.mitsCost ? `${bp.mitsCost} Mits Requisition` : 'Quest Unlock'}
                          </span>
                          {!progress?.completed && bp.mitsCost ? (
                            <span className="text-[10px] font-mono text-slate-500">
                              (Or complete quest to get free)
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isUnlocked ? (
                        <span className="text-xs font-mono text-emerald-400 font-bold">Active in Field</span>
                      ) : progress?.completed && quest ? (
                        <button
                          onClick={() => onClaimQuest(quest)}
                          className="py-1.5 px-3 rounded-lg text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow animate-pulse"
                        >
                          Claim Free!
                        </button>
                      ) : (
                        <>
                          {bp.mitsCost && bp.mitsCost > 0 ? (
                            <button
                              onClick={() => onUnlockUnit(code, bp.mitsCost || 0)}
                              disabled={profile.mits < (bp.mitsCost || 0)}
                              className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition-all ${
                                profile.mits >= (bp.mitsCost || 0)
                                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md font-black'
                                  : 'bg-[#1b2226] text-slate-500 cursor-not-allowed border border-[#2a343a]'
                              }`}
                              title={profile.mits >= (bp.mitsCost || 0) ? `Unlock unit immediately with ${bp.mitsCost} Mits` : `Need ${bp.mitsCost} Mits`}
                            >
                              Unlock ({bp.mitsCost} Mits)
                            </button>
                          ) : null}
                          <button
                            onClick={() => setActiveTab('quests')}
                            className="py-1.5 px-2.5 rounded-lg text-xs font-mono font-bold bg-[#141d22] hover:bg-[#1b262d] text-cyan-400 border border-cyan-500/30 transition-colors"
                            title="View unlock quest"
                          >
                            Quest →
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. SKINS TAB */}
      {activeTab === 'skins' && (
        <div className="space-y-4">
          <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>
              Equip your preferred military livery and uniforms. Includes Toy Soldiers, French & British Napoleonic, Imperial Japan, and more!
            </span>
            <span className="text-amber-400 font-bold">{SKINS_CATALOG.length} SKINS IN CATALOG</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {SKINS_CATALOG.map((skin) => {
              const isUnlocked = profile.unlockedSkins.includes(skin.id);
              const isEquipped = profile.activeSkin === skin.id;

              return (
                <div
                  key={skin.id}
                  className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                    isEquipped
                      ? 'border-amber-400 bg-[#161d21] shadow-xl shadow-amber-950/20'
                      : isUnlocked
                      ? 'border-[#232c32] bg-[#12181c]'
                      : 'border-[#1b2226] bg-[#0c1012] opacity-85'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg border border-white/20 shadow-inner flex items-center justify-center font-bold font-mono text-xs text-white"
                          style={{ backgroundColor: skin.accentColor }}
                        >
                          <Palette className="w-4 h-4 text-slate-950" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-100 text-sm">{skin.name}</h3>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            {skin.camoStyle} camouflage
                          </span>
                        </div>
                      </div>

                      {isEquipped ? (
                        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded">
                          EQUIPPED
                        </span>
                      ) : isUnlocked ? (
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                          UNLOCKED
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold text-slate-500 border border-[#232c32] px-2 py-0.5 rounded">
                          LOCKED
                        </span>
                      )}
                    </div>

                    {/* Visual Preview */}
                    <div className="mb-3 p-3 bg-[#080b0d] rounded-xl border border-[#1d252b] flex items-center justify-around gap-2">
                      <div className="text-center">
                        <span className="text-[9px] font-mono text-slate-500 block mb-1">MAIN TANK</span>
                        <SkinPreviewCanvas unitCode="B" skinId={skin.id} accentColor={skin.accentColor} width={76} height={46} />
                      </div>
                      <div className="h-10 w-[1px] bg-[#1c2429]" />
                      <div className="text-center">
                        <span className="text-[9px] font-mono text-slate-500 block mb-1">INFANTRY</span>
                        <SkinPreviewCanvas unitCode="R" skinId={skin.id} accentColor={skin.accentColor} width={56} height={46} />
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-3">{skin.description}</p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-[#1e262c] flex items-center justify-between">
                    <div>
                      {isUnlocked ? (
                        <span className="text-xs font-mono text-emerald-400">In Armory</span>
                      ) : (
                        <div className="text-xs font-mono font-bold text-amber-400">{skin.costMits} MITS</div>
                      )}
                    </div>

                    {isEquipped ? (
                      <button
                        disabled
                        className="py-1.5 px-3.5 rounded-lg text-xs font-mono font-bold bg-[#1b252a] text-amber-400 border border-amber-500/30 cursor-default"
                      >
                        Active Skin
                      </button>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => onEquipSkin(skin.id)}
                        className="py-1.5 px-3.5 rounded-lg text-xs font-mono font-bold bg-[#182227] hover:bg-[#202e35] text-slate-200 border border-[#2c373e] transition-colors"
                      >
                        Equip Skin
                      </button>
                    ) : (
                      <button
                        onClick={() => onUnlockSkin(skin.id, skin.costMits)}
                        disabled={profile.mits < skin.costMits}
                        className="py-1.5 px-3.5 rounded-lg text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-40"
                      >
                        Unlock Skin
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TECH UPGRADES TAB */}
      {activeTab === 'upgrades' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4 text-xs font-mono">
            <span className="text-slate-400">
              Permanent military enhancements applying across all campaigns and skirmish matches.
            </span>
            <button
              onClick={onResetUpgrades}
              className="py-1 px-3 rounded-lg bg-[#182025] hover:bg-[#202b32] text-slate-300 border border-[#28333a] flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Respec All Points</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TECH_UPGRADES.map((upgrade) => {
              const currentLevel = profile.purchasedUpgrades[upgrade.id] || 0;
              const isMaxed = currentLevel >= upgrade.maxLevel;
              const canAfford = profile.mits >= upgrade.costMits && profile.intel >= upgrade.costIntel;

              return (
                <div
                  key={upgrade.id}
                  className="p-5 rounded-xl border border-[#232c32] bg-[#12181c] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">
                        {upgrade.category} TECH
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        LVL {currentLevel} / {upgrade.maxLevel}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-100 text-sm mb-1">{upgrade.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">
                      {upgrade.description}
                    </p>

                    <div className="p-2 bg-[#090c0e] rounded-lg border border-[#1e252a] text-[11px] font-mono text-emerald-400">
                      ★ {upgrade.statBonus}
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-[#1e262c] flex items-center justify-between">
                    <div>
                      {isMaxed ? (
                        <span className="text-xs font-mono text-emerald-400 font-bold">MAXED OUT</span>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-mono">
                          <span className="text-amber-400 font-bold">{upgrade.costMits} MITS</span>
                          <span className="text-slate-600">·</span>
                          <span className="text-cyan-400">{upgrade.costIntel} INTEL</span>
                        </div>
                      )}
                    </div>

                    <button
                      disabled={isMaxed || !canAfford}
                      onClick={() => onUpgrade(upgrade)}
                      className={`py-2 px-3.5 rounded-lg text-xs font-bold font-mono transition-all uppercase tracking-wider ${
                        isMaxed
                          ? 'bg-[#1b2320] text-emerald-400 cursor-default opacity-80'
                          : canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-950/20'
                          : 'bg-[#1b2226] text-slate-500 cursor-not-allowed border border-[#2a343a]'
                      }`}
                    >
                      {isMaxed ? 'Completed' : 'Upgrade'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const UnitBadge: React.FC<{ unitCode: string }> = ({ unitCode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2 + 5);
    const s = 'JHOWBMALD'.includes(unitCode) ? 0.75 : 0.9;
    ctx.scale(s, s);
    render2DUnit(ctx, unitCode, '#38bdf8', performance.now(), 0, 0);
    ctx.restore();
  }, [unitCode]);

  return (
    <canvas
      ref={canvasRef}
      width={48}
      height={36}
      className="bg-[#0b0e10] rounded border border-[#232c32] shrink-0"
    />
  );
};

const SkinPreviewCanvas: React.FC<{
  unitCode: string;
  skinId: string;
  accentColor: string;
  width?: number;
  height?: number;
}> = ({ unitCode, skinId, accentColor, width = 64, height = 44 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2 + 3);
      const s = unitCode === 'B' ? 0.75 : 0.9;
      ctx.scale(s, s);
      render2DUnit(ctx, unitCode, accentColor, performance.now(), 0, 0, skinId);
      ctx.restore();
      animId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animId);
  }, [unitCode, skinId, accentColor]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="bg-[#070a0c] rounded-lg border border-[#1f282e]"
    />
  );
};
