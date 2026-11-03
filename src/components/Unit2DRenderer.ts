/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function render2DUnit(
  ctx: CanvasRenderingContext2D,
  unitCode: string,
  color: string,
  animTime: number,
  isMoving: number,
  recoil: number,
  skinId?: string
) {
  const sin = Math.sin;
  const cos = Math.cos;

  const walkCycle = isMoving ? animTime / 55 : 0;
  const idleBob = sin(animTime / 240) * (isMoving ? 1.4 : 0.9);
  const breath = sin(animTime / 230) * 2;

  // Skin Identifiers
  const isToySoldiers = skinId === 'skin_toy_soldiers';
  const isNapoleonicFrance = skinId === 'skin_napoleonic_france';
  const isNapoleonicBritain = skinId === 'skin_napoleonic_britain';
  const isImperialJapan = skinId === 'skin_imperial_japan';
  const isWw2Britain = skinId === 'skin_ww2_britain';
  const isWw2Germany = skinId === 'skin_ww2_germany';
  const isModernUsa = skinId === 'skin_modern_usa';
  const isGuP = skinId === 'skin_girls_und_panzer';
  const isNeko = skinId === 'skin_neko';
  const isStealth = skinId === 'skin_stealth';
  const isCyber = skinId === 'skin_cyber';
  const isArctic = skinId === 'skin_arctic';
  const isDesert = skinId === 'skin_desert';

  // Drawing Primitives
  const rect = (x: number, y: number, w: number, h: number, fill: string, r: number = 2) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
    ctx.fill();
  };

  const poly = (fill: string, ...pts: number[]) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    for (let i = 0; i < pts.length; i += 2) {
      if (i === 0) ctx.moveTo(pts[i], pts[i + 1]);
      else ctx.lineTo(pts[i], pts[i + 1]);
    }
    ctx.closePath();
    ctx.fill();
  };

  const circle = (x: number, y: number, radius: number, fill: string) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  const ellipse = (x: number, y: number, rx: number, ry: number, fill: string) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  const line = (x1: number, y1: number, x2: number, y2: number, stroke: string, lw: number) => {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  // Base Armor Palette with Theme Tuning
  let cDark = '#1b2123';
  let cHull = '#55605a';
  let cShadow = '#3a433e';
  let cMetal = '#98a39c';
  let cGlass = '#9ec3d1';
  let cAccent = color;

  if (isToySoldiers) {
    cHull = '#16a34a';
    cShadow = '#15803d';
    cDark = '#14532d';
    cMetal = '#22c55e';
    cAccent = '#4ade80';
  } else if (isNapoleonicFrance) {
    cHull = '#1e3a8a';
    cShadow = '#172554';
    cDark = '#0f172a';
    cMetal = '#f59e0b';
    cAccent = '#3b82f6';
  } else if (isNapoleonicBritain) {
    cHull = '#dc2626';
    cShadow = '#991b1b';
    cDark = '#450a0a';
    cMetal = '#fbbf24';
    cAccent = '#ef4444';
  } else if (isImperialJapan) {
    cHull = '#655e42';
    cShadow = '#4d462f';
    cDark = '#2e2a1b';
    cMetal = '#eab308';
    cAccent = '#ca8a04';
  } else if (isWw2Britain) {
    cHull = '#3d4a36';
    cShadow = '#2b3626';
    cMetal = '#8a947c';
    cAccent = '#eab308';
  } else if (isWw2Germany) {
    cHull = '#434c56';
    cShadow = '#2d343c';
    cDark = '#191d21';
    cMetal = '#94a3b8';
    cAccent = '#cbd5e1';
  } else if (isModernUsa) {
    cHull = '#8c7b57';
    cShadow = '#615438';
    cDark = '#211c13';
    cMetal = '#cbd5e1';
    cAccent = '#38bdf8';
  } else if (isGuP) {
    cHull = '#545c49';
    cShadow = '#3e4435';
    cDark = '#1c2018';
    cMetal = '#e2e8f0';
    cAccent = '#fb7185';
  } else if (isNeko) {
    cHull = '#f472b6';
    cShadow = '#db2777';
    cDark = '#831843';
    cMetal = '#fce7f3';
    cAccent = '#ec4899';
  } else if (isStealth) {
    cHull = '#16191c';
    cShadow = '#0d0f11';
    cDark = '#050607';
    cMetal = '#374151';
    cAccent = '#ef4444';
  } else if (isCyber) {
    cHull = '#0f172a';
    cShadow = '#1e293b';
    cDark = '#020617';
    cMetal = '#38bdf8';
    cAccent = '#22d3ee';
  } else if (isArctic) {
    cHull = '#e2e8f0';
    cShadow = '#64748b';
    cMetal = '#cbd5e1';
    cAccent = '#38bdf8';
  } else if (isDesert) {
    cHull = '#c29a6d';
    cShadow = '#8c6841';
    cMetal = '#d6b896';
    cAccent = '#f59e0b';
  }

  // --- Insignia Decal Helpers ---
  // British RAF Roundel: Blue / White / Red bullseye
  const drawRafRoundel = (x: number, y: number, r: number = 4.5) => {
    circle(x, y, r, '#1e3a8a');
    circle(x, y, r * 0.65, '#ffffff');
    circle(x, y, r * 0.32, '#dc2626');
  };

  // German Balkenkreuz: White cross with inner black cross
  const drawBalkenkreuz = (x: number, y: number, size: number = 4.5) => {
    line(x - size, y, x + size, y, '#ffffff', 2.8);
    line(x, y - size, x, y + size, '#ffffff', 2.8);
    line(x - size + 0.8, y, x + size - 0.8, y, '#0a0d0f', 1.6);
    line(x, y - size + 0.8, x, y + size - 0.8, '#0a0d0f', 1.6);
  };

  // Allied 5-Pointed Star in Circle
  const drawAlliedStar = (x: number, y: number, r: number = 4.5) => {
    circle(x, y, r, 'rgba(15, 23, 42, 0.65)');
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const b = a + Math.PI / 5;
      const outerR = r * 0.85;
      const innerR = r * 0.38;
      if (i === 0) ctx.moveTo(x + cos(a) * outerR, y + sin(a) * outerR);
      else ctx.lineTo(x + cos(a) * outerR, y + sin(a) * outerR);
      ctx.lineTo(x + cos(b) * innerR, y + sin(b) * innerR);
    }
    ctx.closePath();
    ctx.fill();
  };

  // Ooarai Anglerfish Emblem
  const drawAnglerfish = (x: number, y: number, r: number = 5) => {
    circle(x, y, r + 1, '#1e3a8a');
    circle(x, y, r, '#ffffff');
    circle(x + 0.5, y + 0.5, r * 0.65, '#ea580c');
    circle(x + 2, y - 0.5, 1.2, '#ffffff');
    circle(x + 2.3, y - 0.5, 0.6, '#0f172a');
    line(x - 1, y - 1.5, x + 0.5, y - 4, '#ea580c', 1);
    circle(x + 0.5, y - 4, 1.1, '#fde047');
    poly('#ea580c', x - 2, y, x - 4.5, y - 2, x - 4.5, y + 2);
  };

  // Neko Paw Print
  const drawPawPrint = (x: number, y: number, scale: number = 1) => {
    circle(x, y, 2.2 * scale, '#ffffff');
    circle(x - 2.2 * scale, y - 2.6 * scale, 1.1 * scale, '#ffffff');
    circle(x, y - 3.4 * scale, 1.1 * scale, '#ffffff');
    circle(x + 2.2 * scale, y - 2.6 * scale, 1.1 * scale, '#ffffff');
  };

  // Neko Animated Twitching Cat Ears
  const drawCatEars = (x: number, y: number, scale: number = 1) => {
    const twitch = sin(animTime / 220) * 1.5 - recoil * 3;
    poly('#ec4899', x - 7 * scale, y, x - 4 * scale, y - 9 * scale + twitch, x - 1 * scale, y);
    poly('#ffffff', x - 6 * scale, y - 1, x - 4 * scale, y - 7 * scale + twitch, x - 2 * scale, y - 1);
    poly('#ec4899', x + 1 * scale, y, x + 4 * scale, y - 9 * scale - twitch, x + 7 * scale, y);
    poly('#ffffff', x + 2 * scale, y - 1, x + 4 * scale, y - 7 * scale - twitch, x + 6 * scale, y - 1);
  };

  // French Tricolor Cockade
  const drawFrenchCockade = (x: number, y: number, r: number = 4) => {
    circle(x, y, r, '#dc2626');
    circle(x, y, r * 0.66, '#ffffff');
    circle(x, y, r * 0.33, '#1e3a8a');
  };

  // French Imperial Brass Eagle
  const drawFrenchEagle = (x: number, y: number) => {
    circle(x, y, 2, '#fbbf24');
    line(x - 3, y - 1, x + 3, y - 1, '#f59e0b', 1.5);
    line(x, y, x, y + 2, '#d97706', 1.2);
  };

  // British Union Jack Crest
  const drawUnionJack = (x: number, y: number, w: number = 8, h: number = 5) => {
    rect(x - w / 2, y - h / 2, w, h, '#1e3a8a', 0.5);
    line(x - w / 2, y - h / 2, x + w / 2, y + h / 2, '#ffffff', 1.4);
    line(x - w / 2, y + h / 2, x + w / 2, y - h / 2, '#ffffff', 1.4);
    line(x - w / 2, y, x + w / 2, y, '#ffffff', 2);
    line(x, y - h / 2, x, y + h / 2, '#ffffff', 2);
    line(x - w / 2, y, x + w / 2, y, '#dc2626', 1);
    line(x, y - h / 2, x, y + h / 2, '#dc2626', 1);
  };

  // Imperial Japanese Gold Star
  const drawJapanStar = (x: number, y: number, r: number = 3) => {
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const b = a + Math.PI / 5;
      if (i === 0) ctx.moveTo(x + cos(a) * r, y + sin(a) * r);
      else ctx.lineTo(x + cos(a) * r, y + sin(a) * r);
      ctx.lineTo(x + cos(b) * (r * 0.4), y + sin(b) * (r * 0.4));
    }
    ctx.closePath();
    ctx.fill();
  };

  // Muzzle Flash
  const drawMuzzleFlash = (fx: number, fy: number, size: number = 6) => {
    if (recoil > 0.4) {
      if (isNeko) {
        circle(fx, fy, size * recoil * 1.2, 'rgba(244,114,182,0.95)');
        circle(fx, fy, size * recoil * 0.6, '#ffffff');
        line(fx - size * recoil, fy, fx + size * recoil, fy, '#ffffff', 1.5);
        line(fx, fy - size * recoil, fx, fy + size * recoil, '#ffffff', 1.5);
      } else if (isGuP) {
        circle(fx, fy, size * recoil * 1.15, 'rgba(251,113,133,0.95)');
        circle(fx, fy, size * recoil * 0.55, '#ffffff');
        line(fx - size * recoil, fy, fx + size * recoil, fy, '#fecdd3', 1.6);
        line(fx, fy - size * recoil, fx, fy + size * recoil, '#fecdd3', 1.6);
      } else if (isWw2Germany) {
        circle(fx, fy, size * recoil, 'rgba(255,200,90,.95)');
        circle(fx, fy, size * recoil * 0.5, '#ffffff');
        line(fx - 3, fy - 5, fx + 3, fy - 5, 'rgba(255,220,120,0.85)', 2);
        line(fx - 3, fy + 5, fx + 3, fy + 5, 'rgba(255,220,120,0.85)', 2);
      } else if (isModernUsa) {
        circle(fx, fy, size * recoil * 1.1, 'rgba(254,240,138,0.95)');
        circle(fx, fy, size * recoil * 0.5, '#ffffff');
      } else if (isToySoldiers) {
        circle(fx, fy, size * recoil, 'rgba(74,222,128,0.95)');
        circle(fx, fy, size * recoil * 0.5, '#ffffff');
      } else if (isNapoleonicFrance || isNapoleonicBritain) {
        circle(fx, fy, size * recoil * 1.3, 'rgba(253,224,71,0.95)');
        circle(fx, fy, size * recoil * 0.6, '#ffffff');
      } else if (isCyber) {
        circle(fx, fy, size * recoil, 'rgba(34,211,238,0.95)');
        circle(fx, fy, size * recoil * 0.5, '#ffffff');
      } else {
        circle(fx, fy, size * recoil, 'rgba(255,238,160,.95)');
        circle(fx, fy, size * recoil * 0.5, '#ffffff');
      }
    }
  };

  // Tank Tracks
  const drawTracks = (x1: number, x2: number, y: number, h: number) => {
    rect(x1, y, x2 - x1, h, cDark, h / 2);
    for (let wx = x1 + h / 2; wx <= x2 - h / 2 + 0.1; wx += h * 0.8) {
      circle(wx, y + h / 2, h * 0.36, cShadow);
      circle(
        wx + cos(walkCycle * 3 + wx) * h * 0.26,
        y + h / 2 + sin(walkCycle * 3 + wx) * h * 0.26,
        1,
        cMetal
      );
    }
    if (isToySoldiers) {
      // Molded plastic shiny track edge
      line(x1, y + 1, x2, y + 1, '#4ade80', 1);
    }
  };

  // Wheel pair
  const drawWheel = (x: number, y: number, r: number) => {
    circle(x, y, r, cDark);
    circle(x, y, r * 0.55, cShadow);
    line(
      x + cos(walkCycle * 4) * r * 0.8,
      y + sin(walkCycle * 4) * r * 0.8,
      x - cos(walkCycle * 4) * r * 0.8,
      y - sin(walkCycle * 4) * r * 0.8,
      cMetal,
      1.4
    );
  };

  // --- Infantry Squad Rendering ---
  const drawInfantryBase = (
    helmColor: string,
    bodyColor: string,
    drawWeapon?: () => void,
    drawBackpack?: () => void
  ) => {
    const legOffset = sin(walkCycle * 2) * 5;
    const legColor = isToySoldiers
      ? '#15803d'
      : isWw2Britain
      ? '#524b33'
      : isWw2Germany
      ? '#384239'
      : isModernUsa
      ? '#6b5e3f'
      : isGuP
      ? '#1e3a8a'
      : isNeko
      ? '#db2777'
      : isNapoleonicFrance || isNapoleonicBritain
      ? '#ffffff'
      : isImperialJapan
      ? '#4d462f'
      : isDesert
      ? '#a17e52'
      : isArctic
      ? '#cbd5e1'
      : isStealth
      ? '#0d0f11'
      : isCyber
      ? '#1e293b'
      : cDark;

    line(-3, 6, -3 + legOffset, 15, legColor, 4);
    line(3, 6, 3 - legOffset, 15, legColor, 4);

    // Toy soldier molded circular footplate!
    if (isToySoldiers) {
      ellipse(0, 15, 9, 3, '#15803d');
      ellipse(0, 15, 7, 2, '#22c55e');
    }

    if (drawBackpack) drawBackpack();

    // Torso uniform coat
    const torsoColor = isToySoldiers
      ? '#16a34a'
      : isWw2Britain
      ? '#685f43'
      : isWw2Germany
      ? '#434c56'
      : isModernUsa
      ? '#8c7b57'
      : isGuP
      ? '#ffffff'
      : isNeko
      ? '#f472b6'
      : isNapoleonicFrance
      ? '#1e3a8a'
      : isNapoleonicBritain
      ? '#dc2626'
      : isImperialJapan
      ? '#655e42'
      : isDesert
      ? '#c29a6d'
      : isArctic
      ? '#e2e8f0'
      : isStealth
      ? '#16191c'
      : isCyber
      ? '#0f172a'
      : bodyColor || cHull;
    rect(-6, -7 + idleBob, 12, 14, torsoColor, 3);

    // Belt / Sash / Webbing
    const beltColor = isToySoldiers
      ? '#15803d'
      : isWw2Britain
      ? '#4a432e'
      : isWw2Germany
      ? '#191d21'
      : isModernUsa
      ? '#211c13'
      : isNeko
      ? '#ffffff'
      : isNapoleonicFrance || isNapoleonicBritain
      ? '#ffffff'
      : isCyber
      ? '#22d3ee'
      : isStealth
      ? '#ef4444'
      : isDesert
      ? '#8c6841'
      : isArctic
      ? '#64748b'
      : cAccent;
    rect(-6, 2 + idleBob, 12, 3, beltColor, 1);

    // British crossed canvas webbing
    if (isWw2Britain) {
      line(-5, -6 + idleBob, 5, 2 + idleBob, '#8f8664', 1.8);
      line(5, -6 + idleBob, -5, 2 + idleBob, '#8f8664', 1.8);
    } else if (isNapoleonicFrance) {
      // White French crossed chest straps with brass badge
      line(-5, -6 + idleBob, 5, 2 + idleBob, '#ffffff', 2);
      line(5, -6 + idleBob, -5, 2 + idleBob, '#ffffff', 2);
      circle(0, -2 + idleBob, 1.5, '#fbbf24');
      // White lapels
      poly('#ffffff', -5, -6 + idleBob, -1, -6 + idleBob, -1, 1 + idleBob, -5, 1 + idleBob);
      poly('#ffffff', 1, -6 + idleBob, 5, -6 + idleBob, 5, 1 + idleBob, 1, 1 + idleBob);
    } else if (isNapoleonicBritain) {
      // British Redcoat crossed white crossbelts with brass plate
      line(-5, -6 + idleBob, 5, 2 + idleBob, '#ffffff', 2);
      line(5, -6 + idleBob, -5, 2 + idleBob, '#ffffff', 2);
      circle(0, -2 + idleBob, 1.6, '#fbbf24');
      rect(-6, -7 + idleBob, 3, 3, '#1e3a8a', 0.5); // dark blue collar
      rect(3, -7 + idleBob, 3, 3, '#1e3a8a', 0.5);
    }

    // Head / Face
    const faceTone = isToySoldiers ? '#22c55e' : isNeko ? '#ffedd5' : '#c9a77c';
    circle(0, -11 + idleBob, 5.2, faceTone);

    // Specific Skin Headgear / Face Elements
    if (isNeko) {
      // Neko Cat-girl: pink hair, perky cat ears, animated swishing tail, blushing cheeks!
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.arc(0, -12 + idleBob, 5.8, Math.PI, 0);
      ctx.fill();
      line(-5, -12 + idleBob, -6, -6 + idleBob, '#f472b6', 2.2);
      line(5, -12 + idleBob, 6, -6 + idleBob, '#f472b6', 2.2);

      const earTwitch = sin(animTime / 260) * 2;
      poly('#f472b6', -6, -14 + idleBob, -3, -21 + idleBob + earTwitch, 0, -14 + idleBob);
      poly('#ffffff', -5, -14 + idleBob, -3, -19 + idleBob + earTwitch, -1, -14 + idleBob);
      poly('#f472b6', 0, -14 + idleBob, 3, -21 + idleBob - earTwitch, 6, -14 + idleBob);
      poly('#ffffff', 1, -14 + idleBob, 3, -19 + idleBob - earTwitch, 5, -14 + idleBob);

      // Twitching cat tail with white fluffy tip
      const tailSwish = sin(animTime / 180) * 5;
      line(-5, 4 + idleBob, -14 + tailSwish, -2 + idleBob + cos(animTime / 180) * 3, '#f472b6', 3.2);
      circle(-14 + tailSwish, -2 + idleBob + cos(animTime / 180) * 3, 2.5, '#ffffff');

      // Blushing cute cheeks
      circle(-2.5, -9 + idleBob, 1.2, '#f472b6');
      circle(2.5, -9 + idleBob, 1.2, '#f472b6');

      // Floating heart sparkle
      const heartPhase = (animTime / 250) % 8;
      if (heartPhase < 3) {
        circle(8 + sin(animTime / 100) * 4, -18 + idleBob - heartPhase * 3, 1.8, 'rgba(244,114,182,0.85)');
      }
    } else if (isGuP) {
      // Girls und Panzer Sensha-dō: Ooarai sailor collar, brown hair with bangs, red hair ribbon!
      ctx.fillStyle = '#7c2d12';
      ctx.beginPath();
      ctx.arc(0, -12 + idleBob, 5.8, Math.PI, 0);
      ctx.fill();
      line(-5, -12 + idleBob, -6, -6 + idleBob, '#7c2d12', 2.2);
      line(5, -12 + idleBob, 6, -6 + idleBob, '#7c2d12', 2.2);

      // Red hair ribbons
      circle(4, -15 + idleBob, 2.6, '#dc2626');
      circle(6, -16 + idleBob, 1.6, '#ef4444');

      // White sailor collar & red neck ribbon
      poly('#ffffff', -5, -6 + idleBob, 0, -1 + idleBob, 5, -6 + idleBob);
      poly('#dc2626', -1.5, -4 + idleBob, 0, 1 + idleBob, 1.5, -4 + idleBob);
      // Dark blue school skirt
      rect(-6, 3 + idleBob, 12, 4, '#1e3a8a', 1);

      // Blushing cheeks
      circle(-2.5, -9 + idleBob, 1.2, '#f43f5e');
      circle(2.5, -9 + idleBob, 1.2, '#f43f5e');
    } else if (isWw2Germany) {
      // German Stahlhelm flared helmet
      ellipse(0, -12 + idleBob, 8.2, 2.4, '#384239');
      circle(0, -13.8 + idleBob, 5.2, '#455246');
      poly('#384239', -7, -11 + idleBob, -8.5, -8 + idleBob, -4, -8 + idleBob, 0, -10 + idleBob);
      line(-4.5, -10 + idleBob, 0, -7 + idleBob, '#1b2123', 1.2);
      // Potato masher stick grenade (Stielhandgranate) tucked in belt!
      line(-5, 0 + idleBob, -5, 7 + idleBob, '#78562d', 2);
      rect(-6.2, 0 + idleBob, 2.4, 3, '#384239', 0.8);
    } else if (isModernUsa) {
      // Modern US Kevlar with NVG mount and tactical goggles
      ellipse(0, -12 + idleBob, 7.8, 2.3, '#5c543c');
      circle(0, -13.6 + idleBob, 5, '#6e6549');
      rect(1.5, -14.5 + idleBob, 2.5, 2.5, '#0f172a', 0.5);
      rect(-4, -13 + idleBob, 8, 1.8, '#1e293b', 0.6);
      line(-4, -10 + idleBob, 0, -7 + idleBob, '#2b343b', 1.2);
    } else if (isWw2Britain) {
      // British Brodie tin hat ("tin hat")
      ellipse(0, -12 + idleBob, 8.5, 2.2, '#4d462f');
      circle(0, -13.5 + idleBob, 5, '#595137');
      line(-5, -11 + idleBob, 0, -8 + idleBob, '#383220', 1.2);
    } else if (isToySoldiers) {
      // Molded glossy plastic helmet with shine
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(0, -12 + idleBob, 6, Math.PI, 0);
      ctx.fill();
      line(-4, -15 + idleBob, 2, -15 + idleBob, '#4ade80', 1.4); // specular gloss
    } else if (isNapoleonicFrance) {
      // French Shako tall cap with red pompom and imperial eagle
      rect(-4.5, -21 + idleBob, 9, 10, '#0f172a', 1);
      circle(0, -22 + idleBob, 2.5, '#ef4444'); // red pompom
      drawFrenchEagle(0, -16 + idleBob);
      line(-5, -12 + idleBob, 5, -12 + idleBob, '#0f172a', 1.5);
    } else if (isNapoleonicBritain) {
      // British Stovepipe Shako with white plume
      rect(-4.5, -22 + idleBob, 9, 11, '#020617', 1);
      circle(0, -23 + idleBob, 2.5, '#ffffff'); // white plume
      rect(-2, -18 + idleBob, 4, 3, '#fbbf24', 0.5); // brass badge
    } else if (isImperialJapan) {
      // IJA field cap with neck sun flaps
      circle(0, -13 + idleBob, 5.2, '#655e42');
      line(-4, -13 + idleBob, -6, -6 + idleBob, '#4d462f', 2.5); // neck flap
      line(4, -13 + idleBob, 6, -6 + idleBob, '#4d462f', 2.5);
      circle(0, -14 + idleBob, 1.2, '#eab308'); // yellow star
    } else if (isDesert) {
      // Desert sand helmet with sun goggles & shemagh
      ellipse(0, -12 + idleBob, 8, 2.3, '#c29a6d');
      circle(0, -13.5 + idleBob, 5, '#b08b5f');
      rect(-4, -13 + idleBob, 8, 2, '#451a03', 0.5); // tinted goggles
      rect(-5, -8 + idleBob, 10, 3, '#d4a373', 1); // dust shemagh
    } else if (isArctic) {
      // Arctic white thermal hood with glacier goggles
      ellipse(0, -12 + idleBob, 8, 2.5, '#f1f5f9');
      circle(0, -13.5 + idleBob, 5.2, '#e2e8f0');
      rect(-4, -13 + idleBob, 8, 2.2, '#0284c7', 0.5); // ice blue goggles
      line(-5, -8 + idleBob, 5, -8 + idleBob, '#94a3b8', 1.5);
    } else if (isStealth) {
      // Stealth matte obsidian helmet with crimson night-vision optic
      ellipse(0, -12 + idleBob, 7.8, 2.3, '#16191c');
      circle(0, -13.5 + idleBob, 5, '#0d0f11');
      rect(-3.5, -13.5 + idleBob, 7, 2.2, '#050607', 0.5);
      circle(-1.5, -12.5 + idleBob, 1.2, '#ef4444'); // glowing red dual optic
      circle(1.5, -12.5 + idleBob, 1.2, '#ef4444');
    } else if (isCyber) {
      // Cyber helmet with glowing neon visor
      ellipse(0, -12 + idleBob, 7.8, 2.3, '#0f172a');
      circle(0, -13.5 + idleBob, 5, '#1e293b');
      rect(-4, -13 + idleBob, 8, 2.4, '#22d3ee', 0.5); // cyan visor
      line(0, -14 + idleBob, 0, -11 + idleBob, '#ffffff', 1);
    } else {
      // Standard issue helmet
      const hColor = helmColor || cHull;
      ctx.fillStyle = hColor;
      ctx.beginPath();
      ctx.arc(0, -12 + idleBob, 6, Math.PI, 0);
      ctx.fill();
      rect(-6, -12 + idleBob, 12, 2, cAccent, 0);
    }

    if (drawWeapon) drawWeapon();
  };

  // Draw Rifle / Small Arm
  const drawRifle = (len: number = 17, defaultGunColor: string = cDark) => {
    if (isWw2Germany) {
      line(0, -1 + idleBob, len - 5 - recoil * 4, -1 + idleBob, '#4a3520', 3.5);
      line(len - 6, -1 + idleBob, len - recoil * 4, -1 + idleBob, '#1b2123', 2);
    } else if (isModernUsa) {
      line(0, -1 + idleBob, len - recoil * 4, -1 + idleBob, '#1f2421', 3.2);
      rect(4, -4 + idleBob, 5, 2.5, '#0f172a', 0.5); // ACOG optic
      rect(len - 4 - recoil * 4, -2.5 + idleBob, 5, 3, '#0f172a', 0.8);
    } else if (isWw2Britain) {
      line(0, -1 + idleBob, len - 5 - recoil * 4, -1 + idleBob, '#45321f', 3.5);
      line(len - 6, -1 + idleBob, len - recoil * 4, -1 + idleBob, '#1b2123', 2);
    } else if (isGuP) {
      line(0, -1 + idleBob, len - recoil * 4, -1 + idleBob, '#384230', 2.8);
    } else if (isToySoldiers) {
      line(0, -1 + idleBob, len - recoil * 4, -1 + idleBob, '#15803d', 3.2);
      line(2, -2 + idleBob, 8, -2 + idleBob, '#4ade80', 1); // gloss shine
    } else if (isNapoleonicFrance || isNapoleonicBritain) {
      // Flintlock Musket with wooden stock, brass bands, and steel bayonet
      line(0, -1 + idleBob, len - 4 - recoil * 4, -1 + idleBob, '#5c3a21', 3.5);
      line(len - 5, -1 + idleBob, len - recoil * 4, -1 + idleBob, '#94a3b8', 2);
      line(len - recoil * 4, -1 + idleBob, len + 5 - recoil * 4, -3 + idleBob, '#cbd5e1', 1.4); // bayonet
    } else if (isImperialJapan) {
      // Arisaka Type 99 with bayonet
      line(0, -1 + idleBob, len - 4 - recoil * 4, -1 + idleBob, '#543d2b', 3.2);
      line(len - 5, -1 + idleBob, len - recoil * 4, -1 + idleBob, '#1b2123', 2);
      line(len - recoil * 4, -1 + idleBob, len + 5 - recoil * 4, -3 + idleBob, '#94a3b8', 1.2);
    } else if (isCyber) {
      line(0, -1 + idleBob, len - recoil * 4, -1 + idleBob, '#0f172a', 3);
      line(2, -1 + idleBob, len - 2 - recoil * 4, -1 + idleBob, '#22d3ee', 1.5);
    } else if (isStealth) {
      line(0, -1 + idleBob, len - recoil * 4, -1 + idleBob, '#0f172a', 3);
      circle(len - recoil * 4, -1 + idleBob, 1, '#ef4444');
    } else if (isDesert) {
      line(0, -1 + idleBob, len - recoil * 4, -1 + idleBob, '#a17e52', 3.2);
    } else if (isArctic) {
      line(0, -1 + idleBob, len - recoil * 4, -1 + idleBob, '#cbd5e1', 3.2);
    } else {
      line(0, -1 + idleBob, len - recoil * 4, -1 + idleBob, defaultGunColor, 3);
    }
    drawMuzzleFlash(len + 3, -1 + idleBob);
  };

  // Helper for applying all 14 vehicle skin liveries consistently
  const drawVehicleSkinDetails = (x: number, y: number, size: number = 4.5) => {
    if (isWw2Britain) {
      drawRafRoundel(x, y, size);
    } else if (isWw2Germany) {
      drawBalkenkreuz(x, y, size);
    } else if (isModernUsa) {
      drawAlliedStar(x, y, size);
    } else if (isGuP) {
      drawAnglerfish(x, y, size);
    } else if (isNeko) {
      drawPawPrint(x, y, size / 4.5);
      drawCatEars(x, y - 6, size / 5);
      line(x + 8, y - 2, x + 14, y - 4, '#ffffff', 1.2);
      line(x + 8, y + 2, x + 14, y + 4, '#ffffff', 1.2);
    } else if (isToySoldiers) {
      line(x - size * 2.2, y, x + size * 2.2, y, '#4ade80', 1.4);
      circle(x, y, size * 0.7, '#22c55e');
    } else if (isNapoleonicFrance) {
      drawFrenchCockade(x, y, size);
      drawFrenchEagle(x, y - 6);
    } else if (isNapoleonicBritain) {
      drawUnionJack(x, y, size * 1.6, size);
    } else if (isImperialJapan) {
      drawJapanStar(x, y, size * 0.8);
      line(x - size * 1.5, y - 8, x + size * 1.5, y - 8, '#eab308', 1.5);
    } else if (isCyber) {
      circle(x, y, size * 0.8, 'rgba(34,211,238,0.3)');
      line(x - size * 1.5, y, x + size * 1.5, y, '#22d3ee', 1.5);
    } else if (isStealth) {
      rect(x - size, y - 1.5, size * 2, 3, '#ef4444', 0.8);
    } else if (isArctic) {
      circle(x, y, size * 0.75, 'rgba(125,211,252,0.4)');
      line(x - size, y - size, x + size, y + size, '#ffffff', 1.2);
      line(x - size, y + size, x + size, y - size, '#ffffff', 1.2);
    } else if (isDesert) {
      circle(x, y, size * 0.8, '#a17e52');
      circle(x, y, size * 0.4, '#f59e0b');
    }
  };

  // --- UNIT DISPATCH SWITCH ---
  switch (unitCode) {
    case 'R': // Riflemen
      drawInfantryBase(
        cHull,
        cShadow,
        () => drawRifle(17)
      );
      break;

    case 'K': // Medic
      drawInfantryBase(
        '#e6eae4',
        cShadow,
        () => {
          line(0, -17 + idleBob, 0, -12 + idleBob, '#e0554a', 2.4);
          line(-2.4, -14.5 + idleBob, 2.4, -14.5 + idleBob, '#e0554a', 2.4);
          circle(13, -3 + idleBob, 3 + sin(animTime / 180) * 1.4, '#8fbf7a');
          line(5, -2 + idleBob, 12, -3 + idleBob, '#c9a77c', 3);
        },
        () => rect(-14, -3 + idleBob, 8, 10, '#d9d3c0', 2)
      );
      break;

    case 'P': // Supplier
      drawInfantryBase(
        cHull,
        cShadow,
        () => {},
        () => {
          rect(-14, -6 + idleBob, 9, 13, cShadow, 2);
          line(-9.5, -3 + idleBob, -9.5, 3 + idleBob, '#8fbf7a', 2.4);
          line(-12.5, idleBob, -6.5, idleBob, '#8fbf7a', 2.4);
        }
      );
      break;

    case 'T': // Anti-Tank Squad
      drawInfantryBase(
        cHull,
        cShadow,
        () => {
          rect(-9 - recoil * 3, -10 + idleBob, 28, 5, cShadow, 2);
          poly('#c2563f', 19 - recoil * 3, -10 + idleBob, 26 - recoil * 3, -7.5 + idleBob, 19 - recoil * 3, -5 + idleBob);
          if (recoil > 0.5) circle(-11, -7 + idleBob, 7 * recoil, 'rgba(255,200,110,.9)');
        }
      );
      break;

    case 'Z': // Machine Gunner
      drawInfantryBase(
        cHull,
        cShadow,
        () => {
          line(2, 9, -5, 15, cDark, 2);
          line(5, 9, 11, 15, cDark, 2);
          rect(3 - recoil * 3, -5 + idleBob, 20, 4, cDark, 1);
          rect(-3, -2 + idleBob, 6, 6, '#b08b3a', 1);
          drawMuzzleFlash(26, -3 + idleBob, 7);
        }
      );
      break;

    case 'N': // Combat Engineer
      drawInfantryBase(
        '#e0b13a',
        cShadow,
        () => {
          line(6, 1 + idleBob, 16, -8 + idleBob, cMetal, 3);
          circle(17, -9 + idleBob, 3, cMetal);
        },
        () => rect(-14, idleBob, 8, 7, '#c2563f', 1)
      );
      break;

    case 'G': // Commando
      drawInfantryBase(
        cHull,
        cShadow,
        () => {
          drawRifle(16, '#0d0f10');
          line(-5, -9 + idleBob, -12, -7 + idleBob + sin(animTime / 110) * 2.5, cAccent, 2.5);
        }
      );
      break;

    case 'S': // Sniper
      drawInfantryBase(
        cHull,
        cShadow,
        () => {
          poly(isWw2Britain ? '#4a432e' : cShadow, -8, -5 + idleBob, 0, -14 + idleBob, 8, -5 + idleBob);
          drawRifle(25);
          rect(8, -5 + idleBob, 6, 2.5, cMetal, 1);
        }
      );
      break;

    case 'X': // Shock Trooper
      drawInfantryBase(
        cHull,
        cShadow,
        () => {
          circle(2, -9 + idleBob, 2.8, '#b45309');
          line(2, 2 + idleBob, 19 - recoil * 3, -1 + idleBob, cDark, 3.5);
          circle(20 - recoil * 3, -1 + idleBob, 2.5 + Math.abs(sin(animTime / 60)) * 1.5, '#f97316');
        },
        () => {
          rect(-15, -9 + idleBob, 6, 14, '#b45309', 2);
          rect(-11, -9 + idleBob, 6, 14, '#ea580c', 2);
        }
      );
      break;

    case 'MR': // Marksman Team
      drawInfantryBase(
        cHull,
        cShadow,
        () => {
          drawRifle(24);
          circle(12, -8 + idleBob, 2, cAccent);
        }
      );
      break;

    case 'MT': // Mortar Team
      drawInfantryBase(
        cHull,
        cShadow,
        () => {
          line(0, 4 + idleBob, 12, -8 + idleBob, cDark, 3.5);
          circle(12, -8 + idleBob, 2.5, '#4b5563');
        },
        () => {
          rect(-15, -4 + idleBob, 7, 10, cShadow, 2);
        }
      );
      break;

    case 'CH': // Cyber Infiltrator
      drawInfantryBase(
        cHull,
        cShadow,
        () => {
          drawRifle(18, '#0b0f12');
          rect(5, 2 + idleBob, 4, 3, cAccent, 1);
        },
        () => {
          rect(-13, -8 + idleBob, 6, 12, cShadow, 1);
          line(-10, -8 + idleBob, -10, -18 + idleBob, cMetal, 1.5);
          circle(-10, -18 + idleBob, 1.5, cAccent);
        }
      );
      break;

    case 'I': // Infiltrator (Stealth sniper operative with optical cloak & EMP)
      drawInfantryBase(
        isStealth ? '#101416' : cShadow,
        cDark,
        () => {
          // Suppressed long sniper rifle
          line(0, -1 + idleBob, 26 - recoil * 4, -1 + idleBob, '#0d1114', 3.5);
          rect(22 - recoil * 4, -3 + idleBob, 6, 4, '#1b2328', 1);
          rect(6, -5 + idleBob, 8, 2.5, cMetal, 1);
          if (recoil < 0.2) {
            circle(32, -1 + idleBob, 1.2, isNeko ? '#f472b6' : '#ef4444');
          }
          drawMuzzleFlash(28, -1 + idleBob, 4);
        },
        () => {
          rect(-14, -6 + idleBob, 8, 12, '#182024', 2);
          line(-10, -6 + idleBob, -10, -18 + idleBob, cMetal, 1.5);
          circle(-10, -18 + idleBob, 1.8, isCyber ? '#22d3ee' : '#38bdf8');
          const shimmer = Math.abs(sin(animTime / 180));
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.2 + shimmer * 0.4})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(-8, -10 + idleBob, 16, 24);
        }
      );
      break;

    // --- ARMORED VEHICLES ---
    case 'B': // Battle Tank
      drawTracks(-23, 23, 6, 10);
      poly(cHull, -23, 6, -19, -5 + idleBob, 19, -5 + idleBob, 24, 3 + idleBob, 23, 6);
      poly(cShadow, -11, -5 + idleBob, -7, -15 + idleBob, 10, -15 + idleBob, 14, -5 + idleBob);
      rect(-8, -9 + idleBob, 19, 2.4, cAccent, 0);
      circle(-2, -16 + idleBob, 2.4, cDark);
      rect(11 - recoil * 8, -12 + idleBob, 26, 3.6, cDark, 1);
      rect(35 - recoil * 8, -13.5 + idleBob, 4, 6.6, cShadow, 1);
      drawMuzzleFlash(42, -10 + idleBob, 10);

      // Skin Emblems & Details on Main Tank
      drawVehicleSkinDetails(2, -10 + idleBob, 4.5);
      if (isWw2Britain) {
        rect(-22, 5 + idleBob, 44, 2.5, '#2b3626', 1);
      } else if (isWw2Germany) {
        rect(38 - recoil * 8, -15 + idleBob, 4.5, 9, '#1e242a', 1); // Tiger muzzle brake
        line(-16, 4 + idleBob, -16, 10 + idleBob, '#191d21', 2.5); // rear exhaust
        line(-12, 4 + idleBob, -12, 10 + idleBob, '#191d21', 2.5);
      } else if (isModernUsa) {
        circle(4, -18 + idleBob, 2.2, '#38bdf8');
        line(4, -18 + idleBob, 4, -22 + idleBob, '#1e293b', 1.5);
        rect(-22, 5 + idleBob, 44, 3, '#6b5e3f', 1);
      } else if (isGuP) {
        rect(-21, 5 + idleBob, 42, 4.5, '#676e5a', 1.5);
        line(-7, 5 + idleBob, -7, 9.5 + idleBob, '#383e30', 1.5);
        line(7, 5 + idleBob, 7, 9.5 + idleBob, '#383e30', 1.5);
        circle(-4, -19 + idleBob, 3.2, '#ffedd5');
        rect(-6, -21 + idleBob, 5, 2.5, '#1e3a8a', 1);
        rect(-1, -19.5 + idleBob, 4, 2.2, '#1e293b', 0.8);
        line(9, -15 + idleBob, 9, -27 + idleBob, '#cbd5e1', 1.2);
        poly('#dc2626', 9, -27 + idleBob, 17 + sin(animTime / 120) * 2, -24 + idleBob, 9, -21 + idleBob);
      }
      break;

    case 'M': // Heavy Tank
      drawTracks(-20, 20, 7, 9);
      poly(cHull, -20, 7, -16, -4 + idleBob, 16, -4 + idleBob, 21, 3 + idleBob, 20, 7);
      rect(-9, -12 + idleBob, 17, 9, cShadow, 3);
      rect(-9, -12 + idleBob, 17, 3, cAccent, 2);
      rect(8 - recoil * 4, -10 + idleBob, 17, 2.6, cDark, 1);
      rect(8 - recoil * 4, -6.5 + idleBob, 17, 2.6, cDark, 1);
      drawMuzzleFlash(26, -9 + idleBob, 7);
      drawVehicleSkinDetails(0, -7 + idleBob, 4);
      break;

    case 'C': // Scout Buggy
      drawWheel(-11, 9, 6);
      drawWheel(11, 9, 6);
      rect(-18, -2 + idleBob, 36, 10, cHull, 3);
      rect(-7, -10 + idleBob, 15, 9, cAccent, 2);
      rect(1, -8 + idleBob, 6, 5, cGlass, 1);
      line(-14, -2 + idleBob, -17, -17 + idleBob, cMetal, 1);
      circle(-17, -17 + idleBob, 1.6 + Math.abs(sin(animTime / 200)), '#e0554a');
      rect(9 - recoil * 3, -14 + idleBob, 12, 2.6, cDark, 1);
      drawMuzzleFlash(23, -13 + idleBob, 6);
      drawVehicleSkinDetails(-12, 2 + idleBob, 3.5);
      break;

    case 'A': // Artillery
      drawTracks(-21, 21, 8, 9);
      rect(-19, -4 + idleBob, 36, 12, cHull, 3);
      rect(-19, -11 + idleBob, 12, 8, cAccent, 2);
      rect(-21, 2 + idleBob, 3, 11, cShadow, 1);

      ctx.save();
      ctx.translate(2, -4 + idleBob);
      ctx.rotate(-0.4);
      rect(-recoil * 6, -3, 30, 5, cDark, 1);
      drawMuzzleFlash(32, 0, 10);
      ctx.restore();
      drawVehicleSkinDetails(-8, 1 + idleBob, 4);
      break;

    case 'J': // Juggernaut Titan
      drawTracks(-25, 25, 4, 13);
      rect(-25, -6 + idleBob, 50, 13, cHull, 3);
      poly(cMetal, 25, -6 + idleBob, 32, idleBob, 25, 6 + idleBob);
      rect(-25, -11 + idleBob, 50, 5, cShadow, 2);
      rect(-21, -3 + idleBob, 42, 3, cAccent, 0);
      rect(-15, -20 + idleBob, 17, 10, cShadow, 3);
      rect(2 - recoil * 8, -18 + idleBob, 30, 5, cDark, 2);
      rect(8, -14 + idleBob, 9, 5, cShadow, 2);
      rect(15, idleBob, 12, 4, '#a8463a', 2);
      circle(30 + sin(animTime / 45), 2 + idleBob, 2.6 + sin(animTime / 55), '#fb923c');
      drawMuzzleFlash(35 - recoil * 8, -15.5 + idleBob, 10);
      drawVehicleSkinDetails(-6, -15 + idleBob, 5);
      break;

    case 'AT': // Assault Transport (Carry Capacity)
    case 'AC': // Heavy Armored Carrier
      drawTracks(-23, 23, 7, 9);
      rect(-18, -10 + idleBob, 36, 18, cHull, 4);
      rect(-11, -16 + idleBob, 22, 8, cShadow, 2);
      rect(-3, -20 + idleBob, 17, 3, cDark, 1);
      line(10, -19 + idleBob, 24, -19 + idleBob, cDark, 3);
      drawMuzzleFlash(25, -19 + idleBob, 4);
      rect(-15, -7 + idleBob, 7, 5, cAccent, 1);

      // Troop cargo hatch indicator
      rect(-6, -4 + idleBob, 12, 8, cDark, 1);
      circle(0, 0 + idleBob, 1.5, '#4ade80'); // Green cargo status LED
      drawVehicleSkinDetails(-4, -5 + idleBob, 4);
      break;

    case 'FC': // Mobile Factory Crawler (Spawner Unit)
      drawTracks(-27, 27, 5, 14);
      rect(-26, -9 + idleBob, 52, 16, cHull, 3);
      rect(-20, -17 + idleBob, 40, 9, cShadow, 2);
      rect(-14, -6 + idleBob, 28, 4, cAccent, 1);

      // Hydraulic fabrication crane
      line(10, -17 + idleBob, 22, -28 + idleBob, cMetal, 3);
      line(22, -28 + idleBob, 28, -20 + idleBob, cMetal, 2);
      // Crane hook with welding sparks
      line(28, -20 + idleBob, 28, -14 + idleBob, cDark, 1.5);
      if (Math.abs(sin(animTime / 40)) > 0.4) {
        circle(28, -13 + idleBob, 2.5 + sin(animTime / 30) * 1.5, '#67e8f9');
        circle(28, -13 + idleBob, 1.2, '#ffffff');
      }

      // Smokestack exhaust
      rect(-16, -24 + idleBob, 5, 8, cDark, 1);
      rect(-9, -22 + idleBob, 5, 6, cDark, 1);
      circle(-14 + sin(animTime / 70) * 3, -27 + idleBob, 3.5, 'rgba(100, 116, 139, 0.4)');
      drawVehicleSkinDetails(-4, -8 + idleBob, 4.5);
      break;

    case 'D': // Railgun Destroyer
      drawTracks(-24, 24, 6, 10);
      poly(cHull, -24, 6, -18, -6 + idleBob, 18, -6 + idleBob, 24, 6);
      rect(-12, -11 + idleBob, 24, 6, cShadow, 2);
      rect(-12, -11 + idleBob, 24, 2, cAccent, 0);

      // Linear accelerator twin rails
      line(-4 - recoil * 6, -8 + idleBob, 36 - recoil * 6, -8 + idleBob, cDark, 4);
      line(-4 - recoil * 6, -5 + idleBob, 36 - recoil * 6, -5 + idleBob, cDark, 4);

      // Glowing electromagnetic coils
      for (let i = 0; i < 3; i++) {
        rect(8 + i * 8 - recoil * 6, -10 + idleBob, 4, 8, isCyber ? '#f43f5e' : '#22d3ee', 1);
      }
      drawMuzzleFlash(38 - recoil * 6, -6.5 + idleBob, 12);
      drawVehicleSkinDetails(-4, -8 + idleBob, 4);
      break;

    case 'SP': // Self-Propelled Howitzer
      drawTracks(-25, 25, 8, 10);
      rect(-19, -7 + idleBob, 38, 16, cHull, 3);
      rect(-11, -15 + idleBob, 25, 9, cShadow, 2);
      line(2, -13 + idleBob, 24 - recoil * 3, -24 + idleBob, cDark, 5);
      line(21 - recoil * 3, -23 + idleBob, 28 - recoil * 3, -25 + idleBob, '#9aa59b', 2);
      rect(-16, -10 + idleBob, 7, 5, cAccent, 1);
      drawMuzzleFlash(30 - recoil * 3, -26 + idleBob, 10);
      drawVehicleSkinDetails(-4, -3 + idleBob, 4.5);
      break;

    case 'SH': // Shield Tank
      drawTracks(-22, 22, 7, 9);
      poly(cHull, -20, 7, -15, -4 + idleBob, 16, -4 + idleBob, 21, 5 + idleBob, 20, 7);
      rect(-8, -12 + idleBob, 17, 9, cShadow, 2);
      rect(-8, -12 + idleBob, 17, 3, cAccent, 1);
      line(6, -8 + idleBob, 26 - recoil * 4, -8 + idleBob, cDark, 3);
      line(6, -5 + idleBob, 26 - recoil * 4, -5 + idleBob, cDark, 3);

      // Holographic protective energy dome
      ctx.strokeStyle = isNeko
        ? 'rgba(244, 114, 182, 0.85)'
        : 'rgba(56, 189, 248, ' + (0.5 + 0.3 * Math.abs(sin(animTime / 120))) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(20, -2 + idleBob, 14, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();
      drawMuzzleFlash(28, -6.5 + idleBob, 8);
      drawVehicleSkinDetails(-1, -7 + idleBob, 4);
      break;

    case 'DW': // Dreadnought Walker
      const legStride = sin(walkCycle * 3) * 6;
      line(-14, 2, -18 - legStride, 16, '#182024', 4);
      line(-6, 2, -10 + legStride, 16, cDark, 4);
      line(6, 2, 10 - legStride, 16, cDark, 4);
      line(14, 2, 18 + legStride, 16, '#182024', 4);

      rect(-16, -16 + idleBob, 32, 18, cHull, 3);
      rect(-12, -10 + idleBob, 24, 3, cAccent, 0);
      rect(4, -14 + idleBob, 8, 3, isNeko ? '#f472b6' : '#ef4444', 1);
      line(6 - recoil * 5, -5 + idleBob, 28 - recoil * 5, -5 + idleBob, cDark, 3.5);
      line(6 - recoil * 5, -1 + idleBob, 28 - recoil * 5, -1 + idleBob, cDark, 3.5);
      rect(-10, -22 + idleBob, 12, 6, cShadow, 1);
      drawMuzzleFlash(30 - recoil * 5, -3 + idleBob, 11);
      drawVehicleSkinDetails(0, -6 + idleBob, 4.5);
      break;

    case 'GS': // Goliath Fortress Supertank
      drawTracks(-27, 27, 5, 14);
      rect(-27, -8 + idleBob, 54, 14, cHull, 3);
      poly(cMetal, 27, -8 + idleBob, 34, idleBob, 27, 6 + idleBob);
      rect(-23, -14 + idleBob, 46, 7, cShadow, 2);
      rect(-19, -4 + idleBob, 38, 3, cAccent, 0);

      // Secondary turrets
      rect(-18, -12 + idleBob, 8, 5, '#1e2522', 1);
      line(-14, -10 + idleBob, -6, -10 + idleBob, cDark, 2);
      rect(12, -12 + idleBob, 8, 5, '#1e2522', 1);
      line(16, -10 + idleBob, 24, -10 + idleBob, cDark, 2);

      // Primary heavy fortress turret
      rect(-12, -22 + idleBob, 24, 12, cShadow, 3);
      rect(10 - recoil * 9, -19 + idleBob, 34, 6, cDark, 2);
      rect(44 - recoil * 9, -21 + idleBob, 5, 10, cShadow, 1);
      rect(-6, -26 + idleBob, 12, 5, '#b45309', 1); // Missile pod
      drawMuzzleFlash(48 - recoil * 9, -16 + idleBob, 13);
      drawVehicleSkinDetails(-1, -7 + idleBob, 5.5);
      break;

    case 'U': // Flak Halftrack
      drawWheel(-15, 8, 5.5);
      drawTracks(-5, 22, 6, 8);
      rect(-18, -2 + idleBob, 38, 9, cHull, 2);
      rect(-14, -8 + idleBob, 14, 7, cAccent, 1);

      ctx.save();
      ctx.translate(6, -8 + idleBob);
      ctx.rotate(-0.45);
      line(-recoil * 4, -2, 24 - recoil * 4, -2, cDark, 2.5);
      line(-recoil * 4, 2, 24 - recoil * 4, 2, cDark, 2.5);
      ctx.restore();
      drawMuzzleFlash(24, -18 + idleBob, 8);
      drawVehicleSkinDetails(-7, 2 + idleBob, 3.5);
      break;

    case 'HF': // Heavy Flak Battery (Dual heavy 88mm anti-air tracked battery - EXPLICITLY REQUESTED)
      drawTracks(-24, 24, 6, 10);
      poly(cHull, -24, 6, -18, -6 + idleBob, 18, -6 + idleBob, 24, 6);
      rect(-20, 1 + idleBob, 40, 6, cShadow, 2);
      rect(-15, -12 + idleBob, 22, 10, cShadow, 3);
      rect(-15, -12 + idleBob, 22, 2.5, cAccent, 1);

      // Dual heavy flak autocannons elevated at steep anti-air angle
      ctx.save();
      ctx.translate(4, -8 + idleBob);
      ctx.rotate(-0.84); // ~48 deg upward angle
      const flakRecoil = recoil * 8;
      line(-flakRecoil, -4, 34 - flakRecoil, -4, cDark, 3.8);
      line(-flakRecoil, 4, 34 - flakRecoil, 4, cDark, 3.8);
      // Twin slotted flak muzzle brakes
      rect(32 - flakRecoil, -6, 5, 4.5, cMetal, 1);
      rect(32 - flakRecoil, 2, 5, 4.5, cMetal, 1);
      rect(8 - flakRecoil, -6, 12, 3, cShadow, 1);
      rect(8 - flakRecoil, 3, 12, 3, cShadow, 1);
      drawMuzzleFlash(38 - flakRecoil, 0, 12);
      ctx.restore();

      // Ammo feed drum & radar tracking optic on roof
      circle(-6, -15 + idleBob, 4.5, cDark);
      rect(-9, -17 + idleBob, 6, 4, cMetal, 1);
      line(6, -14 + idleBob, 6, -22 + idleBob, cMetal, 1.6);
      circle(6, -23 + idleBob, 2, isCyber ? '#22d3ee' : '#f59e0b');
      drawVehicleSkinDetails(-4, -1 + idleBob, 4.5);
      break;

    case 'L': // Mobile Rocket Launcher (MLRS / Katyusha / HIMARS)
      drawTracks(-22, 22, 7, 9);
      rect(-20, -5 + idleBob, 40, 13, cHull, 3);
      rect(-16, -11 + idleBob, 12, 7, cShadow, 2);
      rect(-16, -11 + idleBob, 12, 2, cAccent, 1);

      // Elevating rocket pod angled upward ~35 deg
      ctx.save();
      ctx.translate(-4, -6 + idleBob);
      ctx.rotate(-0.4);
      rect(-16 - recoil * 5, -8, 32, 14, cDark, 2);
      rect(-16 - recoil * 5, -8, 32, 3, cShadow, 1);
      for (let ty = -5; ty <= 2; ty += 4) {
        for (let tx = 8; tx <= 14; tx += 6) {
          circle(tx - recoil * 5, ty + 1.5, 2.2, '#1e293b');
          poly('#ea580c', tx + 2 - recoil * 5, ty + 1.5, tx + 6 - recoil * 5, ty + 0.5, tx + 6 - recoil * 5, ty + 2.5);
        }
      }
      if (recoil > 0.3) {
        circle(-22 - recoil * 8, 0, 7 * recoil, 'rgba(249, 115, 22, 0.8)');
        circle(-28 - recoil * 8, 2, 9 * recoil, 'rgba(100, 116, 139, 0.6)');
      }
      drawMuzzleFlash(18 - recoil * 5, -1, 10);
      ctx.restore();
      drawVehicleSkinDetails(-10, 2 + idleBob, 4);
      break;

    case 'E': // EMP Jammer Vehicle
      drawTracks(-21, 21, 7, 9);
      rect(-19, -6 + idleBob, 38, 14, cHull, 3);
      rect(-12, -12 + idleBob, 24, 7, cShadow, 2);
      rect(-12, -12 + idleBob, 24, 2, cAccent, 1);

      // Rotating electromagnetic parabolic dish
      ctx.save();
      ctx.translate(2, -16 + idleBob);
      const dishAngle = animTime / 350;
      ctx.rotate(Math.sin(dishAngle) * 0.4 - 0.2);
      rect(-3, 0, 6, 6, cDark, 1);
      ctx.strokeStyle = isCyber ? '#22d3ee' : '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -6, 12, Math.PI * 0.8, Math.PI * 1.6);
      ctx.stroke();
      line(0, -6, 8, -6, cMetal, 2);
      circle(8, -6, 2.5, isCyber ? '#f43f5e' : '#38bdf8');

      // Expanding electromagnetic pulse rings
      const pulseK = (animTime / 400) % 1;
      ctx.strokeStyle = `rgba(34, 211, 238, ${0.8 * (1 - pulseK)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(8, -6, 6 + pulseK * 18, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();
      ctx.restore();
      drawVehicleSkinDetails(-4, 0 + idleBob, 4);
      break;

    case 'SR': // Siege Ram Carrier (Hydraulic kinetic battering ram)
      drawTracks(-25, 25, 6, 11);
      rect(-24, -8 + idleBob, 44, 16, cHull, 4);
      rect(-18, -14 + idleBob, 28, 8, cShadow, 2);
      rect(-18, -14 + idleBob, 28, 2.5, cAccent, 1);
      poly(cDark, 12, -10 + idleBob, 22, -4 + idleBob, 22, 10 + idleBob, 12, 8 + idleBob);
      const ramPiston = recoil * 14;
      line(14, -3 + idleBob, 28 + ramPiston, -3 + idleBob, cMetal, 4);
      line(14, 5 + idleBob, 28 + ramPiston, 5 + idleBob, cMetal, 4);
      poly(
        '#1f2937',
        28 + ramPiston, -9 + idleBob,
        38 + ramPiston, idleBob,
        28 + ramPiston, 11 + idleBob,
        25 + ramPiston, 1 + idleBob
      );
      poly(cAccent, 28 + ramPiston, -7 + idleBob, 36 + ramPiston, idleBob, 28 + ramPiston, 9 + idleBob);
      if (recoil > 0.4) {
        circle(38 + ramPiston, idleBob, 10 * recoil, 'rgba(251, 191, 36, 0.7)');
        line(38 + ramPiston, -8, 46 + ramPiston, -12, '#fbbf24', 2);
        line(38 + ramPiston, 8, 46 + ramPiston, 12, '#fbbf24', 2);
      }
      drawVehicleSkinDetails(-4, -6 + idleBob, 4.5);
      break;

    case 'NS': // Nanite Swarm Hive (Drone carrier with orbiting nanobots)
      const nsFloat = sin(animTime / 180) * 2;
      drawTracks(-20, 20, 7 + nsFloat, 9);
      poly(
        cHull,
        -18, -4 + idleBob + nsFloat,
        -10, -14 + idleBob + nsFloat,
        10, -14 + idleBob + nsFloat,
        18, -4 + idleBob + nsFloat,
        14, 8 + idleBob + nsFloat,
        -14, 8 + idleBob + nsFloat
      );
      rect(-8, -10 + idleBob + nsFloat, 16, 12, cShadow, 2);
      const corePulse = 0.5 + 0.5 * Math.sin(animTime / 120);
      circle(0, -4 + idleBob + nsFloat, 4.5 + corePulse * 1.5, isNeko ? '#f472b6' : '#22d3ee');
      circle(0, -4 + idleBob + nsFloat, 2.5, '#ffffff');

      for (let i = 0; i < 4; i++) {
        const orbitA = animTime / 240 + (i * Math.PI) / 2;
        const ox = Math.cos(orbitA) * 22;
        const oy = Math.sin(orbitA) * 11 - 4 + idleBob + nsFloat;
        circle(ox, oy, 2.2, isNeko ? '#f472b6' : '#38bdf8');
        circle(ox, oy, 1, '#ffffff');
        line(ox * 0.7, oy * 0.7, ox, oy, isNeko ? 'rgba(244,114,182,0.4)' : 'rgba(56,189,248,0.4)', 1);
      }
      drawVehicleSkinDetails(0, -14 + idleBob + nsFloat, 3.5);
      break;

    case 'Q': // Hovercraft Raider
      const hoverFloat = breath * 1.2;
      poly(cHull, -22, 8 + hoverFloat, -16, -2 + hoverFloat, 16, -2 + hoverFloat, 22, 8 + hoverFloat);
      rect(-24, 6 + hoverFloat, 48, 5, '#161a1d', 3);
      rect(-12, -8 + hoverFloat, 24, 7, cAccent, 2);
      rect(2, -6 + hoverFloat, 8, 4, cGlass, 1);

      // Air cushion skirt glow
      ctx.strokeStyle = isNeko ? 'rgba(244,114,182,0.6)' : 'rgba(56,189,248,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 12 + hoverFloat, 22, 4, 0, 0, Math.PI * 2);
      ctx.stroke();

      line(12 - recoil * 3, -4 + hoverFloat, 24 - recoil * 3, -4 + hoverFloat, cDark, 2.5);
      drawMuzzleFlash(26, -4 + hoverFloat, 6);
      drawVehicleSkinDetails(0, -8 + hoverFloat, 4);
      break;

    // --- AVIATION UNITS ---
    case 'V': // Strike Drone (High-speed suicide kamikaze drone)
      const droneFloat = sin(animTime / 120) * 2.5;
      poly(cHull, 16, droneFloat, 4, -9 + droneFloat, -14, -12 + droneFloat, -10, droneFloat, -14, 12 + droneFloat, 4, 9 + droneFloat);
      poly(cAccent, -2, -3 + droneFloat, 6, droneFloat, -2, 3 + droneFloat);
      circle(12, droneFloat, 2.5, '#ef4444'); // suicide sensor warhead
      line(-10, -5 + droneFloat, -18, -14 + droneFloat, cMetal, 1.5);
      line(-10, 5 + droneFloat, -18, 14 + droneFloat, cMetal, 1.5);
      ellipse(-12, droneFloat, 3, 2 + Math.abs(cos(animTime / 18)) * 4, 'rgba(239, 68, 68, 0.8)');
      drawVehicleSkinDetails(0, droneFloat, 3);
      break;

    case 'Y': // Attack Gunship (Heavy attack helicopter with twin rotors & Hellfire missiles)
      const gunshipHover = -4 + sin(animTime / 200) * 3;
      // Tail boom and tail rotor
      line(-6, gunshipHover + 2, -26, gunshipHover + 2, cShadow, 3.5);
      line(-26, gunshipHover - 4, -26, gunshipHover + 8, cDark, 2);
      circle(-26, gunshipHover - 4 + sin(animTime / 30) * 4, 2, cMetal);
      // Main fuselage
      ellipse(2, gunshipHover, 18, 9, cHull);
      poly(cGlass, 10, -4 + gunshipHover, 19, -1 + gunshipHover, 11, 3 + gunshipHover);
      rect(-2, 4 + gunshipHover, 10, 3, cAccent, 1);
      // Stub wings with Hellfire missile pods
      line(-2, gunshipHover - 2, 4, gunshipHover - 11, cDark, 3);
      rect(1, gunshipHover - 13, 10, 3.5, '#1e293b', 1);
      line(-2, gunshipHover + 2, 4, gunshipHover + 11, cDark, 3);
      rect(1, gunshipHover + 9.5, 10, 3.5, '#1e293b', 1);
      // Chin 30mm chain gun
      line(14, gunshipHover + 5, 24 - recoil * 4, gunshipHover + 6, cDark, 2.5);
      drawMuzzleFlash(26 - recoil * 4, gunshipHover + 6, 7);
      // Spinning main rotor mast & blades
      line(0, gunshipHover - 7, 0, gunshipHover - 12, cDark, 2.5);
      const rotorSpan = cos(animTime / 25) * 32;
      line(-rotorSpan, gunshipHover - 12, rotorSpan, gunshipHover - 12, 'rgba(25,30,32,.95)', 2.6);
      ellipse(0, gunshipHover - 12, 32, 2.4, 'rgba(210,220,215,.25)');
      drawVehicleSkinDetails(0, gunshipHover - 1, 4);
      break;

    case 'F': // Heavy Bomber (Strategic carpet bombing platform)
      const bFloat = breath;
      // Fuselage & multi-engine wings
      rect(-31, -3 + bFloat, 20, 4, cShadow, 1);
      poly(cAccent, -31, -3 + bFloat, -35, -13 + bFloat, -27, -3 + bFloat);
      ellipse(-32, -8 + bFloat, 2, 3 + Math.abs(sin(animTime / 20)) * 4, 'rgba(210,220,215,.5)');
      ellipse(0, bFloat, 22, 10, cHull);
      poly(cGlass, 10, -5 + bFloat, 19, -1 + bFloat, 10, 2 + bFloat);
      rect(-6, 6 + bFloat, 13, 4, cAccent, 1);
      // Dual wing engines with spinning propellers
      line(-12, 14 + bFloat, 14, 14 + bFloat, cDark, 2.2);
      line(-6, 7 + bFloat, -6, 14 + bFloat, cDark, 2);
      line(6, 8 + bFloat, 6, 14 + bFloat, cDark, 2);
      const bProp = cos(animTime / 32) * 26;
      line(-bProp, -14 + bFloat, bProp, -14 + bFloat, 'rgba(25,30,32,.9)', 2.4);
      ellipse(0, -14 + bFloat, 26, 2.4, 'rgba(210,220,215,.25)');
      // Bomb bay doors
      rect(-8, 1 + bFloat, 16, 5, cDark, 1);
      if (recoil > 0.3) {
        circle(0, 9 + bFloat, 5 * recoil, '#ea580c');
      }
      drawVehicleSkinDetails(-4, bFloat, 4.5);
      break;

    case 'SB': // Stealth Bomber (B-2 Spirit radar-absorbent flying wing)
      const sbFloat = breath;
      poly(
        isStealth ? '#0f1316' : cHull,
        -32, 6 + sbFloat,
        -12, -12 + sbFloat,
        0, -16 + sbFloat,
        12, -12 + sbFloat,
        32, 6 + sbFloat,
        18, 10 + sbFloat,
        8, 4 + sbFloat,
        0, 11 + sbFloat,
        -8, 4 + sbFloat,
        -18, 10 + sbFloat
      );
      poly(cShadow, -22, 4 + sbFloat, 0, -13 + sbFloat, 22, 4 + sbFloat, 0, 7 + sbFloat);
      poly(cGlass, -4, -10 + sbFloat, 4, -10 + sbFloat, 2, -6 + sbFloat, -2, -6 + sbFloat);
      rect(-6, -1 + sbFloat, 12, 6, cDark, 1);
      rect(-5, 0 + sbFloat, 10, 4, isStealth ? '#ef4444' : isCyber ? '#22d3ee' : '#f59e0b', 0.5);
      drawVehicleSkinDetails(0, -2 + sbFloat, 4.5);
      break;

    case 'IJ': // Interceptor Jet (Supersonic tactical jet fighter - EXPLICITLY REQUESTED)
      const ijFloat = breath * 1.1;
      // Fuselage and pointed supersonic nose
      poly(
        cHull,
        34, ijFloat,
        20, -5 + ijFloat,
        0, -6 + ijFloat,
        -18, -5 + ijFloat,
        -26, -5 + ijFloat,
        -26, 5 + ijFloat,
        -18, 5 + ijFloat,
        0, 6 + ijFloat,
        20, 5 + ijFloat
      );

      // Swept delta wings
      poly(
        cShadow,
        6, -5 + ijFloat,
        -14, -24 + ijFloat,
        -20, -24 + ijFloat,
        -12, -5 + ijFloat
      );
      poly(
        cShadow,
        6, 5 + ijFloat,
        -14, 24 + ijFloat,
        -20, 24 + ijFloat,
        -12, 5 + ijFloat
      );

      // Wingtip Sidewinder Missiles
      rect(-22, -26 + ijFloat, 12, 2.4, '#1b2328', 1);
      poly('#ef4444', -10, -25 + ijFloat, -7, -24.8 + ijFloat, -10, -22.6 + ijFloat);
      rect(-22, 24 + ijFloat, 12, 2.4, '#1b2328', 1);
      poly('#ef4444', -10, 25 + ijFloat, -7, 24.8 + ijFloat, -10, 22.6 + ijFloat);

      // Twin canted vertical stabilizers
      poly(cAccent, -16, -5 + ijFloat, -25, -16 + ijFloat, -20, -16 + ijFloat, -12, -5 + ijFloat);
      poly(cAccent, -16, 5 + ijFloat, -25, 16 + ijFloat, -20, 16 + ijFloat, -12, 5 + ijFloat);

      // Bubble cockpit canopy
      poly(cGlass, 14, -3 + ijFloat, 24, ijFloat, 14, 3 + ijFloat, 8, ijFloat);
      line(10, ijFloat, 20, ijFloat, '#ffffff', 1.2);

      // Twin supersonic afterburners with pulsating exhaust diamonds
      const abPulse = Math.abs(cos(animTime / 18));
      const abLen = 14 + abPulse * 16;
      ellipse(-27 - abLen / 2, -2.5 + ijFloat, abLen / 2, 2.5, isCyber ? '#22d3ee' : isNeko ? '#f472b6' : '#38bdf8');
      ellipse(-27 - abLen * 0.35, -2.5 + ijFloat, abLen * 0.25, 1.2, '#ffffff');
      ellipse(-27 - abLen / 2, 2.5 + ijFloat, abLen / 2, 2.5, isCyber ? '#22d3ee' : isNeko ? '#f472b6' : '#38bdf8');
      ellipse(-27 - abLen * 0.35, 2.5 + ijFloat, abLen * 0.25, 1.2, '#ffffff');

      // Vulcan nose cannon muzzle flash
      drawMuzzleFlash(36, ijFloat, 8);
      drawVehicleSkinDetails(-4, ijFloat, 4.5);
      break;

    // --- STRUCTURES ---
    case 'H': // Command HQ
      rect(-23, -2, 46, 18, '#2a3134', 2);
      rect(-23, -2, 46, 4, cAccent, 0);
      rect(-17, -14, 34, 13, '#38413f', 2);
      for (let i = 0; i < 4; i++) {
        rect(-13 + i * 8, -10, 5, 4, `rgba(230,185,100,${0.65 + 0.3 * sin(animTime / 400 + i)})`, 1);
      }
      rect(-19, -17, 38, 4, cShadow, 1);

      // Rotating Radar Dish
      ctx.save();
      ctx.translate(11, -22);
      ctx.rotate(animTime / 600);
      line(-9, 0, 9, 0, cMetal, 2);
      circle(0, 0, 2.6, cDark);
      ctx.restore();

      line(-13, -17, -13, -33, cMetal, 1.6);
      circle(-13, -34, 2.6, sin(animTime / 250) > 0 ? '#e0554a' : '#4a2a26');
      line(19, -17, 19, -31, cMetal, 1.6);
      poly(cAccent, 19, -31, 30 + sin(animTime / 170) * 1.5, -28 + sin(animTime / 130), 19, -24);
      drawVehicleSkinDetails(-2, 6, 4.5);
      break;

    case 'O': // Forward Outpost
      for (let i = 0; i < 5; i++) {
        rect(-19 + i * 8, 7, 9, 6, '#8a7a55', 3);
      }
      rect(-3, -14, 6, 21, '#4a4338', 1);
      rect(-10, -19, 20, 6, '#5a5143', 1);
      poly('#3a342b', -12, -19, 0, -27, 12, -19);
      line(0, -27, 0, -36, cMetal, 1.4);
      poly(cAccent, 0, -36, 10, -33.5 + sin(animTime / 160) * 2, 0, -30);
      break;

    case 'W': // Military Barracks
      rect(-24, -3, 48, 19, '#3a403a', 2);
      poly('#2b3230', -27, -3, -19, -14, 19, -14, 27, -3);
      rect(-27, -5, 54, 3, cAccent, 0);
      rect(-4, 6, 8, 10, '#14181a', 1);
      for (const rx of [-17, 11]) {
        rect(rx, 3, 7, 5, 'rgba(230,185,100,.7)', 1);
      }
      rect(15, 10, 8, 6, '#7a6a45', 1);
      line(22, -3, 22, -24, cMetal, 1.4);
      poly(cAccent, 22, -24, 31, -22 + sin(animTime / 150) * 1.5, 22, -18);
      break;

    default:
      // Fallback: Default infantry squad
      drawInfantryBase(cHull, cShadow, () => drawRifle(17));
      break;
  }

  // --- AMBIENT SKIN ATMOSPHERIC EFFECTS ---
  const heavyArmorCodes = ['M', 'B', 'J', 'A', 'D', 'AT', 'AC', 'FC', 'SP', 'SH', 'DW', 'GS', 'HF', 'SR', 'L', 'E', 'NS', 'U'];
  if (isWw2Britain || isWw2Germany) {
    if (heavyArmorCodes.includes(unitCode)) {
      const smokeCycle = (animTime / 110) % 10;
      for (let m = 0; m < 2; m++) {
        const sx = -25 - smokeCycle * 1.6 - m * 5;
        const sy = -5 + idleBob - smokeCycle * 0.7 - m * 2;
        const op = Math.max(0, 0.5 - (smokeCycle / 10) * 0.45);
        circle(sx, sy, 3.2 + smokeCycle * 0.45, `rgba(55, 65, 75, ${op})`);
      }
    }
  } else if (isNeko) {
    if ([...heavyArmorCodes, 'C', 'Q', 'V', 'IJ', 'SB'].includes(unitCode)) {
      const sparkleCycle = (animTime / 140) % 10;
      const sx = -24 - sparkleCycle * 1.8;
      const sy = -5 + idleBob - sparkleCycle * 0.6;
      const op = Math.max(0, 0.7 - (sparkleCycle / 10) * 0.65);
      circle(sx, sy, 2.5 + sparkleCycle * 0.4, `rgba(244, 114, 182, ${op})`);
    }
  } else if (isGuP) {
    if (heavyArmorCodes.includes(unitCode)) {
      const gupCycle = (animTime / 220) % 10;
      for (let m = 0; m < 2; m++) {
        const px = (m === 0 ? -12 : 10) + sin(animTime / 160 + m) * 6;
        const py = -16 + idleBob - gupCycle * 2.2;
        const op = Math.max(0, 0.65 - (gupCycle / 10) * 0.55);
        circle(px, py, 2.8 + gupCycle * 0.5, `rgba(180, 190, 175, ${op})`);
      }
    }
  } else if (isCyber) {
    // Floating Holographic Targeting HUD Reticle above Turret!
    const hudAngle = animTime / 350;
    const hudY = -22 + idleBob;
    ctx.save();
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.75)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(0, hudY, 7.5, 0, Math.PI * 2);
    ctx.stroke();
    for (let p = 0; p < 4; p++) {
      const a = hudAngle + (p * Math.PI) / 2;
      line(cos(a) * 5.5, hudY + sin(a) * 5.5, cos(a) * 9, hudY + sin(a) * 9, 'rgba(244, 63, 94, 0.85)', 1.5);
    }
    ctx.restore();
  } else if (isStealth) {
    // Crimson Infrared Laser Aim Line
    const laserAlpha = 0.5 + 0.4 * Math.abs(sin(animTime / 250));
    line(14, -8 + idleBob, 38, -8 + idleBob, `rgba(239, 68, 68, ${laserAlpha * 0.6})`, 1);
  } else if (isArctic) {
    // Cold Frosty Vapor Puffs
    const frostCycle = (animTime / 200) % 8;
    for (let m = 0; m < 2; m++) {
      const px = (m === 0 ? -10 : 8) + sin(animTime / 300 + m) * 3;
      const py = -14 + idleBob - frostCycle * 1.8;
      const op = Math.max(0, 0.4 - (frostCycle / 8) * 0.35);
      circle(px, py, 2.5 + frostCycle * 0.6, `rgba(224, 242, 254, ${op})`);
    }
  } else if (isDesert && isMoving) {
    // Swirling Arid Dust Cloud behind Treads
    const dustCycle = (animTime / 80) % 6;
    for (let m = 0; m < 2; m++) {
      const px = -16 - dustCycle * 2.5 - m * 5;
      const py = 12 - dustCycle * 1.2;
      circle(px, py, 2 + dustCycle * 0.4, `rgba(212, 163, 115, ${0.5 - (dustCycle / 6) * 0.4})`);
    }
  } else if (isModernUsa) {
    // Laser pointer dot on target
    const dotAlpha = 0.5 + 0.45 * Math.abs(sin(animTime / 180));
    line(18, -6 + idleBob, 46, -6 + idleBob, `rgba(34, 197, 94, ${dotAlpha * 0.7})`, 1.2);
    circle(46, -6 + idleBob, 1.4, 'rgba(34, 197, 94, 0.95)');
  }
}
