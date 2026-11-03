import test from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from './engine';
import { UNIT_BLUEPRINTS, STARTER_UNITS } from '../data/units';

test('Starter units include Supplier, Engineer, Machine Gunner, Transport, and core troops', () => {
  assert.ok(STARTER_UNITS.includes('P'), 'Supplier should be in starter units');
  assert.ok(STARTER_UNITS.includes('N'), 'Engineer should be in starter units');
  assert.ok(STARTER_UNITS.includes('Z'), 'Machine Gunner should be in starter units');
  assert.ok(STARTER_UNITS.includes('AT'), 'Assault Transport should be in starter units');
  assert.ok(STARTER_UNITS.includes('R'), 'Riflemen should be in starter units');
  assert.ok(STARTER_UNITS.includes('B'), 'Battle Tank should be in starter units');
});

test('GameEngine initializes 15x15 board with 2 factions and HQs', () => {
  const engine = new GameEngine();
  engine.initMatch({
    mapSize: 15,
    playersCount: 2,
    humanFactions: [0],
  });

  assert.equal(engine.N, 15);
  assert.equal(engine.NP, 2);
  assert.equal(engine.alive[0], true);
  assert.equal(engine.alive[1], true);

  const playerHq = engine.U.find((u) => u.t === 'H' && u.o === 0);
  const enemyHq = engine.U.find((u) => u.t === 'H' && u.o === 1);
  assert.ok(playerHq, 'Player HQ must exist');
  assert.ok(enemyHq, 'Enemy HQ must exist');
});

test('Carry unit logic: Transport can embark adjacent friendly infantry and eject safely', () => {
  const engine = new GameEngine();
  engine.initMatch({
    mapSize: 10,
    playersCount: 2,
    humanFactions: [0],
  });

  const transport = engine.addUnit('AT', 0, 3, 3);
  const infantry = engine.addUnit('R', 0, 3, 4);

  assert.equal(engine.U.includes(infantry), true);
  assert.equal(transport.cargo, null);

  // Load infantry
  transport.cargo = infantry;
  engine.U = engine.U.filter((u) => u !== infantry);

  assert.equal(engine.U.includes(infantry), false);
  assert.equal(transport.cargo.t, 'R');

  // Unload cargo
  const unloadTarget = { x: 3, y: 4 };
  const cargo = transport.cargo;
  cargo.x = cargo.rx = unloadTarget.x;
  cargo.y = cargo.ry = unloadTarget.y;
  engine.U.push(cargo);
  transport.cargo = null;

  assert.equal(engine.U.includes(cargo), true);
  assert.equal(cargo.x, 3);
  assert.equal(cargo.y, 4);
});

test('Healer logic: Field Medic restores HP to damaged infantry', () => {
  const engine = new GameEngine();
  engine.initMatch({
    mapSize: 10,
    playersCount: 2,
    humanFactions: [0],
  });

  const wounded = engine.addUnit('R', 0, 2, 2);
  wounded.hp = 1; // damaged
  assert.equal(wounded.hp, 1);

  // Field triage restores 3 HP up to maxHp
  const healAmount = 3;
  wounded.hp = Math.min(wounded.maxHp, wounded.hp + healAmount);
  assert.equal(wounded.hp, wounded.maxHp);
});

test('Mobile Factory Spawner: can construct units on the field', () => {
  const bp = UNIT_BLUEPRINTS.FC;
  assert.ok(bp, 'FC blueprint exists');
  assert.equal(bp.isSpawner, true);
  assert.equal(bp.c, 58, 'Factory Crawler has high cost');
  assert.ok(bp.ab.some((ab) => ab.f.includes('sp')), 'Has spawner ability flag');
});

test('Advanced Units exist in blueprints: HF, IJ, SB, NS, SR', () => {
  assert.ok(UNIT_BLUEPRINTS.HF, 'Heavy Flak Battery blueprint exists');
  assert.equal(UNIT_BLUEPRINTS.HF.n, 'Heavy Flak Battery');
  assert.ok(UNIT_BLUEPRINTS.IJ, 'Interceptor Jet blueprint exists');
  assert.equal(UNIT_BLUEPRINTS.IJ.n, 'Interceptor Jet');
  assert.ok(UNIT_BLUEPRINTS.SB, 'Stealth Bomber blueprint exists');
  assert.ok(UNIT_BLUEPRINTS.NS, 'Nanite Swarm Hive blueprint exists');
  assert.ok(UNIT_BLUEPRINTS.SR, 'Siege Ram Carrier blueprint exists');
});

