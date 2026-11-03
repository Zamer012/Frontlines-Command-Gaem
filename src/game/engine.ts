import {
  PlacedUnit,
  UnitBlueprint,
  UnitAbility,
  PlayerProfile,
  CampaignMission,
  TerrainTileType,
  MinePosition,
  BotDifficulty,
  ReinforcementWave,
} from '../types/game';
import {
  UNIT_BLUEPRINTS,
  isAirUnit,
  isHeavyVehicle,
} from '../data/units';
import { FACTION_NAMES, FACTION_COLORS } from '../data/skins';
import { AudioService } from '../services/audio';

export interface ReachNode {
  x: number;
  y: number;
  p: string | null;
}

export interface GameEngineInitParams {
  mapSize: number;
  playersCount: number;
  humanFactions: number[];
  startingGold?: number[];
  autoDeploy?: boolean;
  fogOfWar?: boolean;
  difficulty?: BotDifficulty;
  mapTheme?: 'standard' | 'forest' | 'trenches' | 'river' | 'ruins';
  baseLayout?: 'standard' | 'diagonal' | 'flank' | 'asymmetric' | 'corners';
  customHqPositions?: Array<{ x: number; y: number }>;
  customMines?: MinePosition[];
  customObstacles?: Array<{ x: number; y: number; type: TerrainTileType }>;
  preplacedUnits?: Array<{
    t: string;
    o: number;
    x: number;
    y: number;
    hp?: number;
    maxHp?: number;
    isVip?: boolean;
    isDefendTarget?: boolean;
    name?: string;
  }>;
  campaignMissionId?: string;
  campaignMission?: CampaignMission;
  enemySkin?: string;
  factionSkins?: Record<number, string>;
  isCampaign?: boolean;
  noPlayerHq?: boolean;
  customDeployTiles?: Array<{ x: number; y: number }>;
  storyNodeId?: string;
  reinforcementWaves?: ReinforcementWave[];
  holdoutTurns?: number;
}

export class GameEngine {
  public N: number = 15;
  public C: number = 50; // tile size in px
  public difficulty: BotDifficulty = 'normal';
  public mapTheme: 'standard' | 'forest' | 'trenches' | 'river' | 'ruins' = 'standard';
  public factionSkins: Record<number, string> = {};
  public noPlayerHq: boolean = false;
  public customDeployTiles: Array<[number, number]> = [];
  public storyNodeId: string | null = null;
  public reinforcementWaves: ReinforcementWave[] = [];
  public U: PlacedUnit[] = [];
  public ob: TerrainTileType[][] = [];
  public mines: MinePosition[] = [];
  public gold: number[] = [24, 24];
  public cur: number = 0;
  public view: number = 0;
  public ph: 'setup' | 'play' = 'setup';
  public turn: number = 1;
  public alive: boolean[] = [true, true];
  public ctrl: boolean[] = [false, true];
  public NP: number = 2;
  public sel: PlacedUnit | null = null;
  public sp: string | null = null;
  public busy: boolean = false;
  public over: boolean = false;
  public winner: number | null = null;
  public victoryReason: string = '';
  public fogOff: boolean = false;
  public note: string = '';
  public shake: number = 0;
  public flash: number = 0;
  public activeMission: CampaignMission | null = null;
  public holdoutTurnsRemaining: number = 0;
  public defendTargets: PlacedUnit[] = [];
  public vipTargets: PlacedUnit[] = [];
  public initialVanguardCount: number = 0;
  public vanguardDestroyedCount: number = 0;
  public currentWaveIndex: number = 0;
  public spawnedWaveTurns: Set<number> = new Set();
  public cheatTainted: boolean = false;
  public pt: any[] = [];
  public fx: any[] = [];
  public scorch: any[] = [];
  public gen: number = 0;
  public paused: boolean = false;
  public gameSpeed: number = 1;
  public hl: {
    m: Map<string, ReachNode>;
    r: Array<[number, number]>;
    t: PlacedUnit[];
    s: Array<[number, number]>;
    c: PlacedUnit[];
    carryTargets: PlacedUnit[];
    unloadTiles: Array<[number, number]>;
  } = { m: new Map(), r: [], t: [], s: [], c: [], carryTargets: [], unloadTiles: [] };

  public profile: PlayerProfile | null = null;
  public missionId: string | null = null;
  public isCampaignMode: boolean = false;
  public turnCasualties: { friendly: number; enemy: number } = { friendly: 0, enemy: 0 };
  public totalFriendlyLosses: number = 0;
  public onStateChange?: () => void;
  public passPlayPending: boolean = false;
  public privacyShieldEnabled: boolean = true;

  constructor(profile?: PlayerProfile) {
    this.profile = profile || null;
  }

  public isPassAndPlay(): boolean {
    return this.ctrl.filter((isBot) => !isBot).length > 1;
  }

  public confirmPassAndPlayReady() {
    this.passPlayPending = false;
    this.view = this.cur;
    this.recalculateHighlights();
    this.triggerChange();
    AudioService.play('turnReady');
  }

  public setProfile(profile: PlayerProfile) {
    this.profile = profile;
  }

  public isUnitUnlocked(code: string): boolean {
    if (!this.profile) return true;
    return this.profile.unlockedUnits?.includes(code) ?? true;
  }

  public getUpgradeLevel(id: string): number {
    return this.profile?.purchasedUpgrades[id] || 0;
  }

  public getBlueprint(code: string): UnitBlueprint {
    return UNIT_BLUEPRINTS[code] || UNIT_BLUEPRINTS.R;
  }

  public isInfantry(u: { t: string }): boolean {
    const bp = this.getBlueprint(u.t);
    return !bp.bl && bp.fu == null;
  }

  public getCost(ab: UnitAbility): number {
    return ab.a ?? 1;
  }

  public canAffordAbility(u: PlacedUnit, ab: UnitAbility, abIndex?: number): boolean {
    if (ab.cd && (u.cd || 0) > 0) return false;
    const idx = abIndex !== undefined ? abIndex : (u.ai || 0);
    if (u.abAmmo && u.abAmmo[idx] !== undefined) {
      if (u.abAmmo[idx] <= 0) return false;
    } else if (u.am != null && u.am < this.getCost(ab)) {
      return false;
    }
    return true;
  }

  public getMaxHealth(code: string, owner: number): number {
    let hp = this.getBlueprint(code).hp;
    if (owner === 0 && this.profile) {
      if (this.isInfantry({ t: code })) {
        hp += this.getUpgradeLevel('upg_infantry_armor');
      }
      if (['M', 'B', 'J', 'SH', 'DW', 'GS', 'AT', 'SR', 'AC', 'FC'].includes(code)) {
        hp += this.getUpgradeLevel('upg_reactive_plating') * 2;
      }
    }
    return hp;
  }

  public getMaxAmmo(code: string, owner: number): number | undefined {
    const am = this.getBlueprint(code).am;
    if (am != null) {
      return owner === 0 && this.profile ? am + this.getUpgradeLevel('upg_extended_ammo') * 2 : am;
    }
    return undefined;
  }

  public getMaxFuel(code: string, owner: number): number | undefined {
    const fu = this.getBlueprint(code).fu;
    if (fu != null) {
      return owner === 0 && this.profile ? fu + this.getUpgradeLevel('upg_high_octane_fuel') * 3 : fu;
    }
    return undefined;
  }

  public getMoveReach(u: PlacedUnit): number {
    let mv = this.getBlueprint(u.t).mv;
    if (u.o === 0 && this.profile) {
      if (u.t === 'V' || u.t === 'IJ') {
        mv += this.getUpgradeLevel('upg_drone_overdrive');
      }
      if (u.t === 'AT' || u.t === 'AC') {
        mv += this.getUpgradeLevel('upg_transport_speed');
      }
    }
    return Math.min(mv, u.fu ?? 99);
  }

  public getVisionReach(u: PlacedUnit): number {
    let v = this.getBlueprint(u.t).v;
    if (u.o === 0 && this.profile) {
      v += this.getUpgradeLevel('upg_radar_recon');
    }
    return v;
  }

