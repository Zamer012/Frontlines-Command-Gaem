import React, { useRef, useEffect } from 'react';
import { PlacedUnit, UnitBlueprint, UnitAbility } from '../types/game';
import { GameEngine } from '../game/engine';
import { FACTION_COLORS, NEUTRAL_COLOR } from '../data/skins';
import { render2DUnit } from './Unit2DRenderer';
import { AudioService } from '../services/audio';
import {
  Footprints,
  Flag,
  Crosshair,
  Zap,
  X,
  Truck,
  Heart,
  Wrench,
  Sparkles,
  Package,
} from 'lucide-react';

interface TacticalUnitModalProps {
  unit: PlacedUnit;
  engine: GameEngine;
  onMoveClick: () => void;
  onSelectAbility: (index: number) => void;
  onCapture: (building: PlacedUnit) => void;
  onToggleGroundAim: () => void;
  onClose: () => void;
  disabled?: boolean;
}

export const TacticalUnitModal: React.FC<TacticalUnitModalProps> = ({
  unit,
  engine,
  onMoveClick,
  onSelectAbility,
  onCapture,
  onToggleGroundAim,
  onClose,
  disabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bp = engine.getBlueprint(unit.t);
  const canMove = engine.canUnitMove(unit);
  const canAct = engine.canUnitAct(unit);
  const capturables = engine.getCapturableBuildings(unit);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2 + 6);
    const s = 'JHOWBMAL'.includes(unit.t) ? 0.8 : 0.95;
    ctx.scale(s, s);
    const col = unit.o >= 0 ? FACTION_COLORS[unit.o] : NEUTRAL_COLOR;
    render2DUnit(ctx, unit.t, col, performance.now(), 0, 0, engine.getFactionSkin(unit.o));
    ctx.restore();
  }, [unit, engine]);

  const getAbilityDesc = (ab: UnitAbility) => {
    if (ab.f.includes('c')) return 'Embark adjacent infantry into carrier';
    if (ab.f.includes('uo')) return 'Deploy carried infantry onto empty tile';
    if (ab.f.includes('sp')) return 'Fabricate new squad on adjacent tile';
    if (ab.f.includes('h')) return 'Restores +2 HP, Fuel, and Ammunition';
    if (ab.f.includes('j')) return 'Freezes enemy mechanical systems';
    if (ab.f.includes('r')) return `Heals & Repairs +${ab.d} HP`;
    return `${ab.d} Firepower Damage`;
  };

  const getAbilityFlags = (ab: UnitAbility) => {
    return [
      ab.f.includes('c') && 'Carry Unit',
      ab.f.includes('uo') && 'Unload Cargo',
      ab.f.includes('sp') && 'Spawner',
      ab.f.includes('i') && 'Indirect',
      ab.f.includes('d') && 'Diagonal',
      ab.f.includes('s') && 'Splash Area',
      ab.f.includes('a') && '+2 vs Vehicles',
      ab.f.includes('b') && !ab.f.includes('r') && '2x vs Structures',
      ab.f.includes('u') && 'Pins Target',
      ab.f.includes('x') && 'Kamikaze',
      ab.cd && `${ab.cd}-Turn Cooldown`,
    ]
      .filter(Boolean)
      .join(' · ');
  };

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center p-3 sm:p-4 animate-in fade-in zoom-in-95 duration-150">
      <div className="pointer-events-auto bg-[#13191d]/95 backdrop-blur-md border border-[#2d373e] rounded-2xl shadow-2xl p-4 sm:p-5 max-w-sm w-full text-slate-200 font-sans border-t-2 border-t-amber-400">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#232c32] pb-3 mb-3">
          <div className="flex items-center gap-3">
            <canvas
              ref={canvasRef}
              width={56}
              height={42}
              className="bg-[#0b0e10] rounded-lg border border-[#232c32]"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">{bp.n}</h3>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                  Tier {bp.tier || 1}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {canMove ? 'Move Ready' : 'Movement Spent'} · {canAct ? 'Weapons Ready' : 'Action Spent'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              AudioService.play('click');
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hull / Fuel / Ammo Stats */}
        <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-[#0b0f12] border border-[#232c32] text-xs font-mono text-center mb-3">
          <div>
            <span className="text-[10px] text-slate-400 block mb-0.5">HULL</span>
            <span className="font-bold text-emerald-400 tabular-nums">
              {unit.hp} / {unit.maxHp}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block mb-0.5">FUEL</span>
            <span className="font-bold text-amber-400 tabular-nums">
              {unit.fu != null ? `${unit.fu}/${unit.maxFu}` : 'INF'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block mb-0.5">AMMO</span>
            <span className="font-bold text-cyan-400 tabular-nums">
              {unit.am != null ? `${unit.am}/${unit.maxAm}` : 'INF'}
            </span>
          </div>
        </div>

        {/* Cargo notification */}
        {unit.cargo && (
          <div className="mb-3 p-2.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-xs font-mono text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span>Carrying: {engine.getBlueprint(unit.cargo.t).n}</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">{unit.cargo.hp} HP</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="space-y-2 mb-3">
          {/* Move Button */}
          <button
            disabled={disabled || !canMove}
            onClick={() => {
              AudioService.play('mv');
              onMoveClick();
              onClose();
            }}
            className={`w-full py-2.5 px-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-between transition-all ${
              canMove
                ? 'bg-[#1b262d] hover:bg-[#23323b] text-cyan-300 border border-cyan-500/40 shadow-md cursor-pointer'
                : 'bg-[#111619] text-slate-500 border border-[#232c32] opacity-50 cursor-not-allowed'
            }`}
          >
            <span className="flex items-center gap-2">
              <Footprints className="w-4 h-4 text-cyan-400" />
              <span>Move Unit (Reach: {engine.getMoveReach(unit)} tiles)</span>
            </span>
            <span className="text-[10px] font-mono font-normal text-slate-400">Tap Blue Tile</span>
          </button>

          {/* Capture Buildings */}
          {capturables.map((b) => (
            <button
              key={b.id}
              disabled={disabled || !!unit.acted}
              onClick={() => {
                AudioService.play('cap');
                onCapture(b);
                onClose();
              }}
              className="w-full py-2.5 px-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-950/30 animate-pulse cursor-pointer"
            >
              <Flag className="w-4 h-4" />
              <span>Capture {engine.getBlueprint(b.t).n}!</span>
            </button>
          ))}
        </div>

        {/* Weapon & Abilities */}
        {bp.ab.length > 0 && (
          <div className="space-y-1.5 border-t border-[#232c32] pt-3">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
              <span>ARM WEAPON / ABILITY</span>
              <span>DAMAGE · RANGE</span>
            </div>

            {bp.ab.length > 2 && (
              <div className="flex items-center justify-between px-2 py-1 bg-cyan-500/15 border border-cyan-500/40 rounded-lg text-[10px] font-mono text-cyan-300">
                <span className="font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span>Dual Attack Unit (Attacks twice/turn)</span>
                </span>
                <span className="font-bold bg-cyan-900/60 px-1.5 py-0.5 rounded text-cyan-200">
                  {Math.max(0, 2 - (unit.attacksThisTurn || 0))} Left
                </span>
              </div>
            )}

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
              {bp.ab.map((ab, idx) => {
                const isSelected = (unit.ai || 0) === idx;
                const canAfford = engine.canAffordAbility(unit, ab, idx);
                const abilityAmmo = unit.abAmmo ? unit.abAmmo[idx] : unit.am;
                const maxAbilityAmmo = unit.maxAbAmmo ? unit.maxAbAmmo[idx] : unit.maxAm;
                return (
                  <button
                    key={idx}
                    disabled={disabled || !canAfford || !canAct}
                    onClick={() => {
                      AudioService.play('sel');
                      onSelectAbility(idx);
                      onClose();
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs flex flex-col gap-1 ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/15 text-amber-300 shadow-md shadow-amber-950/20'
                        : 'border-[#232c32] hover:border-[#384650] bg-[#0c1012] text-slate-300'
                    } ${!canAfford || !canAct ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        {ab.f.includes('c') ? (
                          <Truck className="w-3.5 h-3.5 text-cyan-400" />
                        ) : ab.f.includes('uo') ? (
                          <Footprints className="w-3.5 h-3.5 text-emerald-400" />
                        ) : ab.f.includes('sp') ? (
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        ) : ab.f.includes('r') || ab.f.includes('h') ? (
                          <Heart className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span>{ab.n}</span>
                      </span>
                      <span className="font-mono text-xs text-amber-400">
                        {ab.d > 0 ? `${ab.d} DMG` : 'SUPPORT'} · R{ab.rg}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{getAbilityDesc(ab)}</span>
                      {abilityAmmo != null && abilityAmmo < 90 ? (
                        <span className="text-cyan-400 font-bold bg-cyan-950/50 border border-cyan-900 px-1.5 py-0.2 rounded">
                          Ammo: {abilityAmmo}/{maxAbilityAmmo}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono">∞ Ammo</span>
                      )}
                    </div>

                    {getAbilityFlags(ab) && (
                      <span className="text-[10px] text-cyan-400/90 font-mono mt-0.5">
                        {getAbilityFlags(ab)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 pt-2.5 border-t border-[#232c32] flex items-center justify-between">
          <button
            disabled={disabled || !canAct}
            onClick={() => {
              AudioService.play('radar');
              onToggleGroundAim();
            }}
            className={`text-xs font-mono py-1.5 px-3 rounded-lg border flex items-center gap-2 transition-colors cursor-pointer ${
              unit.gm
                ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                : 'border-[#28333a] hover:bg-[#182126] text-slate-400'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Target Ground Tile: {unit.gm ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => {
              AudioService.play('click');
              onClose();
            }}
            className="text-xs font-mono text-slate-400 hover:text-slate-200 py-1.5 px-2 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
