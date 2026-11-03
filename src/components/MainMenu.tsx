import React from 'react';
import { PlayerProfile, GameSettings } from '../types/game';
import { Battlefield3DBackground } from './Battlefield3DBackground';
import { SKINS_CATALOG } from '../data/skins';
import { AudioService } from '../services/audio';
import {
  Play,
  Swords,
  Settings,
  Shield,
  Crosshair,
  Coins,
  Star,
  Users,
  Briefcase,
  ShoppingBag,
  Volume2,
  VolumeX,
  HardDrive,
  ChevronRight,
  Flame,
  BookOpen,
} from 'lucide-react';

interface MainMenuProps {
  profile: PlayerProfile;
  settings: GameSettings;
  hasActiveBattle: boolean;
  onSelectStory: () => void;
  onSelectPlay: (subTab?: 'campaigns' | 'inventory' | 'shop') => void;
  onSelectSandbox: () => void;
  onSelectSettings: () => void;
  onResumeBattle: () => void;
  onOpenSaveManager: () => void;
  onOpenAdmin: () => void;
  onToggleMute: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  profile,
  settings,
  hasActiveBattle,
  onSelectStory,
  onSelectPlay,
  onSelectSandbox,
  onSelectSettings,
  onResumeBattle,
  onOpenSaveManager,
  onOpenAdmin,
  onToggleMute,
}) => {
  const activeSkinDef = SKINS_CATALOG.find((s) => s.id === profile.activeSkin) || SKINS_CATALOG[0];

  const totalStars = Object.values(profile.campaignProgress || {}).reduce(
    (acc, curr) => acc + (curr.stars || 0),
    0
  );

  const rankTitle =
    totalStars >= 45
      ? 'Field Marshal'
      : totalStars >= 30
      ? 'Supreme General'
      : totalStars >= 20
      ? 'Brigadier Colonel'
      : totalStars >= 10
      ? 'Battalion Major'
      : totalStars >= 4
      ? 'Captain'
      : 'Lieutenant';

  return (
    <div className="relative w-full h-screen min-h-[640px] bg-[#070a0d] text-slate-100 flex flex-col justify-between overflow-hidden select-none">
      {/* 3D Real-time Battlefield Scene */}
      <Battlefield3DBackground activeSkinId={profile.activeSkin} />

      {/* Atmospheric Vignette & Contrast Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#06080a] via-[#080d12]/40 to-[#070b0f]/80 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(5,8,12,0.6)_100%)] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-20 flex items-center justify-between p-4 sm:p-6 max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/40 border border-amber-400/50">
            <Shield className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black tracking-widest uppercase text-white font-mono leading-none">
                Frontline Command
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                v3.0
              </span>
            </div>
            <span className="text-[11px] text-cyan-400 font-mono tracking-wider block mt-1">
              TACTICAL WARFARE · REAL-TIME 3D BATTLE ENGINE
            </span>
          </div>
        </div>

        {/* Profile Card & Quick Actions */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-3 bg-[#0c1216]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-[#232f38] shadow-lg text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Commander</span>
              <span className="font-bold text-slate-200">{profile.profileName}</span>
            </div>
            <span className="text-slate-700">·</span>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Rank</span>
              <span className="font-bold text-amber-400">{rankTitle}</span>
            </div>
            <span className="text-slate-700">·</span>
            <div className="flex items-center gap-1 text-amber-400 font-bold">
              <Coins className="w-3.5 h-3.5" />
              <span>{profile.mits.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={() => {
              AudioService.play('click');
              onToggleMute();
            }}
            className="p-2.5 rounded-xl bg-[#12191f]/90 hover:bg-[#1a252f] text-slate-300 hover:text-white border border-[#283540] transition-colors shadow-lg cursor-pointer"
            title={settings.muted ? 'Unmute Audio' : 'Mute Audio'}
            aria-label={settings.muted ? 'Unmute' : 'Mute'}
          >
            {settings.muted ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            )}
          </button>

          <button
            onClick={() => {
              AudioService.play('click');
              onOpenSaveManager();
            }}
            className="p-2.5 rounded-xl bg-[#12191f]/90 hover:bg-[#1a252f] text-slate-300 hover:text-white border border-[#283540] transition-colors shadow-lg cursor-pointer"
            title="Profile Storage & File Backups"
            aria-label="Save Manager"
          >
            <HardDrive className="w-4 h-4 text-slate-300" />
          </button>

          <button
            onClick={() => {
              AudioService.play('click');
              onSelectSettings();
            }}
            className="p-2.5 rounded-xl bg-[#12191f]/90 hover:bg-[#1a252f] text-slate-300 hover:text-white border border-[#283540] transition-colors shadow-lg cursor-pointer"
            title="Battlefield Settings"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </header>

      {/* Main Center Title & Actions */}
      <div className="relative z-20 max-w-4xl w-full mx-auto px-4 sm:px-6 my-auto flex flex-col items-center text-center">
        {/* Title Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono mb-3 backdrop-blur-sm">
          <Flame className="w-3.5 h-3.5" />
          <span>REAL-TIME COMBAT ENGINE READY · SELECT OPERATION</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-white drop-shadow-2xl font-mono">
          Frontline Command
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-2.5 leading-relaxed drop-shadow-md">
          Turn-based tactical warfare. Command infantry, battle tanks, gunships, and artillery across dynamic 3D battlefields.
        </p>

        {/* Primary Action Buttons (Intuitive, High Contrast, Clean) */}
        <div className="mt-8 flex flex-col gap-3 w-full max-w-md">
          {/* Quick Resume Button if match is active */}
          {hasActiveBattle && (
            <button
              onClick={() => {
                AudioService.play('turnReady');
                onResumeBattle();
              }}
              className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl text-base uppercase tracking-wider flex items-center justify-center gap-3 shadow-xl shadow-emerald-950/40 transition-all border border-emerald-400/40 cursor-pointer transform active:scale-95"
            >
              <Crosshair className="w-5 h-5 text-emerald-200" />
              <span>Resume Active Battle</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse ml-1" />
            </button>
          )}

          {/* 1. STORY MODE (NEW) */}
          <button
            onClick={() => {
              AudioService.play('turnReady');
              onSelectStory();
            }}
            className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-base uppercase tracking-wider flex items-center justify-between shadow-2xl shadow-amber-950/50 transition-all border border-amber-400/50 group cursor-pointer transform active:scale-95"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 fill-slate-950" />
              <div className="text-left">
                <span className="block leading-none">Story Mode</span>
                <span className="text-[11px] font-mono font-medium text-amber-950/80 block mt-0.5">
                  8-Bit Comms, Western Front, Japan Landings & Nekoland
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* 2. CAMPAIGN OPERATIONS */}
          <button
            onClick={() => {
              AudioService.play('tab');
              onSelectPlay('campaigns');
            }}
            className="w-full py-3.5 px-6 bg-[#12191f]/95 hover:bg-[#1a252f] text-slate-100 hover:text-white font-bold rounded-2xl text-sm sm:text-base uppercase tracking-wider flex items-center justify-between shadow-xl border border-[#2c3945] transition-all group backdrop-blur-md cursor-pointer transform active:scale-95"
          >
            <div className="flex items-center gap-3">
              <Play className="w-5 h-5 text-cyan-400 fill-cyan-400/20" />
              <div className="text-left">
                <span className="block leading-none">Campaign Operations</span>
                <span className="text-[11px] font-mono font-normal text-slate-400 block mt-0.5">
                  Tactical missions, radar defense, VIP hunts & holdouts
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-slate-400" />
          </button>

          {/* 3. SANDBOX & PASS & PLAY */}
          <button
            onClick={() => {
              AudioService.play('tab');
              onSelectSandbox();
            }}
            className="w-full py-3.5 px-6 bg-[#12191f]/95 hover:bg-[#1a252f] text-slate-100 hover:text-white font-bold rounded-2xl text-sm sm:text-base uppercase tracking-wider flex items-center justify-between shadow-xl border border-[#2c3945] transition-all group backdrop-blur-md cursor-pointer transform active:scale-95"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-amber-400" />
              <div className="text-left">
                <span className="block leading-none">Pass & Play · Sandbox</span>
                <span className="text-[11px] font-mono font-normal text-slate-400 block mt-0.5">
                  1-Device 2-4 Players, Bot Skirmishes, or Spectate
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-slate-400" />
          </button>

          {/* 3. Quick Sub-options: Armory and Shop */}
          <div className="grid grid-cols-2 gap-2.5 mt-1">
            <button
              onClick={() => {
                AudioService.play('tab');
                onSelectPlay('inventory');
              }}
              className="py-3 px-4 rounded-xl bg-[#10161a]/90 hover:bg-[#172127] border border-[#24313b] text-slate-300 hover:text-white flex items-center justify-center gap-2 text-xs font-mono font-bold transition-all cursor-pointer"
            >
              <Briefcase className="w-4 h-4 text-cyan-400" />
              <span>Armory Tech</span>
            </button>

            <button
              onClick={() => {
                AudioService.play('tab');
                onSelectPlay('shop');
              }}
              className="py-3 px-4 rounded-xl bg-[#10161a]/90 hover:bg-[#172127] border border-[#24313b] text-slate-300 hover:text-white flex items-center justify-center gap-2 text-xs font-mono font-bold transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span>Requisition Shop</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <footer className="relative z-20 flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 max-w-7xl w-full mx-auto text-xs font-mono text-slate-400 gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span
              className="w-3 h-3 rounded-full border border-white/20 inline-block"
              style={{ backgroundColor: activeSkinDef.accentColor }}
            />
            <span>Active Livery:</span>
            <strong className="text-white">{activeSkinDef.name}</strong>
          </div>
          <span className="text-slate-700 hidden sm:inline">·</span>
          <span className="text-slate-400 hidden sm:inline">
            Graphics Preset: {['Minimalist', 'Low', 'Reduced', 'Balanced', 'Standard', 'Tactical High', 'Cinematic', 'Ultra'][settings.quality - 1] || 'Tactical High'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              AudioService.play('click');
              onOpenAdmin();
            }}
            className="text-[11px] text-amber-400/80 hover:text-amber-300 py-1 px-2.5 rounded bg-amber-500/10 border border-amber-500/25 transition-colors cursor-pointer"
          >
            Admin Console
          </button>
          <span className="text-slate-500">Frontline Command 3.0</span>
        </div>
      </footer>
    </div>
  );
};
