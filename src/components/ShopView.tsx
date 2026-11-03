import React, { useState } from 'react';
import { PlayerProfile } from '../types/game';
import { SKINS_CATALOG } from '../data/skins';
import { CAMPAIGN_BRANCHES } from '../data/campaigns';
import { UNIT_BLUEPRINTS, STARTER_UNITS } from '../data/units';
import {
  Coins,
  Shield,
  Palette,
  Compass,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  Unlock,
  Building2,
  Truck,
  Flame,
  Award,
} from 'lucide-react';
import { render2DUnit } from './Unit2DRenderer';
import { AudioService } from '../services/audio';

const SkinPreviewCanvas: React.FC<{
  unitCode: string;
  skinId: string;
  accentColor: string;
  width?: number;
  height?: number;
}> = ({ unitCode, skinId, accentColor, width = 64, height = 44 }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
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

interface ShopViewProps {
  profile: PlayerProfile;
  onBuyUnit: (unitCode: string, costMits: number) => void;
  onBuySkin: (skinId: string, costMits: number) => void;
  onEquipSkin?: (skinId: string) => void;
  onUnlockBranch: (branchId: string, costMits: number) => void;
  onGoToArmory: () => void;
  onGoToCampaign: () => void;
}

export const ShopView: React.FC<ShopViewProps> = ({
  profile,
  onBuyUnit,
  onBuySkin,
  onEquipSkin,
  onUnlockBranch,
  onGoToArmory,
  onGoToCampaign,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'units' | 'skins' | 'theaters'>('all');

  // Units purchasable in shop with Mits
  const purchasableUnitCodes = Object.keys(UNIT_BLUEPRINTS).filter(
    (code) => !['H', 'O', 'W'].includes(code)
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#141b20] to-[#101417] border border-[#232c32] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
            <Coins className="w-4 h-4" />
            <span>CENTRAL QUARTERMASTER & MILITARY REQUISITION EXCHANGE</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
            The Frontline Shop
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mt-1 leading-relaxed">
            Acquire combat units, historic uniforms, authentic WW2 & Napoleonic skins, and operational theater passes with{' '}
            <strong className="text-amber-400 font-semibold">Mits</strong> earned from battle victories.
          </p>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-[#232c32] pt-4 md:pt-0 md:pl-8 text-sm font-mono shrink-0">
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Your Treasury</span>
            <div className="flex items-center gap-1.5 text-2xl font-black text-amber-400 tabular-nums">
              <Coins className="w-5 h-5 text-amber-400" />
              <span>{profile.mits.toLocaleString()}</span>
              <span className="text-xs font-normal text-slate-400">MITS</span>
            </div>
          </div>
          <span className="text-slate-700 hidden sm:inline">·</span>
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Intel Stars</span>
            <span className="text-xl font-bold text-cyan-400 tabular-nums">{profile.intel} INTEL</span>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-[#0f1418] rounded-xl border border-[#232c32] overflow-x-auto text-xs font-mono">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-lg font-bold transition-colors whitespace-nowrap ${
            activeCategory === 'all'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Featured Depot (All Items)
        </button>
        <button
          onClick={() => setActiveCategory('skins')}
          className={`px-4 py-2 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeCategory === 'skins'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Cosmetic Skins ({SKINS_CATALOG.length})</span>
        </button>
        <button
          onClick={() => setActiveCategory('units')}
          className={`px-4 py-2 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeCategory === 'units'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Combat Units ({purchasableUnitCodes.length})</span>
        </button>
        <button
          onClick={() => setActiveCategory('theaters')}
          className={`px-4 py-2 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeCategory === 'theaters'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Theater Authorizations ({CAMPAIGN_BRANCHES.length})</span>
        </button>
      </div>

      {/* SKINS SECTION */}
      {(activeCategory === 'all' || activeCategory === 'skins') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#1f282e] pb-2">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                Camouflage Liveries & Historic Skins
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {profile.unlockedSkins.length} / {SKINS_CATALOG.length} Owned
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {SKINS_CATALOG.map((skin) => {
              const isOwned = profile.unlockedSkins.includes(skin.id);
              const isActive = profile.activeSkin === skin.id;
              const canAfford = profile.mits >= skin.costMits;

              return (
                <div
                  key={skin.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isActive
                      ? 'border-amber-400 bg-[#161d21] shadow-lg shadow-amber-950/20'
                      : isOwned
                      ? 'border-[#232c32] bg-[#12181c]'
                      : 'border-[#1b2226] bg-[#0c1012] opacity-90'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border border-white/20 shadow-inner"
                          style={{ backgroundColor: skin.accentColor }}
                        />
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          {skin.camoStyle}
                        </span>
                      </div>
                      {isActive ? (
                        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded">
                          EQUIPPED
                        </span>
                      ) : isOwned ? (
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                          OWNED
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold text-amber-400">
                          {skin.costMits} MITS
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-100 text-sm mb-1">{skin.name}</h3>

                    {/* Visual Preview on Tank and Infantry */}
                    <div className="mb-2.5 p-2.5 bg-[#080b0d] rounded-xl border border-[#1d252b] flex items-center justify-around gap-2">
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

                    <p className="text-xs text-slate-300 leading-relaxed mb-2 line-clamp-2">
                      {skin.description}
                    </p>
                    <div className="text-[10px] font-mono text-amber-400/90 bg-[#080b0d] p-1.5 rounded border border-[#1b2226]">
                      ★ {skin.tagline}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1e262c] flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {skin.costMits === 0 ? 'FREE' : `${skin.costMits} Mits`}
                    </span>
                    {isActive ? (
                      <button
                        disabled
                        className="py-1.5 px-3 rounded-lg text-xs font-mono font-bold bg-[#1b252a] text-amber-400 border border-amber-500/30 cursor-default"
                      >
                        Active Skin
                      </button>
                    ) : isOwned ? (
                      <button
                        onClick={() => {
                          AudioService.play('equip');
                          onEquipSkin && onEquipSkin(skin.id);
                        }}
                        className="py-1.5 px-3 rounded-lg text-xs font-mono font-bold bg-[#182227] hover:bg-[#202e35] text-slate-200 border border-[#2c373e] transition-colors cursor-pointer"
                      >
                        Equip Skin
                      </button>
                    ) : (
                      <button
                        disabled={!canAfford}
                        onClick={() => {
                          AudioService.play('purchase');
                          onBuySkin(skin.id, skin.costMits);
                        }}
                        className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transform active:scale-95'
                            : 'bg-[#1b2226] text-slate-500 cursor-not-allowed border border-[#2a343a]'
                        }`}
                      >
                        Purchase Skin
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* COMBAT UNITS SECTION */}
      {(activeCategory === 'all' || activeCategory === 'units') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#1f282e] pb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                Combat Units Requisition
              </h2>
            </div>
            <button
              onClick={onGoToArmory}
              className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>View Quests & Armory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {purchasableUnitCodes.map((code) => {
              const bp = UNIT_BLUEPRINTS[code];
              const isUnlocked = profile.unlockedUnits.includes(code);
              const isStarter = STARTER_UNITS.includes(code);
              const mitsPrice = bp.mitsCost || 300;
              const canAfford = profile.mits >= mitsPrice;

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
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                        Tier {bp.tier || 1} · {code}
                      </span>
                      {isUnlocked ? (
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                          AVAILABLE
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold text-amber-400">
                          {mitsPrice} MITS
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-100 text-sm">{bp.n}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {bp.description || 'Frontline tactical combat unit.'}
                    </p>

                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#1b2327] text-[10px] font-mono text-slate-400">
                      <span className="text-emerald-400 font-bold">{bp.hp} HP</span>
                      <span>·</span>
                      <span className="text-cyan-400 font-bold">{bp.mv} Move</span>
                      <span>·</span>
                      <span className="text-amber-400 font-bold">{bp.c} Gold Deploy</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1e262c] flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {isStarter ? 'Starter Unit' : `${mitsPrice} Mits`}
                    </span>
                    {isUnlocked ? (
                      <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ready in Field
                      </span>
                    ) : (
                      <button
                        disabled={!canAfford}
                        onClick={() => onBuyUnit(code, mitsPrice)}
                        className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition-all ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                            : 'bg-[#1b2226] text-slate-500 cursor-not-allowed border border-[#2a343a]'
                        }`}
                      >
                        Requisition Unit
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* THEATER OPERATIONS SECTION */}
      {(activeCategory === 'all' || activeCategory === 'theaters') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#1f282e] pb-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                Theater Operation Clearance Passes
              </h2>
            </div>
            <button
              onClick={onGoToCampaign}
              className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>View Campaign Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CAMPAIGN_BRANCHES.map((branch) => {
              const isUnlocked = profile.unlockedBranches.includes(branch.id);
              const canAfford = profile.mits >= branch.unlockCostMits;

              return (
                <div
                  key={branch.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isUnlocked
                      ? 'border-[#232c32] bg-[#12181c]'
                      : 'border-[#1b2226] bg-[#0c1012] opacity-85'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                        Chapter {branch.number} · {branch.codename}
                      </span>
                      {isUnlocked ? (
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                          AUTHORIZED
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold text-amber-400">
                          {branch.unlockCostMits} MITS
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-100 text-sm mb-1">{branch.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">
                      {branch.description}
                    </p>
                    <div className="text-[10px] font-mono text-slate-400">
                      {branch.missionIds.length} Operations · {branch.theaterTheme} Theater
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1e262c] flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {branch.unlockCostMits === 0 ? 'FREE' : `${branch.unlockCostMits} Mits`}
                    </span>
                    {isUnlocked ? (
                      <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Unlocked
                      </span>
                    ) : (
                      <button
                        disabled={!canAfford}
                        onClick={() => onUnlockBranch(branch.id, branch.unlockCostMits)}
                        className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition-all ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                            : 'bg-[#1b2226] text-slate-500 cursor-not-allowed border border-[#2a343a]'
                        }`}
                      >
                        Authorize Theater
                      </button>
                    )}
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
