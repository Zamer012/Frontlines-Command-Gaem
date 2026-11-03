import React, { useState } from 'react';
import { PlayerProfile, CampaignMission } from '../types/game';
import { ShopView } from './ShopView';
import {
  Compass,
  Briefcase,
  ShoppingBag,
  ArrowLeft,
  Coins,
  Star,
  Swords,
  ChevronRight,
  Shield,
  Palette,
  Crosshair,
  Award,
} from 'lucide-react';

interface PlayHubProps {
  initialSubTab?: 'campaigns' | 'inventory' | 'shop';
  profile: PlayerProfile;
  campaignComponent: React.ReactNode;
  armoryComponent: React.ReactNode;
  onBuyUnit: (unitCode: string, costMits: number) => void;
  onBuySkin: (skinId: string, costMits: number) => void;
  onEquipSkin?: (skinId: string) => void;
  onUnlockBranch: (branchId: string, costMits: number) => void;
  onReturnToMenu: () => void;
  onQuickResumeBattle?: () => void;
  hasActiveBattle?: boolean;
}

export const PlayHub: React.FC<PlayHubProps> = ({
  initialSubTab = 'campaigns',
  profile,
  campaignComponent,
  armoryComponent,
  onBuyUnit,
  onBuySkin,
  onEquipSkin,
  onUnlockBranch,
  onReturnToMenu,
  onQuickResumeBattle,
  hasActiveBattle = false,
}) => {
  const [subTab, setSubTab] = useState<'campaigns' | 'inventory' | 'shop'>(initialSubTab);

  return (
    <div className="min-h-screen bg-[#0b0e11] text-[#d6ded9] flex flex-col font-sans">
      {/* Sub-Navigation Bar */}
      <div className="border-b border-[#232c32] bg-[#0c1013]/95 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onReturnToMenu}
              className="py-1.5 px-3 bg-[#182126] hover:bg-[#202c34] text-slate-300 hover:text-white rounded-lg border border-[#2d3840] text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Main Menu</span>
            </button>

            <div className="h-4 w-px bg-slate-800 hidden sm:block" />

            {/* 3 Play Options as Requested */}
            <div className="flex items-center gap-1 bg-[#090d0f] p-1 rounded-xl border border-[#232c32] text-xs font-mono">
              <button
                onClick={() => setSubTab('campaigns')}
                className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  subTab === 'campaigns'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>1. Campaigns</span>
              </button>

              <button
                onClick={() => setSubTab('inventory')}
                className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  subTab === 'inventory'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>2. Inventory (Armory)</span>
              </button>

              <button
                onClick={() => setSubTab('shop')}
                className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  subTab === 'shop'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>3. The Shop</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasActiveBattle && onQuickResumeBattle && (
              <button
                onClick={onQuickResumeBattle}
                className="py-1.5 px-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
              >
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                <span>Resume Active Battle</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              </button>
            )}

            <div className="flex items-center gap-2 text-xs font-mono bg-[#0b0e10] px-2.5 py-1 rounded-lg border border-[#232c32]">
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <Coins className="w-3.5 h-3.5" />
                <span>{profile.mits.toLocaleString()} MITS</span>
              </div>
              <span className="text-slate-700">·</span>
              <div className="flex items-center gap-1 text-cyan-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-cyan-400/30" />
                <span>{profile.intel} INTEL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 pb-12">
        {subTab === 'campaigns' && campaignComponent}
        {subTab === 'inventory' && armoryComponent}
        {subTab === 'shop' && (
          <ShopView
            profile={profile}
            onBuyUnit={onBuyUnit}
            onBuySkin={onBuySkin}
            onEquipSkin={onEquipSkin}
            onUnlockBranch={onUnlockBranch}
            onGoToArmory={() => setSubTab('inventory')}
            onGoToCampaign={() => setSubTab('campaigns')}
          />
        )}
      </div>
    </div>
  );
};
