import React, { useState } from 'react';
import { CampaignBranch, CampaignMission, BotDifficulty } from '../types/game';
import { CAMPAIGN_BRANCHES, CAMPAIGN_MISSIONS } from '../data/campaigns';
import { SKINS_CATALOG } from '../data/skins';
import {
  Compass,
  Star,
  CheckCircle2,
  Lock,
  Unlock,
  Play,
  Circle,
  Palette,
  Shield,
  Target,
  Flame,
  Award,
  Zap,
} from 'lucide-react';
import { AudioService } from '../services/audio';

interface CampaignViewProps {
  campaignProgress: Record<
    string,
    { completed: boolean; stars: number; bestTurns: number; completedObjectives: string[] }
  >;
  unlockedBranches: string[];
  mits: number;
  onLaunchMission: (mission: CampaignMission) => void;
  onUnlockBranch: (branchId: string, costMits: number) => void;
}

export const CampaignView: React.FC<CampaignViewProps> = ({
  campaignProgress,
  unlockedBranches,
  mits,
  onLaunchMission,
  onUnlockBranch,
}) => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>('branch_iron_dawn');
  const [selectedMissionId, setSelectedMissionId] = useState<string>('op_01_dawnbreak');
  const [missionDifficulty, setMissionDifficulty] = useState<BotDifficulty>('smarty');

  const currentBranch =
    CAMPAIGN_BRANCHES.find((b) => b.id === selectedBranchId) || CAMPAIGN_BRANCHES[0];
  const branchMissions = CAMPAIGN_MISSIONS.filter((m) => m.branchId === currentBranch.id);
  const activeMission =
    branchMissions.find((m) => m.id === selectedMissionId) || branchMissions[0] || CAMPAIGN_MISSIONS[0];

  const isBranchUnlocked = (branchId: string) => unlockedBranches.includes(branchId);

  const isMissionUnlocked = (m: CampaignMission) => {
    if (!isBranchUnlocked(m.branchId)) return false;
    const idx = branchMissions.findIndex((item) => item.id === m.id);
    if (idx <= 0) return true;
    const prev = branchMissions[idx - 1];
    return !!campaignProgress[prev?.id]?.completed;
  };

  const totalStars = Object.values(campaignProgress).reduce((acc, curr) => acc + (curr.stars || 0), 0);
  const totalCompleted = Object.values(campaignProgress).filter((m) => m.completed).length;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Campaign Operations Header */}
      <div className="bg-gradient-to-r from-[#141b20] to-[#101417] border border-[#232c32] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
            <Compass className="w-4 h-4" />
            <span>THEATER OF OPERATIONS · CORE CAMPAIGN MISSIONS</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
            Campaign Operations
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mt-1 leading-relaxed">
            Lead your strike battalion through structured tactical operations. Victorious operations reward{' '}
            <strong className="text-amber-400 font-semibold">Mits</strong> to unlock advanced units and cosmetic liveries in the Shop and Armory.
          </p>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-[#232c32] pt-4 md:pt-0 md:pl-8 text-sm font-mono shrink-0">
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Missions Pacified</span>
            <span className="text-xl font-bold text-slate-200 tabular-nums">
              {totalCompleted} / {CAMPAIGN_MISSIONS.length}
            </span>
          </div>
          <span className="text-slate-700 hidden sm:inline">·</span>
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Stars Earned</span>
            <div className="flex items-center gap-1.5 text-xl font-bold text-amber-400 tabular-nums">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>
                {totalStars} / {CAMPAIGN_MISSIONS.length * 3}
              </span>
            </div>
          </div>
          <span className="text-slate-700 hidden sm:inline">·</span>
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Treasury</span>
            <span className="text-xl font-black text-amber-400 tabular-nums">
              {mits.toLocaleString()} <span className="text-xs font-normal text-slate-400">MITS</span>
            </span>
          </div>
        </div>
      </div>

      {/* Theater Branches Selector */}
      <div className="space-y-2">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400 px-1">
          Operational Theater Branches ({CAMPAIGN_BRANCHES.length} Theaters Available)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-3">
          {CAMPAIGN_BRANCHES.map((branch) => {
            const unlocked = isBranchUnlocked(branch.id);
            const isSelected = selectedBranchId === branch.id;
            const completedInBranch = branch.missionIds.filter((id) => campaignProgress[id]?.completed).length;

            return (
              <button
                key={branch.id}
                onClick={() => {
                  setSelectedBranchId(branch.id);
                  const first = branch.missionIds[0];
                  if (first) setSelectedMissionId(first);
                }}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-400 bg-[#161e22] shadow-md shadow-amber-950/20'
                    : unlocked
                    ? 'border-[#232c32] hover:border-[#384650] bg-[#111619]'
                    : 'border-[#1b2226] bg-[#0c1012] opacity-70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                      BRANCH {branch.number}
                    </span>
                    {unlocked ? (
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        {completedInBranch}/{branch.missionIds.length}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-200 line-clamp-1">
                    {branch.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                    {branch.description}
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-[#1e262c] flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-500">{branch.missionIds.length} Ops</span>
                  {!unlocked && (
                    <span className="text-amber-400 font-bold">{branch.unlockCostMits} Mits</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Operations List & Briefing Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Operations in Selected Branch */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 px-1">
              {currentBranch.title} · Tactical Operations
            </h2>
            {!isBranchUnlocked(currentBranch.id) && (
              <button
                onClick={() => onUnlockBranch(currentBranch.id, currentBranch.unlockCostMits)}
                disabled={mits < currentBranch.unlockCostMits}
                className="py-1 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors disabled:opacity-40"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Unlock Branch ({currentBranch.unlockCostMits} Mits)</span>
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {branchMissions.map((mission) => {
              const unlocked = isMissionUnlocked(mission);
              const prog = campaignProgress[mission.id];
              const isSelected = activeMission.id === mission.id;
              const stars = prog?.stars || 0;

              return (
                <div
                  key={mission.id}
                  onClick={() => unlocked && setSelectedMissionId(mission.id)}
                  className={`p-4 rounded-xl border transition-all ${
                    unlocked
                      ? isSelected
                        ? 'border-amber-400 bg-[#161d21] shadow-lg shadow-amber-950/20 cursor-pointer'
                        : 'border-[#232c32] hover:border-[#384650] bg-[#111619] cursor-pointer'
                      : 'border-[#1b2226] bg-[#0c1012] opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-sm shrink-0 border ${
                          unlocked
                            ? prog?.completed
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                            : 'bg-[#14191c] text-slate-600 border-[#232c32]'
                        }`}
                      >
                        {unlocked ? (
                          prog?.completed ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            mission.number
                          )
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-mono text-slate-500">
                            OP #{mission.number} · {mission.codename}
                          </span>
                          {mission.objectiveType === 'holdout' ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              HOLDOUT {mission.holdoutTurns ? `(${mission.holdoutTurns}T)` : ''}
                            </span>
                          ) : mission.objectiveType === 'defend_and_attack' ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                              DEFEND & ATTACK
                            </span>
                          ) : mission.objectiveType === 'counterattack' ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                              COUNTERATTACK
                            </span>
                          ) : mission.objectiveType === 'destroy_vip' ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                              VIP HUNT
                            </span>
                          ) : mission.objectiveType === 'capture_outposts' ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              DOMINATION
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                              ASSAULT
                            </span>
                          )}
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
                              mission.difficulty === 'expert'
                                ? 'bg-red-500/15 text-red-400 border-red-500/30'
                                : mission.difficulty === 'hard'
                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                            }`}
                          >
                            {mission.difficulty.toUpperCase()} AI
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {mission.mapSize}x{mission.mapSize}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-200 mt-1">{mission.title}</h3>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {unlocked ? (
                        <div className="flex items-center gap-1 justify-end">
                          {[1, 2, 3].map((starIdx) => (
                            <Star
                              key={starIdx}
                              className={`w-4 h-4 ${
                                starIdx <= stars ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs font-mono text-slate-600">LOCKED</span>
                      )}
                      <div className="text-xs font-mono font-bold text-amber-400 mt-1">
                        +{mission.rewardMits} MITS
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Mission Briefing Sidebar */}
        <div className="lg:col-span-5 bg-[#141a1e] border border-[#232c32] rounded-2xl p-6 space-y-5 sticky top-20 shadow-xl">
          <div className="border-b border-[#232c32] pb-4">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
              <span>OPERATION #{activeMission.number}</span>
              <span className="text-amber-400 font-bold">{activeMission.codename}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100">{activeMission.title}</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400 mt-2">
              <span>Grid: {activeMission.mapSize}x{activeMission.mapSize}</span>
              <span>·</span>
              <span>Enemy: {activeMission.enemyFactionName}</span>
              <span>·</span>
              <span
                className={
                  activeMission.difficulty === 'expert'
                    ? 'text-red-400 font-bold'
                    : activeMission.difficulty === 'hard'
                    ? 'text-amber-400 font-bold'
                    : 'text-cyan-400'
                }
              >
                AI: {activeMission.difficulty.toUpperCase()}
              </span>
            </div>

            {activeMission.enemySkin && (() => {
              const skin = SKINS_CATALOG.find((s) => s.id === activeMission.enemySkin);
              return skin ? (
                <div className="flex items-center gap-2 mt-2 px-2.5 py-1.5 bg-[#0c1012] border border-[#232c32] rounded-lg text-xs font-mono">
                  <Palette className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-slate-400">Hostile Livery:</span>
                  <span
                    className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                    style={{ backgroundColor: skin.accentColor }}
                  />
                  <span className="text-slate-200 font-bold">{skin.name}</span>
                </div>
              ) : null;
            })()}
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Mission Directive
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed bg-[#0c1012] p-3 rounded-xl border border-[#232c32]">
              {activeMission.briefing}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400/90 mb-1.5">
              Intelligence Advisory
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed bg-[#0c1012] p-3 rounded-xl border border-[#232c32]">
              {activeMission.intelBrief}
            </p>
          </div>

          {/* Objectives */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Operational Objectives
            </h4>
            <div className="space-y-1.5">
              {activeMission.objectives.map((obj) => {
                const isDone = campaignProgress[activeMission.id]?.completedObjectives?.includes(obj.id);
                return (
                  <div
                    key={obj.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#0c1012] border border-[#232c32] text-xs font-mono"
                  >
                    <div className="flex items-center gap-2 text-slate-300">
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      )}
                      <span>{obj.text}</span>
                    </div>
                    {obj.isBonus && (
                      <span className="text-amber-400 text-[10px] shrink-0 font-semibold">
                        ★ +{obj.rewardMits} MITS
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Difficulty Selector (Normal, Smarty, Sweat, Tryhard) */}
          <div className="p-3 rounded-xl bg-[#0e1316] border border-[#232c32] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 font-bold uppercase tracking-wider">AI Difficulty Setting:</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  missionDifficulty === 'tryhard'
                    ? 'text-purple-300 bg-purple-500/15 border-purple-500/40'
                    : missionDifficulty === 'sweat'
                    ? 'text-red-300 bg-red-500/15 border-red-500/40'
                    : missionDifficulty === 'smarty'
                    ? 'text-amber-300 bg-amber-500/15 border-amber-500/40'
                    : 'text-cyan-300 bg-cyan-500/15 border-cyan-500/40'
                }`}
              >
                {missionDifficulty.toUpperCase()}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-tight">
              {missionDifficulty === 'tryhard'
                ? 'Tryhard: actual thinking bot. Deep calculation, coordinates transport air drops, calculates multi-turn trades.'
                : missionDifficulty === 'sweat'
                ? 'Sweat (expert AI): lethal focus-firing, artillery standoff kiting, covers trenches & interceptors.'
                : missionDifficulty === 'smarty'
                ? 'Smarty (intermediate bot AI): evaluates damage trades, triage healing, and retreats wounded units.'
                : 'Normal (normal bot AI): basic combat reactions & structure captures.'}
            </p>

            <div className="grid grid-cols-4 gap-1 pt-1">
              {[
                { id: 'normal', label: 'Normal', desc: 'Normal bot AI' },
                { id: 'smarty', label: 'Smarty', desc: 'Intermediate bot AI' },
                { id: 'sweat', label: 'Sweat', desc: 'Expert AI' },
                { id: 'tryhard', label: 'Tryhard', desc: 'Actual thinking bot' },
              ].map(({ id, label, desc }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMissionDifficulty(id as BotDifficulty)}
                  title={desc}
                  className={`py-1.5 px-1 rounded-lg text-xs font-mono font-bold transition-all border uppercase text-center ${
                    missionDifficulty === id
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                      : 'bg-[#141b1f] text-slate-400 border-[#232c32] hover:text-white hover:bg-[#1a2328]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0e1316] border border-[#232c32] text-xs font-mono">
            <span className="text-slate-400">Victory Requisition</span>
            <div className="flex items-center gap-3">
              <span className="text-amber-400 font-bold">+{activeMission.rewardMits} MITS</span>
              <span className="text-cyan-400 font-bold">+{activeMission.rewardIntel} INTEL</span>
            </div>
          </div>

          {isMissionUnlocked(activeMission) ? (
            <button
              onClick={() => {
                AudioService.play('turnReady');
                onLaunchMission({ ...activeMission, difficulty: missionDifficulty });
              }}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-950/30 uppercase tracking-wider transition-all cursor-pointer transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Launch Operation ({missionDifficulty.toUpperCase()})</span>
            </button>
          ) : (
            <div className="p-3 bg-[#0c1012] border border-amber-500/30 rounded-xl text-center text-xs font-mono text-amber-400">
              Complete preceding mission or authorize branch to launch.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