  public inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.N && y < this.N;
  }

  public unitAt(x: number, y: number): PlacedUnit | undefined {
    return this.U.find((u) => u.hp > 0 && u.x === x && u.y === y);
  }

  public addUnit(t: string, o: number, x: number, y: number): PlacedUnit {
    const bp = this.getBlueprint(t);
    const maxHp = this.getMaxHealth(t, o);
    const maxFu = this.getMaxFuel(t, o);
    const maxAm = this.getMaxAmmo(t, o);

    const maxAbAmmo: number[] = [];
    const abAmmo: number[] = [];
    bp.ab.forEach((ability) => {
      let cap: number;
      if (ability.f.includes('c') || ability.f.includes('uo') || ability.a === 0) {
        cap = 99; // unlimited utility / sidearm
      } else if (ability.a != null && ability.a > 0) {
        cap = ability.a;
        if (o === 0 && this.profile) {
          cap += this.getUpgradeLevel('upg_extended_ammo');
        }
      } else if (maxAm != null) {
        cap = maxAm;
      } else {
        cap = 6;
      }
      maxAbAmmo.push(cap);
      abAmmo.push(cap);
    });

    const unit: PlacedUnit = {
      id: `u_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      t,
      o,
      x,
      y,
      rx: x,
      ry: y,
      hp: maxHp,
      maxHp,
      fu: maxFu,
      maxFu,
      am: maxAm,
      maxAm,
      abAmmo,
      maxAbAmmo,
      attacksThisTurn: 0,
      moved: 0,
      acted: 0,
      cd: 0,
      spawnCd: 0,
      wx: 0,
      ph: Math.random() * 3000,
      dr: x < this.N / 2 ? 1 : -1,
      rc: 0,
      mw: 0,
      cargo: null,
    };
    this.U.push(unit);
    return unit;
  }

  public initMatch(params: GameEngineInitParams) {
    this.gen++;
    this.paused = false;
    this.N = params.mapSize;
    this.NP = params.playersCount;
    this.ctrl = Array(this.NP)
      .fill(true)
      .map((_, idx) => !params.humanFactions.includes(idx));
    this.alive = Array(this.NP).fill(true);
    this.over = false;
    this.winner = null;
    this.view = 0;
    this.cur = 0;
    this.turn = 1;
    this.sel = null;
    this.sp = null;
    this.busy = false;
    this.shake = 0;
    this.flash = 0;
    this.pt = [];
    this.fx = [];
    this.scorch = [];
    this.noPlayerHq = !!params.noPlayerHq;
    this.customDeployTiles = params.customDeployTiles ? params.customDeployTiles.map((p) => [p.x, p.y]) : [];
    this.storyNodeId = params.storyNodeId || null;
    this.missionId = params.campaignMissionId || null;
    this.isCampaignMode = !!params.campaignMissionId;
    this.difficulty = params.difficulty || 'normal';
    this.turnCasualties = { friendly: 0, enemy: 0 };
    this.totalFriendlyLosses = 0;
    this.cheatTainted = false;
    this.currentWaveIndex = 0;
    this.spawnedWaveTurns = new Set();
    this.factionSkins = {};

    if (this.isCampaignMode && params.campaignMission) {
      if (params.campaignMission.factionSkins) {
        this.factionSkins = { ...params.campaignMission.factionSkins };
      }
      if (params.campaignMission.enemySkin) {
        this.factionSkins[1] = params.campaignMission.enemySkin;
      }
    } else if (params.factionSkins) {
      this.factionSkins = { ...params.factionSkins };
    } else {
      this.factionSkins = {
        1: 'skin_ww2_germany',
        2: 'skin_modern_usa',
        3: 'skin_girls_und_panzer',
      };
    }

    this.ob = Array.from({ length: this.N }, () => Array(this.N).fill(0));

    // Base layout coordinates
    let hqPositions: Array<[number, number]> = [];
    const customHq = params.customHqPositions || params.campaignMission?.customHqPositions;

    if (customHq && customHq.length >= this.NP) {
      hqPositions = customHq.slice(0, this.NP).map((p) => [p.x, p.y]);
    } else if (this.NP === 4) {
      const margin = Math.max(1, Math.floor(this.N * 0.08));
      hqPositions = [
        [margin + 1, this.N - 2 - margin],
        [margin + 1, 1 + margin],
        [this.N - 2 - margin, 1 + margin],
        [this.N - 2 - margin, this.N - 2 - margin],
      ];
    } else if (this.NP === 3) {
      hqPositions = [
        [Math.floor(this.N / 2), this.N - 2],
        [Math.max(1, Math.floor(this.N * 0.15)), 1],
        [Math.min(this.N - 2, Math.floor(this.N * 0.85)), 1],
      ];
    } else {
      const layout = params.baseLayout || 'diagonal';
      if (layout === 'diagonal') {
        const x1 = Math.max(1, Math.floor(this.N * 0.12));
        const y1 = this.N - 2;
        const x2 = Math.min(this.N - 2, Math.floor(this.N * 0.88));
        hqPositions = [[x1, y1], [x2, 1]];
      } else if (layout === 'flank') {
        const x1 = Math.max(1, Math.floor(this.N * 0.22));
        const y1 = this.N - 2;
        const x2 = Math.min(this.N - 2, Math.floor(this.N * 0.78));
        hqPositions = [[x1, y1], [x2, 1]];
      } else {
        hqPositions = [
          [Math.floor(this.N / 2), this.N - 2],
          [Math.floor(this.N / 2), 1],
        ];
      }
    }

    // Forward mines / outposts
    if (params.customMines) {
      this.mines = params.customMines.map((m) => ({ x: m.x, y: m.y, w: !!m.w }));
    } else {
      const mid = Math.floor(this.N / 2);
      const offset = Math.max(2, Math.floor(this.N * 0.25));
      const minesList: MinePosition[] = [
        { x: mid - offset, y: mid, w: true },
        { x: mid + offset, y: mid, w: true },
        { x: mid, y: mid - offset, w: false },
        { x: mid, y: mid + offset, w: false },
      ];
      if (this.N >= 18) {
        minesList.push({ x: mid, y: mid, w: false });
      }
      this.mines = minesList.filter((m) => this.inBounds(m.x, m.y));
    }

    const mapTheme = params.mapTheme || params.campaignMission?.mapTheme || 'standard';
    this.mapTheme = mapTheme;

    // Terrain Obstacles & Bridges & Trenches
    if (params.customObstacles) {
      params.customObstacles.forEach((obs) => {
        if (this.inBounds(obs.x, obs.y)) {
          this.ob[obs.y][obs.x] = obs.type;
        }
      });
    } else {
      const midY = Math.floor(this.N / 2);
      const isProtected = (cx: number, cy: number) =>
        hqPositions.some(([hx, hy]) => Math.max(Math.abs(hx - cx), Math.abs(hy - cy)) <= 2) ||
        this.mines.some((m) => Math.max(Math.abs(m.x - cx), Math.abs(m.y - cy)) <= 1);

      if (mapTheme === 'forest') {
        const candidates: Array<[number, number]> = [];
        for (let y = 0; y < this.N; y++) {
          for (let x = 0; x < this.N; x++) {
            if (!isProtected(x, y)) {
              candidates.push([x, y]);
            }
          }
        }
        // Exactly 45% - 50% dense forest tiles across the battlefield
        const forestRatio = 0.45 + Math.random() * 0.05;
        const forestCount = Math.floor(candidates.length * forestRatio);
        for (let i = candidates.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }
        for (let i = 0; i < forestCount; i++) {
          const [fx, fy] = candidates[i];
          this.ob[fy][fx] = 5; // Dense Forest
        }
        // Remaining open tiles have slight mud/trenches, ruins, or boulders
        for (let i = forestCount; i < candidates.length; i++) {
          const [ox, oy] = candidates[i];
          const r = Math.random();
          if (r < 0.08) this.ob[oy][ox] = 4; // Mud / Trenches
          else if (r < 0.12) this.ob[oy][ox] = 2; // Concrete Ruins
          else if (r < 0.16) this.ob[oy][ox] = 1; // Boulders
        }
      } else if (mapTheme === 'trenches') {
        const candidates: Array<[number, number]> = [];
        for (let y = 0; y < this.N; y++) {
          for (let x = 0; x < this.N; x++) {
            if (!isProtected(x, y)) {
              candidates.push([x, y]);
            }
          }
        }
        // 35% - 40% trench tiles
        const trenchRatio = 0.35 + Math.random() * 0.05;
        const trenchCount = Math.floor(candidates.length * trenchRatio);
        for (let i = candidates.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }
        for (let i = 0; i < trenchCount; i++) {
          const [tx, ty] = candidates[i];
          this.ob[ty][tx] = 4; // Trench
        }
        for (let i = trenchCount; i < candidates.length; i++) {
          const [ox, oy] = candidates[i];
          const r = Math.random();
          if (r < 0.10) this.ob[oy][ox] = 1; // Boulders
          else if (r < 0.18) this.ob[oy][ox] = 2; // Concrete Ruins
          else if (r < 0.25) this.ob[oy][ox] = 5; // Forest pocket
        }
      } else if (mapTheme === 'ruins') {
        const candidates: Array<[number, number]> = [];
        for (let y = 0; y < this.N; y++) {
          for (let x = 0; x < this.N; x++) {
            if (!isProtected(x, y)) {
              candidates.push([x, y]);
            }
          }
        }
        const ruinCount = Math.floor(candidates.length * 0.35);
        for (let i = candidates.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }
        for (let i = 0; i < ruinCount; i++) {
          const [rx, ry] = candidates[i];
          this.ob[ry][rx] = 2; // Ruins
        }
        for (let i = ruinCount; i < candidates.length; i++) {
          const [ox, oy] = candidates[i];
          const r = Math.random();
          if (r < 0.12) this.ob[oy][ox] = 1; // Boulders
          else if (r < 0.20) this.ob[oy][ox] = 4; // Trenches
        }
      } else {
        // Standard or River crossing
        if ((this.NP === 2 && this.N >= 14) || mapTheme === 'river') {
          for (let x = 0; x < this.N; x++) {
            if (!isProtected(x, midY)) {
              // Leave bridges at 1/3 and 2/3
              const b1 = Math.floor(this.N * 0.3);
              const b2 = Math.floor(this.N * 0.7);
              if (x === b1 || x === b2) {
                this.ob[midY][x] = 6; // Bridge
              } else {
                this.ob[midY][x] = 3; // Water
              }
            }
          }
        }

        // Add rocky cover, ruins, trenches, and forests
        for (let y = 0; y < this.N; y++) {
          for (let x = 0; x < this.N; x++) {
            if (!isProtected(x, y) && !this.ob[y][x]) {
              const r = Math.random();
              if (r < 0.04) this.ob[y][x] = 1; // Boulders
              else if (r < 0.07) this.ob[y][x] = 2; // Concrete Ruins
              else if (r < 0.10) this.ob[y][x] = 4; // Mud / Trenches
              else if (r < 0.13) this.ob[y][x] = 5; // Dense Forest
            }
          }
        }
      }
    }

    // Initialize units
    this.U = [];
    for (let i = 0; i < this.NP; i++) {
      if (i === 0 && this.noPlayerHq) {
        // Player starts with no HQ (airborne drop or infiltration raid)
        continue;
      }
      const [hx, hy] = hqPositions[i];
      this.addUnit('H', i, hx, hy);
    }

    // Add neutral outposts / barracks
    this.mines.forEach((m) => {
      const b = this.addUnit(m.w ? 'W' : 'O', -1, m.x, m.y);
      b.hp = Math.ceil(this.getBlueprint(b.t).hp / 2);
    });

    this.defendTargets = [];
    this.vipTargets = [];
    this.initialVanguardCount = 0;
    this.vanguardDestroyedCount = 0;
    this.activeMission = params.campaignMission || null;

    if (params.preplacedUnits && params.preplacedUnits.length > 0) {
      params.preplacedUnits.forEach((u) => {
        if (!this.unitAt(u.x, u.y)) {
          const unit = this.addUnit(u.t, u.o, u.x, u.y);
          if (u.hp != null) {
            unit.hp = u.hp;
            unit.maxHp = u.maxHp || Math.max(unit.maxHp, u.hp);
          }
          if (u.isVip) {
            unit.isVip = true;
            this.vipTargets.push(unit);
          }
          if (u.isDefendTarget) {
            unit.isDefendTarget = true;
            this.defendTargets.push(unit);
          }
          if (u.name) {
            unit.customName = u.name;
          }
          if (u.o > 0 && !this.getBlueprint(u.t).bl) {
            this.initialVanguardCount++;
          }
        }
      });
    }

    this.reinforcementWaves = params.reinforcementWaves || params.campaignMission?.reinforcementWaves || [];
    if (params.holdoutTurns) {
      this.holdoutTurnsRemaining = params.holdoutTurns;
    } else if (this.activeMission?.objectiveType === 'holdout') {
      this.holdoutTurnsRemaining = this.activeMission.holdoutTurns || 10;
    }

    // Budget setup
    let starting = params.startingGold || Array(this.NP).fill(this.NP > 2 ? 48 : 24);
    if (this.profile) {
      const sub = this.getUpgradeLevel('upg_logistics_subsidy') * 6;
      starting[0] += sub;
    }
    this.gold = [...starting];

    const allBots = this.ctrl.every((c) => c);
    const autoDeploy = !!params.autoDeploy || allBots;

    if (params.fogOfWar !== undefined) {
      this.fogOff = !params.fogOfWar;
    } else if (allBots) {
      this.fogOff = true;
    }

    if (autoDeploy) {
      for (let p = 0; p < this.NP; p++) {
        this.botAutoDeploy(p);
      }
      this.beginCombat();
      if (this.ctrl[this.cur]) {
        setTimeout(() => {
          if (!this.over && this.ctrl[this.cur]) this.botTurn();
        }, 150);
      }
    } else {
      let firstHuman = 0;
      while (firstHuman < this.NP && this.ctrl[firstHuman]) {
        this.botAutoDeploy(firstHuman);
        firstHuman++;
      }
      if (firstHuman < this.NP) {
        this.cur = firstHuman;
        this.view = firstHuman;
        this.ph = 'setup';
        this.note = this.noPlayerHq
          ? 'Airborne / Raid Deployment: Position your strike force on marked drop tiles, then tap Ready.'
          : 'Deployment Phase: Position units adjacent to your HQ, then tap Ready.';
        this.recalculateHighlights();
        this.triggerChange();
      } else {
        this.beginCombat();
        setTimeout(() => {
          if (!this.over && this.ctrl[this.cur]) this.botTurn();
        }, 150);
      }
    }
  }

  public triggerChange() {
    this.onStateChange?.();
  }

  public getFactionSkin(faction: number): string {
    // Story or campaign missions explicitly set factionSkins (including player faction 0)
    if (this.factionSkins && this.factionSkins[faction]) {
      return this.factionSkins[faction];
    }
    if (faction === 0) {
      return this.profile?.activeSkin || 'skin_default';
    }
    if (faction < 0) return 'skin_default';

    if (this.isCampaignMode && this.activeMission) {
      if (this.activeMission.factionSkins && this.activeMission.factionSkins[faction]) {
        return this.activeMission.factionSkins[faction];
      }
      if (this.activeMission.enemySkin) {
        return this.activeMission.enemySkin;
      }
    }
    return this.factionSkins[faction] || (faction === 1 ? 'skin_ww2_germany' : faction === 2 ? 'skin_modern_usa' : 'skin_girls_und_panzer');
  }

  public getVisibilityMap(viewFaction: number): boolean[] {
    const vis = Array(this.N * this.N).fill(this.fogOff);
    if (this.fogOff) return vis;

    this.U.forEach((u) => {
      if (u.o !== viewFaction) return;
      const reach = this.getVisionReach(u) + 1;
      for (let y = u.y - reach; y <= u.y + reach; y++) {
        for (let x = u.x - reach; x <= u.x + reach; x++) {
          if (this.inBounds(x, y) && Math.abs(x - u.x) + Math.abs(y - u.y) <= reach) {
            vis[y * this.N + x] = true;
          }
        }
      }
    });
    return vis;
  }

  public reachMap(u: PlacedUnit): Map<string, ReachNode> {
    const map = new Map<string, ReachNode>([[u.x + ',' + u.y, { x: u.x, y: u.y, p: null }]]);
    const maxDist = this.getMoveReach(u);

    // Air units fly freely over everything except outside grid
    if (isAirUnit(u.t)) {
      for (let y = 0; y < this.N; y++) {
        for (let x = 0; x < this.N; x++) {
          if (Math.abs(x - u.x) + Math.abs(y - u.y) <= maxDist && !this.unitAt(x, y)) {
            map.set(x + ',' + y, { x, y, p: u.x + ',' + u.y });
          }
        }
      }
      return map;
    }

    const DIRS = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    let frontier = [[u.x, u.y]];

    for (let step = 0; step < maxDist; step++) {
      const nextFrontier: Array<[number, number]> = [];
      for (const [cx, cy] of frontier) {
        for (const [dx, dy] of DIRS) {
          const nx = cx + dx;
          const ny = cy + dy;
          const key = nx + ',' + ny;

          if (!this.inBounds(nx, ny) || map.has(key)) continue;

          const tile = this.ob[ny][nx];
          // Boulders (1), Ruins (2), Magma (7) block ground movement
          if (tile === 1 || tile === 2 || tile === 7) continue;

          // Water (3) blocks all ground units (no units can go over water tiles)
          if (tile === 3) continue;

          // Dense Forest (5) blocks heavy vehicles
          if (tile === 5 && isHeavyVehicle(u.t)) continue;

          // Mud / Trench (4) blocks heavy vehicles
          if (tile === 4 && isHeavyVehicle(u.t)) continue;

          // Unit blocking
          if (this.unitAt(nx, ny)) continue;

          map.set(key, { x: nx, y: ny, p: cx + ',' + cy });
          nextFrontier.push([nx, ny]);
        }
      }
      frontier = nextFrontier;
    }

    return map;
  }

  public hasForestBetween(x1: number, y1: number, x2: number, y2: number): boolean {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    for (let d = 1; d < steps; d++) {
      const tx = Math.round(x1 + ((x2 - x1) * d) / steps);
      const ty = Math.round(y1 + ((y2 - y1) * d) / steps);
      if (this.ob[ty]?.[tx] === 5) {
        return true;
      }
    }
    return false;
  }

  public hasLineOfSight(x1: number, y1: number, x2: number, y2: number): boolean {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    for (let d = 1; d < steps; d++) {
      const tx = Math.round(x1 + ((x2 - x1) * d) / steps);
      const ty = Math.round(y1 + ((y2 - y1) * d) / steps);
      const tile = this.ob[ty]?.[tx];
      // Boulders (1), Ruins (2), Forest (5), and Magma (7) block direct line of sight
      if (tile === 1 || tile === 2 || tile === 5 || tile === 7) {
        return false;
      }
    }
    return true;
  }

  public canTarget(u: PlacedUnit, x1: number, y1: number, x2: number, y2: number, ab?: UnitAbility): boolean {
    const ability = ab || this.getActiveAbility(u);
    if (!ability) return false;

    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const isDiag = ability.f.includes('d');
    const dist = isDiag ? Math.max(dx, dy) : dx + dy;

    if (!dist || dist > ability.rg) return false;
    if (isDiag && dx !== dy) return false;

    // Heavy vehicles cannot attack beyond forest tiles (even with indirect fire)
    if (isHeavyVehicle(u.t) && this.hasForestBetween(x1, y1, x2, y2)) {
      return false;
    }

    // Heavy vehicles CAN shoot beyond trench tiles (trench 4 is not blocked in line of sight)
    return ability.f.includes('i') || this.hasLineOfSight(x1, y1, x2, y2);
  }

  public getActiveAbility(u: PlacedUnit): UnitAbility | undefined {
    const bp = this.getBlueprint(u.t);
    return bp.ab[u.ai || 0] || bp.ab[0];
  }

  public getValidTargets(u: PlacedUnit, x: number = u.x, y: number = u.y, checkVis: boolean = true): PlacedUnit[] {
    const vis = checkVis ? this.getVisibilityMap(this.view) : null;
    const ab = this.getActiveAbility(u);
    if (!ab) return [];

    const isSupportOrHeal = ab.f.includes('h') || ab.f.includes('r') || ab.f.includes('c');
    const isBuilding = (other: PlacedUnit) => !!this.getBlueprint(other.t).bl;

    return this.U.filter((other) => {
      if (other.hp <= 0) return false;
      if (isSupportOrHeal) {
        // Must be friendly
        if (other.o !== u.o || !this.canTarget(u, x, y, other.x, other.y, ab)) return false;

        // Carry / Load logic
        if (ab.f.includes('c')) {
          return other !== u && this.isInfantry(other) && !u.cargo;
        }

        // Heal / Resupply logic
        if (ab.f.includes('h')) {
          const otherBp = this.getBlueprint(other.t);
          return (
            !isBuilding(other) &&
            (other.hp < other.maxHp ||
              (otherBp.fu != null && (other.fu ?? 0) < (other.maxFu ?? 0)) ||
              (otherBp.am != null && (other.am ?? 0) < (other.maxAm ?? 0)))
          );
        } else {
          // Repair
          return ab.f.includes('b')
            ? isBuilding(other) && other.hp < other.maxHp
            : !isBuilding(other) && other.hp < other.maxHp;
        }
      } else {
        // Hostile combat target
        if (other.o === u.o || (other.o < 0 && isBuilding(other))) return false;
        if (ab.f.includes('j') && (isBuilding(other) || other.fz)) return false;
        if (vis && !vis[other.y * this.N + other.x]) return false;
        return this.canTarget(u, x, y, other.x, other.y, ab);
      }
    });
  }

  public getDeployZone(faction: number): Array<[number, number]> {
    if (faction === 0 && this.noPlayerHq) {
      if (this.ph === 'setup' && this.customDeployTiles.length > 0) {
        return this.customDeployTiles.filter(
          ([x, y]) => this.inBounds(x, y) && !this.unitAt(x, y) && !this.ob[y][x]
        );
      }
      return [];
    }

    const zones: Array<[number, number]> = [];
    const rad = this.ph === 'setup' ? (this.NP > 2 ? 3 : 2) : 1;

    this.U.filter(
      (u) =>
        u.o === faction &&
        (u.spawnCd ?? 0) <= 0 &&
        (u.t === 'H' || (u.t === 'W' && this.ph !== 'setup') || (u.t === 'FC' && this.ph !== 'setup'))
    ).forEach((source) => {
      const r = source.t === 'W' || source.t === 'FC' ? 1 : rad;
      for (let y = source.y - r; y <= source.y + r; y++) {
        for (let x = source.x - r; x <= source.x + r; x++) {
          if (
            this.inBounds(x, y) &&
            !this.ob[y][x] &&
            !this.unitAt(x, y) &&
            !zones.some(([zx, zy]) => zx === x && zy === y)
          ) {
            zones.push([x, y]);
          }
        }
      }
    });

    return zones;
  }

  public isTileOpenForSpawn(x: number, y: number, isAir: boolean = false): boolean {
    if (!this.inBounds(x, y)) return false;
    if (this.unitAt(x, y)) return false;
    const tile = this.ob[y]?.[x] ?? 0;
    if (isAir) return true;
    // Ground units cannot spawn inside boulders (1), concrete ruins (2), impassable water (3), or magma (7)
    return tile !== 1 && tile !== 2 && tile !== 3 && tile !== 7;
  }

  public findNearestSpawnTile(startX: number, startY: number, faction: number, isAir: boolean = false): [number, number] | null {
    if (this.isTileOpenForSpawn(startX, startY, isAir)) {
      return [startX, startY];
    }
    // Search outward in concentric rings (up to radius 8)
    for (let r = 1; r <= 8; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const nx = startX + dx;
          const ny = startY + dy;
          if (this.isTileOpenForSpawn(nx, ny, isAir)) {
            return [nx, ny];
          }
        }
      }
    }
    // Fallback: scan along edge rows according to faction
    const startYEdge = faction === 0 ? this.N - 1 : 0;
    const stepY = faction === 0 ? -1 : 1;
    for (let i = 0; i < this.N; i++) {
      const cy = startYEdge + i * stepY;
      if (cy < 0 || cy >= this.N) continue;
      for (let cx = 0; cx < this.N; cx++) {
        if (this.isTileOpenForSpawn(cx, cy, isAir)) {
          return [cx, cy];
        }
      }
    }
    return null;
  }

  public spawnReinforcementsForTurn(targetTurn?: number): PlacedUnit[] {
    const t = targetTurn ?? this.turn;
    const activeWaves = this.reinforcementWaves.length > 0 ? this.reinforcementWaves : (this.activeMission?.reinforcementWaves || []);
    if (!activeWaves.length) return [];

    const waves = activeWaves.filter((w) => w.turn === t);
    if (!waves.length || this.spawnedWaveTurns.has(t)) return [];

    this.spawnedWaveTurns.add(t);
    const spawnedUnits: PlacedUnit[] = [];

    for (const wave of waves) {
      const f = wave.faction ?? 1;
      for (const unitInfo of wave.units) {
        const air = isAirUnit(unitInfo.t);
        const spawnPos = this.findNearestSpawnTile(unitInfo.x, unitInfo.y, f, air);
        if (spawnPos) {
          const [sx, sy] = spawnPos;
          const u = this.addUnit(unitInfo.t, f, sx, sy);
          if (unitInfo.hp) {
            u.hp = unitInfo.hp;
            u.maxHp = Math.max(u.maxHp, unitInfo.hp);
          }
          u.moved = 0;
          u.acted = 0;
          const factionColor = FACTION_COLORS[f] || (f === 0 ? '#38bdf8' : '#f87171');
          this.addSpark(sx, sy, factionColor, 28, 4, 4);
          this.addRing(sx, sy, factionColor, 95);
          spawnedUnits.push(u);
        }
      }
    }

    if (spawnedUnits.length > 0) {
      AudioService.play('big', this.N / 2, 2);
      this.shake = Math.max(this.shake, 16);
      this.flash = Math.max(this.flash, 0.5);
      const waveLabel = waves[0]?.label || `WAVE ${t}`;
      const factionName = waves[0]?.faction === 0 ? 'ALLIED' : 'HOSTILE';
      this.note = `★★★ ${factionName} REINFORCEMENTS ARRIVED: ${waveLabel} (${spawnedUnits.length} units deployed)! ★★★`;
      this.recalculateHighlights();
      this.triggerChange();
    }

    return spawnedUnits;
  }

  public getCapturableBuildings(u: PlacedUnit, x: number = u.x, y: number = u.y): PlacedUnit[] {
    if (!this.isInfantry(u) || u.acted || u.hp <= 0) return [];
    return this.U.filter(
      (b) =>
        b.hp > 0 &&
        this.getBlueprint(b.t).bl &&
        b.o !== u.o &&
        Math.max(Math.abs(b.x - x), Math.abs(b.y - y)) <= 1
    );
  }

  public getUnloadTiles(u: PlacedUnit): Array<[number, number]> {
    if (!u.cargo) return [];
    const tiles: Array<[number, number]> = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = u.x + dx;
        const ny = u.y + dy;
        if (this.inBounds(nx, ny) && (this.ob[ny][nx] === 0 || this.ob[ny][nx] === 4 || this.ob[ny][nx] === 6) && !this.unitAt(nx, ny)) {
          tiles.push([nx, ny]);
        }
      }
    }
    return tiles;
  }

  public canUnitMove(u: PlacedUnit): boolean {
    return !u.moved && !('AL'.includes(u.t) && u.acted) && this.getMoveReach(u) > 0;
  }

  public canUnitAct(u: PlacedUnit): boolean {
    const bp = this.getBlueprint(u.t);
    if (bp.bl || u.acted) return false;
    if ('AL'.includes(u.t) && u.moved) return false;
    const maxAttacks = bp.ab.length > 2 ? 2 : 1;
    if ((u.attacksThisTurn || 0) >= maxAttacks) return false;
    return bp.ab.some((ab, idx) => this.canAffordAbility(u, ab, idx));
  }

  public recalculateHighlights() {
    this.hl = {
      m: new Map(),
      r: [],
      t: [],
      s: [],
      c: [],
      carryTargets: [],
      unloadTiles: [],
    };

    if (this.sp || this.ph === 'setup') {
      this.hl.s = this.getDeployZone(this.cur);
    } else if (this.sel && !this.getBlueprint(this.sel.t).bl && this.sel.o === this.cur) {
      this.hl.c = this.getCapturableBuildings(this.sel);
      if (this.canUnitMove(this.sel) && !this.sel.gm) {
        this.hl.m = this.reachMap(this.sel);
      }
      if (this.canUnitAct(this.sel)) {
        const ab = this.getActiveAbility(this.sel);
        if (ab) {
          if (ab.f.includes('uo') && this.sel.cargo) {
            this.hl.unloadTiles = this.getUnloadTiles(this.sel);
          } else {
            for (let y = 0; y < this.N; y++) {
              for (let x = 0; x < this.N; x++) {
                if (this.canTarget(this.sel, this.sel.x, this.sel.y, x, y, ab)) {
                  this.hl.r.push([x, y]);
                }
              }
            }
            this.hl.t = this.getValidTargets(this.sel, this.sel.x, this.sel.y, true);
          }
        }
      }
    }
  }

  public selectUnit(u: PlacedUnit | null) {
    if (this.busy || this.over) return;
    this.sel = u && u.o === this.cur ? u : null;
    this.sp = null;
    if (this.sel) {
      AudioService.play('sel');
      if (!this.getBlueprint(this.sel.t).bl) {
        this.sel.gm = 0;
        this.sel.ai = Math.max(
          0,
          this.getBlueprint(this.sel.t).ab.findIndex((ab) => this.canAffordAbility(this.sel!, ab))
        );
      }
    }
    this.recalculateHighlights();
    this.triggerChange();
  }

  public selectAbility(index: number) {
    if (!this.sel || this.busy) return;
    const bp = this.getBlueprint(this.sel.t);
    if (bp.ab[index] && this.canAffordAbility(this.sel, bp.ab[index])) {
      this.sel.ai = index;
      this.recalculateHighlights();
      this.triggerChange();
    }
  }

  public toggleGroundAim() {
    if (!this.sel || this.busy || this.over) return;
    this.sel.gm = this.sel.gm ? 0 : 1;
    AudioService.play('sel');
    this.recalculateHighlights();
    this.triggerChange();
  }

  public async moveUnit(u: PlacedUnit, targetKey: string) {
    AudioService.play(isAirUnit(u.t) ? 'fly' : 'mv', u.x, u.y, true, true);
    const rMap = this.reachMap(u);
    const path: ReachNode[] = [];
    let cur: ReachNode | undefined = rMap.get(targetKey);

    while (cur) {
      path.unshift(cur);
      cur = cur.p ? rMap.get(cur.p) : undefined;
    }

    u.mw = 1;
    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const next = path[i];
      if (next.x !== prev.x) u.dr = next.x > prev.x ? 1 : -1;

      const dur = this.getVisibilityMap(this.view)[u.y * this.N + u.x]
        ? isAirUnit(u.t) ? 50 : 110
        : 1;

      await this.tween(dur, (k) => {
        u.rx = prev.x + (next.x - prev.x) * k;
        u.ry = prev.y + (next.y - prev.y) * k;
      });
      this.addSpark(prev.x, prev.y, isAirUnit(u.t) ? '#e2e8f0' : '#d6c7a1', 4, 1.5, 3);
    }

    u.x = u.rx = path[path.length - 1].x;
    u.y = u.ry = path[path.length - 1].y;
    u.moved = 1;

    if (u.fu != null) {
      const dist = isAirUnit(u.t)
        ? Math.abs(u.x - path[0].x) + Math.abs(u.y - path[0].y)
        : path.length - 1;
      u.fu = Math.max(0, u.fu - dist);
      if (u.fu === 0) {
        this.addFloatingText(u, 'OUT OF FUEL', '#fbbf24');
      }
    }
    u.mw = 0;
  }

  public async attackTarget(u: PlacedUnit, target: PlacedUnit | { x: number; y: number; gnd?: boolean }) {
    const ab = this.getActiveAbility(u);
    if (!ab) return;

    // Handle Carry Unit Ability
    if (ab.f.includes('c')) {
      const pass = this.unitAt(target.x, target.y);
      if (pass && pass.o === u.o && this.isInfantry(pass) && !u.cargo) {
        u.cargo = pass;
        this.U = this.U.filter((item) => item !== pass);
        AudioService.play('sel', u.x, u.y);
        this.addFloatingText(u, `LOADED ${this.getBlueprint(pass.t).n}`, '#38bdf8');
        this.addSpark(u.x, u.y, '#38bdf8', 16, 3);
        this.note = `${this.getBlueprint(u.t).n} embarked ${this.getBlueprint(pass.t).n}.`;
        u.acted = 1;
        if (this.profile && u.o === 0) {
          this.profile.questProgress.transports_completed =
            (this.profile.questProgress.transports_completed || 0) + 1;
        }
        return;
      }
    }

    // Handle Unload Cargo Ability
    if (ab.f.includes('uo')) {
      if (u.cargo && !this.unitAt(target.x, target.y)) {
        const pass = u.cargo;
        pass.x = pass.rx = target.x;
        pass.y = pass.ry = target.y;
        pass.moved = 1;
        pass.acted = 0;
        this.U.push(pass);
        u.cargo = null;
        AudioService.play('spawn', target.x, target.y);
        this.addFloatingText(target, `UNLOADED ${this.getBlueprint(pass.t).n}`, '#22c55e');
        this.addSpark(target.x, target.y, '#22c55e', 18, 3);
        this.note = `${this.getBlueprint(u.t).n} safely deployed ${this.getBlueprint(pass.t).n}.`;
        u.acted = 1;
        return;
      }
    }

    // Handle Spawner Ability (Mobile Factory Crawler FC)
    if (ab.f.includes('sp')) {
      if (!this.unitAt(target.x, target.y)) {
        const spawnedType = u.t === 'FC' ? 'R' : 'R';
        const spawned = this.addUnit(spawnedType, u.o, target.x, target.y);
        spawned.moved = 1;
        spawned.acted = 1;
        AudioService.play('spawn', target.x, target.y);
        this.addFloatingText(target, `FABRICATED ${this.getBlueprint(spawnedType).n}`, '#fbbf24');
        this.addSpark(target.x, target.y, '#fbbf24', 22, 4);
        this.addRing(target.x, target.y, '#fbbf24');
        this.note = `${this.getBlueprint(u.t).n} manufactured new squad on frontline!`;
        u.acted = 1;
        if (ab.cd) u.cd = ab.cd;
        return;
      }
    }

    await this.shootAnimation(u, target);

    const abIdx = u.ai ?? 0;
    if (u.abAmmo && u.abAmmo[abIdx] !== undefined) {
      if (u.abAmmo[abIdx] > 0 && u.abAmmo[abIdx] < 90) {
        u.abAmmo[abIdx]--;
        if (u.abAmmo[abIdx] === 0) {
          this.addFloatingText(u, `${ab.n.toUpperCase()} DEPLETED`, '#d3a85a');
        }
      }
      u.am = u.abAmmo[abIdx];
    } else if (u.am != null) {
      const cost = this.getCost(ab);
      u.am = Math.max(0, u.am - cost);
      if (u.am === 0) {
        this.addFloatingText(u, 'OUT OF AMMO', '#d3a85a');
      }
    }
    if (ab.cd) u.cd = ab.cd;

    const targetUnit = this.unitAt(target.x, target.y);

    // EMP Jammer Freeze
    if (ab.f.includes('j') && targetUnit && !('gnd' in target && target.gnd)) {
      targetUnit.fz = 1;
      targetUnit.sp = 1;
      this.addFloatingText(targetUnit, 'JAMMED', '#7fc4d6');
      this.addSpark(targetUnit.x, targetUnit.y, '#7fc4d6', 26, 5);
      this.addRing(targetUnit.x, targetUnit.y, '#7fc4d6');
      this.note = `${this.getBlueprint(targetUnit.t).n} disabled for next turn.`;
      if (this.profile && u.o === 0) {
        this.profile.questProgress.emp_jams = (this.profile.questProgress.emp_jams || 0) + 1;
      }
    }
    // Resupply & Full Patch
    else if (ab.f.includes('h') && targetUnit) {
      const bp = this.getBlueprint(targetUnit.t);
      targetUnit.hp = Math.min(targetUnit.maxHp, targetUnit.hp + 2);
      if (targetUnit.fu != null && targetUnit.maxFu != null) targetUnit.fu = targetUnit.maxFu;
      if (targetUnit.am != null && targetUnit.maxAm != null) targetUnit.am = targetUnit.maxAm;
      if (targetUnit.abAmmo && targetUnit.maxAbAmmo) {
        targetUnit.abAmmo = [...targetUnit.maxAbAmmo];
      }
      this.addFloatingText(targetUnit, '+2 RESUPPLY', '#8fbf7a');
      this.addSpark(targetUnit.x, targetUnit.y, '#8fbf7a', 20, 3);
      this.addRing(targetUnit.x, targetUnit.y, '#8fbf7a');
      this.note = `Supplier replenished ${bp.n}.`;
      if (this.profile && u.o === 0) {
        this.profile.questProgress.resupplies = (this.profile.questProgress.resupplies || 0) + 1;
      }
    }
    // Field Medic & Engineer Repair / Heal
    else if (ab.f.includes('r') && targetUnit) {
      let heal = ab.d;
      if (u.o === 0 && this.profile) {
        if (u.t === 'K') heal += this.getUpgradeLevel('upg_medical_triage');
        if (u.t === 'N') heal += this.getUpgradeLevel('upg_combat_engineering') * 2;
      }
      const actualHeal = Math.min(heal, targetUnit.maxHp - targetUnit.hp);
      targetUnit.hp += actualHeal;
      targetUnit.sp = 0; // clears suppression
      this.addFloatingText(targetUnit, `+${actualHeal} HP`, '#8fbf7a');
      this.addSpark(targetUnit.x, targetUnit.y, '#8fbf7a', 20, 3);
      this.addRing(targetUnit.x, targetUnit.y, '#8fbf7a');
      this.note = `${this.getBlueprint(targetUnit.t).n} triage healed.`;
      if (this.profile && u.o === 0) {
        this.profile.questProgress.repairs = (this.profile.questProgress.repairs || 0) + actualHeal;
      }
    }
    // Damaging attacks
    else {
      let hits: PlacedUnit[] = [];
      if (ab.f.includes('s')) {
        // Area splash
        hits = this.U.filter(
          (other) =>
            other.o !== u.o &&
            (other.o >= 0 || !this.getBlueprint(other.t).bl) &&
            Math.abs(other.x - target.x) + Math.abs(other.y - target.y) < 2
        );
      } else if (targetUnit && !('gnd' in target && target.gnd)) {
        hits = [targetUnit];
      }

      this.note = ab.n + (hits.length ? ' fired.' : ' missed: tile was empty.');
      if (!hits.length) {
        this.addFloatingText(target, 'MISS', '#9aa59d');
      }

      hits.forEach((targetHit) => {
        let dmg = ab.d;
        if (ab.f.includes('a') && targetHit.fu != null) dmg += 2;
        if (ab.f.includes('b') && this.getBlueprint(targetHit.t).bl) dmg += ab.d;

        if (u.o === 0 && this.profile) {
          if ('AL'.includes(u.t)) dmg += this.getUpgradeLevel('upg_heavy_ordnance');
          if (u.t === 'V' && ab.f.includes('x')) dmg += this.getUpgradeLevel('upg_drone_overdrive') * 2;
          if (u.t === 'G' && ab.f.includes('b') && this.getBlueprint(targetHit.t).bl) {
            dmg += this.getUpgradeLevel('upg_combat_engineering') * 2;
          }
        }

        this.applyDamage(targetHit, dmg, u);
      });

      if (ab.f.includes('u')) {
        hits.forEach((pinned) => {
          if (!this.getBlueprint(pinned.t).bl && this.U.includes(pinned)) {
            pinned.sp = 1;
            this.addFloatingText(pinned, 'PINNED', '#d3a85a');
            if (this.profile && u.o === 0) {
              this.profile.questProgress.suppressions =
                (this.profile.questProgress.suppressions || 0) + 1;
            }
          }
        });
      }

      // Kamikaze blast
      if (ab.f.includes('x')) {
        u.hp = 0;
        this.triggerExplosion(u);
        this.U = this.U.filter((item) => item !== u);
      }
    }

    const bp = this.getBlueprint(u.t);
    const maxAttacks = bp.ab.length > 2 ? 2 : 1;
    u.attacksThisTurn = (u.attacksThisTurn || 0) + 1;

    if (u.hp > 0) {
      if (u.attacksThisTurn < maxAttacks) {
        u.acted = 0;
        u.moved = 1; // cannot move further after engaging
        this.addFloatingText(u, 'EXTRA ATTACK (1 LEFT)', '#38bdf8');
      } else {
        u.acted = 1;
      }
    }
    u.gm = 0;
  }

  public async captureBuilding(u: PlacedUnit, b: PlacedUnit) {
    const prevOwner = b.o;
    const isHq = b.t === 'H';
    const vis = this.getVisibilityMap(this.view)[b.y * this.N + b.x];

    if (b.x !== u.x) u.dr = b.x > u.x ? 1 : -1;

    await this.tween(vis ? 300 : 1, (k) => (u.wx = Math.sin(k * 40) * 2 * (1 - k)));
    u.wx = 0;

    b.o = u.o;
    b.hp = Math.ceil(this.getBlueprint(b.t).hp / 2);
    b.cd = b.t === 'W' ? 3 : 0;

    AudioService.play('cap', b.x, b.y, true, true);
    this.addRing(b.x, b.y, '#facc15');
    this.addSpark(b.x, b.y, '#facc15', 26, 4, 4);

    u.moved = u.acted = 1;
    this.addFloatingText(u, 'CAPTURED', '#facc15');
    this.note = `${this.getBlueprint(b.t).n} captured by ${u.o === 0 ? 'Friendly' : 'Hostile'} forces!`;

    if (this.profile && u.o === 0) {
      this.profile.skirmishStats.outpostsCaptured++;
      this.profile.questProgress.outposts_captured =
        (this.profile.questProgress.outposts_captured || 0) + 1;
      this.profile.questProgress.structures_demolished =
        (this.profile.questProgress.structures_demolished || 0) + 1;
    }

    // Check Outpost Domination
    if (this.activeMission?.objectiveType === 'capture_outposts' && u.o === 0) {
      const held = this.U.filter((item) => item.t === 'O' && item.o === 0).length;
      const target = this.activeMission.objectives.find((obj) => obj.type === 'capture_outposts')?.targetCount || 3;
      if (held >= target) {
        this.handleVictory(0, `OUTPOST DOMINATION: Captured and controlled ${held}/${target} strategic outposts!`);
        return;
      }
    }

    if (isHq) {
      if (prevOwner === 0 && !this.ctrl[0]) {
        if (this.isDefendRequired()) {
          this.handleDefeat('DEFENSE FAILED: Your HQ Fortress was captured and seized!');
          return;
        } else {
          this.note += ' ALLIED HQ CAPTURED! Command lost, but frontline forces fight on!';
          this.addFloatingText(b, 'HQ SEIZED - FIGHT ON!', '#ef4444');
          this.checkPlayerWipeout();
        }
      } else {
        this.eliminateFaction(prevOwner);
      }
    } else if (prevOwner === 0 && !this.ctrl[0]) {
      this.checkPlayerWipeout();
    }
  }

  public isDefendRequired(): boolean {
    if (!this.activeMission) return false;
    return !!(
      this.activeMission.objectiveType === 'defend_and_attack' ||
      this.activeMission.objectiveType === 'holdout' ||
      this.activeMission.defendTargetCoord ||
      this.U.some((u) => u.o === 0 && u.isDefendTarget)
    );
  }

  public getPlayerAssetCount(): number {
    return this.U.filter((u) => u.o === 0 && u.hp > 0).length;
  }

  public checkPlayerWipeout() {
    if (!this.over && !this.ctrl[0] && this.getPlayerAssetCount() === 0) {
      this.alive[0] = false;
      if (this.isCampaignMode) {
        this.handleDefeat('TOTAL DEFEAT: All friendly units and structures have been eliminated or captured!');
      } else {
        this.ctrl[0] = true;
        this.note = 'All allied units lost! Spectating remaining battle...';
        const remaining = this.alive.map((al, idx) => (al ? idx : -1)).filter((idx) => idx >= 0);
        if (remaining.length === 1) {
          this.handleVictory(remaining[0], `${FACTION_NAMES[remaining[0]] || 'FACTION'} VICTORY - LAST FACTION STANDING`);
        }
        this.triggerChange();
      }
    }
  }

  public applyDamage(target: PlacedUnit, dmg: number, attacker?: PlacedUnit) {
    if (!this.U.includes(target)) return;

    target.hp -= dmg;
    target.fl = performance.now();
    AudioService.play('hit', target.x, target.y);
    this.addFloatingText(target, `-${dmg}`, '#f87171');
    this.addSpark(target.x, target.y, '#f87171', 8, 3);

    if (target.hp <= 0) {
      this.note += ` ${this.getBlueprint(target.t).n} destroyed!`;
      this.triggerExplosion(target, !!(attacker && 'AL'.includes(attacker.t)));

      // If unit was carrying cargo, drop or eject cargo
      if (target.cargo) {
        const cargo = target.cargo;
        cargo.x = cargo.rx = target.x;
        cargo.y = cargo.ry = target.y;
        cargo.hp = Math.max(1, cargo.hp - 2); // takes damage from carrier explosion
        this.U.push(cargo);
        this.addFloatingText(cargo, 'CARGO EJECTED', '#fbbf24');
      }

      this.U = this.U.filter((u) => u !== target);

      if (target.o === 0) {
        this.totalFriendlyLosses++;
        this.turnCasualties.friendly++;
        if (target.isDefendTarget) {
          this.handleDefeat(`MISSION FAILED: Critical asset "${target.customName || 'Allied Installation'}" was destroyed!`);
          return;
        }
      } else {
        this.turnCasualties.enemy++;
        if (this.profile) {
          this.profile.skirmishStats.enemiesEliminated++;
          const qp = this.profile.questProgress;
          qp.kills = (qp.kills || 0) + 1;

          if (['B', 'M', 'J', 'D', 'SH', 'DW', 'GS', 'AT', 'SP', 'AC', 'FC'].includes(target.t)) {
            qp.vehicle_kills = (qp.vehicle_kills || 0) + 1;
            if (['J', 'DW', 'GS', 'D', 'SH'].includes(target.t)) {
              qp.heavy_tank_kills = (qp.heavy_tank_kills || 0) + 1;
            }
          }
          if (['R', 'G', 'S', 'P', 'K', 'T', 'Z', 'N', 'X', 'I', 'MR', 'MT', 'CH'].includes(target.t)) {
            qp.infantry_kills = (qp.infantry_kills || 0) + 1;
          }
          if (isAirUnit(target.t)) {
            qp.air_kills = (qp.air_kills || 0) + 1;
            qp.heavy_flak_kills = (qp.heavy_flak_kills || 0) + 1;
          }
          if (attacker && isAirUnit(attacker.t)) {
            qp.air_to_ground_kills = (qp.air_to_ground_kills || 0) + 1;
          }
          if (attacker && ['A', 'SP', 'MT', 'L'].includes(attacker.t)) {
            qp.indirect_damage = (qp.indirect_damage || 0) + 8;
          }
          if (attacker && attacker.t === 'V') {
            qp.burst_damage = (qp.burst_damage || 0) + 12;
          }
          if (target.t === 'H') {
            qp.hq_kills = (qp.hq_kills || 0) + 1;
          }
        }

        if (
          target.isVip &&
          this.U.filter((u) => u.isVip && u.o !== 0 && u.hp > 0).length === 0 &&
          this.activeMission?.objectiveType === 'destroy_vip'
        ) {
          this.handleVictory(0, `VIP DESTROYED: Prototype "${target.customName || 'Boss Target'}" has been eliminated!`);
          return;
        }

        if (this.initialVanguardCount > 0) {
          this.vanguardDestroyedCount++;
        }
      }

      if (target.t === 'H') {
        if (target.o === 0 && !this.ctrl[0]) {
          if (this.isDefendRequired()) {
            this.handleDefeat('DEFENSE FAILED: Your HQ Fortress has fallen!');
            return;
          } else {
            this.note += ' ALLIED HQ DESTROYED! Base lost, but operational units fight on to the last stand!';
            this.addFloatingText(target, 'HQ LOST - FIGHT ON!', '#ef4444');
            this.checkPlayerWipeout();
          }
        } else {
          this.eliminateFaction(target.o);
        }
      } else if (target.o === 0 && !this.ctrl[0]) {
        this.checkPlayerWipeout();
      }
    }
  }

  public eliminateFaction(faction: number) {
    if (faction === 0 && !this.ctrl[0] && !this.isDefendRequired() && this.getPlayerAssetCount() > 0) {
      return;
    }

    this.alive[faction] = false;
    this.note += ` Faction ${faction + 1} (${FACTION_NAMES[faction] || 'Power'}) eliminated!`;

    this.U.filter((u) => u.o === faction && !this.getBlueprint(u.t).bl).forEach((u) =>
      this.addSpark(u.x, u.y, '#f87171', 8, 3)
    );
    this.U = this.U.filter((u) => u.o !== faction || this.getBlueprint(u.t).bl);
    this.U.forEach((u) => {
      if (u.o === faction) {
        u.o = -1;
        u.hp = Math.min(u.hp, Math.ceil(this.getBlueprint(u.t).hp / 2));
      }
    });

    if (this.sel && this.sel.o === faction) this.sel = null;

    if (faction === 0) {
      if (this.isCampaignMode) {
        this.handleDefeat(
          this.isDefendRequired()
            ? 'DEFENSE FAILED: Your HQ Fortress has fallen!'
            : 'TOTAL DEFEAT: All friendly units and structures have been eliminated or captured!'
        );
        return;
      } else {
        this.ctrl[0] = true;
        this.note = 'Command HQ lost! Your faction was eliminated. Spectating remaining battle...';
        const remaining = this.alive.map((al, idx) => (al ? idx : -1)).filter((idx) => idx >= 0);
        if (remaining.length === 1) {
          this.handleVictory(remaining[0], `${FACTION_NAMES[remaining[0]] || 'FACTION'} VICTORY - LAST FACTION STANDING`);
        }
        this.triggerChange();
        return;
      }
    }

    const remaining = this.alive.map((al, idx) => (al ? idx : -1)).filter((idx) => idx >= 0);
    if (remaining.length === 1) {
      this.handleVictory(
        remaining[0],
        remaining[0] === 0 ? 'HOSTILE HQ NEUTRALIZED' : `${FACTION_NAMES[remaining[0]] || 'FACTION'} VICTORY - LAST FACTION STANDING`
      );
    } else if (remaining.length === 0) {
      this.handleVictory(0, 'DRAW');
    }
  }

  public handleDefeat(reason: string = 'MISSION FAILED') {
    if (this.over) return;
    this.over = true;
    this.winner = 1;
    this.victoryReason = reason;
    AudioService.play('lose');
    if (this.profile && this.profile.skirmishStats) {
      this.profile.skirmishStats.defeats++;
      this.profile.skirmishStats.battles++;
    }
    this.recalculateHighlights();
    this.triggerChange();
  }

  public handleVictory(winnerFaction: number, reason: string = 'HOSTILE HQ DESTROYED') {
    if (this.over) return;
    this.over = true;
    this.winner = winnerFaction;
    this.victoryReason = reason;

    const isPlayerWin = winnerFaction === 0;
    AudioService.play(isPlayerWin ? 'win' : 'lose');

    if (this.profile) {
      if (isPlayerWin) {
        if (this.profile.skirmishStats) this.profile.skirmishStats.victories++;
        if (this.isCampaignMode) {
          const qp = this.profile.questProgress;
          qp.campaign_wins = (qp.campaign_wins || 0) + 1;
          if (this.totalFriendlyLosses === 0) qp.flawless_victories = (qp.flawless_victories || 0) + 1;
          if (this.turn <= 12) qp.speed_victories = (qp.speed_victories || 0) + 1;
          if (this.difficulty === 'hard' || this.difficulty === 'expert') {
            qp.hard_campaign_wins = (qp.hard_campaign_wins || 0) + 1;
          }
          if (this.ob.some((row) => row.includes(3))) qp.water_missions = (qp.water_missions || 0) + 1;

          let totalStars = 0;
          if (this.profile.campaignProgress) {
            Object.values(this.profile.campaignProgress).forEach((cp) => {
              totalStars += cp.stars || 0;
            });
          }
          qp.campaign_stars = totalStars;
        }
      } else {
        if (this.profile.skirmishStats) this.profile.skirmishStats.defeats++;
      }
      if (this.profile.skirmishStats) this.profile.skirmishStats.battles++;
    }

    this.recalculateHighlights();
    this.triggerChange();
  }

  public endTurn() {
    if (this.busy || this.over) return;

    this.sel = null;
    this.sp = null;

    if (this.ph === 'setup') {
      let next = this.cur + 1;
      while (next < this.NP && this.ctrl[next]) {
        this.botAutoDeploy(next);
        next++;
      }
      if (next < this.NP) {
        this.cur = next;
        this.view = next;
        if (this.isPassAndPlay() && !this.ctrl[next] && this.privacyShieldEnabled) {
          this.passPlayPending = true;
          AudioService.play('passTurn');
        }
        this.recalculateHighlights();
        this.triggerChange();
      } else {
        this.beginCombat();
        if (this.ctrl[this.cur]) {
          setTimeout(() => {
            if (!this.over && this.ctrl[this.cur]) this.botTurn();
          }, 150);
        }
      }
      return;
    }

    const prevTurn = this.cur;
    do {
      this.cur = (this.cur + 1) % this.NP;
    } while (!this.alive[this.cur]);

    // Fog of war and view synchronization:
    // If the active commander is human, switch perspective to their view!
    if (!this.ctrl[this.cur]) {
      this.view = this.cur;
      if (this.isPassAndPlay() && this.privacyShieldEnabled) {
        this.passPlayPending = true;
        AudioService.play('passTurn');
      } else {
        AudioService.play('turn');
      }
    } else {
      AudioService.play('turn');
    }

    if (this.cur <= prevTurn) {
      this.turn++;

      // Check reinforcement waves
      this.spawnReinforcementsForTurn(this.turn);

      // Check holdout objective
      if (this.holdoutTurnsRemaining > 0 && this.alive[0]) {
        const total = this.holdoutTurnsRemaining;
        if (this.turn >= total) {
          this.handleVictory(0, `HOLDOUT SUCCESS: You held the defense perimeter for all ${total} combat turns!`);
          return;
        }
      }
    }

    // Income generation
    let inc = 2;
    if (this.NP > 2 && this.cur === 1) inc += 1;
    inc += this.U.filter((u) => u.t === 'O' && u.o === this.cur).length;
    if (this.cur === 0 && this.profile) {
      inc += this.getUpgradeLevel('upg_logistics_subsidy');
    }
    this.gold[this.cur] += inc;

    // Reset units for this turn
    this.U.forEach((u) => {
      if (u.o === this.cur) {
        u.spawnCd = Math.max(0, (u.spawnCd ?? 0) - 1);
        u.moved = 0;
        u.acted = 0;
        u.attacksThisTurn = 0;
        if (u.cd && u.cd > 0) u.cd--;
        if (u.fz) {
          u.moved = 1;
          u.acted = 1;
          u.fz = 0;
        }
        if (u.sp) {
          u.moved = 1;
          u.sp = 0;
        }
      }
    });

    // Proximity automated resupply next to HQ or Barracks
    this.U.forEach((u) => {
      if (u.o !== this.cur || this.getBlueprint(u.t).bl) return;
      const isNear = (source: PlacedUnit) =>
        source.o === this.cur && Math.abs(source.x - u.x) < 2 && Math.abs(source.y - u.y) < 2;

      const nearHq = this.U.some((source) => source.t === 'H' && isNear(source));
      const nearBarracks = this.U.find((source) => source.t === 'W' && !source.cd && isNear(source));

      const needsSupply =
        (u.maxFu != null && (u.fu ?? 0) < u.maxFu) ||
        (u.maxAm != null && (u.am ?? 0) < u.maxAm) ||
        (u.abAmmo && u.maxAbAmmo && u.abAmmo.some((val, idx) => val < (u.maxAbAmmo?.[idx] ?? val)));

      if (nearHq || (nearBarracks && needsSupply)) {
        if (u.maxFu != null) u.fu = u.maxFu;
        if (u.maxAm != null) u.am = u.maxAm;
        if (u.abAmmo && u.maxAbAmmo) {
          u.abAmmo = [...u.maxAbAmmo];
        }
        if (!nearHq && nearBarracks) nearBarracks.us = 1;
      }
    });

    this.U.forEach((b) => {
      if (b.us) {
        b.us = 0;
        b.cd = 3;
        this.addFloatingText(b, 'SUPPLY RECHARGE', '#8fbf7a');
        this.addRing(b.x, b.y, '#8fbf7a');
      }
    });

    this.note = '';
    this.recalculateHighlights();
    this.triggerChange();

    if (this.ctrl[this.cur]) {
      this.botTurn();
    }
  }

  public beginCombat() {
    AudioService.play('go');
    this.ph = 'play';
    this.cur = 0;
    const firstHuman = this.ctrl.findIndex((c) => !c);
    this.view = firstHuman >= 0 ? firstHuman : 0;
    this.turn = 1;
    this.U.forEach((u) => {
      u.moved = 0;
      u.acted = 0;
      u.attacksThisTurn = 0;
    });
    const allBots = this.ctrl.every((c) => c);
    this.note = allBots ? 'Autonomous simulation active. Spectating AI battle.' : 'Battle commences! Unspent deployment gold carries forward.';

    if (this.isPassAndPlay() && this.privacyShieldEnabled && !this.ctrl[this.cur]) {
      this.passPlayPending = true;
      AudioService.play('passTurn');
    }

    this.recalculateHighlights();
    this.triggerChange();
  }

  public isHighDifficulty(): boolean {
    return this.difficulty === 'sweat' || this.difficulty === 'tryhard' || this.difficulty === 'hard' || this.difficulty === 'expert';
  }

  public isIntermediateOrHigher(): boolean {
    return this.difficulty !== 'normal';
  }

  public isTryhard(): boolean {
    return this.difficulty === 'tryhard' || this.difficulty === 'expert';
  }

  public botAutoDeploy(faction: number, maxCount?: number) {
    const limit = maxCount ?? (this.NP > 2 ? 24 : 14);
    const mid = (this.N - 1) / 2;
    const distSq = (pt: [number, number]) => (pt[0] - mid) ** 2 + (pt[1] - mid) ** 2;

    let pool: string[];
    if (this.isTryhard()) {
      pool = ['GS', 'DW', 'J', 'SB', 'HF', 'IJ', 'SR', 'NS', 'AT', 'G', 'T', 'SP', 'B', 'E', 'K', 'I', 'FC'];
    } else if (this.isHighDifficulty()) {
      pool = ['B', 'T', 'HF', 'IJ', 'SP', 'J', 'K', 'G', 'V', 'I', 'MT', 'AT', 'MR', 'R', 'C'];
    } else if (this.isIntermediateOrHigher()) {
      pool = ['B', 'T', 'A', 'K', 'G', 'HF', 'MT', 'C', 'R', 'Z', 'M', 'AT'];
    } else {
      pool = ['R', 'C', 'B', 'M', 'G', 'S', 'T', 'A'];
    }

    for (let i = 0; i < limit; i++) {
      const affordable = pool.filter(
        (code) =>
          this.getBlueprint(code).c <= this.gold[faction] &&
          (!'PEKN'.includes(code) || !this.U.some((u) => u.o === faction && u.t === code))
      );
      if (!affordable.length) break;

      const zone = this.getDeployZone(faction).sort((a, b) => distSq(a) - distSq(b));
      if (!zone.length) break;

      let chosen: string;
      if (this.isTryhard()) {
        if (i === 0 && affordable.includes('AT')) chosen = 'AT';
        else if (i === 1 && affordable.includes('G')) chosen = 'G';
        else if (i === 2 && (affordable.includes('GS') || affordable.includes('DW') || affordable.includes('J'))) {
          chosen = affordable.find((c) => ['GS', 'DW', 'J'].includes(c))!;
        } else if (i === 3 && affordable.includes('HF')) chosen = 'HF';
        else if (i === 4 && affordable.includes('IJ')) chosen = 'IJ';
        else if (i === 5 && affordable.includes('K')) chosen = 'K';
        else chosen = affordable[Math.floor(Math.random() * affordable.length)];
      } else if (this.isHighDifficulty()) {
        if (i === 0 && affordable.includes('B')) chosen = 'B';
        else if (i === 1 && affordable.includes('T')) chosen = 'T';
        else if (i === 2 && affordable.includes('HF')) chosen = 'HF';
        else if (i === 3 && affordable.includes('K')) chosen = 'K';
        else if (i === 4 && affordable.includes('SP')) chosen = 'SP';
        else chosen = affordable[Math.floor(Math.random() * affordable.length)];
      } else if (this.isIntermediateOrHigher()) {
        if (i === 0 && affordable.includes('B')) chosen = 'B';
        else if (i === 1 && affordable.includes('K')) chosen = 'K';
        else if (i === 2 && affordable.includes('G')) chosen = 'G';
        else chosen = affordable[Math.floor(Math.random() * affordable.length)];
      } else {
        chosen = affordable.includes('B') && Math.random() < 0.35 ? 'B' : affordable[Math.floor(Math.random() * affordable.length)];
      }

      const spot = zone[Math.floor(Math.random() * Math.min(zone.length, 6))];
      this.gold[faction] -= this.getBlueprint(chosen).c;
      const unit = this.addUnit(chosen, faction, spot[0], spot[1]);
      unit.moved = 0;
      unit.acted = 0;
    }

    this.recalculateHighlights();
    this.triggerChange();
  }

  public async waitIfPaused() {
    while (this.paused) {
      await this.sleep(100);
    }
  }

  public async botTurn() {
    const thisGen = this.gen;
    const f = this.cur;
    this.busy = true;
    this.triggerChange();

    await this.sleep(300);
    await this.waitIfPaused();

    const units = this.U.filter((u) => u.o === f && !this.getBlueprint(u.t).bl);

    // Sort execution order: support & transports act first, then artillery, then frontline combatants
    if (this.isIntermediateOrHigher()) {
      units.sort((a, b) => {
        const order = (u: PlacedUnit) => {
          if (['K', 'N', 'P', 'FC'].includes(u.t)) return 0; // support first
          if (['AT', 'AC'].includes(u.t)) return 1; // transports early
          if (['E', 'I'].includes(u.t)) return 2; // EMP/jammers disable enemies early
          if (['A', 'L', 'SP', 'MT'].includes(u.t)) return 3; // artillery softens targets
          return 4; // combat units clean up
        };
        return order(a) - order(b);
      });
    }

    for (const u of units) {
      if (this.over || thisGen !== this.gen) return;
      await this.waitIfPaused();
      await this.botUnitDecision(u);
      await this.sleep(80);
    }

    if (this.over || thisGen !== this.gen) return;
    await this.waitIfPaused();

    // Spawning reinforcements for bots during turn with dynamic counter-recruitment
    if (this.U.find((u) => u.t === 'H' && u.o === f)) {
      const maxSpawns = this.isTryhard() ? 4 : this.isHighDifficulty() ? 3 : 2;

      // Analyze player/enemy composition to recruit optimal counters
      const enemyUnits = this.U.filter((u) => u.o !== f && !this.getBlueprint(u.t).bl && u.hp > 0);
      const enemyAirCount = enemyUnits.filter((u) => isAirUnit(u.t)).length;
      const enemyHeavyCount = enemyUnits.filter((u) => ['J', 'D', 'SH', 'DW', 'GS', 'B'].includes(u.t)).length;
      const enemyInfantryCount = enemyUnits.filter((u) => this.isInfantry(u)).length;

      const myUnits = this.U.filter((u) => u.o === f && !this.getBlueprint(u.t).bl);
      const myAaCount = myUnits.filter((u) => ['HF', 'U', 'IJ'].includes(u.t)).length;
      const myAtCount = myUnits.filter((u) => ['T', 'B', 'D', 'SR', 'SH'].includes(u.t)).length;

      for (let s = 0; s < maxSpawns; s++) {
        const zone = this.getDeployZone(f);
        if (!zone.length) break;

        let pool: string[];
        if (this.isTryhard()) {
          pool = ['GS', 'DW', 'J', 'SB', 'HF', 'IJ', 'SR', 'NS', 'AT', 'G', 'T', 'SP', 'B', 'E', 'K', 'I', 'FC'];
        } else if (this.isHighDifficulty()) {
          pool = ['T', 'B', 'A', 'G', 'M', 'R', 'K', 'C', 'Y', 'MR', 'AT', 'SP', 'SH', 'HF', 'IJ', 'MT', 'SR'];
        } else if (this.isIntermediateOrHigher()) {
          pool = ['B', 'M', 'R', 'G', 'T', 'A', 'C', 'Y', 'MR', 'AT', 'SP', 'K', 'HF'];
        } else {
          pool = ['B', 'M', 'R', 'G', 'T', 'A', 'C'];
        }

        const affordable = pool.filter((c) => this.getBlueprint(c).c <= this.gold[f]);
        if (!affordable.length) break;

        // Tactical selection: counter enemy composition
        let chosen: string;
        if (this.isIntermediateOrHigher() && enemyAirCount > 0 && myAaCount === 0 && (affordable.includes('HF') || affordable.includes('IJ') || affordable.includes('U'))) {
          chosen = affordable.find((c) => ['HF', 'IJ', 'U'].includes(c))!;
        } else if (this.isIntermediateOrHigher() && enemyHeavyCount > 0 && myAtCount === 0 && (affordable.includes('T') || affordable.includes('B') || affordable.includes('SR'))) {
          chosen = affordable.find((c) => ['T', 'B', 'SR'].includes(c))!;
        } else if (this.isIntermediateOrHigher() && enemyInfantryCount >= 3 && (affordable.includes('G') || affordable.includes('MT') || affordable.includes('Y'))) {
          chosen = affordable.find((c) => ['G', 'MT', 'Y'].includes(c))!;
        } else if (this.isTryhard() && (affordable.includes('GS') || affordable.includes('DW') || affordable.includes('J') || affordable.includes('SB'))) {
          chosen = affordable.find((c) => ['GS', 'DW', 'J', 'SB'].includes(c))!;
        } else {
          chosen = affordable[Math.floor(Math.random() * affordable.length)];
        }

        this.gold[f] -= this.getBlueprint(chosen).c;
        const newUnit = this.addUnit(chosen, f, zone[0][0], zone[0][1]);
        const sourceHq = this.U.find(
          (b) =>
            b.o === f &&
            (b.t === 'H' || b.t === 'W') &&
            (b.spawnCd ?? 0) <= 0 &&
            Math.max(Math.abs(b.x - zone[0][0]), Math.abs(b.y - zone[0][1])) <= 1
        );
        if (sourceHq) sourceHq.spawnCd = 2;
        newUnit.moved = 1;
        newUnit.acted = 1;
        this.addSpark(zone[0][0], zone[0][1], FACTION_COLORS[f], 12, 3);
      }
    }

    await this.sleep(200);
    if (thisGen === this.gen) {
      this.busy = false;
      if (!this.over) this.endTurn();
    }
  }

  public async botUnitDecision(u: PlacedUnit) {
    if (u.moved && u.acted) return;

    const rMap = this.reachMap(u);
    const startKey = `${u.x},${u.y}`;
    const startNode: ReachNode = rMap.get(startKey) || { x: u.x, y: u.y, p: null };
    const bp = this.getBlueprint(u.t);

    // ==========================================
    // 1. MOBILE FACTORY SPRAWL (FC)
    // ==========================================
    if (u.t === 'FC' && !u.acted) {
      const spAbIdx = bp.ab.findIndex((ab) => ab.f.includes('sp'));
      if (spAbIdx >= 0 && this.canAffordAbility(u, bp.ab[spAbIdx])) {
        // Look for adjacent empty tile to construct infantry
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const tx = u.x + dx;
            const ty = u.y + dy;
            if (this.inBounds(tx, ty) && this.ob[ty][tx] === 0 && !this.unitAt(tx, ty)) {
              u.ai = spAbIdx;
              await this.attackTarget(u, { x: tx, y: ty });
              u.ai = 0;
              return;
            }
          }
        }
      }
    }

    // ==========================================
    // 2. TRANSPORT LOGISTICS (AT / AC)
    // ==========================================
    if ((u.t === 'AT' || u.t === 'AC') && this.isIntermediateOrHigher()) {
      const cAbIdx = bp.ab.findIndex((ab) => ab.f.includes('c'));
      const uoAbIdx = bp.ab.findIndex((ab) => ab.f.includes('uo'));

      // If carrying cargo, move toward nearest contested outpost or enemy HQ, then unload
      if (u.cargo && uoAbIdx >= 0) {
        const outposts = this.U.filter((b) => (b.t === 'O' || b.t === 'H') && b.o !== u.o);
        if (outposts.length > 0) {
          outposts.sort((a, b) => Math.hypot(a.x - u.x, a.y - u.y) - Math.hypot(b.x - u.x, b.y - u.y));
          const targetObj = outposts[0];

          // Find reach node closest to target
          let bestNodeKey = startKey;
          let bestDist = Math.hypot(targetObj.x - u.x, targetObj.y - u.y);

          for (const [key, node] of rMap.entries()) {
            if (!node) continue;
            const d = Math.hypot(targetObj.x - node.x, targetObj.y - node.y);
            if (d < bestDist) {
              bestDist = d;
              bestNodeKey = key;
            }
          }

          if (bestNodeKey !== startKey && this.canUnitMove(u)) {
            await this.moveUnit(u, bestNodeKey);
          }

          // Now unload cargo onto adjacent empty tile
          const unloadTiles = this.getUnloadTiles(u);
          if (unloadTiles.length > 0 && !u.acted) {
            // Pick tile closest to target building
            unloadTiles.sort((a, b) => Math.hypot(a[0] - targetObj.x, a[1] - targetObj.y) - Math.hypot(b[0] - targetObj.x, b[1] - targetObj.y));
            u.ai = uoAbIdx;
            await this.attackTarget(u, { x: unloadTiles[0][0], y: unloadTiles[0][1] });
            u.ai = 0;
            return;
          }
        }
      } else if (!u.cargo && cAbIdx >= 0 && this.canUnitMove(u)) {
        // Find empty friendly infantry squad within pickup reach
        const friendlyInfantry = this.U.filter(
          (other) => other.o === u.o && other !== u && this.isInfantry(other) && !other.moved && !other.acted
        );
        if (friendlyInfantry.length > 0) {
          for (const [key, node] of rMap.entries()) {
            if (!node) continue;
            for (const inf of friendlyInfantry) {
              if (Math.abs(inf.x - node.x) + Math.abs(inf.y - node.y) === 1) {
                if (key !== startKey) await this.moveUnit(u, key);
                u.ai = cAbIdx;
                await this.attackTarget(u, inf);
                u.ai = 0;
                return;
              }
            }
          }
        }
      }
    }

    // ==========================================
    // 3. SUPPORT UNITS (MEDIC K, SUPPLIER P, ENGINEER N)
    // ==========================================
    if (['K', 'P', 'N'].includes(u.t) && this.isIntermediateOrHigher() && !u.acted) {
      const healAbIdx = bp.ab.findIndex((ab) => ab.f.includes('r') || ab.f.includes('h'));
      if (healAbIdx >= 0) {
        const healAb = bp.ab[healAbIdx];
        const isResupply = healAb.f.includes('h');
        const damagedAllies = this.U.filter((other) => {
          if (other.o !== u.o || other === u || this.getBlueprint(other.t).bl) return false;
          if (isResupply) {
            return (other.fu != null && other.fu < (other.maxFu || 99)) || (other.am != null && other.am < (other.maxAm || 99)) || other.hp < other.maxHp;
          }
          return other.hp < other.maxHp && (u.t === 'K' ? this.isInfantry(other) : true);
        });

        if (damagedAllies.length > 0) {
          let bestHealTarget: PlacedUnit | null = null;
          let bestHealNodeKey = startKey;
          let highestHealScore = 0;

          const candidateNodes: Array<[string, ReachNode]> = this.canUnitMove(u)
            ? Array.from(rMap.entries())
            : [[startKey, startNode]];

          for (const [key, node] of candidateNodes) {
            if (!node) continue;
            for (const ally of damagedAllies) {
              const dist = Math.abs(ally.x - node.x) + Math.abs(ally.y - node.y);
              if (dist <= (healAb.rg || 1)) {
                const missingHp = ally.maxHp - ally.hp;
                const score = missingHp * 3 + (this.getBlueprint(ally.t).c / 2);
                if (score > highestHealScore) {
                  highestHealScore = score;
                  bestHealTarget = ally;
                  bestHealNodeKey = key;
                }
              }
            }
          }

          if (bestHealTarget) {
            if (bestHealNodeKey !== startKey && this.canUnitMove(u)) {
              await this.moveUnit(u, bestHealNodeKey);
            }
            u.ai = healAbIdx;
            await this.attackTarget(u, bestHealTarget);
            u.ai = 0;
            return;
          }
        }
      }
    }

    // ==========================================
    // 4. INFANTRY STRATEGIC CAPTURE
    // ==========================================
    if (this.isInfantry(u) && !u.acted) {
      let bestCap: [string, PlacedUnit] | null = null;
      let highestCapScore = 0;
      const candidateNodes: Array<[string, ReachNode]> = this.canUnitMove(u)
        ? Array.from(rMap.entries())
        : [[startKey, startNode]];

      for (const [key, node] of candidateNodes) {
        if (!node) continue;
        for (const b of this.getCapturableBuildings(u, node.x, node.y)) {
          // HQ captures eliminate factions; outposts provide tactical resource income
          let score = b.t === 'H' ? 100 : b.t === 'O' ? 60 : 40;
          if (b.o >= 0) score += 20; // taking an enemy outpost is better than neutral
          if (score > highestCapScore) {
            highestCapScore = score;
            bestCap = [key, b];
          }
        }
      }

      if (bestCap) {
        if (bestCap[0] !== startKey && this.canUnitMove(u)) await this.moveUnit(u, bestCap[0]);
        await this.captureBuilding(u, bestCap[1]);
        return;
      }
    }

    // ==========================================
    // 5. EMP DISABLER / JAMMER (E, I)
    // ==========================================
    if (['E', 'I'].includes(u.t) && this.isHighDifficulty() && !u.acted) {
      const jamAbIdx = bp.ab.findIndex((ab) => ab.f.includes('j'));
      if (jamAbIdx >= 0 && this.canAffordAbility(u, bp.ab[jamAbIdx])) {
        const candidateNodes: Array<[string, ReachNode]> = this.canUnitMove(u)
          ? Array.from(rMap.entries())
          : [[startKey, startNode]];

        let bestJam: [string, PlacedUnit] | null = null;
        let highestJamScore = 0;

        for (const [key, node] of candidateNodes) {
          if (!node) continue;
          u.ai = jamAbIdx;
          const targets = this.getValidTargets(u, node.x, node.y, false);
          for (const target of targets) {
            if (target.fz || this.getBlueprint(target.t).bl) continue;
            let score = this.getBlueprint(target.t).c;
            if (['GS', 'DW', 'J', 'D', 'SH', 'A', 'SP', 'SB'].includes(target.t)) score += 50;
            if (score > highestJamScore) {
              highestJamScore = score;
              bestJam = [key, target];
            }
          }
        }
        u.ai = 0;

        if (bestJam) {
          if (bestJam[0] !== startKey && this.canUnitMove(u)) await this.moveUnit(u, bestJam[0]);
          u.ai = jamAbIdx;
          await this.attackTarget(u, bestJam[1]);
          u.ai = 0;
          return;
        }
      }
    }

    // ==========================================
    // 6. WOUNDED UNIT RETREAT CALCULATION
    // ==========================================
    const isWounded = u.hp / u.maxHp <= 0.35 && !'VX'.includes(u.t) && !bp.bl;
    if (isWounded && this.isIntermediateOrHigher() && this.canUnitMove(u)) {
      // Check if we can secure a lethal kill right now before running away
      let canScoreImmediateKill = false;
      if (this.canUnitAct(u)) {
        for (const ab of bp.ab) {
          if (!this.canAffordAbility(u, ab)) continue;
          const targets = this.getValidTargets(u, u.x, u.y, false);
          if (targets.some((t) => t.hp <= ab.d)) {
            canScoreImmediateKill = true;
            break;
          }
        }
      }

      if (!canScoreImmediateKill) {
        // Calculate safest retreat destination
        const enemies = this.U.filter((other) => other.o !== u.o && other.hp > 0 && !this.getBlueprint(other.t).bl);
        const friendlyHq = this.U.find((other) => other.o === u.o && other.t === 'H');

        let bestRetreatKey: string | null = null;
        let bestSafetyScore = -9999;

        for (const [key, node] of rMap.entries()) {
          if (!node) continue;
          // Distance from all visible enemies
          let minEnemyDist = 999;
          for (const e of enemies) {
            const d = Math.hypot(e.x - node.x, e.y - node.y);
            if (d < minEnemyDist) minEnemyDist = d;
          }

          // Defensive terrain cover: trench (5) or ruins (2) or forest (1)
          const tile = this.ob[node.y]?.[node.x] || 0;
          const terrainCover = tile === 5 ? 4 : tile === 2 ? 3 : tile === 1 ? 2 : 0;

          // Proximity to friendly HQ
          const distToHq = friendlyHq ? Math.hypot(friendlyHq.x - node.x, friendlyHq.y - node.y) : 0;

          const safetyScore = minEnemyDist * 5 + terrainCover * 4 - distToHq * 1.5;
          if (safetyScore > bestSafetyScore) {
            bestSafetyScore = safetyScore;
            bestRetreatKey = key;
          }
        }

        if (bestRetreatKey && bestRetreatKey !== startKey) {
          await this.moveUnit(u, bestRetreatKey);
          return;
        }
      }
    }

    // ==========================================
    // 7. TACTICAL COMBAT ATTACK CALCULATION
    // ==========================================
    let bestAttack: [string, PlacedUnit, number] | null = null;
    let maxDamageScore = -1;

    const isArtilleryOrSniper = ['A', 'L', 'SP', 'MT', 'S', 'MR'].includes(u.t);
    const candidateAttackNodes: Array<[string, ReachNode]> = isArtilleryOrSniper && !['S', 'MR'].includes(u.t)
      ? [[startKey, startNode]] // static artillery cannot move and fire
      : this.canUnitMove(u)
      ? Array.from(rMap.entries())
      : [[startKey, startNode]];

    if (this.canUnitAct(u)) {
      bp.ab.forEach((ab, abIdx) => {
        if (!this.canAffordAbility(u, ab)) return;
        u.ai = abIdx;

        for (const [key, node] of candidateAttackNodes) {
          if (!node) continue;
          const targets = this.getValidTargets(u, node.x, node.y, false);

          for (const target of targets) {
            let dmg = ab.d;
            if (ab.f.includes('a') && target.fu != null) dmg += 2;
            if (ab.f.includes('b') && this.getBlueprint(target.t).bl) dmg += ab.d;

            const isLethal = target.hp <= dmg;
            const targetBp = this.getBlueprint(target.t);

            // Base score based on damage output
            let score = Math.min(target.hp, dmg) * 3;

            // Lethal focus-fire bonus
            if (isLethal) {
              score += this.isHighDifficulty() ? 65 : 30;
            }

            // High-value targets
            if (target.t === 'H') score += 40;
            if (target.isDefendTarget) score += 60;
            if (target.isVip) score += 70;
            score += targetBp.c * 1.5;

            // Tactical Counter Multipliers
            if (['HF', 'U', 'IJ'].includes(u.t) && isAirUnit(target.t)) {
              score += 45; // Anti-Air prioritizing Aircraft
            }
            if (['T', 'B', 'D', 'SR', 'SH'].includes(u.t) && ['J', 'D', 'SH', 'DW', 'GS', 'B'].includes(target.t)) {
              score += 35; // Anti-Tank prioritizing Heavy Armor
            }
            if (['G', 'Z', 'X', 'MT'].includes(u.t) && this.isInfantry(target)) {
              score += 30; // Anti-Infantry prioritizing Infantry
            }

            // Artillery & Sniper Standoff Kiting
            if (isArtilleryOrSniper && this.isHighDifficulty()) {
              const targetDist = Math.hypot(target.x - node.x, target.y - node.y);
              if (targetDist >= 2.5) {
                score += 25; // Bonus for maintaining maximum safe standoff range
              } else if (targetDist <= 1.2 && !this.getBlueprint(target.t).bl) {
                score -= 30; // Heavy penalty for engaging melee enemies point blank
              }
            }

            // Defensive terrain cover bonus
            if (this.isHighDifficulty()) {
              const tile = this.ob[node.y]?.[node.x] || 0;
              if (tile === 5) score += 15; // Trench cover
              else if (tile === 2 || tile === 1) score += 10; // Concrete/rock cover
            }

            // Tryhard Counter-Attack Threat Evaluation
            if (this.isTryhard()) {
              const enemiesNearNode = this.U.filter(
                (e) => e.o !== u.o && !this.getBlueprint(e.t).bl && Math.hypot(e.x - node.x, e.y - node.y) <= 2
              );
              if (enemiesNearNode.length >= 2 && !isLethal && target.t !== 'H') {
                score -= 35; // Avoid reckless trades where 2+ enemies can collapse on us
              }
            }

            if (score > maxDamageScore) {
              maxDamageScore = score;
              bestAttack = [key, target, abIdx];
            }
          }
        }
      });
      u.ai = 0;
    }

    if (bestAttack) {
      if (bestAttack[0] !== startKey && this.canUnitMove(u)) {
        await this.moveUnit(u, bestAttack[0]);
      }
      u.ai = bestAttack[2];
      await this.attackTarget(u, bestAttack[1]);
      u.ai = 0;
      return;
    }

    // ==========================================
    // 8. TACTICAL ADVANCE & REPOSITIONING
    // ==========================================
    if (!this.canUnitMove(u)) return;

    const enemies = this.U.filter((other) => other.o !== u.o && other.hp > 0);
    if (!enemies.length) return;

    // In smarty/sweat/tryhard: infantry check for uncaptured outposts first
    if (this.isInfantry(u) && this.isIntermediateOrHigher()) {
      const contestedOutposts = this.U.filter((b) => (b.t === 'O' || b.t === 'H') && b.o !== u.o);
      if (contestedOutposts.length > 0) {
        contestedOutposts.sort((a, b) => Math.hypot(a.x - u.x, a.y - u.y) - Math.hypot(b.x - u.x, b.y - u.y));
        const nearestOutpost = contestedOutposts[0];

        let bestNodeKey = startKey;
        let shortestDist = Math.hypot(nearestOutpost.x - u.x, nearestOutpost.y - u.y);

        for (const [key, node] of rMap.entries()) {
          if (!node) continue;
          const d = Math.hypot(nearestOutpost.x - node.x, nearestOutpost.y - node.y);
          if (d < shortestDist) {
            shortestDist = d;
            bestNodeKey = key;
          }
        }

        if (bestNodeKey !== startKey) {
          await this.moveUnit(u, bestNodeKey);
          return;
        }
      }
    }

    // Artillery / Sniper Kiting & Standoff Position Maintenance
    if (isArtilleryOrSniper && this.isHighDifficulty()) {
      enemies.sort((a, b) => Math.hypot(a.x - u.x, a.y - u.y) - Math.hypot(b.x - u.x, b.y - u.y));
      const closestEnemy = enemies[0];
      const curDist = Math.hypot(closestEnemy.x - u.x, closestEnemy.y - u.y);

      // Ideal artillery range is ~3.5 tiles. If enemy is too close (< 2.5), step backwards!
      if (curDist < 2.5) {
        let bestKiteKey = startKey;
        let bestKiteScore = -9999;

        for (const [key, node] of rMap.entries()) {
          if (!node) continue;
          const d = Math.hypot(closestEnemy.x - node.x, closestEnemy.y - node.y);
          // Prefer range 3-4 away from enemy
          const kiteScore = -Math.abs(d - 3.5);
          if (kiteScore > bestKiteScore) {
            bestKiteScore = kiteScore;
            bestKiteKey = key;
          }
        }

        if (bestKiteKey !== startKey) {
          await this.moveUnit(u, bestKiteKey);
          return;
        }
      }
    }

    // Standard Advance towards closest enemy or enemy HQ
    enemies.sort((a, b) => Math.hypot(a.x - u.x, a.y - u.y) - Math.hypot(b.x - u.x, b.y - u.y));
    const closest = enemies[0];

    let bestKey = startKey;
    let bestScore = -9999;

    for (const [key, node] of rMap.entries()) {
      if (!node) continue;
      const d = Math.hypot(closest.x - node.x, closest.y - node.y);
      let score = -d * 10;

      // In sweat/tryhard, favor paths that take defensive cover
      if (this.isHighDifficulty()) {
        const tile = this.ob[node.y]?.[node.x] || 0;
        if (tile === 5) score += 6; // Trench
        else if (tile === 2 || tile === 1) score += 4; // Ruins/rock
      }

      if (score > bestScore) {
        bestScore = score;
        bestKey = key;
      }
    }

    if (bestKey !== startKey) {
      await this.moveUnit(u, bestKey);
    }
  }

  public async tween(durationMs: number, onFrame: (t: number) => void): Promise<void> {
    const dur = durationMs / this.gameSpeed;
    const start = performance.now();
    const raf = typeof requestAnimationFrame !== 'undefined'
      ? requestAnimationFrame
      : (cb: () => void) => setTimeout(cb, 16);
    return new Promise((resolve) => {
      const loop = () => {
        const k = Math.min(1, (performance.now() - start) / dur);
        onFrame(k);
        if (k < 1) raf(loop);
        else resolve();
      };
      loop();
    });
  }

  public sleep(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms / this.gameSpeed));
  }

  public addSpark(x: number, y: number, color: string, count: number = 10, speed: number = 3, size: number = 3) {
    for (let i = 0; i < count && this.pt.length < 500; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * speed;
      this.pt.push({
        x: (x + 0.5) * this.C,
        y: (y + 0.5) * this.C,
        gx: x,
        gy: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 0.4,
        l: 1,
        d: 0.02 + Math.random() * 0.03,
        c: color,
        s: size * (0.5 + Math.random()),
      });
    }
  }

  public addRing(x: number, y: number, color: string, radius: number = 70) {
    const ring = { id: Math.random().toString(), f: 'r', x, y, k: 0, c: color, R: radius };
    this.fx.push(ring);
    this.tween(600, (k) => (ring.k = k)).then(() => {
      this.fx = this.fx.filter((item) => item !== ring);
    });
  }

  public addFloatingText(target: { x: number; y: number }, str: string, color: string) {
    const textFx = { id: Math.random().toString(), f: 't', x: target.x, y: target.y, s: str, c: color, k: 0 };
    this.fx.push(textFx);
    this.tween(750, (k) => (textFx.k = k)).then(() => {
      this.fx = this.fx.filter((item) => item !== textFx);
    });
  }

  public triggerExplosion(target: PlacedUnit, heavy: boolean = false) {
    const isHq = target.t === 'H';
    AudioService.play('boom', target.x, target.y);
    this.addSpark(target.x, target.y, '#fbbf24', 35, 6, 5);
    this.addSpark(target.x, target.y, '#f97316', 22, 5, 5);
    this.addRing(target.x, target.y, '#fbbf24');
    this.addRing(target.x, target.y, '#f97316');
    this.scorch.push({ x: target.x, y: target.y, r: isHq ? 24 : 18, a: 0.4 });
    if (this.scorch.length > 70) this.scorch.shift();
    this.flash = Math.max(this.flash, isHq ? 0.7 : 0.4);
    this.shake = Math.max(this.shake, isHq ? 20 : 10);
  }

  public async shootAnimation(u: PlacedUnit, target: { x: number; y: number }) {
    const vis = this.getVisibilityMap(this.view);
    const seen = vis[u.y * this.N + u.x] || vis[target.y * this.N + target.x];
    const code = u.t;
    const colorMap: Record<string, string> = {
      R: '#fde047',
      M: '#fb923c',
      A: '#f97316',
      S: '#e2e8f0',
      B: '#f87171',
      P: '#4ade80',
      C: '#fde047',
      L: '#fb7185',
      F: '#fbbf24',
      E: '#22d3ee',
      G: '#fde047',
      Y: '#fbbf24',
      J: '#f87171',
      T: '#fb7185',
      Z: '#fde047',
      V: '#fbbf24',
      D: '#22d3ee',
      U: '#fde047',
      Q: '#38bdf8',
      I: '#94a3b8',
      X: '#f97316',
      MR: '#e2e8f0',
      AT: '#fb923c',
      AC: '#fb923c',
      FC: '#facc15',
      SP: '#f97316',
      SH: '#38bdf8',
      DW: '#c084fc',
      HF: '#facc15',
      SB: '#e2e8f0',
      NS: '#4ade80',
      IJ: '#38bdf8',
      MT: '#f97316',
      SR: '#94a3b8',
      CH: '#06b6d4',
      GS: '#f87171',
    };
    const col = colorMap[code] || '#fde047';

    if (target.x !== u.x) u.dr = target.x > u.x ? 1 : -1;

    await this.tween(seen ? 250 : 1, (k) => (u.wx = Math.sin(k * 50) * 3 * (1 - k)));
    u.wx = 0;
    u.rc = 1;
    this.addSpark(u.x, u.y, col, 10, 4, 3);
    AudioService.play(code, u.x, u.y, seen);

    const isBeam = ['S', 'E', 'D', 'SH', 'NS', 'CH'].includes(code);
    const proj = {
      id: Math.random().toString(),
      f: 'p',
      ox: u.x,
      oy: u.y,
      x: u.x,
      y: u.y,
      c: col,
      r: ['A', 'B', 'L', 'J', 'D', 'DW', 'GS', 'SP', 'SR'].includes(code) ? 7 : 3,
      l: isBeam,
      h: 0,
      seen,
      k: 0,
    };
    this.fx.push(proj);

    const dur = seen ? 240 : 1;
    await this.tween(dur, (k) => {
      proj.x = u.x + (target.x - u.x) * k;
      proj.y = u.y + (target.y - u.y) * k;
      proj.h = ['A', 'L', 'SP', 'MT', 'DW'].includes(code) ? Math.sin(k * Math.PI) * 60 : 0;
    });
    this.fx = this.fx.filter((item) => item !== proj);

    const isBig = ['A', 'L', 'SP', 'MT', 'DW', 'GS', 'SB'].includes(code);
    const exp = {
      id: Math.random().toString(),
      f: 'e',
      x: target.x,
      y: target.y,
      k: 0,
      c: col,
      seen,
      b: 'ABL'.includes(code),
      big: isBig,
    };
    if (seen) {
      this.addSpark(target.x, target.y, col, isBig ? 25 : 12, 5, 4);
      if (isBig) this.shake = Math.max(this.shake, 12);
    }
    this.fx.push(exp);
    await this.tween(seen ? (isBig ? 450 : 220) : 1, (k) => (exp.k = k));
    this.fx = this.fx.filter((item) => item !== exp);
  }
}
