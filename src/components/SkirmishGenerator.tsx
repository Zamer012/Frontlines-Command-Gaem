import React, { useState } from 'react';
import { GameEngineInitParams } from '../game/engine';
import { BotDifficulty } from '../types/game';
import { SKINS_CATALOG, FACTION_NAMES, FACTION_COLORS } from '../data/skins';
import { AudioService } from '../services/audio';
import {
  Swords,
  Globe,
  Bot,
  Users,
  Play,
  RotateCcw,
  Sparkles,
  Shield,
  Layers,
  Palette,
  Check,
  EyeOff,
  Eye,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';

interface SkirmishGeneratorProps {
  onStartMatch: (params: GameEngineInitParams) => void;
}

type MainCategory = 'local' | 'vs_ai' | 'spectate' | 'custom';

export const SkirmishGenerator: React.FC<SkirmishGeneratorProps> = ({ onStartMatch }) => {
  const [category, setCategory] = useState<MainCategory>('local');
  const [selectedPreset, setSelectedPreset] = useState<number>(6); // Default to Pass & Play
  const [startingGold, setStartingGold] = useState<number>(28);
  const [fogOfWar, setFogOfWar] = useState<boolean>(true);
  const [autoDeploy, setAutoDeploy] = useState<boolean>(true);
  const [privacyCurtain, setPrivacyCurtain] = useState<boolean>(true);
  const [difficulty, setDifficulty] = useState<BotDifficulty>('smarty');
  const [customSize, setCustomSize] = useState<number | null>(null);
  const [baseLayout, setBaseLayout] = useState<'standard' | 'diagonal' | 'flank' | 'asymmetric' | 'corners' | 'random'>('random');

  // Custom Sandbox Player Slot Configuration (Human vs Bot for each faction)
  const [slotTypes, setSlotTypes] = useState<('human' | 'bot' | 'none')[]>([
    'human',
    'human',
    'none',
    'none',
  ]);

  const [botSkins, setBotSkins] = useState<Record<number, string>>({
    0: 'skin_toy_soldiers',
    1: 'skin_ww2_germany',
    2: 'skin_imperial_japan',
    3: 'skin_girls_und_panzer',
  });

  const PRESETS = [
    {
      id: 0,
      category: 'vs_ai' as const,
      title: 'Compact Strike (10x10)',
      desc: 'Fast, intense close-quarters skirmish with rapid engagements on a tight 10x10 grid.',
      mapSize: 10,
      players: 2,
      humans: [0],
      icon: Swords,
    },
    {
      id: 1,
      category: 'vs_ai' as const,
      title: 'River Delta Crossings (14x14)',
      desc: 'Tactical water crossing with bridges, canal defiles, and amphibious hovercraft routes.',
      mapSize: 14,
      players: 2,
      humans: [0],
      icon: Globe,
    },
    {
      id: 2,
      category: 'vs_ai' as const,
      title: 'Tactical Skirmish vs AI (15x15)',
      desc: '1v1 combined-arms tactical battle against computer AI on a standard 15x15 sector.',
      mapSize: 15,
      players: 2,
      humans: [0],
      icon: Swords,
    },
    {
      id: 3,
      category: 'vs_ai' as const,
      title: 'Sunken Archipelago (18x18)',
      desc: 'Flooded island chain with scattered outposts. Perfect for Hovercraft, Gunships, and Artillery.',
      mapSize: 18,
      players: 2,
      humans: [0],
      icon: Globe,
    },
    {
      id: 4,
      category: 'vs_ai' as const,
      title: 'Frontline War (20x20)',
      desc: 'Expanded 20x20 battlefield with wide flanking routes, off-center outposts, and river crossings.',
      mapSize: 20,
      players: 2,
      humans: [0],
      icon: Globe,
    },
    {
      id: 5,
      category: 'vs_ai' as const,
      title: 'Tri-War Citadel (24x24)',
      desc: '3-way superpower conflict on an expansive 24x24 fortress map with multiple forward barracks.',
      mapSize: 24,
      players: 3,
      humans: [0],
      icon: Globe,
    },
    {
      id: 6,
      category: 'local' as const,
      title: 'Pass & Play: 1v1 Classic (15x15)',
      desc: '2-player hotseat match on 1 device with turn curtain privacy between commander handovers.',
      mapSize: 15,
      players: 2,
      humans: [0, 1],
      icon: Users,
    },
    {
      id: 7,
      category: 'spectate' as const,
      title: 'Bot vs Bot Simulation (15x15)',
      desc: 'Spectate two autonomous AI commanders fighting for victory in real-time. Zero manual deployment.',
      mapSize: 15,
      players: 2,
      humans: [],
      icon: Bot,
    },
    {
      id: 8,
      category: 'vs_ai' as const,
      title: 'Grand War: You vs 3 AI Powers (30x30)',
      desc: 'Massive 30x30 theater with 4 corner HQs and multiple staging barracks across 4 quadrants.',
      mapSize: 30,
      players: 4,
      humans: [0],
      icon: Globe,
    },
    {
      id: 9,
      category: 'spectate' as const,
      title: '4-Way Grand War (Spectate 30x30)',
      desc: 'Watch four autonomous AI superpowers clash across a 30x30 theater. Instant battle, zero setup.',
      mapSize: 30,
      players: 4,
      humans: [],
      icon: Bot,
    },
    {
      id: 10,
      category: 'local' as const,
      title: 'Pass & Play: 4-Way Grand War (30x30)',
      desc: '4-player hotseat conflict on one shared device with full privacy handovers.',
      mapSize: 30,
      players: 4,
      humans: [0, 1, 2, 3],
      icon: Users,
    },
    {
      id: 11,
      category: 'local' as const,
      title: 'Pass & Play: Fast 1v1 Blitz (10x10)',
      desc: 'High-speed 1v1 battle on a compact 10x10 grid. Quick turns, intense tactical choices.',
      mapSize: 10,
      players: 2,
      humans: [0, 1],
      icon: Users,
    },
    {
      id: 12,
      category: 'local' as const,
      title: 'Pass & Play: Tri-War 3 Players (24x24)',
      desc: '3 human commanders competing on one shared screen in a triangular theater.',
      mapSize: 24,
      players: 3,
      humans: [0, 1, 2],
      icon: Users,
    },
  ];

  const currentPreset = PRESETS.find((p) => p.id === selectedPreset) || PRESETS[6];
  const actualSize = customSize !== null ? customSize : currentPreset.mapSize;

  const handleLaunch = () => {
    AudioService.play('turnReady');
    let finalPlayers = currentPreset.players;
    let finalHumans = currentPreset.humans;

    if (category === 'custom') {
      const activeSlots = slotTypes
        .map((type, idx) => ({ type, idx }))
        .filter((s) => s.type !== 'none');
      finalPlayers = Math.max(2, activeSlots.length);
      finalHumans = activeSlots
        .filter((s) => s.type === 'human')
        .map((s) => s.idx);
    }

    const isBotSim = finalHumans.length === 0;
    const finalSize = customSize !== null ? customSize : currentPreset.mapSize;
    const layout = baseLayout === 'random' ? undefined : (baseLayout as any);

    onStartMatch({
      mapSize: finalSize,
      playersCount: finalPlayers,
      humanFactions: finalHumans,
      startingGold: Array(finalPlayers).fill(finalSize >= 20 ? startingGold * 2 : startingGold),
      autoDeploy: isBotSim || autoDeploy,
      fogOfWar: isBotSim ? false : fogOfWar,
      difficulty,
      baseLayout: layout,
      factionSkins: botSkins,
    });
  };

  const visiblePresets = PRESETS.filter((p) => {
    if (category === 'custom') return false;
    return p.category === category;
  });

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header & Launch Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#0f1418] rounded-2xl border border-[#232f38] shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase tracking-widest">
              Sandbox & Custom Battles
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Battle Theater Generator
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Play local Pass & Play on 1 device, challenge tactical AI bots, or build a custom war.
          </p>
        </div>

        <button
          onClick={handleLaunch}
          className="py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-950/30 shrink-0 transition-all cursor-pointer transform active:scale-95"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          <span>Launch Battle</span>
        </button>
      </div>

      {/* Main Mode Category Switcher */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          {
            id: 'local' as const,
            title: 'Pass & Play',
            subtitle: '1 Device (2-4 Players)',
            icon: Users,
            color: 'text-amber-400',
            border: 'border-amber-500/40',
            bg: 'bg-amber-500/10',
          },
          {
            id: 'vs_ai' as const,
            title: 'Solo vs AI',
            subtitle: 'Tactical Bot Battles',
            icon: Swords,
            color: 'text-cyan-400',
            border: 'border-cyan-500/40',
            bg: 'bg-cyan-500/10',
          },
          {
            id: 'spectate' as const,
            title: 'AI Spectator',
            subtitle: 'Bot vs Bot Simulation',
            icon: Bot,
            color: 'text-emerald-400',
            border: 'border-emerald-500/40',
            bg: 'bg-emerald-500/10',
          },
          {
            id: 'custom' as const,
            title: 'Custom Sandbox',
            subtitle: 'Configure Factions & Grid',
            icon: SlidersHorizontal,
            color: 'text-purple-400',
            border: 'border-purple-500/40',
            bg: 'bg-purple-500/10',
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = category === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                AudioService.play('tab');
                setCategory(tab.id);
                if (tab.id === 'local') setSelectedPreset(6);
                else if (tab.id === 'vs_ai') setSelectedPreset(2);
                else if (tab.id === 'spectate') setSelectedPreset(7);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                isActive
                  ? `${tab.bg} ${tab.border} shadow-lg ring-1 ring-amber-400/30`
                  : 'bg-[#12171b] border-[#222d35] hover:border-slate-600 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${isActive ? tab.color : 'text-slate-400'}`} />
                <span className={`text-xs font-black uppercase tracking-wide ${isActive ? 'text-white' : 'text-slate-300'}`}>
                  {tab.title}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 block">
                {tab.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* Preset Cards (for Pass & Play, Solo vs AI, or Spectate) */}
      {category !== 'custom' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
            <span>Choose Match Format</span>
            <span>{visiblePresets.length} Configurations Available</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visiblePresets.map((preset) => {
              const Icon = preset.icon;
              const isSelected = selectedPreset === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => {
                    AudioService.play('click');
                    setSelectedPreset(preset.id);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-amber-400 bg-[#161f25] shadow-lg shadow-amber-950/20 ring-1 ring-amber-400/40'
                      : 'border-[#222d35] bg-[#11161a] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                            : 'bg-[#1a2329] text-slate-300'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-100 text-sm">{preset.title}</h3>
                        <span className="text-[11px] font-mono text-amber-400 font-bold block mt-0.5">
                          {preset.mapSize}x{preset.mapSize} Grid · {preset.players} Factions
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-bold">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-2.5 leading-relaxed pl-13">
                    {preset.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Sandbox: Faction Assignment Editor */}
      {category === 'custom' && (
        <div className="bg-[#12171b] p-5 rounded-2xl border border-[#232f38] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Faction Slot Setup (Human / Bot / Inactive)</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              Min 2 factions active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((idx) => {
              const currentType = slotTypes[idx];
              const factionColor = FACTION_COLORS[idx];
              const factionName = FACTION_NAMES[idx];

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border bg-[#0b0e11] flex flex-col justify-between space-y-3"
                  style={{ borderColor: currentType !== 'none' ? `${factionColor}50` : '#222d35' }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold" style={{ color: factionColor }}>
                        P{idx + 1}: {factionName}
                      </span>
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: factionColor }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      Slot Status:{' '}
                      <strong className="text-slate-200">
                        {currentType === 'human'
                          ? 'Human (Pass & Play)'
                          : currentType === 'bot'
                          ? 'AI Bot'
                          : 'Inactive'}
                      </strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => {
                        AudioService.play('click');
                        const next = [...slotTypes];
                        next[idx] = 'human';
                        setSlotTypes(next);
                      }}
                      className={`py-1.5 text-[10px] font-mono font-bold rounded transition-colors ${
                        currentType === 'human'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-[#182126] text-slate-400 hover:text-white'
                      }`}
                    >
                      Human
                    </button>
                    <button
                      onClick={() => {
                        AudioService.play('click');
                        const next = [...slotTypes];
                        next[idx] = 'bot';
                        setSlotTypes(next);
                      }}
                      className={`py-1.5 text-[10px] font-mono font-bold rounded transition-colors ${
                        currentType === 'bot'
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-[#182126] text-slate-400 hover:text-white'
                      }`}
                    >
                      AI Bot
                    </button>
                    <button
                      disabled={idx < 2}
                      onClick={() => {
                        AudioService.play('click');
                        const next = [...slotTypes];
                        next[idx] = 'none';
                        setSlotTypes(next);
                      }}
                      className={`py-1.5 text-[10px] font-mono font-bold rounded transition-colors disabled:opacity-30 ${
                        currentType === 'none'
                          ? 'bg-slate-700 text-white'
                          : 'bg-[#182126] text-slate-400 hover:text-white'
                      }`}
                    >
                      None
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Match Parameters & Rules (Simple, Clean, Minimalist Cards) */}
      <div className="bg-[#12171b] p-5 rounded-2xl border border-[#232f38] space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Match Rules & Environment</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Starting Gold */}
          <div className="p-3.5 bg-[#0b0e11] rounded-xl border border-[#222d35] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-1">
                <span className="text-slate-300 font-bold">Starting Budget</span>
                <span className="text-amber-400 font-black">{startingGold} Gold</span>
              </div>
              <p className="text-[11px] text-slate-400">Initial gold to buy starter troops and tanks.</p>
            </div>
            <div className="grid grid-cols-4 gap-1 mt-3">
              {[16, 28, 40, 56].map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    AudioService.play('click');
                    setStartingGold(g);
                  }}
                  className={`py-1 text-[11px] font-mono font-bold rounded transition-colors ${
                    startingGold === g
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-[#182126] text-slate-400 hover:text-white'
                  }`}
                >
                  {g}G
                </button>
              ))}
            </div>
          </div>

          {/* AI Difficulty */}
          <div className="p-3.5 bg-[#0b0e11] rounded-xl border border-[#222d35] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-1">
                <span className="text-slate-300 font-bold">Bot Intelligence</span>
                <span className="text-cyan-400 font-black uppercase text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
                  {difficulty}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Governs tactics, target focus, and retreat AI.</p>
            </div>
            <div className="grid grid-cols-4 gap-1 mt-3">
              {(['normal', 'smarty', 'sweat', 'tryhard'] as BotDifficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    AudioService.play('click');
                    setDifficulty(d);
                  }}
                  className={`py-1 text-[10px] font-mono font-bold rounded uppercase transition-colors ${
                    difficulty === d
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'bg-[#182126] text-slate-400 hover:text-white'
                  }`}
                >
                  {d === 'normal' ? 'Norm' : d === 'smarty' ? 'Smart' : d === 'sweat' ? 'Sweat' : 'Tryhard'}
                </button>
              ))}
            </div>
          </div>

          {/* Deployment Phase Mode */}
          <div className="p-3.5 bg-[#0b0e11] rounded-xl border border-[#222d35] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-1">
                <span className="text-slate-300 font-bold">Deployment</span>
                <span className="text-emerald-400 font-black text-[10px]">
                  {autoDeploy ? 'INSTANT' : 'MANUAL'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {autoDeploy ? 'Armies auto-deploy & fight begins Turn 1.' : 'Place units tile-by-tile around HQ.'}
              </p>
            </div>
            <button
              onClick={() => {
                AudioService.play('click');
                setAutoDeploy(!autoDeploy);
              }}
              className={`mt-3 py-1.5 px-3 text-xs font-mono font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                autoDeploy
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-[#182126] text-slate-300 border border-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{autoDeploy ? 'Instant Combat' : 'Manual Placement'}</span>
            </button>
          </div>

          {/* Fog of War */}
          <div className="p-3.5 bg-[#0b0e11] rounded-xl border border-[#222d35] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-1">
                <span className="text-slate-300 font-bold">Fog of War</span>
                <span className="text-slate-400 font-mono text-[10px]">
                  {fogOfWar ? 'ENABLED' : 'OPEN MAP'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {fogOfWar ? 'Shroud unseen map areas in fog.' : 'All terrain & units visible to everyone.'}
              </p>
            </div>
            <button
              onClick={() => {
                AudioService.play('click');
                setFogOfWar(!fogOfWar);
              }}
              className={`mt-3 py-1.5 px-3 text-xs font-mono font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                fogOfWar
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-[#182126] text-slate-300 border border-slate-700'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{fogOfWar ? 'Fog of War Active' : 'Revealed Battlefield'}</span>
            </button>
          </div>
        </div>

        {/* Map Scale & Terrain Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#1f2930]">
          {/* Custom Map Scale */}
          <div className="p-3.5 bg-[#0b0e11] rounded-xl border border-[#222d35] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 font-mono">Map Dimension Scale</span>
              <span className="text-[10px] font-mono text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                {actualSize}x{actualSize} Grid
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1 pt-1">
              {[10, 15, 20, 24, 30].map((sz) => (
                <button
                  key={sz}
                  onClick={() => {
                    AudioService.play('click');
                    setCustomSize(sz);
                  }}
                  className={`py-1.5 text-xs font-mono font-bold rounded transition-colors ${
                    actualSize === sz
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-[#182126] text-slate-400 hover:text-white'
                  }`}
                >
                  {sz}x{sz}
                </button>
              ))}
            </div>
          </div>

          {/* Terrain & Base Layout */}
          <div className="p-3.5 bg-[#0b0e11] rounded-xl border border-[#222d35] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 font-mono">HQ Placement & Layout</span>
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
                {baseLayout}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 pt-1">
              {[
                { id: 'random', label: 'Random' },
                { id: 'standard', label: 'Classic' },
                { id: 'diagonal', label: 'Diagonal' },
                { id: 'flank', label: 'Flank' },
                { id: 'asymmetric', label: 'Asymmetric' },
                { id: 'corners', label: 'Corners' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => {
                    AudioService.play('click');
                    setBaseLayout(id as any);
                  }}
                  className={`py-1 text-[10px] font-mono font-bold rounded transition-colors ${
                    baseLayout === id
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'bg-[#182126] text-slate-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
