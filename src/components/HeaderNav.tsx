import React from 'react';
import {
  Shield,
  Coins,
  Star,
  Compass,
  Briefcase,
  Swords,
  Crosshair,
  Volume2,
  VolumeX,
  Settings,
  HardDrive,
  ShieldAlert,
  Home,
  ShoppingBag,
  BookOpen,
} from 'lucide-react';
import { AudioService } from '../services/audio';

interface HeaderNavProps {
  currentTab: 'menu' | 'play' | 'campaign' | 'story' | 'armory' | 'shop' | 'skirmish' | 'battle';
  onSelectTab: (tab: 'menu' | 'play' | 'campaign' | 'story' | 'armory' | 'shop' | 'skirmish' | 'battle') => void;
  mits: number;
  intel: number;
  muted: boolean;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onOpenSaveManager: () => void;
  onOpenAdmin: () => void;
  isInActiveBattle: boolean;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentTab,
  onSelectTab,
  mits,
  intel,
  muted,
  onToggleMute,
  onOpenSettings,
  onOpenSaveManager,
  onOpenAdmin,
  isInActiveBattle,
}) => {
  const handleNavClick = (tab: HeaderNavProps['currentTab']) => {
    AudioService.play('tab');
    onSelectTab(tab);
  };

  return (
    <header className="border-b border-[#222d35] bg-[#090d10]/95 backdrop-blur-md sticky top-0 z-30 select-none">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-2">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => handleNavClick('menu')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
            title="Return to Main Menu"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-950/30 border border-amber-400/40 group-hover:scale-105 transition-all">
              <Shield className="w-4 h-4 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="text-sm font-black tracking-wider text-slate-100 uppercase whitespace-nowrap block leading-tight">
                Frontline Command
              </span>
              <span className="text-[10px] text-amber-400 font-mono hidden sm:block">
                Tactical Warfare 3.0
              </span>
            </div>
          </button>
        </div>

        {/* Desktop Minimalist Nav Pills */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#0f1418] p-1 rounded-xl border border-[#222d35] text-xs font-semibold">
          {[
            { id: 'menu' as const, label: 'Menu', icon: Home },
            { id: 'story' as const, label: 'Story Mode', icon: BookOpen },
            { id: 'campaign' as const, label: 'Campaigns', icon: Compass },
            { id: 'skirmish' as const, label: 'Sandbox & Pass/Play', icon: Swords },
            { id: 'armory' as const, label: 'Armory', icon: Briefcase },
            { id: 'shop' as const, label: 'Shop', icon: ShoppingBag },
            { id: 'battle' as const, label: 'Battlefield', icon: Crosshair, pulse: isInActiveBattle },
          ].map((item) => {
            const Icon = item.icon;
            const isActive =
              currentTab === item.id ||
              (item.id === 'campaign' && currentTab === 'play');
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.pulse && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Currency & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 text-xs font-mono bg-[#0f1418] px-2.5 py-1 rounded-xl border border-[#222d35]">
            <div
              className="flex items-center gap-1 text-amber-400 font-bold"
              title="Mits currency"
            >
              <Coins className="w-3.5 h-3.5" />
              <span className="tabular-nums font-mono">{mits.toLocaleString()}</span>
            </div>
            <span className="text-slate-700">·</span>
            <div className="flex items-center gap-1 text-cyan-400 font-bold" title="Campaign Stars">
              <Star className="w-3.5 h-3.5 fill-cyan-400/30" />
              <span className="tabular-nums font-mono">{intel}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                AudioService.play('click');
                onToggleMute();
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#161f26] transition-colors cursor-pointer"
              title={muted ? 'Unmute Audio' : 'Mute Audio'}
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-slate-300" />
              )}
            </button>

            <button
              onClick={() => {
                AudioService.play('click');
                onOpenSaveManager();
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#161f26] transition-colors cursor-pointer"
              title="Save Manager & Backup"
              aria-label="Save Manager"
            >
              <HardDrive className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                AudioService.play('click');
                onOpenAdmin();
              }}
              className="p-1.5 text-amber-400/80 hover:text-amber-300 rounded-lg hover:bg-amber-500/10 transition-colors cursor-pointer"
              title="Admin Clearance Console"
              aria-label="Admin Console"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                AudioService.play('click');
                onOpenSettings();
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#161f26] transition-colors cursor-pointer"
              title="Settings"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Strip */}
      <div className="lg:hidden flex items-center justify-around border-t border-[#1a2329] px-2 py-1.5 bg-[#090d10] text-[11px] font-mono">
        {[
          { id: 'menu' as const, label: 'Menu', icon: Home },
          { id: 'story' as const, label: 'Story', icon: BookOpen },
          { id: 'campaign' as const, label: 'Campaign', icon: Compass },
          { id: 'skirmish' as const, label: 'Sandbox', icon: Swords },
          { id: 'armory' as const, label: 'Armory', icon: Briefcase },
          { id: 'shop' as const, label: 'Shop', icon: ShoppingBag },
          { id: 'battle' as const, label: 'Battle', icon: Crosshair, pulse: isInActiveBattle },
        ].map((item) => {
          const Icon = item.icon;
          const isActive =
            currentTab === item.id ||
            (item.id === 'campaign' && currentTab === 'play');
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? 'text-amber-400 font-bold bg-[#141d22]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {item.pulse && !isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
