import { UnitBlueprint, UnitAbility } from '../types/game';

export const makeAbility = (
  n: string,
  d: number,
  rg: number,
  f: string = '',
  a?: number,
  cd?: number
): UnitAbility => ({ n, d, rg, f, a, cd });

// Units that fly freely above ground obstacles
export const AIR_UNIT_CODES = ['F', 'Y', 'V', 'SB', 'IJ'];

export const isAirUnit = (code: string): boolean => AIR_UNIT_CODES.includes(code);

// Heavy mechanized vehicles and tanks that cannot enter dense forest or trenches
export const HEAVY_VEHICLE_CODES = [
  'B',  // Battle Tank
  'M',  // Multi FTank / Heavy Tank
  'A',  // Artillery
  'SP', // Self-Propelled Artillery
  'L',  // Rocket Launcher
  'SH', // Aegis Shield Tank
  'D',  // Railgun Destroyer
  'J',  // Juggernaut Titan
  'DW', // Dreadnought Walker
  'GS', // Goliath Fortress
  'SR', // Siege Ram
  'FC', // Mobile Factory
  'AC', // Heavy Armored Carrier
  'HF', // Heavy Flak
  'AT', // Assault Transport
  'U',  // Flak Halftrack
  'E',  // EMP Jammer
  'P',  // Supplier Rig
];

export const isHeavyVehicle = (code: string): boolean => HEAVY_VEHICLE_CODES.includes(code);

// Default starter units unlocked from day one (NOT locked by quests)
// As requested: Suppliers (P), Engineers (N), Machine Gunners (Z), etc. are NOT locked by quests!
export const STARTER_UNITS = [
  'R',  // Riflemen
  'C',  // Scout Buggy
  'K',  // Field Medic
  'T',  // Anti-Tank
  'B',  // Battle Tank
  'A',  // Artillery
  'P',  // Supplier (Requested: NOT locked by quests!)
  'N',  // Combat Engineer
  'Z',  // Machine Gunner
  'X',  // Shock Trooper
  'U',  // Flak Halftrack
  'AT', // Assault Transport (Carrier)
  'MT', // Mortar Team
];