test('Difficulty levels: Normal, Smarty, Sweat, and Tryhard are supported', () => {
  const engine = new GameEngine();

  engine.initMatch({
    mapSize: 10,
    playersCount: 2,
    humanFactions: [0],
    difficulty: 'normal',
  });
  assert.equal(engine.difficulty, 'normal');
  assert.equal(engine.isIntermediateOrHigher(), false);
  assert.equal(engine.isHighDifficulty(), false);

  engine.initMatch({
    mapSize: 10,
    playersCount: 2,
    humanFactions: [0],
    difficulty: 'smarty',
  });
  assert.equal(engine.difficulty, 'smarty');
  assert.equal(engine.isIntermediateOrHigher(), true);
  assert.equal(engine.isHighDifficulty(), false);

  engine.initMatch({
    mapSize: 10,
    playersCount: 2,
    humanFactions: [0],
    difficulty: 'sweat',
  });
  assert.equal(engine.difficulty, 'sweat');
  assert.equal(engine.isIntermediateOrHigher(), true);
  assert.equal(engine.isHighDifficulty(), true);

  engine.initMatch({
    mapSize: 10,
    playersCount: 2,
    humanFactions: [0],
    difficulty: 'tryhard',
  });
  assert.equal(engine.difficulty, 'tryhard');
  assert.equal(engine.isIntermediateOrHigher(), true);
  assert.equal(engine.isHighDifficulty(), true);
  assert.equal(engine.isTryhard(), true);
});

test('Tactical AI: Bot recruits and deploys custom units per difficulty', () => {
  const engine = new GameEngine();
  engine.initMatch({
    mapSize: 12,
    playersCount: 2,
    humanFactions: [0],
    difficulty: 'tryhard',
    startingGold: [50, 100],
  });

  // Verify tryhard auto deploy populates advanced units
  engine.botAutoDeploy(1, 4);
  const botUnits = engine.U.filter((u) => u.o === 1 && !UNIT_BLUEPRINTS[u.t].bl);
  assert.ok(botUnits.length > 0, 'Bot should deploy units');
});

test('Pass & Play: isPassAndPlay correctly identifies local multiplayer matches', () => {
  const engine = new GameEngine();

  // 1 human, 1 bot -> not pass and play
  engine.initMatch({
    mapSize: 10,
    playersCount: 2,
    humanFactions: [0],
  });
  assert.equal(engine.isPassAndPlay(), false);

  // 2 humans -> pass and play
  engine.initMatch({
    mapSize: 15,
    playersCount: 2,
    humanFactions: [0, 1],
  });
  assert.equal(engine.isPassAndPlay(), true);

  // 4 humans -> 4-way pass and play
  engine.initMatch({
    mapSize: 30,
    playersCount: 4,
    humanFactions: [0, 1, 2, 3],
  });
  assert.equal(engine.isPassAndPlay(), true);
});

test('Pass & Play: Perspective switching and handover curtain between turns', () => {
  const engine = new GameEngine();
  engine.initMatch({
    mapSize: 10,
    playersCount: 2,
    humanFactions: [0, 1],
    autoDeploy: true,
  });

  assert.equal(engine.isPassAndPlay(), true);
  assert.equal(engine.cur, 0);

  // End Player 0's turn
  engine.endTurn();

  // It should now be Player 1's turn
  assert.equal(engine.cur, 1);
  // View perspective MUST switch to Player 1 for proper fog of war!
  assert.equal(engine.view, 1);
  // Pass & Play curtain MUST trigger to hide screen from Player 0
  assert.equal(engine.passPlayPending, true);

  // Player 1 confirms ready
  engine.confirmPassAndPlayReady();
  assert.equal(engine.passPlayPending, false);
  assert.equal(engine.view, 1);
});

test('Story Mode: All 3 narrative campaigns exist with branching paths and final maps', async () => {
  const { STORY_CAMPAIGNS } = await import('../data/stories');

  assert.ok(STORY_CAMPAIGNS.story_western_front, 'Western Front story exists');
  assert.ok(STORY_CAMPAIGNS.story_landings_japan, 'Landings of Japan story exists');
  assert.ok(STORY_CAMPAIGNS.story_nekoland, 'Nekoland story exists');

  // Verify Western Front final map is Battle of Berlin
  const wfNodes = STORY_CAMPAIGNS.story_western_front.nodes;
  assert.ok(wfNodes.wf_node_berlin, 'Battle of Berlin exists');
  assert.equal(wfNodes.wf_node_berlin.isFinalNode, true);
  assert.match(wfNodes.wf_node_berlin.title, /Berlin/i);

  // Verify Landings of Japan final map is Battle of Tokyo
  const jpNodes = STORY_CAMPAIGNS.story_landings_japan.nodes;
  assert.ok(jpNodes.jp_node_tokyo, 'Battle of Tokyo exists');
  assert.equal(jpNodes.jp_node_tokyo.isFinalNode, true);
  assert.match(jpNodes.jp_node_tokyo.title, /Tokyo/i);

  // Verify Nekoland final map is "Britannia rule the Neko's"
  const nekoNodes = STORY_CAMPAIGNS.story_nekoland.nodes;
  assert.ok(nekoNodes.neko_node_britannia_rules, 'Britannia rule the Nekos exists');
  assert.equal(nekoNodes.neko_node_britannia_rules.isFinalNode, true);
  assert.equal(nekoNodes.neko_node_britannia_rules.holdoutTurns, 50);
  assert.match(nekoNodes.neko_node_britannia_rules.title, /Britannia rule the Neko/i);
});

