export type FactionId = 0 | 1 | 2 | 3 | -1;

export type CamoStyle =
  | 'standard'
  | 'desert'
  | 'arctic'
  | 'stealth'
  | 'cyber'
  | 'ww2_britain'
  | 'ww2_germany'
  | 'modern_usa'
  | 'girls_und_panzer'
  | 'neko'
  | 'toy_soldiers'
  | 'napoleonic_france'
  | 'napoleonic_britain'
  | 'imperial_japan';

export interface SkinDefinition {
  id: string;
  name: string;
  description: string;
  costMits: number;
  accentColor: string;
  hullTone: string;
  camoStyle: CamoStyle;
  tagline: string;
  taglineIcon?: string;
  taglineClass?: string;
}

export interface UnitAbility {
  n: string; // name
  d: number; // damage / heal value
  rg: number; // range
  f: string; // flags: i=indirect, d=diagonal, s=splash, a=anti-armor, b=anti-building, u=suppress/pin, x=kamikaze, h=heal/resupply, j=emp/freeze, r=repair, c=carry/load, uo=unload, sp=spawn
  a?: number; // ammo cost
  cd?: number; // cooldown
}

export interface UnitBlueprint {
  n: string; // name
  hp: number;
  c: number; // cost in gold
  mv: number; // movement reach
  fu?: number; // fuel
  am?: number; // ammunition
  v: number; // vision
  bl?: number; // building flag
  ab: UnitAbility[];
  d?: number; // primary damage rating
  tier?: number;
  mitsCost?: number;
  description?: string;
  canCarry?: boolean; // can load & carry infantry
  isSpawner?: boolean; // can build units on adjacent tiles
  spawnUnitOptions?: string[]; // unit codes it can spawn
}

export interface PlacedUnit {
  id: string;
  t: string; // unit code type
  o: number; // owner faction (-1 = neutral, 0 = player 1, 1 = player 2, etc.)
  x: number;
  y: number;
  rx: number;
  ry: number;
  hp: number;
  maxHp: number;
  fu?: number;
  maxFu?: number;
  am?: number;
  maxAm?: number;
  abAmmo?: number[]; // Per-ability current ammo
  maxAbAmmo?: number[]; // Per-ability maximum ammo
  attacksThisTurn?: number; // Count of attacks performed this turn
  moved?: number;
  acted?: number;
  cd?: number;
  spawnCd?: number;
  wx?: number;
  ph?: number;
  dr?: number; // direction (1 = right, -1 = left)
  rc?: number; // recoil
  mw?: number; // moving walk
  fz?: number; // frozen/jammed
  sp?: number; // suppressed/pinned
  gm?: number; // ground aim mode
  ai?: number; // active ability index
  fl?: number; // flash timestamp
  us?: number; // resupply used
  isVip?: boolean;
  isDefendTarget?: boolean;
  customName?: string;
  cargo?: PlacedUnit | null; // unit being carried
}

export type TerrainTileType =
  | 0 // Plain grass/ground
  | 1 // Rocky Boulders (Blocks ground & direct fire)
  | 2 // Concrete Ruins (Blocks ground & direct fire)
  | 3 // Water / River / Canal (Passable by Air & Hovercraft)
  | 4 // Mud / Trench (Slows ground vehicles, gives +1 cover defense)
  | 5 // Dense Forest / Jungle (Blocks LoS through tile, high cover for infantry)
  | 6 // Bridge (Allows ground armor & infantry to cross water)
  | 7; // Volcanic Magma Vent / Lava (Hazardous ground)

export interface MinePosition {
  x: number;
  y: number;
  w: boolean; // true = barracks, false = outpost
}

export interface CampaignObjective {
  id: string;
  text: string;
  type: 'destroy_hq' | 'turn_limit' | 'no_friendly_losses' | 'capture_outposts' | 'destroy_vip' | 'defend_and_attack' | 'holdout' | 'counterattack' | 'destroy_all';
  targetCount?: number;
  isBonus?: boolean;
  rewardMits?: number;
}

export interface ReinforcementWave {
  turn: number;
  label?: string;
  faction?: number;
  units: Array<{
    t: string;
    x: number;
    y: number;
    hp?: number;
  }>;
}

export type BotDifficulty = 'normal' | 'smarty' | 'sweat' | 'tryhard' | 'hard' | 'expert';

export interface CampaignMission {
  id: string;
  branchId: string;
  number: number;
  chapter: number;
  title: string;
  codename: string;
  objectiveType: 'destroy_hq' | 'defend_and_attack' | 'holdout' | 'counterattack' | 'destroy_vip' | 'capture_outposts';
  briefing: string;
  intelBrief: string;
  mapSize: number;
  playerGold: number;
  enemyGold: number;
  enemyFactionName: string;
  enemySkin?: string;
  factionSkins?: Record<number, string>;
  factionsCount: number;
  rewardMits: number;
  rewardIntel: number;
  difficulty: BotDifficulty;
  mapTheme?: 'standard' | 'forest' | 'trenches' | 'river' | 'ruins';
  objectives: CampaignObjective[];
  customHqPositions?: Array<{ x: number; y: number }>;
  preplacedMines?: MinePosition[];
  preplacedObstacles?: Array<{ x: number; y: number; type: TerrainTileType }>;
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
  reinforcementWaves?: ReinforcementWave[];
  holdoutTurns?: number;
  defendTargetName?: string;
  defendTargetCoord?: { x: number; y: number };
  vipTargetName?: string;
  vipTargetCoord?: { x: number; y: number };
}

export interface CampaignBranch {
  id: string;
  number: number;
  title: string;
  codename: string;
  description: string;
  unlockCostMits: number;
  requiredPriorBranchId?: string;
  missionIds: string[];
  theaterTheme: string;
}

export interface TacticalQuest {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  statKey: string;
  rewardUnitCode: string;
  rewardMits: number;
  iconName: string;
  category: 'combat' | 'tactics' | 'objectives' | 'apex';
  hint: string;
}

export interface TechUpgrade {
  id: string;
  category: 'infantry' | 'armor' | 'aviation' | 'logistics' | 'tactics';
  title: string;
  description: string;
  costMits: number;
  costIntel: number;
  maxLevel: number;
  statBonus: string;
}

export interface PlayerProfile {
  slotId: number;
  profileName: string;
  lastSaved: number;
  mits: number;
  credits: number; // legacy alias
  intel: number;
  unlockedUnits: string[];
  unlockedBranches: string[];
  unlockedSkins: string[];
  activeSkin: string;
  questProgress: Record<string, number>;
  claimedQuests: string[];
  campaignProgress: Record<string, {
    completed: boolean;
    stars: number;
    bestTurns: number;
    completedObjectives: string[];
  }>;
  purchasedUpgrades: Record<string, number>;
  skirmishStats: {
    battles: number;
    victories: number;
    defeats: number;
    enemiesEliminated: number;
    outpostsCaptured: number;
    totalCreditsEarned: number;
  };
}

export interface GameSettings {
  quality: number; // 1 to 8
  soundMode: number; // 0=fog echo, 1=everywhere, 2=muffler
  masterVolume: number;
  sfxVolume: number;
  muted: boolean;
  screenShake: boolean;
  gameSpeed: number;
}
