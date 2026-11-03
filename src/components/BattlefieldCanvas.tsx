import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameEngine } from '../game/engine';
import { FACTION_COLORS, NEUTRAL_COLOR, SKINS_CATALOG } from '../data/skins';
import { isAirUnit } from '../data/units';
import { render2DUnit } from './Unit2DRenderer';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Lock,
  Unlock,
  Crosshair,
  Compass,
  Radar,
  Move,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Shrink,
} from 'lucide-react';

interface BattlefieldCanvasProps {
  engine: GameEngine;
  onTileClick: (x: number, y: number) => void;
  graphicsQuality: number; // 1 to 8
  screenShake?: boolean;
}

export const BattlefieldCanvas: React.FC<BattlefieldCanvasProps> = ({
  engine,
  onTileClick,
  graphicsQuality,
  screenShake = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cacheCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoverTile, setHoverTile] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDpad, setShowDpad] = useState(true);
  const [screenLock, setScreenLock] = useState(false);

  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const isPointerDown = useRef(false);
  const hasMoved = useRef(false);
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartZoom = useRef(1);

  // High-DPI Resolution Multiplier according to Graphics Quality
  const getQualityMultiplier = useCallback(() => {
    if (graphicsQuality <= 2) return 1;
    if (graphicsQuality <= 4) return 1.25;
    if (graphicsQuality <= 6) return 1.5;
    return Math.min(window.devicePixelRatio || 2, 2);
  }, [graphicsQuality]);

  // Pre-render terrain grid cache
  const generateTerrainCache = useCallback(
    (N: number, C: number) => {
      if (!cacheCanvasRef.current) {
        cacheCanvasRef.current = document.createElement('canvas');
      }
      const cache = cacheCanvasRef.current;
      const size = N * C;
      cache.width = cache.height = size;
      const ctx = cache.getContext('2d');
      if (!ctx) return;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          const tile = engine.ob[y]?.[x] || 0;
          const px = x * C;
          const py = y * C;
          const cx = px + C / 2;
          const cy = py + C / 2;

          // Base ground
          ctx.fillStyle = (x + y) % 2 ? '#212724' : '#1c221f';
          ctx.fillRect(px, py, C, C);
          ctx.strokeStyle = 'rgba(212, 217, 211, 0.05)';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, C, C);

          // Render Tile Varieties
          switch (tile) {
            case 1: {
              // Boulders / Rocky Crags
              ctx.beginPath();
              ctx.moveTo(cx - 15, cy + 9);
              ctx.lineTo(cx - 10, cy - 10);
              ctx.lineTo(cx + 4, cy - 14);
              ctx.lineTo(cx + 16, cy - 2);
              ctx.lineTo(cx + 12, cy + 11);
              ctx.closePath();
              ctx.fillStyle = '#171c19';
              ctx.fill();
              ctx.strokeStyle = '#4a574f';
              ctx.lineWidth = 1.5;
              ctx.stroke();
              break;
            }
            case 2: {
              // Concrete Ruins
              ctx.beginPath();
              ctx.moveTo(cx - 18, cy + 13);
              ctx.lineTo(cx - 6, cy - 13);
              ctx.lineTo(cx + 2, cy - 2);
              ctx.lineTo(cx + 10, cy - 10);
              ctx.lineTo(cx + 20, cy + 13);
              ctx.closePath();
              ctx.fillStyle = '#141816';
              ctx.fill();
              ctx.strokeStyle = '#5f6b64';
              ctx.lineWidth = 1.5;
              ctx.stroke();
              break;
            }
            case 3: {
              // Water / River
              const grad = ctx.createLinearGradient(px, py, px + C, py + C);
              grad.addColorStop(0, '#0d2838');
              grad.addColorStop(0.5, '#091c28');
              grad.addColorStop(1, '#061520');
              ctx.fillStyle = grad;
              ctx.fillRect(px, py, C, C);
              ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
              ctx.lineWidth = 1;
              ctx.strokeRect(px + 0.5, py + 0.5, C - 1, C - 1);
              break;
            }
            case 4: {
              // Mud / Trenches
              ctx.fillStyle = '#261e18';
              ctx.fillRect(px, py, C, C);
              ctx.strokeStyle = '#453528';
              ctx.lineWidth = 2;
              // Duckboards
              ctx.strokeRect(px + 6, py + 12, C - 12, C - 24);
              for (let b = px + 10; b <= px + C - 10; b += 6) {
                ctx.beginPath();
                ctx.moveTo(b, py + 12);
                ctx.lineTo(b, py + C - 12);
                ctx.stroke();
              }
              break;
            }
            case 5: {
              // Dense Forest / Jungle
              ctx.fillStyle = '#17241c';
              ctx.fillRect(px, py, C, C);
              ctx.fillStyle = '#223829';
              ctx.beginPath();
              ctx.arc(cx - 6, cy - 4, 10, 0, Math.PI * 2);
              ctx.arc(cx + 6, cy - 2, 9, 0, Math.PI * 2);
              ctx.arc(cx, cy + 6, 11, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#2d4734';
              ctx.lineWidth = 1.5;
              ctx.stroke();
              break;
            }
            case 6: {
              // Bridge over water
              const waterGrad = ctx.createLinearGradient(px, py, px + C, py + C);
              waterGrad.addColorStop(0, '#0d2838');
              waterGrad.addColorStop(1, '#061520');
              ctx.fillStyle = waterGrad;
              ctx.fillRect(px, py, C, C);

              // Bridge planks
              ctx.fillStyle = '#5c4d3c';
              ctx.fillRect(px + 4, py + 6, C - 8, C - 12);
              ctx.strokeStyle = '#8a7761';
              ctx.lineWidth = 1.5;
              ctx.strokeRect(px + 4, py + 6, C - 8, C - 12);
              // Planks lines
              for (let pl = py + 10; pl < py + C - 8; pl += 6) {
                ctx.beginPath();
                ctx.moveTo(px + 4, pl);
                ctx.lineTo(px + C - 4, pl);
                ctx.stroke();
              }
              break;
            }
            case 7: {
              // Volcanic Magma Vent / Lava
              const lavaGrad = ctx.createLinearGradient(px, py, px + C, py + C);
              lavaGrad.addColorStop(0, '#7f1d1d');
              lavaGrad.addColorStop(0.5, '#ea580c');
              lavaGrad.addColorStop(1, '#450a0a');
              ctx.fillStyle = lavaGrad;
              ctx.fillRect(px, py, C, C);
              ctx.strokeStyle = '#f97316';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(cx - 14, cy + 8);
              ctx.lineTo(cx, cy - 10);
              ctx.lineTo(cx + 14, cy + 8);
              ctx.stroke();
              break;
            }
          }
        }
      }

      // Grid coordinate labels
      ctx.font = `${N > 15 ? 12 : 10}px JetBrains Mono, monospace`;
      ctx.fillStyle = 'rgba(212, 217, 211, 0.35)';
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcd';
      for (let i = 0; i < N; i++) {
        ctx.fillText(letters[i] || `${i + 1}`, i * C + C / 2, 9);
        ctx.fillText(`${i + 1}`, 9, i * C + C / 2);
      }
    },
    [engine.ob]
  );

  useEffect(() => {
    generateTerrainCache(engine.N, engine.C);
  }, [engine.N, engine.C, engine.ob, generateTerrainCache]);

  // Main Render Loop with Multi-Tier Graphics System
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;

    const render = () => {
      const { N, C } = engine;
      const baseSize = N * C;

      if (canvas.width !== baseSize || canvas.height !== baseSize) {
        canvas.width = canvas.height = baseSize;
      }

      const now = performance.now();
      const vis = engine.getVisibilityMap(engine.view);

      ctx.clearRect(0, 0, baseSize, baseSize);
      ctx.save();

      // Screen Shake
      if (engine.shake > 0.4 && screenShake) {
        ctx.translate((Math.random() - 0.5) * engine.shake, (Math.random() - 0.5) * engine.shake);
        engine.shake *= 0.9;
      }

      // Draw Terrain from Cache
      if (cacheCanvasRef.current) {
        ctx.drawImage(cacheCanvasRef.current, 0, 0);
      }

      // Animated Water & Magma Waves (on quality >= 4)
      if (graphicsQuality >= 4) {
        for (let y = 0; y < N; y++) {
          for (let x = 0; x < N; x++) {
            const tile = engine.ob[y]?.[x];
            if (vis[y * N + x]) {
              const cx = x * C + C / 2;
              const cy = y * C + C / 2;

              if (tile === 3) {
                // Water ripples
                const wav1 = Math.sin(now / 550 + x * 1.7 + y * 2.1) * 3;
                const wav2 = Math.cos(now / 750 + x * 1.1 + y * 1.6) * 2.5;
                ctx.save();
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(cx - 8, cy - 6 + wav1, 6, 0.2, Math.PI - 0.2);
                ctx.stroke();
                ctx.strokeStyle = 'rgba(125, 211, 252, 0.25)';
                ctx.beginPath();
                ctx.arc(cx + 6, cy + 8 + wav2, 8, 0.2, Math.PI - 0.2);
                ctx.stroke();
                ctx.restore();
              } else if (tile === 7) {
                // Magma pulse
                const pulse = 0.5 + 0.5 * Math.sin(now / 300 + x * 2);
                ctx.save();
                ctx.fillStyle = `rgba(249, 115, 22, ${0.15 + pulse * 0.2})`;
                ctx.beginPath();
                ctx.arc(cx, cy, 14, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
              }
            }
          }
        }
      }

      // Scorch Marks
      engine.scorch.forEach((sc) => {
        if (vis[sc.y * N + sc.x]) {
          ctx.globalAlpha = sc.a;
          ctx.fillStyle = '#080a09';
          ctx.beginPath();
          ctx.ellipse((sc.x + 0.5) * C, (sc.y + 0.5) * C + 6, sc.r, sc.r * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      });

      // Highlight Helper
      const drawTileBox = (col: string, tx: number, ty: number, alpha: number, dashed: boolean = false) => {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = col;
        ctx.fillRect(tx * C + 1, ty * C + 1, C - 2, C - 2);
        ctx.globalAlpha = Math.min(1, alpha + 0.4);
        ctx.strokeStyle = col;
        ctx.lineWidth = 1;
        if (dashed) ctx.setLineDash([4, 3]);
        ctx.strokeRect(tx * C + 1.5, ty * C + 1.5, C - 3, C - 3);
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      };

      const drawReticleCorners = (tx: number, ty: number, col: string) => {
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const corners = [
          [tx * C + 3, ty * C + 3, 1, 1],
          [(tx + 1) * C - 3, ty * C + 3, -1, 1],
          [tx * C + 3, (ty + 1) * C - 3, 1, -1],
          [(tx + 1) * C - 3, (ty + 1) * C - 3, -1, -1],
        ];
        for (const [cx, cy, sx, sy] of corners) {
          ctx.moveTo(cx + sx * 7, cy);
          ctx.lineTo(cx, cy);
          ctx.lineTo(cx, cy + sy * 7);
        }
        ctx.stroke();
      };

      // Draw Move / Range / Deploy Highlights
      engine.hl.m.forEach((node) => drawTileBox('#38bdf8', node.x, node.y, 0.22));
      engine.hl.r.forEach(([rx, ry]) => drawTileBox('#f87171', rx, ry, 0.15));
      engine.hl.s.forEach(([sx, sy]) => drawTileBox('#d3a85a', sx, sy, 0.3, true));
      engine.hl.unloadTiles.forEach(([ux, uy]) => {
        drawTileBox('#22c55e', ux, uy, 0.28, true);
        drawReticleCorners(ux, uy, '#22c55e');
      });

      engine.hl.t.forEach((tgt) => {
        drawTileBox('#f87171', tgt.x, tgt.y, 0.25 + 0.12 * Math.sin(now / 180));
        drawReticleCorners(tgt.x, tgt.y, '#fca5a5');
      });
      engine.hl.c.forEach((cap) => {
        drawTileBox('#facc15', cap.x, cap.y, 0.24 + 0.12 * Math.sin(now / 180));
        drawReticleCorners(cap.x, cap.y, '#facc15');
      });

      // Fog of War Shroud
      if (!engine.fogOff) {
        ctx.fillStyle = 'rgba(7, 9, 11, 0.78)';
        ctx.beginPath();
        for (let y = 0; y < N; y++) {
          for (let x = 0; x < N; x++) {
            if (!vis[y * N + x]) {
              ctx.rect(x * C, y * C, C, C);
            }
          }
        }
        ctx.fill();
      }

      // Draw Units (Sorted by Y for depth layering)
      const sortedUnits = [...engine.U].sort((a, b) => {
        const aAir = isAirUnit(a.t) ? 9 : 0;
        const bAir = isAirUnit(b.t) ? 9 : 0;
        return a.ry - b.ry + aAir - bAir;
      });

      sortedUnits.forEach((u) => {
        const bp = engine.getBlueprint(u.t);
        const isVisible = vis[Math.round(u.ry) * N + Math.round(u.rx)] || u.o === engine.view;
        if (!isVisible && !(bp.bl && u.t !== 'H')) return;

        const isAir = isAirUnit(u.t);
        const isFriendly = u.o === engine.view;
        const isHit = now - (u.fl || 0) < 250;
        const drawX = (u.rx + 0.5) * C + (u.wx || 0) + (isHit ? (Math.random() - 0.5) * 5 : 0);
        const drawY = (u.ry + 0.5) * C;
        const skinId = engine.getFactionSkin(u.o);

        let color = isVisible && u.o >= 0 ? FACTION_COLORS[u.o] : NEUTRAL_COLOR;
        if (isVisible && skinId && skinId !== 'skin_default') {
          const skin = SKINS_CATALOG.find((s) => s.id === skinId);
          if (skin?.accentColor) color = skin.accentColor;
        } else if (isVisible && u.o === 0 && skinId) {
          const skin = SKINS_CATALOG.find((s) => s.id === skinId);
          if (skin?.accentColor) color = skin.accentColor;
        }

        const isExhausted =
          u.o === engine.cur &&
          isFriendly &&
          !bp.bl &&
          !engine.canUnitMove(u) &&
          !engine.canUnitAct(u) &&
          !engine.getCapturableBuildings(u).length;

        const unitYOffset = drawY - (isAir ? 10 : 0) - 2;
        u.rc = (u.rc || 0) * 0.9;

        // Shadow under unit
        ctx.globalAlpha = isVisible ? 0.45 : 0.2;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(
          drawX + (isAir ? 8 : 0),
          drawY + 16 + (isAir ? 8 : 0),
          bp.bl ? 26 : isAir ? 13 : 19,
          isAir ? 4 : 6,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Selection ring
        ctx.strokeStyle = color;
        ctx.lineWidth = isFriendly ? 2.5 : 1.5;
        ctx.setLineDash(isFriendly || u.o < 0 ? [] : [5, 3]);
        ctx.beginPath();
        ctx.ellipse(drawX, drawY + 15, bp.bl ? 27 : 21, bp.bl ? 9 : 7, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        if (u === engine.sel) {
          const puls = Math.sin(now / 150);
          ctx.globalAlpha = 0.6 + 0.3 * puls;
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.ellipse(drawX, drawY + 15, (bp.bl ? 32 : 26) + puls * 2, (bp.bl ? 12 : 10) + puls, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Draw 2D Unit Sprite
        ctx.save();
        ctx.translate(drawX, unitYOffset);
        const scaleVal = u.t === 'H' ? 1.15 : 1;
        ctx.scale((bp.bl ? 1 : u.dr || 1) * scaleVal, scaleVal);
        ctx.globalAlpha = (isExhausted ? 0.55 : 1) * (isVisible ? 1 : 0.45);

        render2DUnit(ctx, u.t, color, now + (u.ph || 0), u.mw || 0, u.rc || 0, skinId);
        ctx.restore();

        // Flash white on hit
        if (isHit) {
          ctx.globalAlpha = 0.7 * (1 - (now - (u.fl || 0)) / 250);
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.ellipse(drawX, unitYOffset, 19, 17, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Carried Cargo indicator
        if (u.cargo) {
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(drawX + 16, drawY - 14, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // EMP Frozen indicator
        if (u.fz) {
          ctx.globalAlpha = 0.8;
          ctx.strokeStyle = '#7fc4d6';
          ctx.lineWidth = 1.5;
          for (let e = 0; e < 2; e++) {
            ctx.beginPath();
            ctx.moveTo(drawX - 16, unitYOffset - 12 + Math.random() * 24);
            ctx.lineTo(drawX + 16, unitYOffset - 12 + Math.random() * 24);
            ctx.stroke();
          }
          ctx.fillStyle = 'rgba(127, 196, 214, 0.25)';
          ctx.beginPath();
          ctx.ellipse(drawX, unitYOffset, 20, 18, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Health bar & status badges
        ctx.globalAlpha = 1;
        if (isVisible) {
          const hpRatio = u.hp / u.maxHp;
          const barY = drawY + 21;
          ctx.fillStyle = '#0b0e0f';
          ctx.fillRect(drawX - 18, barY, 36, 4);
          ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444';
          ctx.fillRect(drawX - 18, barY, 36 * Math.max(0, hpRatio), 4);

          ctx.font = '700 10px JetBrains Mono, monospace';
          if ((u.cd || 0) > 0 && u.o >= 0) {
            ctx.fillStyle = '#38bdf8';
            ctx.fillText(`CD${u.cd}`, drawX + 20, drawY - 20);
          }
          if (u.am === 0 || u.fu === 0) {
            ctx.fillStyle = '#f59e0b';
            ctx.fillText('!', drawX - 20, drawY - 20);
          }
        }
      });

      // FX Animations (Sparks, Rings, Projectiles)
      engine.fx.forEach((fx) => {
        if (fx.f === 'r') {
          if (vis[fx.y * N + fx.x]) {
            ctx.globalAlpha = 1 - fx.k;
            ctx.strokeStyle = fx.c;
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.arc((fx.x + 0.5) * C, (fx.y + 0.5) * C, fx.k * (fx.R || 70), 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        } else if (fx.f === 't') {
          ctx.fillStyle = fx.c;
          ctx.font = '700 20px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(fx.s || '', (fx.x + 0.5) * C, (fx.y + 0.2) * C - fx.k * 32);
        } else if (fx.seen) {
          const cx = (fx.x + 0.5) * C;
          const cy = (fx.y + 0.5) * C;
          if (fx.f === 'p') {
            ctx.strokeStyle = ctx.fillStyle = fx.c;
            if (fx.l) {
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(((fx.ox || 0) + 0.5) * C, ((fx.oy || 0) + 0.5) * C);
              ctx.lineTo(cx, cy);
              ctx.stroke();
            } else {
              ctx.beginPath();
              ctx.arc(cx, cy - (fx.h || 0), fx.r || 3, 0, Math.PI * 2);
              ctx.fill();
            }
          } else if (fx.big) {
            const prog = fx.k;
            const r = (0.3 + 0.7 * Math.sqrt(prog)) * 92;
            const alpha = 1 - prog;
            const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            g.addColorStop(0, `rgba(255, 255, 235, ${alpha})`);
            g.addColorStop(0.3, `rgba(255, 205, 90, ${0.95 * alpha})`);
            g.addColorStop(0.7, `rgba(240, 100, 30, ${0.6 * alpha})`);
            g.addColorStop(1, 'rgba(110, 30, 10, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.globalAlpha = 1 - fx.k;
            ctx.fillStyle = fx.c;
            ctx.beginPath();
            ctx.arc(cx, cy, fx.k * (fx.b ? 46 : 26), 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
      });

      // Particle update & render (scaled to graphicsQuality)
      const maxParticles = Math.round(60 + (Math.min(8, Math.max(1, graphicsQuality)) - 1) * 65);
      if (engine.pt.length > maxParticles) {
        engine.pt.splice(0, engine.pt.length - maxParticles);
      }
      engine.pt = engine.pt.filter((p) => p.l > 0);
      engine.pt.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy = p.vy * 0.96 + (p.gv || 0);
        p.l -= p.d;
        if (vis[p.gy * N + p.gx]) {
          ctx.globalAlpha = Math.max(0, p.l);
          ctx.fillStyle = p.c;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.s * p.l + 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;

      // Screen flash
      if (engine.flash > 0.02) {
        ctx.fillStyle = `rgba(255, 236, 190, ${engine.flash * 0.4})`;
        ctx.fillRect(0, 0, baseSize, baseSize);
        engine.flash *= 0.85;
      }

      ctx.restore();
      animFrame = requestAnimationFrame(render);
    };

    animFrame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrame);
  }, [engine, graphicsQuality, screenShake]);

  // Fit camera to window
  const fitToWindow = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;

    const baseSize = engine.N * engine.C;
    const pad = 48;
    const availW = Math.max(100, clientWidth - pad);
    const availH = Math.max(100, clientHeight - pad);
    const fitZoom = Math.min(1.8, Math.max(0.25, Math.min(availW / baseSize, availH / baseSize)));
    const offsetX = (clientWidth - baseSize * fitZoom) / 2;
    const offsetY = (clientHeight - baseSize * fitZoom) / 2;

    setZoom(+fitZoom.toFixed(2));
    setPan({ x: Math.round(offsetX), y: Math.round(offsetY) });
  }, [engine.N, engine.C]);

  // Center on selection or HQ
  const centerCamera = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const C = engine.C;
    let targetX = engine.N / 2;
    let targetY = engine.N / 2;

    if (engine.sel) {
      targetX = engine.sel.x + 0.5;
      targetY = engine.sel.y + 0.5;
    } else {
      const hq = engine.U.find((u) => u.t === 'H' && u.o === engine.cur);
      if (hq) {
        targetX = hq.x + 0.5;
        targetY = hq.y + 0.5;
      }
    }

    setPan({
      x: Math.round(clientWidth / 2 - targetX * C * zoom),
      y: Math.round(clientHeight / 2 - targetY * C * zoom),
    });
  }, [engine.sel, engine.U, engine.cur, engine.N, engine.C, zoom]);

  useEffect(() => {
    fitToWindow();
    const t = setTimeout(fitToWindow, 60);
    window.addEventListener('resize', fitToWindow);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', fitToWindow);
    };
  }, [engine.N, isFullscreen, fitToWindow]);

  // Zoom handlers
  const adjustZoom = (delta: number) => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const cx = clientWidth / 2;
    const cy = clientHeight / 2;

    setZoom((prev) => {
      const next = Math.min(2.5, Math.max(0.35, +(prev + delta).toFixed(2)));
      if (next === prev) return prev;
      setPan((p) => {
        const wx = (cx - p.x) / prev;
        const wy = (cy - p.y) / prev;
        return {
          x: Math.round(cx - wx * next),
          y: Math.round(cy - wy * next),
        };
      });
      return next;
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (screenLock || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.14 : 0.88;

    setZoom((prev) => {
      const next = Math.min(2.5, Math.max(0.35, +(prev * factor).toFixed(2)));
      if (next === prev) return prev;
      setPan((p) => {
        const wx = (mx - p.x) / prev;
        const wy = (my - p.y) / prev;
        return {
          x: Math.round(mx - wx * next),
          y: Math.round(my - wy * next),
        };
      });
      return next;
    });
  };

  // Dragging / Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 && e.button !== 1) return;
    isPointerDown.current = true;
    hasMoved.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { x: pan.x, y: pan.y };
    setIsDragging(!screenLock);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPointerDown.current) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      if (Math.hypot(dx, dy) > 4) hasMoved.current = true;
      if (!screenLock) {
        setPan({
          x: panStart.current.x + dx,
          y: panStart.current.y + dy,
        });
      }
    }
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const gx = Math.floor((mx / rect.width) * engine.N);
      const gy = Math.floor((my / rect.height) * engine.N);
      if (engine.inBounds(gx, gy)) {
        setHoverTile({ x: gx, y: gy });
      } else {
        setHoverTile(null);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if ((isPointerDown.current || screenLock) && (!hasMoved.current || screenLock) && e.button === 0 && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const gx = Math.floor((mx / rect.width) * engine.N);
      const gy = Math.floor((my / rect.height) * engine.N);
      if (engine.inBounds(gx, gy)) {
        onTileClick(gx, gy);
      }
    }
    isPointerDown.current = false;
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isPointerDown.current = true;
      hasMoved.current = false;
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStart.current = { x: pan.x, y: pan.y };
      setIsDragging(!screenLock);
    } else if (e.touches.length === 2 && !screenLock) {
      isPointerDown.current = false;
      hasMoved.current = true;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartDist.current = dist;
      pinchStartZoom.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isPointerDown.current) {
      const dx = e.touches[0].clientX - dragStart.current.x;
      const dy = e.touches[0].clientY - dragStart.current.y;
      if (Math.hypot(dx, dy) > 5) hasMoved.current = true;
      if (!screenLock) {
        setPan({
          x: panStart.current.x + dx,
          y: panStart.current.y + dy,
        });
      }
    } else if (e.touches.length === 2 && pinchStartDist.current && !screenLock) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / pinchStartDist.current;
      const nextZoom = Math.min(2.5, Math.max(0.35, +(pinchStartZoom.current * ratio).toFixed(2)));
      setZoom(nextZoom);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches.length === 1 && (!hasMoved.current || screenLock) && canvasRef.current) {
      const touch = e.changedTouches[0];
      const rect = canvasRef.current.getBoundingClientRect();
      const mx = touch.clientX - rect.left;
      const my = touch.clientY - rect.top;
      const gx = Math.floor((mx / rect.width) * engine.N);
      const gy = Math.floor((my / rect.height) * engine.N);
      if (engine.inBounds(gx, gy)) {
        onTileClick(gx, gy);
      }
    }
    isPointerDown.current = false;
    pinchStartDist.current = null;
    setIsDragging(false);
  };

  const panDelta = (dx: number, dy: number) => {
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const resetZoom100 = () => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    setZoom(1);
    setPan({
      x: Math.round((clientWidth - totalSize) / 2),
      y: Math.round((clientHeight - totalSize) / 2),
    });
  };

  const handleRadarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const rx = (e.clientX - rect.left) / rect.width;
    const ry = (e.clientY - rect.top) / rect.height;
    const tx = Math.floor(rx * engine.N);
    const ty = Math.floor(ry * engine.N);
    const { clientWidth, clientHeight } = containerRef.current;
    setPan({
      x: Math.round(clientWidth / 2 - (tx + 0.5) * engine.C * zoom),
      y: Math.round(clientHeight / 2 - (ty + 0.5) * engine.C * zoom),
    });
  };

  const totalSize = engine.N * engine.C;

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col rounded-2xl bg-[#0b0f13] border border-[#232c32] shadow-2xl overflow-hidden select-none transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none border-0'
          : 'w-full h-[76vh] md:h-[82vh] min-h-[640px]'
      }`}
    >
      {/* Top Floating Control Dock */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 p-1 bg-[#141b20]/95 backdrop-blur-md rounded-xl border border-[#2d373e] shadow-xl">
        {/* Screen Lock Button */}
        <button
          onClick={() => setScreenLock((prev) => !prev)}
          className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-mono font-bold ${
            screenLock
              ? 'text-amber-300 bg-amber-500/20 border border-amber-500/40 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title={
            screenLock
              ? 'Screen Lock: ON (Map drag locked; tile taps & buttons active)'
              : 'Screen Lock: OFF (Mouse/touch drag to move map enabled)'
          }
          aria-label={screenLock ? 'Unlock map drag' : 'Lock map drag'}
        >
          {screenLock ? (
            <Lock className="w-4 h-4 text-amber-400" />
          ) : (
            <Unlock className="w-4 h-4" />
          )}
          <span className="hidden sm:inline text-[11px] font-mono">
            {screenLock ? 'LOCKED' : 'UNLOCKED'}
          </span>
        </button>

        <button
          onClick={() => adjustZoom(-0.15)}
          className="p-1.5 text-slate-300 rounded-lg transition-colors hover:text-white hover:bg-slate-800"
          title="Zoom Out (-)"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={resetZoom100}
          className="text-xs font-mono text-cyan-400 px-1.5 py-0.5 rounded transition-colors hover:text-cyan-300 hover:bg-slate-800"
          title="Reset Zoom to 100%"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          onClick={() => adjustZoom(0.15)}
          className="p-1.5 text-slate-300 rounded-lg transition-colors hover:text-white hover:bg-slate-800"
          title="Zoom In (+)"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-slate-700/60 mx-0.5" />

        <button
          onClick={centerCamera}
          className="p-1.5 text-cyan-400 rounded-lg transition-colors hover:text-white hover:bg-cyan-900/40"
          title="Center Camera on Active Unit / HQ"
          aria-label="Center camera"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        <button
          onClick={fitToWindow}
          className="p-1.5 text-slate-300 rounded-lg transition-colors hover:text-white hover:bg-slate-800"
          title="Fit Battlefield to Window"
          aria-label="Fit to window"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowDpad((prev) => !prev)}
          className={`p-1.5 rounded-lg transition-colors ${
            showDpad ? 'text-amber-400 bg-amber-950/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Toggle Maneuver D-Pad"
          aria-label="Toggle D-Pad"
        >
          <Compass className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsFullscreen((prev) => !prev)}
          className={`p-1.5 rounded-lg transition-colors ${
            isFullscreen ? 'text-cyan-400 bg-cyan-950/40' : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title={isFullscreen ? 'Exit Fullscreen' : 'Expand to Fullscreen'}
          aria-label="Toggle fullscreen"
        >
          {isFullscreen ? <Shrink className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Top Left: Tile Inspector HUD */}
      {hoverTile && (() => {
        const u = engine.unitAt(hoverTile.x, hoverTile.y);
        const tileType = engine.ob[hoverTile.y]?.[hoverTile.x];
        const isMove = engine.hl.m.has(`${hoverTile.x},${hoverTile.y}`);
        const isTarget = engine.hl.t.some((t) => t.x === hoverTile.x && t.y === hoverTile.y);
        const isDeploy = engine.hl.s.some(([sx, sy]) => sx === hoverTile.x && sy === hoverTile.y);

        let desc = `Grid ${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[hoverTile.x] || hoverTile.x + 1}${hoverTile.y + 1}`;
        let col = 'text-slate-300';

        if (u) {
          const bp = engine.getBlueprint(u.t);
          if (u.isDefendTarget) {
            desc = `★ DEFEND: ${u.customName || 'Allied Facility'} (${u.hp}/${u.maxHp} HP)`;
            col = 'text-blue-400 font-bold';
          } else if (u.isVip) {
            desc = `☠ VIP BOSS: ${u.customName || 'Prototype Titan'} (${u.hp}/${u.maxHp} HP)`;
            col = 'text-rose-400 font-bold';
          } else if (bp.bl) {
            const side = u.o === engine.cur ? 'Friendly' : u.o >= 0 ? 'Hostile' : 'Neutral';
            desc = `${side} ${bp.n} (${u.hp}/${u.maxHp} HP)`;
            col = u.o === engine.cur ? 'text-cyan-400' : u.o >= 0 ? 'text-red-400' : 'text-amber-400';
          } else {
            desc = `${u.o === engine.cur ? 'Friendly' : 'Hostile'} ${bp.n} · HP ${u.hp}/${u.maxHp} · Mv ${engine.getMoveReach(u)}`;
            col = u.o === engine.cur ? 'text-cyan-400' : 'text-red-400';
          }
        } else if (tileType) {
          switch (tileType) {
            case 1:
              desc = 'Rocky Boulders (Blocks line of sight & ground move)';
              col = 'text-amber-400';
              break;
            case 2:
              desc = 'Concrete Ruins (Blocks line of sight & direct fire)';
              col = 'text-amber-400';
              break;
            case 3:
              desc = 'Water River (Blocks armor; Air & Hovercraft can cross)';
              col = 'text-sky-400';
              break;
            case 4:
              desc = 'Mud / Trench (Slows ground vehicles, +1 Defense Cover)';
              col = 'text-amber-300';
              break;
            case 5:
              desc = 'Dense Forest (Blocks LoS through tile, high cover)';
              col = 'text-emerald-400';
              break;
            case 6:
              desc = 'Bridge Crossing (Ground vehicles & infantry can cross)';
              col = 'text-amber-200';
              break;
            case 7:
              desc = 'Magma / Lava Vent (Volcanic hazard)';
              col = 'text-red-400';
              break;
          }
        } else if (isTarget) {
          desc = 'Target in Weapon Range (Tap to Attack)';
          col = 'text-red-400 font-bold';
        } else if (isMove) {
          desc = 'Traversable Move Destination (Tap to Move)';
          col = 'text-cyan-400 font-bold';
        } else if (isDeploy) {
          desc = 'Deployment Zone (Tap to Place Unit)';
          col = 'text-amber-400 font-bold';
        }

        return (
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2 px-3 py-1.5 bg-[#141a1e]/95 backdrop-blur-md rounded-xl border border-[#2d373e] text-xs font-mono shadow-xl">
            <Crosshair className={`w-3.5 h-3.5 ${col}`} />
            <span className={`font-semibold ${col}`}>{desc}</span>
          </div>
        );
      })()}

      {/* Mini Radar */}
      <div
        onClick={handleRadarClick}
        className={`absolute bottom-3 left-3 z-20 bg-[#11171c]/90 backdrop-blur-md p-1.5 rounded-xl border border-[#2d3840] shadow-2xl group ${
          screenLock ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
        }`}
        title={screenLock ? 'Tactical Radar (Screen locked)' : 'Tactical Radar: Click to jump camera'}
      >
        <div className="relative w-20 h-20 bg-[#0d1216] rounded-lg overflow-hidden border border-[#1e272f]">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none" />
          {engine.U.map((u) => {
            const rx = ((u.x + 0.5) / engine.N) * 100;
            const ry = ((u.y + 0.5) / engine.N) * 100;
            const col = u.o >= 0 ? FACTION_COLORS[u.o] : '#eab308';
            return (
              <span
                key={u.id}
                style={{ left: `${rx}%`, top: `${ry}%`, backgroundColor: col }}
                className={`absolute w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                  u.t === 'H' ? 'ring-1 ring-white w-2 h-2 z-10' : ''
                }`}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-1 px-0.5 text-[9px] font-mono text-slate-400 group-hover:text-cyan-400">
          <span className="flex items-center gap-1">
            <Radar className="w-2.5 h-2.5 text-cyan-400" />
            <span>RADAR</span>
          </span>
          <span>
            {engine.N}x{engine.N}
          </span>
        </div>
      </div>

      {/* Maneuver D-Pad */}
      {showDpad && (
        <div className="absolute bottom-3 right-3 z-20 flex flex-col items-center bg-[#141b20]/95 backdrop-blur-md p-1.5 rounded-xl border border-[#2d373e] shadow-2xl">
          <button
            onClick={() => panDelta(0, 70)}
            className="p-1.5 text-slate-300 rounded transition-colors hover:text-cyan-400 hover:bg-slate-800"
            title="Pan Up"
            aria-label="Pan up"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => panDelta(70, 0)}
              className="p-1.5 text-slate-300 rounded transition-colors hover:text-cyan-400 hover:bg-slate-800"
              title="Pan Left"
              aria-label="Pan left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={centerCamera}
              className="p-1 text-cyan-400 rounded transition-colors hover:text-white hover:bg-cyan-900/40"
              title="Center on Selection"
              aria-label="Center camera"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => panDelta(-70, 0)}
              className="p-1.5 text-slate-300 rounded transition-colors hover:text-cyan-400 hover:bg-slate-800"
              title="Pan Right"
              aria-label="Pan right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => panDelta(0, -70)}
            className="p-1.5 text-slate-300 rounded transition-colors hover:text-cyan-400 hover:bg-slate-800"
            title="Pan Down"
            aria-label="Pan down"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Canvas Mount */}
      <div
        className={`w-full h-full relative overflow-hidden ${
          screenLock ? 'cursor-default' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        onMouseLeave={() => {
          setHoverTile(null);
          if (isPointerDown.current) {
            isPointerDown.current = false;
            setIsDragging(false);
          }
        }}
      >
        <div
          className="absolute will-change-transform"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: `${totalSize}px`,
            height: `${totalSize}px`,
          }}
        >
          <canvas
            ref={canvasRef}
            width={totalSize}
            height={totalSize}
            className="block rounded-lg shadow-2xl border border-[#202930]"
            style={{ width: `${totalSize}px`, height: `${totalSize}px` }}
          />
        </div>
      </div>
    </div>
  );
};