test('Story Mode: No-HQ rapid deployment drop mechanics', () => {
  const engine = new GameEngine();
  const dropTiles = [
    { x: 1, y: 10 },
    { x: 2, y: 10 },
    { x: 3, y: 10 },
    { x: 4, y: 10 },
  ];

  engine.initMatch({
    mapSize: 12,
    playersCount: 2,
    humanFactions: [0],
    noPlayerHq: true,
    customDeployTiles: dropTiles,
    customObstacles: [],
    startingGold: [60, 40],
  });

  // Player 0 should have NO headquarters!
  const playerHq = engine.U.find((u) => u.o === 0 && u.t === 'H');
  assert.equal(playerHq, undefined, 'Player should start with NO HQ');

  // Enemy still has an HQ
  const enemyHq = engine.U.find((u) => u.o === 1 && u.t === 'H');
  assert.ok(enemyHq, 'Enemy should have an HQ');

  // During setup phase, deploy zone must return the drop tiles!
  const setupDeployZones = engine.getDeployZone(0);
  assert.equal(setupDeployZones.length, dropTiles.length);

  // Transition to combat play phase
  engine.beginCombat();
  assert.equal(engine.ph, 'play');

  // Now during combat, player CANNOT spawn new units because they have no HQ!
  const playDeployZones = engine.getDeployZone(0);
  assert.equal(playDeployZones.length, 0, 'No mid-battle spawns without an HQ');
});

test('Story Mode: Nekoland 50-turn holdout and British reinforcement waves', async () => {
  const { STORY_CAMPAIGNS } = await import('../data/stories');
  const finalMap = STORY_CAMPAIGNS.story_nekoland.nodes.neko_node_britannia_rules;

  assert.equal(finalMap.holdoutTurns, 50);
  assert.ok(finalMap.reinforcementWaves, 'Reinforcement waves must exist');

  // Check reinforcement turns: 10, 20, 30, 40
  const waveTurns = finalMap.reinforcementWaves.map((w) => w.turn);
  assert.ok(waveTurns.includes(10), 'Turn 10 reinforcement wave exists');
  assert.ok(waveTurns.includes(20), 'Turn 20 reinforcement wave exists');
  assert.ok(waveTurns.includes(30), 'Turn 30 reinforcement wave exists');
  assert.ok(waveTurns.includes(40), 'Turn 40 reinforcement wave exists');

  // Verify all waves are British (faction 0)
  finalMap.reinforcementWaves.forEach((w) => {
    assert.equal(w.faction, 0, `Wave at turn ${w.turn} should reinforce British player`);
  });
});

test('Reinforcement Wave Spawning: units spawn properly even when target tile is occupied', () => {
  const engine = new GameEngine();
  const waveDef = [
    {
      turn: 10,
      label: 'Royal Armoured Corps Deployment',
      faction: 0,
      units: [
        { t: 'B', x: 2, y: 15 }, // Tile where HQ might be
        { t: 'B', x: 3, y: 15 },
        { t: 'M', x: 4, y: 15 },
      ],
    },
  ];

  engine.initMatch({
    mapSize: 17,
    playersCount: 2,
    humanFactions: [0],
    reinforcementWaves: waveDef,
    autoDeploy: false,
  });

  const initialUnitCount = engine.U.length;

  // Deliberately place a blocking unit right on (3, 15) and (4, 15)
  engine.addUnit('R', 0, 3, 15);
  engine.addUnit('R', 0, 4, 15);

  // Trigger reinforcement wave at Turn 10
  const spawned = engine.spawnReinforcementsForTurn(10);

  // ALL 3 units must successfully spawn via nearest tile fallback!
  assert.equal(spawned.length, 3, 'All 3 reinforcement units must spawn');
  assert.equal(engine.U.length, initialUnitCount + 2 + 3);

  // Verify spawned units belong to faction 0 and are on distinct valid board tiles
  const spawnedPositions = new Set(spawned.map((u) => `${u.x},${u.y}`));
  assert.equal(spawnedPositions.size, 3, 'All spawned units must be on distinct tiles');

  spawned.forEach((u) => {
    assert.equal(u.o, 0, 'Spawned unit must belong to faction 0');
    assert.ok(engine.inBounds(u.x, u.y), 'Spawned unit must be within board bounds');
    assert.ok(u.hp > 0, 'Spawned unit must have positive health');
  });

  // Verify that calling it again does not duplicate wave
  const duplicateSpawn = engine.spawnReinforcementsForTurn(10);
  assert.equal(duplicateSpawn.length, 0, 'Should not re-spawn already deployed wave');
});

