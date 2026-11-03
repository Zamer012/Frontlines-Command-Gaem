import React, { useState } from 'react';
import { STORY_CAMPAIGNS } from '../data/stories';
import { StoryCampaign, StoryMissionNode, StoryChoice } from '../types/story';
import { PlayerProfile } from '../types/game';
import { AudioService } from '../services/audio';
import {
  BookOpen,
  CheckCircle2,
  Lock,
  ChevronRight,
  Shield,
  Coins,
  Star,
  MapPin,
  Flame,
  Award,
  Zap,
  Play,
  RotateCcw,
  Sparkles,
  GitBranch,
  Skull,
} from 'lucide-react';

interface StoryViewProps {
  profile: PlayerProfile;
  onLaunchStoryMission: (node: StoryMissionNode) => void;
  onProfileUpdated: (profile: PlayerProfile) => void;
}

export const StoryView: React.FC<StoryViewProps> = ({
  profile,
  onLaunchStoryMission,
  onProfileUpdated,
}) => {
  const [selectedStoryId, setSelectedStoryId] = useState<string>('story_western_front');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('wf_node_normandy');
  const [showChoiceModal, setShowChoiceModal] = useState<StoryMissionNode | null>(null);

  const activeStory: StoryCampaign = STORY_CAMPAIGNS[selectedStoryId] || STORY_CAMPAIGNS['story_western_front'];
  const nodes = Object.values(activeStory.nodes);

  // User story progress stored in profile or defaults
  const completedNodeIds = (profile as any).storyCompletedNodes || [];
  const chosenBranches = (profile as any).storyChosenBranches || {};

  // Check if node is unlocked
  const isNodeUnlocked = (node: StoryMissionNode): boolean => {
    if (node.id === activeStory.startingNodeId) return true;
    // Check if any incoming parent node is completed
    const parentNodes = nodes.filter((n) =>
      n.nextChoices?.some((c) => c.targetNodeId === node.id)
    );
    if (parentNodes.length === 0) return true;
    return parentNodes.some((pn) => completedNodeIds.includes(pn.id));
  };

  const isNodeCompleted = (nodeId: string): boolean => {
    return completedNodeIds.includes(nodeId);
  };

  const selectedNode = activeStory.nodes[selectedNodeId] || nodes[0];

  const handleSelectStory = (storyId: string) => {
    AudioService.play('tab');
    setSelectedStoryId(storyId);
    const story = STORY_CAMPAIGNS[storyId];
    setSelectedNodeId(story.startingNodeId);
  };

  const handleSelectNode = (node: StoryMissionNode) => {
    AudioService.play('click');
    setSelectedNodeId(node.id);
  };

  const handleChooseBranch = (parentNode: StoryMissionNode, choice: StoryChoice) => {
    AudioService.play('purchase');
    const updatedBranches = { ...chosenBranches, [parentNode.id]: choice.targetNodeId };
    const updatedProfile = {
      ...profile,
      storyChosenBranches: updatedBranches,
    };
    onProfileUpdated(updatedProfile as any);
    setSelectedNodeId(choice.targetNodeId);
    setShowChoiceModal(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6 animate-in fade-in duration-150 select-none">
      {/* Top Story Campaign Carousel */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-100 font-mono">
              Story Mode Campaigns
            </h1>
          </div>
          <span className="text-xs font-mono text-cyan-400">
            8-Bit Typewriter Comms · Branching Routes
          </span>
        </div>

        {/* 3 Story Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.values(STORY_CAMPAIGNS).map((story) => {
            const isSelected = story.id === selectedStoryId;
            const completedInStory = Object.keys(story.nodes).filter((nid) =>
              completedNodeIds.includes(nid)
            ).length;
            const totalInStory = Object.keys(story.nodes).length;

            return (
              <button
                key={story.id}
                onClick={() => handleSelectStory(story.id)}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#162029] to-[#0e161c] border-amber-400 shadow-xl shadow-amber-950/20 ring-1 ring-amber-400/50'
                    : 'bg-[#0c1216] border-[#222f38] hover:border-[#384955] text-slate-400 hover:text-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {story.badge}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {completedInStory} / {totalInStory} Won
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100">{story.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {story.synopsis}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-[#202d36] flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <Coins className="w-3.5 h-3.5" />
                    <span>+{story.totalRewardMits} Mits</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-cyan-400/20" />
                    <span>+{story.totalRewardIntel} Intel</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Story Content: Left Timeline Graph & Right Mission Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Visual Branching Timeline Map (7 cols) */}
        <div className="lg:col-span-7 bg-[#0b1014] border border-[#202d36] rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#202d36] pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">
                {activeStory.title} Timeline Map
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">
                Era: {activeStory.era}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Won
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Active
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <Lock className="w-3.5 h-3.5" /> Locked
              </span>
            </div>
          </div>

          {/* Timeline Nodes Container */}
          <div className="relative py-2 space-y-4">
            {nodes.map((node, index) => {
              const unlocked = isNodeUnlocked(node);
              const completed = isNodeCompleted(node.id);
              const isSelected = selectedNodeId === node.id;
              const hasChoices = node.nextChoices && node.nextChoices.length > 1;

              return (
                <div key={node.id} className="relative">
                  {/* Connector Line to next steps */}
                  {index < nodes.length - 1 && (
                    <div className="absolute left-6 top-12 bottom-[-16px] w-0.5 bg-gradient-to-b from-[#2a3842] to-transparent z-0" />
                  )}

                  <div
                    onClick={() => unlocked && handleSelectNode(node)}
                    className={`relative z-10 p-3.5 rounded-xl border transition-all flex items-center justify-between gap-4 cursor-pointer ${
                      isSelected
                        ? 'bg-[#15212a] border-amber-400 shadow-lg shadow-amber-950/20 ring-1 ring-amber-400/40'
                        : completed
                        ? 'bg-[#0f171c] border-emerald-500/40 hover:border-emerald-500 text-slate-300'
                        : unlocked
                        ? 'bg-[#0d1418] border-[#25333d] hover:border-amber-400/60 text-slate-300'
                        : 'bg-[#080d10] border-[#182329] opacity-45 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Step Indicator */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs font-mono shrink-0 shadow-md ${
                          completed
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : unlocked
                            ? isSelected
                              ? 'bg-amber-500 text-slate-950 font-black'
                              : 'bg-[#1a252d] text-amber-400 border border-amber-400/30'
                            : 'bg-[#12191f] text-slate-600 border border-[#202a32]'
                        }`}
                      >
                        {completed ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : unlocked ? (
                          node.timelineStep
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </div>

                      {/* Title & Metadata */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-100">{node.title}</h4>
                          {node.noPlayerHq && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                              Airborne Drop
                            </span>
                          )}
                          {node.isFinalNode && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                              Final Battle
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          {node.subtitle} · {node.locationName}
                        </p>
                      </div>
                    </div>

                    {/* Right Action / Status */}
                    <div className="flex items-center gap-3 shrink-0">
                      {hasChoices && completed && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowChoiceModal(node);
                          }}
                          className="px-2.5 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold flex items-center gap-1"
                        >
                          <GitBranch className="w-3.5 h-3.5" />
                          <span>Branch Route</span>
                        </button>
                      )}

                      <div className="text-right font-mono text-xs hidden sm:block">
                        <span className="text-amber-400 font-bold block">
                          +{node.rewardMits} Mits
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {node.rewardIntel} Intel
                        </span>
                      </div>

                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isSelected ? 'text-amber-400 translate-x-1' : 'text-slate-600'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Mission Tactical Dossier (5 cols) */}
        <div className="lg:col-span-5 bg-[#0b1014] border border-[#202d36] rounded-2xl p-5 shadow-xl flex flex-col gap-4 sticky top-16">
          <div className="flex items-center justify-between border-b border-[#202d36] pb-3">
            <div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                {selectedNode.codename}
              </span>
              <h2 className="text-lg font-bold text-slate-100 mt-1">{selectedNode.title}</h2>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{selectedNode.locationName}</span>
              </span>
            </div>
            {isNodeCompleted(selectedNode.id) && (
              <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-lg flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Completed
              </span>
            )}
          </div>

          {/* Lore Briefing */}
          <div className="p-3 bg-[#080d10] border border-[#1d272f] rounded-xl text-xs text-slate-300 leading-relaxed font-sans">
            <span className="text-[10px] font-mono text-amber-400 block mb-1 uppercase tracking-wider font-bold">
              HISTORICAL & NARRATIVE LORE
            </span>
            <p>{selectedNode.loreBrief}</p>
          </div>

          {/* Tactical Directive */}
          <div className="p-3 bg-[#080d10] border border-[#1d272f] rounded-xl text-xs text-slate-300 leading-relaxed font-sans">
            <span className="text-[10px] font-mono text-cyan-400 block mb-1 uppercase tracking-wider font-bold">
              TACTICAL DIRECTIVE & OBJECTIVE
            </span>
            <p className="font-semibold text-slate-100">{selectedNode.objectiveText}</p>
            <p className="text-slate-400 text-[11px] mt-1.5">{selectedNode.tacticalBrief}</p>
          </div>

          {/* Special Mechanics Badge */}
          {selectedNode.noPlayerHq && (
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-xs font-mono text-cyan-300 flex items-start gap-2.5">
              <Zap className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
              <div>
                <strong className="block text-cyan-200">NO BASE HQ — RAPID INFILTRATION</strong>
                <span>
                  Deploy your squad on marked drop tiles with a generous {selectedNode.playerGold} Gold budget. Once combat begins, no mid-battle unit recruitment is available!
                </span>
              </div>
            </div>
          )}

          {selectedNode.holdoutTurns && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-mono text-amber-300 flex items-start gap-2.5">
              <Shield className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <strong className="block text-amber-200">
                  {selectedNode.holdoutTurns}-TURN HOLDOUT DEFENSE
                </strong>
                <span>
                  Hold your ground for {selectedNode.holdoutTurns} combat turns. Reinforcement waves arrive periodically through the rear lines!
                </span>
              </div>
            </div>
          )}

          {/* Battle Specs Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono p-3 bg-[#080d10] border border-[#1d272f] rounded-xl">
            <div>
              <span className="text-[10px] text-slate-400 block">PLAYER FORCES</span>
              <span className="font-bold text-slate-200">{activeStory.heroFactionName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">ENEMY OPPONENT</span>
              <span className="font-bold text-red-400">{selectedNode.enemyName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">STARTING BUDGET</span>
              <span className="font-bold text-amber-400">{selectedNode.playerGold} Gold</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">ENEMY DIFFICULTY</span>
              <span className="font-bold text-purple-400 uppercase">
                {selectedNode.difficulty}
              </span>
            </div>
          </div>

          {/* Reward Badges */}
          <div className="flex items-center justify-between p-3 bg-[#111920] border border-[#23313d] rounded-xl text-xs font-mono">
            <span className="text-slate-400">MISSION REWARDS:</span>
            <div className="flex items-center gap-3 font-bold">
              <span className="text-amber-400 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" />
                <span>+{selectedNode.rewardMits} Mits</span>
              </span>
              <span className="text-cyan-400 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-cyan-400/20" />
                <span>+{selectedNode.rewardIntel} Intel</span>
              </span>
            </div>
          </div>

          {/* Launch Mission Button */}
          <button
            onClick={() => {
              AudioService.play('turnReady');
              onLaunchStoryMission(selectedNode);
            }}
            disabled={!isNodeUnlocked(selectedNode)}
            className={`w-full py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-xl ${
              isNodeUnlocked(selectedNode)
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-950/40 border border-amber-400/60 cursor-pointer transform active:scale-95'
                : 'bg-[#12181d] text-slate-600 border border-[#1f2830] opacity-50 cursor-not-allowed'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Engage Story Mission</span>
          </button>
        </div>
      </div>

      {/* Branch Choice Modal */}
      {showChoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#12171a] border border-[#232c32] rounded-2xl w-full max-w-xl p-6 shadow-2xl flex flex-col gap-4 border-t-2 border-t-amber-400">
            <div className="flex items-center justify-between border-b border-[#232c32] pb-3">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Select Narrative Branch: {showChoiceModal.title}
                </h3>
              </div>
              <button
                onClick={() => setShowChoiceModal(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Choose your strategic advance route. Each choice takes you to a distinct battlefield with unique tactical requirements and lore.
            </p>

            <div className="space-y-3">
              {showChoiceModal.nextChoices?.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => handleChooseBranch(showChoiceModal, choice)}
                  className="w-full p-4 rounded-xl border border-[#26343e] hover:border-amber-400 bg-[#0d1418] hover:bg-[#141f26] text-left transition-all flex flex-col gap-2 cursor-pointer group"
                >
                  <div className="flex items-center justify-between font-bold text-sm text-slate-100 group-hover:text-amber-300">
                    <span>{choice.label}</span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    {choice.description}
                  </p>
                  {choice.tacticalAdvantage && (
                    <span className="text-[11px] font-mono text-cyan-400">
                      Advantage: {choice.tacticalAdvantage}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