export const UNIT_BLUEPRINTS: Record<string, UnitBlueprint> = {
  H: {
    n: 'HQ Fortress',
    hp: 16,
    c: 0,
    mv: 0,
    v: 4,
    bl: 1,
    ab: [],
    d: 0,
    tier: 1,
    mitsCost: 0,
    description: 'Central Command Fortress. Generates +2 Gold per turn and automatically resupplies adjacent friendly forces.',
  },
  O: {
    n: 'Outpost',
    hp: 6,
    c: 0,
    mv: 0,
    v: 2,
    bl: 1,
    ab: [],
    d: 0,
    tier: 1,
    mitsCost: 0,
    description: 'Strategic resource station. Generates +1 Gold per turn. Capturable only by foot infantry squads.',
  },
  W: {
    n: 'Barracks & Armory',
    hp: 14,
    c: 0,
    mv: 0,
    v: 3,
    bl: 1,
    ab: [],
    d: 0,
    tier: 1,
    mitsCost: 0,
    description: 'Forward staging garrison. Allows tactical deployment on adjacent tiles and supplies passing columns every 3 turns.',
  },

  // === TIER 1 & CORE COMBAT (UNLOCKED BY DEFAULT) ===
  R: {
    n: 'Riflemen',
    hp: 3,
    c: 4,
    mv: 2,
    am: 6,
    v: 3,
    tier: 1,
    mitsCost: 0,
    description: 'Frontline infantry platoon. Specialized in seizing neutral and enemy outposts and holding entrenched positions.',
    ab: [
      makeAbility('Rifle burst', 1, 2),
      makeAbility('Frag grenade', 3, 2, 'i', 2, 2),
    ],
    d: 3,
  },
  C: {
    n: 'Scout Buggy',
    hp: 2,
    c: 6,
    mv: 5,
    fu: 12,
    am: 6,
    v: 5,
    tier: 1,
    mitsCost: 0,
    description: 'High-speed recon light vehicle with extended sight radius and hit-and-run ambush machine guns.',
    ab: [
      makeAbility('SMG burst', 1, 1),
      makeAbility('Ambush strike', 2, 1, '', 2),
    ],
    d: 2,
  },
  K: {
    n: 'Field Medic',
    hp: 2,
    c: 7,
    mv: 3,
    v: 3,
    tier: 1,
    mitsCost: 0,
    description: 'Tactical medical corps capable of triage healing wounded infantry squads and restoring fighting power.',
    ab: [
      makeAbility('Field Triage', 3, 2, 'ri', 0, 1), // heal infantry
      makeAbility('Combat Stim', 2, 1, 'ri', 0, 2), // heal and unstun
      makeAbility('Sidearm', 1, 1),
    ],
    d: 3,
  },
  T: {
    n: 'Anti-Tank Squad',
    hp: 3,
    c: 10,
    mv: 2,
    am: 4,
    v: 3,
    tier: 1,
    mitsCost: 0,
    description: 'Heavy shaped-charge rocket squad delivering lethal armor-piercing damage against mechanized vehicles.',
    ab: [
      makeAbility('AT rocket', 3, 3, 'a'),
      makeAbility('Sidearm', 1, 1, '', 0),
    ],
    d: 3,
  },
  B: {
    n: 'Battle Tank',
    hp: 8,
    c: 22,
    mv: 3,
    fu: 10,
    am: 6,
    v: 3,
    tier: 1,
    mitsCost: 0,
    description: 'Main battle tank boasting heavy composite armor, coaxial machine guns, and a devastating 120mm main cannon.',
    ab: [
      makeAbility('Main gun', 4, 3),
      makeAbility('Coaxial MG', 2, 2, '', 0),
    ],
    d: 4,
  },
  A: {
    n: 'Artillery',
    hp: 2,
    c: 15,
    mv: 1,
    fu: 6,
    am: 5,
    v: 3,
    tier: 1,
    mitsCost: 0,
    description: 'Heavy howitzer battery providing long-range indirect ballistic bombardment over walls and terrain obstacles.',
    ab: [
      makeAbility('Howitzer shell', 4, 5, 'i'),
      makeAbility('Cluster barrage', 2, 4, 'is', 2),
    ],
    d: 4,
  },

  // === UTILITY & STANDARD UNITS (UNLOCKED BY DEFAULT PER USER REQUEST) ===
  P: {
    n: 'Supplier Rig',
    hp: 3,
    c: 8,
    mv: 3,
    fu: 12,
    v: 3,
    tier: 2,
    mitsCost: 0, // UNLOCKED by default as requested
    description: 'Essential mobile support crew. Fully refuels tanks, restocks ammunition, and patches vehicle hulls in the field.',
    ab: [
      makeAbility('Full Resupply', 0, 2, 'hi', 0, 1),
      makeAbility('Hull Patch', 2, 1, 'r', 0, 2),
      makeAbility('Sidearm', 1, 2),
    ],
    d: 2,
  },
  N: {
    n: 'Combat Engineer',
    hp: 3,
    c: 8,
    mv: 2,
    am: 4,
    v: 3,
    tier: 2,
    mitsCost: 0, // UNLOCKED by default as requested
    description: 'Sapper unit that repairs fortifications, restores damaged armor hulls, or detonates concentrated breaching charges.',
    ab: [
      makeAbility('Fortification Repair', 3, 1, 'rb', 0, 1),
      makeAbility('Demolition Charge', 4, 1, 'b', 2, 2),
    ],
    d: 4,
  },
  Z: {
    n: 'Machine Gunner',
    hp: 3,
    c: 9,
    mv: 1,
    am: 8,
    v: 3,
    tier: 2,
    mitsCost: 0, // UNLOCKED by default as requested
    description: 'Heavy sustained-fire weapons crew that pins enemy infantry and halts aggressive armored advances.',
    ab: [
      makeAbility('Suppressing Fire', 1, 3, 'u'),
      makeAbility('Heavy Burst', 2, 3, '', 2),
    ],
    d: 2,
  },
  X: {
    n: 'Shock Trooper',
    hp: 4,
    c: 9,
    mv: 2,
    am: 6,
    v: 3,
    tier: 2,
    mitsCost: 0, // UNLOCKED by default
    description: 'Armored incendiary assault infantry equipped with a pressurized flamethrower for sweeping adjacent tiles with fire.',
    ab: [
      makeAbility('Flamethrower Sweep', 2, 1, 's'),
      makeAbility('Thermal Breach', 4, 1, 'b', 2, 2),
    ],
    d: 4,
  },
  U: {
    n: 'Flak Halftrack',
    hp: 4,
    c: 12,
    mv: 3,
    fu: 10,
    am: 8,
    v: 4,
    tier: 2,
    mitsCost: 0, // UNLOCKED by default
    description: 'Mobile dual 20mm autocannon halftrack lethal against hostile aircraft, strike drones, and light armored scouts.',
    ab: [
      makeAbility('Flak Autocannon', 2, 3, 's'),
      makeAbility('Anti-Air Salvo', 4, 3, 'a', 2, 1),
    ],
    d: 4,
  },
  AT: {
    n: 'Assault Transport (APC)',
    hp: 6,
    c: 16,
    mv: 4,
    fu: 12,
    am: 6,
    v: 4,
    tier: 2,
    mitsCost: 0, // UNLOCKED by default
    canCarry: true,
    description: 'Armored personnel carrier with Carry Unit ability! Can embark friendly infantry, shield them from fire, and deploy them on the front.',
    ab: [
      makeAbility('Load / Carry Unit', 0, 1, 'c'),
      makeAbility('Unload Cargo', 0, 1, 'uo'),
      makeAbility('Autocannon Burst', 2, 2),
      makeAbility('Suppression Burst', 1, 3, 'u', 2, 1),
    ],
    d: 2,
  },
  MT: {
    n: 'Mortar Team',
    hp: 3,
    c: 11,
    mv: 2,
    am: 6,
    v: 4,
    tier: 2,
    mitsCost: 0, // UNLOCKED by default
    description: 'Two-soldier mortar team lobbing indirect high-explosive and smoke canisters over obstacles into entrenched positions.',
    ab: [
      makeAbility('Mortar Barrage', 3, 4, 'i'),
      makeAbility('Smoke Pin', 1, 3, 'iu', 1, 2),
    ],
    d: 3,
  },

  // === UNIQUE ABILITY & SUPPORT VEHICLES ===
  AC: {
    n: 'Heavy Armored Carrier',
    hp: 8,
    c: 24,
    mv: 4,
    fu: 14,
    am: 6,
    v: 4,
    tier: 2,
    mitsCost: 450,
    canCarry: true,
    description: 'Reinforced heavy tracked combat carrier with Carry Unit ability. Requisition directly with Mits or unlock via quests.',
    ab: [
      makeAbility('Embark Unit', 0, 1, 'c'),
      makeAbility('Deploy Cargo', 0, 1, 'uo'),
      makeAbility('Heavy 30mm Cannon', 3, 2),
    ],
    d: 3,
  },
  FC: {
    n: 'Mobile Factory Crawler',
    hp: 10,
    c: 58,
    mv: 2,
    fu: 10,
    am: 8,
    v: 3,
    tier: 4,
    mitsCost: 1600,
    isSpawner: true,
    spawnUnitOptions: ['R', 'K', 'T', 'C'],
    description: 'Autonomous field fabrication crawler. Can manufacture and deploy Riflemen, Medics, or Scouts right on the frontline! Requisition directly with Mits.',
    ab: [
      makeAbility('Fabricate Platoon', 0, 1, 'sp', 0, 2),
      makeAbility('Heavy Point Defense', 3, 2),
      makeAbility('Emergency Field Repair', 4, 1, 'r', 0, 2),
    ],
    d: 4,
  },

  // === ADVANCED COMBAT UNITS (DIRECT MITS UNLOCK OR QUEST CLAIM) ===
  G: {
    n: 'Commando',
    hp: 3,
    c: 10,
    mv: 3,
    am: 6,
    v: 4,
    tier: 2,
    mitsCost: 240,
    description: 'Elite special forces equipped with silenced carbines and breaching charges. Requisition directly with Mits or complete quests.',
    ab: [
      makeAbility('Tactical Carbine', 2, 2),
      makeAbility('Breaching Charge', 4, 1, 'b', 2, 2),
    ],
    d: 4,
  },
  S: {
    n: 'Sniper',
    hp: 2,
    c: 10,
    mv: 2,
    am: 6,
    v: 5,
    tier: 2,
    mitsCost: 320,
    description: 'Extreme-range marksman able to fire diagonal precision shots. Requisition directly with Mits or complete quests.',
    ab: [
      makeAbility('Precision Shot', 3, 4, 'd'),
      makeAbility('Anti-Materiel Round', 4, 5, 'da', 3),
    ],
    d: 4,
  },
  I: {
    n: 'Infiltrator',
    hp: 2,
    c: 11,
    mv: 3,
    am: 4,
    v: 6,
    tier: 2,
    mitsCost: 360,
    description: 'Stealth operative with advanced radar recon, silenced sniper rifle, and miniature EMP pulse generator. Requisition with Mits.',
    ab: [
      makeAbility('Silenced Sniper', 3, 3, 'd'),
      makeAbility('EMP Pulse', 0, 2, 'ij', 0, 2),
    ],
    d: 3,
  },
  Q: {
    n: 'Hovercraft Raider',
    hp: 3,
    c: 12,
    mv: 4,
    fu: 10,
    am: 6,
    v: 4,
    tier: 2,
    mitsCost: 420,
    description: 'All-terrain amphibious skirmisher that glides rapidly over water and mud with high-frequency pulse blasters. Requisition with Mits.',
    ab: [
      makeAbility('Pulse Blaster', 2, 2),
      makeAbility('Overdrive Burst', 3, 2, '', 2),
    ],
    d: 3,
  },
  V: {
    n: 'Strike Drone',
    hp: 1,
    c: 12,
    mv: 6,
    fu: 8,
    am: 1,
    v: 4,
    tier: 2,
    mitsCost: 340,
    description: 'Expendable autonomous aerial drone capable of high-velocity kamikaze suicide dives into enemy targets. Requisition with Mits.',
    ab: [makeAbility('Kamikaze Dive', 5, 1, 'sx')],
    d: 5,
  },
  M: {
    n: 'Multi FTank',
    hp: 6,
    c: 15,
    mv: 4,
    fu: 12,
    am: 8,
    v: 3,
    tier: 2,
    mitsCost: 380,
    description: 'Medium multi-turret cruiser balancing high road speed with rapid-fire twin explosive cannon barrels. Requisition with Mits.',
    ab: [
      makeAbility('Twin Autocannon', 2, 2),
      makeAbility('HE Shell', 3, 2, '', 2),
    ],
    d: 3,
  },
  Y: {
    n: 'Attack Gunship',
    hp: 5,
    c: 34,
    mv: 5,
    fu: 8,
    am: 5,
    v: 4,
    tier: 3,
    mitsCost: 680,
    description: 'Heavy attack helicopter flying freely above terrain obstacles with armor-piercing Hellfire missiles. Requisition with Mits.',
    ab: [
      makeAbility('Chain Gun', 2, 2),
      makeAbility('Hellfire Missile', 4, 3, 'a', 2, 2),
    ],
    d: 4,
  },
  F: {
    n: 'Heavy Bomber',
    hp: 4,
    c: 38,
    mv: 4,
    fu: 8,
    am: 3,
    v: 4,
    tier: 3,
    mitsCost: 660,
    description: 'Strategic heavy bombing platform executing devastating carpet strikes against clustered enemy battalions. Requisition with Mits.',
    ab: [
      makeAbility('Bunker Bomb', 4, 1, 'b'),
      makeAbility('Carpet Strike', 3, 1, 's', 2, 2),
    ],
    d: 4,
  },
  L: {
    n: 'Rocket Launcher',
    hp: 3,
    c: 38,
    mv: 2,
    fu: 6,
    am: 3,
    v: 3,
    tier: 3,
    mitsCost: 690,
    description: 'Mobile rocket artillery delivering massive thermobaric salvos with wide collateral blast radius. Requisition with Mits.',
    ab: [
      makeAbility('Rocket Salvo', 3, 4, 'is'),
      makeAbility('Thermobaric Warhead', 5, 3, 'is', 3),
    ],
    d: 5,
  },
  E: {
    n: 'EMP Jammer',
    hp: 3,
    c: 24,
    mv: 2,
    fu: 8,
    v: 3,
    tier: 3,
    mitsCost: 500,
    description: 'Electronic warfare vehicle that emits an electromagnetic pulse to freeze enemy vehicles and weapon systems. Requisition with Mits.',
    ab: [
      makeAbility('EMP Pulse', 0, 3, 'ij', 0, 2),
      makeAbility('Arc Discharge', 2, 2, 'i'),
    ],
    d: 2,
  },
  MR: {
    n: 'Marksman Team',
    hp: 2,
    c: 16,
    mv: 2,
    am: 5,
    v: 6,
    tier: 2,
    mitsCost: 380,
    description: 'Long-range precision infantry with exceptional scouting vision and spotter marks that illuminate hidden targets. Requisition with Mits.',
    ab: [
      makeAbility('Precision Shot', 3, 4, 'd'),
      makeAbility('Spotter Mark', 1, 5, 'i', 1, 2),
    ],
    d: 3,
  },
  SP: {
    n: 'Self-Propelled Artillery',
    hp: 4,
    c: 42,
    mv: 2,
    fu: 8,
    am: 5,
    v: 3,
    tier: 3,
    mitsCost: 750,
    description: 'Tracked siege platform that delivers indirect explosive fire from deep behind the frontline. Requisition with Mits.',
    ab: [
      makeAbility('Siege Shell', 4, 5, 'is'),
      makeAbility('Airburst Round', 3, 4, 'is', 2, 1),
    ],
    d: 4,
  },
  SH: {
    n: 'Aegis Shield Tank',
    hp: 9,
    c: 45,
    mv: 3,
    fu: 10,
    am: 6,
    v: 3,
    tier: 3,
    mitsCost: 790,
    description: 'Heavy armored vehicle with frontal particle shield. Discharges high-energy arc beams and can reinforce its own integrity. Requisition with Mits.',
    ab: [
      makeAbility('Arc Disruptor', 3, 2, 'a'),
      makeAbility('Deflector Field', 3, 1, 'r', 0, 2),
    ],
    d: 3,
  },
  HF: {
    n: 'Heavy Flak Battery',
    hp: 5,
    c: 35,
    mv: 2,
    fu: 8,
    am: 8,
    v: 4,
    tier: 3,
    mitsCost: 650,
    description: 'Heavy dual 88mm tracked flak battery delivering area-of-effect anti-aircraft fire and pinning enemy armor. Requisition directly with Mits.',
    ab: [
      makeAbility('Flak Barrage', 3, 3, 'sa'),
      makeAbility('Suppression Sweep', 2, 3, 'u', 2, 1),
    ],
    d: 3,
  },
  SB: {
    n: 'Stealth Bomber',
    hp: 4,
    c: 48,
    mv: 5,
    fu: 10,
    am: 4,
    v: 5,
    tier: 3,
    mitsCost: 880,
    description: 'Radar-absorbent flying wing strike aircraft delivering heavy bunker-buster ordnance behind enemy lines. Requisition directly with Mits.',
    ab: [
      makeAbility('Bunker Buster', 5, 1, 'b'),
      makeAbility('Thermobaric Drop', 3, 1, 's', 2, 2),
    ],
    d: 5,
  },
  NS: {
    n: 'Nanite Swarm Hive',
    hp: 4,
    c: 26,
    mv: 3,
    fu: 8,
    am: 4,
    v: 4,
    tier: 3,
    mitsCost: 650,
    description: 'Tactical field drone carrier dispersing self-replicating nanobots that corrode hostile vehicles or repair friendly hulls. Requisition with Mits.',
    ab: [
      makeAbility('Nanite Corrosion', 2, 3, 'ia'),
      makeAbility('Nanite Bio-Repair', 4, 2, 'ri', 0, 2),
    ],
    d: 4,
  },
  IJ: {
    n: 'Interceptor Jet',
    hp: 4,
    c: 40,
    mv: 7,
    fu: 10,
    am: 6,
    v: 5,
    tier: 3,
    mitsCost: 760,
    description: 'Supersonic tactical jet fighter capable of crossing the battlefield in moments to intercept incoming hostile threats. Requisition directly with Mits.',
    ab: [
      makeAbility('Vulcan Cannon', 3, 2),
      makeAbility('Sidewinder Missile', 4, 3, 'a', 2, 1),
    ],
    d: 4,
  },
  SR: {
    n: 'Siege Ram Carrier',
    hp: 8,
    c: 36,
    mv: 3,
    fu: 10,
    am: 4,
    v: 3,
    tier: 3,
    mitsCost: 680,
    description: 'Reinforced assault carrier fitted with a hydraulic kinetic ram for shattering defensive bunkers and fortified outposts. Requisition with Mits.',
    ab: [
      makeAbility('Hydraulic Ram', 6, 1, 'b'),
      makeAbility('Pneumatic Blast', 3, 2),
    ],
    d: 6,
  },
  CH: {
    n: 'Cyber Infiltrator',
    hp: 3,
    c: 22,
    mv: 3,
    am: 5,
    v: 5,
    tier: 3,
    mitsCost: 660,
    description: 'Electronic cyber-warfare specialist equipped to jam enemy hardware frequencies and strike with silenced carbines. Requisition with Mits.',
    ab: [
      makeAbility('System Hijack', 0, 3, 'ij', 0, 2),
      makeAbility('Silenced Carbine', 3, 2),
    ],
    d: 3,
  },

  // === OP & APEX BOSS UNITS ===
  D: {
    n: 'Railgun Destroyer',
    hp: 7,
    c: 44,
    mv: 2,
    fu: 8,
    am: 4,
    v: 4,
    tier: 3,
    mitsCost: 800,
    description: 'Advanced anti-armor tank destroyer utilizing a linear electromagnetic accelerator to punch through heavy plating. Requisition directly with Mits.',
    ab: [
      makeAbility('Railgun Spike', 5, 4, 'da'),
      makeAbility('Overcharge Beam', 7, 3, 'da', 2, 2),
    ],
    d: 7,
  },
  J: {
    n: 'Juggernaut Titan',
    hp: 12,
    c: 68,
    mv: 2,
    fu: 8,
    am: 5,
    v: 3,
    tier: 4,
    mitsCost: 1400,
    description: 'Super-heavy walking fortress outfitted with dual cannons, flame sweeps, and integrated mortar batteries. Requisition with Mits or unlock via apex quest.',
    ab: [
      makeAbility('Heavy Cannon', 5, 3),
      makeAbility('Flame Sweep', 3, 1, 's'),
      makeAbility('Mortar Barrage', 4, 3, 'i', 2, 2),
    ],
    d: 5,
  },
  DW: {
    n: 'Dreadnought Walker',
    hp: 14,
    c: 75,
    mv: 2,
    fu: 10,
    am: 6,
    v: 4,
    tier: 4,
    mitsCost: 1650,
    description: 'Colossal quad-pedal walking titan armed with dual plasma accelerators and a heavy roof-mounted mortar. Requisition with Mits or unlock via apex quest.',
    ab: [
      makeAbility('Twin Plasma', 5, 3),
      makeAbility('Seismic Stomp', 4, 1, 's'),
      makeAbility('Heavy Mortar', 5, 4, 'i', 2, 2),
    ],
    d: 5,
  },
  GS: {
    n: 'Goliath Fortress',
    hp: 16,
    c: 90,
    mv: 2,
    fu: 12,
    am: 8,
    v: 4,
    tier: 4,
    mitsCost: 2200,
    description: 'The supreme commander of the armored battlefield. Multi-turreted supertank with quad tracks, heavy cannon, and thermobaric missiles.',
    ab: [
      makeAbility('180mm Cannon', 6, 3),
      makeAbility('Rocket Battery', 5, 4, 'is', 2, 2),
      makeAbility('Coaxial Sweep', 3, 2),
    ],
    d: 6,
  },
};

// Calculate maximum damage rating for all blueprints
for (const key of Object.keys(UNIT_BLUEPRINTS)) {
  const bp = UNIT_BLUEPRINTS[key];
  bp.d = Math.max(0, ...bp.ab.map((ab) => ab.d));
}