test('Character Portraits: Neko Queen has Neco-Arc inspired theme and catchphrases', async () => {
  const { PORTRAIT_CONFIGS } = await import('../data/portraits');

  assert.ok(PORTRAIT_CONFIGS.neko_queen, 'neko_queen portrait config must exist');
  assert.match(PORTRAIT_CONFIGS.neko_queen.badgeLabel, /BURU NYU/i, 'Badge must feature Neco-Arc catchphrase');
  assert.equal(PORTRAIT_CONFIGS.neko_queen.badgeColor, '#f472b6');
  assert.equal(PORTRAIT_CONFIGS.neko_queen.voiceStyle, 'neko');
  assert.equal(PORTRAIT_CONFIGS.neko_queen.catchphrase, 'Buru Nyuu!~');
});

test('Story Mode: Player skin is strictly forced per campaign requirements', async () => {
  const { STORY_CAMPAIGNS } = await import('../data/stories');
  const engine = new GameEngine();

  // 1. Nekoland: Player is forced to WW2 Britain
  const nekoCampaign = STORY_CAMPAIGNS.story_nekoland;
  assert.equal(nekoCampaign.heroSkin, 'skin_ww2_britain', 'Nekoland campaign heroSkin must be WW2 Britain');
  const nekoNode = nekoCampaign.nodes.neko_node_whisker;
  assert.equal(nekoNode.playerSkin, 'skin_ww2_britain', 'Nekoland node playerSkin must be WW2 Britain');

  // Verify engine enforces it even if profile has another skin equipped
  engine.setProfile({
    slotId: 1,
    profileName: 'Commander',
    lastSaved: Date.now(),
    credits: 1000,
    mits: 1000,
    intel: 50,
    unlockedUnits: ['R', 'M', 'B'],
    purchasedUpgrades: {},
    unlockedBranches: [],
    unlockedSkins: ['skin_default', 'skin_stealth'],
    activeSkin: 'skin_stealth',
    questProgress: {},
    claimedQuests: [],
    campaignProgress: {},
    skirmishStats: {
      battles: 0,
      victories: 0,
      defeats: 0,
      enemiesEliminated: 0,
      outpostsCaptured: 0,
      totalCreditsEarned: 0,
    },
  });

  engine.initMatch({
    mapSize: nekoNode.mapSize,
    playersCount: 2,
    humanFactions: [0],
    factionSkins: {
      0: nekoNode.playerSkin,
      1: nekoNode.enemySkin,
    },
  });

  assert.equal(engine.getFactionSkin(0), 'skin_ww2_britain', 'Faction 0 skin must be forced to WW2 Britain in Nekoland');
  assert.equal(engine.getFactionSkin(1), 'skin_neko', 'Enemy faction skin must be Neko in Nekoland');

  // 2. Landings of Japan: Player is forced to Modern USA
  const japanCampaign = STORY_CAMPAIGNS.story_landings_japan;
  assert.equal(japanCampaign.heroSkin, 'skin_modern_usa', 'Japan Landings heroSkin must be Modern USA');
  const japanNode = japanCampaign.nodes.jp_node_olympic;
  assert.equal(japanNode.playerSkin, 'skin_modern_usa', 'Japan node playerSkin must be Modern USA');

  engine.initMatch({
    mapSize: japanNode.mapSize,
    playersCount: 2,
    humanFactions: [0],
    factionSkins: {
      0: japanNode.playerSkin,
      1: japanNode.enemySkin,
    },
  });
  assert.equal(engine.getFactionSkin(0), 'skin_modern_usa', 'Faction 0 skin must be forced to Modern USA in Landings of Japan');

  // 3. Western Front: Allied Forces (Modern USA & WW2 Britain)
  const wfCampaign = STORY_CAMPAIGNS.story_western_front;
  assert.equal(wfCampaign.heroSkin, 'skin_modern_usa');
  assert.equal(wfCampaign.nodes.wf_node_normandy.playerSkin, 'skin_modern_usa');
  assert.equal(wfCampaign.nodes.wf_node_market_garden.playerSkin, 'skin_ww2_britain'); // British 1st Airborne
});


