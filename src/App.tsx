import React, { useState, useEffect, useRef } from 'react';
import { GameEngine, GameEngineInitParams } from './game/engine';
import { StorageService } from './services/storage';
import { AudioService } from './services/audio';
import { PlayerProfile, GameSettings, CampaignMission, PlacedUnit, TechUpgrade, TacticalQuest } from './types/game';
import { CAMPAIGN_MISSIONS } from './data/campaigns';
import { FACTION_NAMES, FACTION_COLORS } from './data/skins';
import { HeaderNav } from './components/HeaderNav';
import { MainMenu } from './components/MainMenu';
import { PlayHub } from './components/PlayHub';
import { CampaignView } from './components/CampaignView';
import { ArmoryView } from './components/ArmoryView';
import { SkirmishGenerator } from './components/SkirmishGenerator';
import { BattlefieldCanvas } from './components/BattlefieldCanvas';
import { TacticalUnitModal } from './components/TacticalUnitModal';
import { BuildingModal } from './components/BuildingModal';
import { RecruitmentBar } from './components/RecruitmentBar';
import { SettingsModal } from './components/SettingsModal';
import { SaveManagerModal } from './components/SaveManagerModal';
import { AdminConsoleModal } from './components/AdminConsoleModal';
import { PassAndPlayModal } from './components/PassAndPlayModal';
import { StoryView } from './components/StoryView';
import { StoryDialogueModal } from './components/StoryDialogueModal';
import { StoryMissionNode, StoryDialogueSequence } from './types/story';
import {
  Trophy,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff,
  Flame,
  Zap,
  FastForward,
  Play as PlayIcon,
  Pause,
  BookOpen,
} from 'lucide-react';

export default function App() {
  const [profile, setProfile] = useState<PlayerProfile>(() => StorageService.loadProfile());
  const [settings, setSettings] = useState<GameSettings>(() => StorageService.loadSettings());

  // Check URL param ?autostart=1 for automated test verification
  const isAutostart = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('autostart') === '1';

  // Navigation: 'menu' | 'play' | 'campaign' | 'story' | 'armory' | 'shop' | 'skirmish' | 'battle'
  const [currentTab, setCurrentTab] = useState<'menu' | 'play' | 'campaign' | 'story' | 'armory' | 'shop' | 'skirmish' | 'battle'>(
    isAutostart ? 'battle' : 'menu'
  );
  const [playSubTab, setPlaySubTab] = useState<'campaigns' | 'inventory' | 'shop'>('campaigns');

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSaveManagerOpen, setIsSaveManagerOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // In-battle popup inspect states
  const [inspectedUnit, setInspectedUnit] = useState<PlacedUnit | null>(null);
  const [inspectedBuilding, setInspectedBuilding] = useState<PlacedUnit | null>(null);

  // Admin placement tools
  const [adminTool, setAdminTool] = useState<number | null>(null);
  const [adminSpawnUnit, setAdminSpawnUnit] = useState<string>('B');
  const [adminSpawnFaction, setAdminSpawnFaction] = useState<number>(0);

  // Engine instance & rerender trigger
  const engineRef = useRef<GameEngine | null>(null);
  const [, setRerenderCounter] = useState(0);
  const lastProcessedGen = useRef<number>(-1);
  const [lastMissionReward, setLastMissionReward] = useState<{ gen: number; mits: number } | null>(null);
  const lastMatchParamsRef = useRef<GameEngineInitParams | null>(null);

  if (!engineRef.current) {
    const eng = new GameEngine(profile);
    eng.onStateChange = () => setRerenderCounter((c) => c + 1);
    engineRef.current = eng;
    eng.initMatch({
      mapSize: 15,
      playersCount: 2,
      humanFactions: [0],
    });
  }
  const engine = engineRef.current;

  // Sync settings with audio and engine
  useEffect(() => {
    AudioService.updateVolumes(settings.muted, settings.masterVolume, settings.sfxVolume, settings.soundMode);
    if (engine) {
      engine.gameSpeed = settings.gameSpeed;
    }
  }, [settings, engine]);

  // Sync profile with engine
  useEffect(() => {
    if (engine) {
      engine.setProfile(profile);
    }
  }, [profile, engine]);

  const updateSettings = (nextSettings: GameSettings) => {
    setSettings(nextSettings);
    StorageService.saveSettings(nextSettings);
  };

  const updateProfile = (nextProfile: PlayerProfile) => {
    setProfile(nextProfile);
    StorageService.saveProfile(nextProfile);
  };

  // Story Mode State
  const [activeStoryNode, setActiveStoryNode] = useState<StoryMissionNode | null>(null);
  const [activeDialogueSequence, setActiveDialogueSequence] = useState<StoryDialogueSequence | null>(null);
  const [isDialogueModalOpen, setIsDialogueModalOpen] = useState(false);
  const triggeredDialoguesRef = useRef<Set<string>>(new Set());
  const aftermathShownRef = useRef<boolean>(false);
  const [lastStoryReward, setLastStoryReward] = useState<{ mits: number; intel: number; nodeTitle: string } | null>(null);

  // Launch Story Mission
  const handleLaunchStoryMission = (node: StoryMissionNode) => {
    if (!engine) return;
    lastMatchParamsRef.current = null;
    setActiveStoryNode(node);
    triggeredDialoguesRef.current.clear();
    aftermathShownRef.current = false;
    setLastStoryReward(null);

    engine.initMatch({
      mapSize: node.mapSize,
      playersCount: 2,
      humanFactions: [0],
      startingGold: [node.playerGold, node.enemyGold],
      customObstacles: node.preplacedObstacles,
      customHqPositions: node.customHqPositions,
      preplacedUnits: node.preplacedUnits,
      difficulty: node.difficulty,
      enemySkin: node.enemySkin,
      factionSkins: {
        0: node.playerSkin,
        1: node.enemySkin,
      },
      noPlayerHq: node.noPlayerHq,
      customDeployTiles: node.customDeployTiles,
      reinforcementWaves: node.reinforcementWaves,
      holdoutTurns: node.holdoutTurns,
      storyNodeId: node.id,
    });

    setInspectedUnit(null);
    setInspectedBuilding(null);

    // Queue onStart dialogue if present
    const startDlg = node.dialogues.find((d) => d.trigger === 'onStart');
    if (startDlg) {
      triggeredDialoguesRef.current.add(startDlg.id);
      setActiveDialogueSequence(startDlg);
      setIsDialogueModalOpen(true);
    }

    setCurrentTab('battle');
  };

  // Watch for mid-battle turn dialogues in Story mode
  useEffect(() => {
    if (!activeStoryNode || engine.over || currentTab !== 'battle') return;
    const turnDlg = activeStoryNode.dialogues.find(
      (d) => typeof d.trigger === 'object' && d.trigger.turn === engine.turn
    );
    if (turnDlg && !triggeredDialoguesRef.current.has(turnDlg.id)) {
      triggeredDialoguesRef.current.add(turnDlg.id);
      setActiveDialogueSequence(turnDlg);
      setIsDialogueModalOpen(true);
    }
  }, [engine.turn, activeStoryNode, engine.over, currentTab]);

  // Story mode rewards and aftermath dialogue
  const awardStoryRewards = (node: StoryMissionNode) => {
    if (lastProcessedGen.current === engine.gen) return;
    lastProcessedGen.current = engine.gen;

    const completedNodes: string[] = (profile as any).storyCompletedNodes || [];
    const wasCompleted = completedNodes.includes(node.id);
    const awardedMits = wasCompleted ? 200 : node.rewardMits;
    const awardedIntel = wasCompleted ? 2 : node.rewardIntel;

    const updatedProfile = {
      ...profile,
      mits: profile.mits + awardedMits,
      credits: (profile.credits || profile.mits) + awardedMits,
      intel: profile.intel + awardedIntel,
      storyCompletedNodes: Array.from(new Set([...completedNodes, node.id])),
    };

    setLastStoryReward({
      mits: awardedMits,
      intel: awardedIntel,
      nodeTitle: node.title,
    });
    updateProfile(updatedProfile as any);
  };

  useEffect(() => {
    if (engine.over && engine.winner === 0 && activeStoryNode && !aftermathShownRef.current && !engine.busy) {
      aftermathShownRef.current = true;
      awardStoryRewards(activeStoryNode);

      if (activeStoryNode.aftermathDialogue && activeStoryNode.aftermathDialogue.length > 0) {
        setActiveDialogueSequence({
          id: `aftermath_${activeStoryNode.id}`,
          trigger: 'onEnd',
          lines: activeStoryNode.aftermathDialogue,
        });
        setIsDialogueModalOpen(true);
      }
    }
  }, [engine.over, engine.winner, activeStoryNode, engine.busy, engine.gen]);

  // Launch campaign operation
  const handleLaunchCampaign = (mission: CampaignMission) => {
    if (!engine) return;
    lastMatchParamsRef.current = null;
    setActiveStoryNode(null);
    setLastStoryReward(null);
    engine.initMatch({
      mapSize: mission.mapSize,
      playersCount: mission.factionsCount,
      humanFactions: [0],
      startingGold: [mission.playerGold, ...Array(mission.factionsCount - 1).fill(mission.enemyGold)],
      customMines: mission.preplacedMines,
      customObstacles: mission.preplacedObstacles,
      customHqPositions: mission.customHqPositions,
      preplacedUnits: mission.preplacedUnits,
      campaignMissionId: mission.id,
      campaignMission: mission,
      enemySkin: mission.enemySkin,
      factionSkins: mission.factionSkins,
      isCampaign: true,
      difficulty: mission.difficulty || 'normal',
    });
    setInspectedUnit(null);
    setInspectedBuilding(null);
    setCurrentTab('battle');
  };

  // Launch skirmish sandbox match
  const handleStartSkirmish = (params: GameEngineInitParams) => {
    if (!engine) return;
    lastMatchParamsRef.current = params;
    setActiveStoryNode(null);
    setLastStoryReward(null);
    engine.initMatch(params);
    setInspectedUnit(null);
    setInspectedBuilding(null);
    setCurrentTab('battle');
  };

  // Tile click on battle grid
  const handleTileClick = async (x: number, y: number) => {
    if (!engine || engine.busy || engine.over) return;

    // Handle Admin Tool Click
    if (adminTool) {
      engine.cheatTainted = true;
      if (adminTool === 1) {
        if (!engine.unitAt(x, y)) {
          engine.addUnit(adminSpawnUnit, adminSpawnFaction, x, y);
          AudioService.play('spawn', x, y, true, true);
          engine.addSpark(x, y, FACTION_COLORS[adminSpawnFaction], 14, 3);
          engine.note = `Admin: Spawned ${engine.getBlueprint(adminSpawnUnit).n}.`;
          engine.recalculateHighlights();
          engine.triggerChange();
        }
      } else if (adminTool === 2) {
        const u = engine.unitAt(x, y);
        if (u) {
          engine.triggerExplosion(u);
          engine.U = engine.U.filter((item) => item !== u);
          if (engine.sel === u) engine.sel = null;
          engine.note = `Admin: Removed ${engine.getBlueprint(u.t).n}.`;
          if (u.t === 'H') engine.eliminateFaction(u.o);
          engine.recalculateHighlights();
          engine.triggerChange();
        }
      } else if (adminTool === 3) {
        if (engine.inBounds(x, y) && !engine.unitAt(x, y)) {
          engine.ob[y][x] = Math.random() < 0.5 ? 1 : 2;
          engine.addSpark(x, y, '#94a3b8', 12, 3);
          engine.note = `Admin: Placed obstacle at (${x}, ${y}).`;
          engine.recalculateHighlights();
          engine.triggerChange();
        }
      } else if (adminTool === 5) {
        if (engine.inBounds(x, y) && !engine.unitAt(x, y)) {
          engine.ob[y][x] = 3;
          engine.addSpark(x, y, '#38bdf8', 14, 3);
          engine.note = `Admin: Placed water at (${x}, ${y}).`;
          engine.recalculateHighlights();
          engine.triggerChange();
        }
      } else if (adminTool === 4) {
        if (engine.inBounds(x, y) && engine.ob[y][x]) {
          engine.ob[y][x] = 0;
          engine.addSpark(x, y, '#94a3b8', 12, 3);
          engine.note = `Admin: Cleared terrain at (${x}, ${y}).`;
          engine.recalculateHighlights();
          engine.triggerChange();
        }
      }
      return;
    }

    if (engine.ctrl[engine.cur]) return;

    // Handle Unit Placement from Spawner
    if (engine.sp) {
      if (engine.hl.s.some((pt) => pt[0] === x && pt[1] === y)) {
        const cost = engine.getBlueprint(engine.sp).c;
        const source = engine.U.find(
          (u) =>
            u.o === engine.cur &&
            (u.t === 'H' || (u.t === 'W' && engine.ph !== 'setup') || (u.t === 'FC' && engine.ph !== 'setup')) &&
            (u.spawnCd ?? 0) <= 0 &&
            Math.max(Math.abs(u.x - x), Math.abs(u.y - y)) <=
              (u.t === 'W' || u.t === 'FC' ? 1 : engine.ph === 'setup' ? (engine.NP > 2 ? 3 : 2) : 1)
        );

        const isNoHqSetup = engine.noPlayerHq && engine.ph === 'setup';
        if (!source && !isNoHqSetup) {
          engine.note = 'Deployment point rearming.';
        } else if (engine.gold[engine.cur] >= cost) {
          engine.gold[engine.cur] -= cost;
          const newUnit = engine.addUnit(engine.sp, engine.cur, x, y);
          if (source && engine.ph !== 'setup') source.spawnCd = 2;
          newUnit.moved = newUnit.acted = engine.ph === 'setup' ? 0 : 1;
          AudioService.play('spawn', x, y, true, true);
          engine.addSpark(x, y, FACTION_COLORS[engine.cur], 14, 3);
          engine.addRing(x, y, FACTION_COLORS[engine.cur]);
          engine.note = `${engine.getBlueprint(newUnit.t).n} deployed.`;
        }
      }
      if (engine.ph !== 'setup' || engine.gold[engine.cur] < engine.getBlueprint(engine.sp).c) {
        engine.sp = null;
      }
      engine.sel = null;
      engine.recalculateHighlights();
      engine.triggerChange();
      return;
    }

    // Handle refund in setup
    if (engine.ph === 'setup') {
      const u = engine.unitAt(x, y);
      if (u && u.o === engine.cur && !engine.getBlueprint(u.t).bl) {
        engine.gold[engine.cur] += engine.getBlueprint(u.t).c;
        engine.U = engine.U.filter((item) => item !== u);
        engine.note = `${engine.getBlueprint(u.t).n} refunded.`;
        engine.recalculateHighlights();
        engine.triggerChange();
      }
      return;
    }

    const clickedUnit = engine.unitAt(x, y);
    const key = `${x},${y}`;

    // Handle actions with selected unit
    if (engine.sel && engine.sel.o === engine.cur && !engine.getBlueprint(engine.sel.t).bl) {
      // 1. Capture building
      if (clickedUnit && engine.hl.c.includes(clickedUnit)) {
        await executeBusyAction(async () => {
          await engine.captureBuilding(engine.sel!, clickedUnit);
        });
        setInspectedUnit(null);
        return;
      }

      // 2. Unload cargo onto empty tile
      if (!clickedUnit && engine.hl.unloadTiles.some(([tx, ty]) => tx === x && ty === y)) {
        await executeBusyAction(async () => {
          await engine.attackTarget(engine.sel!, { x, y });
        });
        setInspectedUnit(null);
        return;
      }

      // 3. Move unit to highlighted reach tile
      if (!engine.sel.gm && !clickedUnit && engine.hl.m.has(key) && key !== `${engine.sel.x},${engine.sel.y}`) {
        await executeBusyAction(async () => {
          await engine.moveUnit(engine.sel!, key);
        });
        setInspectedUnit(null);
        return;
      }

      // 4. Attack target or heal ally
      if (clickedUnit && engine.hl.t.includes(clickedUnit)) {
        await executeBusyAction(async () => {
          await engine.attackTarget(engine.sel!, clickedUnit);
        });
        setInspectedUnit(null);
        return;
      }

      // 5. Ground aim attack
      if (engine.canUnitAct(engine.sel) && engine.hl.r.some(([rx, ry]) => rx === x && ry === y)) {
        const dummyTarget = clickedUnit || { x, y, gnd: true };
        await executeBusyAction(async () => {
          await engine.attackTarget(engine.sel!, dummyTarget);
        });
        setInspectedUnit(null);
        return;
      }
    }

    // Inspect building
    if (clickedUnit && engine.getBlueprint(clickedUnit.t).bl) {
      AudioService.play('sel');
      engine.sel = null;
      setInspectedUnit(null);
      setInspectedBuilding(clickedUnit);
      engine.recalculateHighlights();
      engine.triggerChange();
      return;
    }

    // Inspect / Select friendly unit
    const friendly = clickedUnit && clickedUnit.o === engine.cur ? clickedUnit : null;
    engine.selectUnit(friendly);
    setInspectedBuilding(null);
    setInspectedUnit(friendly);
  };

  const executeBusyAction = async (action: () => Promise<void>) => {
    if (!engine) return;
    engine.busy = true;
    engine.triggerChange();
    await action();
    engine.busy = false;
    if (engine.sel && !engine.U.includes(engine.sel)) {
      engine.sel = null;
    }
    if (engine.sel && !engine.getBlueprint(engine.sel.t).bl) {
      const bp = engine.getBlueprint(engine.sel.t);
      if (!engine.canAffordAbility(engine.sel, bp.ab[engine.sel.ai || 0])) {
        engine.sel.ai = Math.max(
          0,
          bp.ab.findIndex((ab) => engine.canAffordAbility(engine.sel!, ab))
        );
      }
    }
    engine.recalculateHighlights();
    engine.triggerChange();
  };

  // Campaign Victory Rewards evaluation
  const awardCampaignRewards = (missionId: string) => {
    if (!engine || !engine.isCampaignMode || !missionId || lastProcessedGen.current === engine.gen) return;
    lastProcessedGen.current = engine.gen;

    const prog = profile.campaignProgress[missionId];
    const mission = CAMPAIGN_MISSIONS.find((m) => m.id === missionId);

    let starsEarned = 1;
    const completedObjIds = ['primary'];
    let bonusMits = 0;

    if (mission) {
      mission.objectives.forEach((obj) => {
        if (!obj.isBonus) return;
        let met = false;
        if (obj.type === 'turn_limit') {
          if (engine.turn <= (obj.targetCount || 15)) met = true;
        } else if (obj.type === 'no_friendly_losses') {
          if (engine.totalFriendlyLosses <= (obj.targetCount || 0)) met = true;
        } else if (obj.type === 'capture_outposts') {
          if (engine.U.filter((u) => u.t === 'O' && u.o === 0).length >= (obj.targetCount || 1)) met = true;
        }
        if (met) {
          starsEarned++;
          completedObjIds.push(obj.id);
          bonusMits += obj.rewardMits || 150;
        }
      });
    }

    const wasCompleted = !!prog?.completed;
    const prevStars = prog?.stars || 0;
    const finalStars = Math.max(prevStars, Math.min(3, starsEarned));

    const awardedMits = wasCompleted ? 80 : (mission ? mission.rewardMits : 400) + bonusMits;
    const awardedIntel = wasCompleted ? 0 : mission?.rewardIntel || 2;

    const allObj = Array.from(new Set([...(prog?.completedObjectives || []), ...completedObjIds]));

    const updatedProfile: PlayerProfile = {
      ...profile,
      mits: profile.mits + awardedMits,
      credits: (profile.credits || profile.mits) + awardedMits,
      intel: profile.intel + awardedIntel,
      campaignProgress: {
        ...profile.campaignProgress,
        [missionId]: {
          completed: true,
          stars: finalStars,
          bestTurns: Math.min(prog?.bestTurns || 999, engine.turn),
          completedObjectives: allObj,
        },
      },
    };

    setLastMissionReward({ gen: engine.gen, mits: awardedMits });
    updateProfile(updatedProfile);
  };

  useEffect(() => {
    if (engine.over && engine.winner === 0 && engine.missionId && engine.isCampaignMode && !engine.busy) {
      awardCampaignRewards(engine.missionId);
    }
  }, [engine.over, engine.winner, engine.missionId, engine.isCampaignMode, engine.busy, engine.gen]);

  // Shop / Armory purchase handlers
  const handleBuyUnit = (unitCode: string, costMits: number) => {
    if (profile.mits < costMits || profile.unlockedUnits.includes(unitCode)) return;
    AudioService.play('cap');
    const updated: PlayerProfile = {
      ...profile,
      mits: profile.mits - costMits,
      credits: (profile.credits || profile.mits) - costMits,
      unlockedUnits: [...profile.unlockedUnits, unitCode],
    };
    updateProfile(updated);
  };

  const handleClaimQuest = (quest: TacticalQuest) => {
    AudioService.play('win');
    const updated: PlayerProfile = {
      ...profile,
      mits: profile.mits + quest.rewardMits,
      credits: (profile.credits || profile.mits) + quest.rewardMits,
      unlockedUnits: Array.from(new Set([...profile.unlockedUnits, quest.rewardUnitCode])),
      claimedQuests: Array.from(new Set([...(profile.claimedQuests || []), quest.id])),
    };
    updateProfile(updated);
  };

  const handleUnlockBranch = (branchId: string, costMits: number) => {
    if (profile.mits < costMits || profile.unlockedBranches.includes(branchId)) return;
    AudioService.play('cap');
    const updated: PlayerProfile = {
      ...profile,
      mits: profile.mits - costMits,
      credits: (profile.credits || profile.mits) - costMits,
      unlockedBranches: [...profile.unlockedBranches, branchId],
    };
    updateProfile(updated);
  };

  const handleUnlockSkin = (skinId: string, costMits: number) => {
    if (profile.mits < costMits || profile.unlockedSkins.includes(skinId)) return;
    AudioService.play('cap');
    const updated: PlayerProfile = {
      ...profile,
      mits: profile.mits - costMits,
      credits: (profile.credits || profile.mits) - costMits,
      unlockedSkins: [...profile.unlockedSkins, skinId],
      activeSkin: skinId,
    };
    updateProfile(updated);
  };

  const handleEquipSkin = (skinId: string) => {
    AudioService.play('sel');
    const updated: PlayerProfile = {
      ...profile,
      activeSkin: skinId,
    };
    updateProfile(updated);
  };

  const handleUpgrade = (upg: TechUpgrade) => {
    const current = profile.purchasedUpgrades[upg.id] || 0;
    if (current >= upg.maxLevel || profile.mits < upg.costMits || profile.intel < upg.costIntel) return;
    AudioService.play('cap');
    const updated: PlayerProfile = {
      ...profile,
      mits: profile.mits - upg.costMits,
      credits: (profile.credits || profile.mits) - upg.costMits,
      intel: profile.intel - upg.costIntel,
      purchasedUpgrades: {
        ...profile.purchasedUpgrades,
        [upg.id]: current + 1,
      },
    };
    updateProfile(updated);
  };

  const handleResetUpgrades = () => {
    let refundMits = 0;
    let refundIntel = 0;
    Object.entries(profile.purchasedUpgrades).forEach(([id, level]) => {
      refundMits += 450 * level;
      refundIntel += 1 * level;
    });
    const updated: PlayerProfile = {
      ...profile,
      mits: profile.mits + refundMits,
      credits: (profile.credits || profile.mits) + refundMits,
      intel: profile.intel + refundIntel,
      purchasedUpgrades: {},
    };
    AudioService.play('sel');
    updateProfile(updated);
  };

  // Determine current income per turn
  const currentIncome =
    2 +
    (engine.NP > 2 && engine.cur === 1 ? 1 : 0) +
    engine.U.filter((u) => u.t === 'O' && u.o === engine.cur).length +
    (engine.cur === 0 ? engine.getUpgradeLevel('upg_logistics_subsidy') : 0);

  const hasActiveBattle = !engine.over;

  return (
    <div className="min-h-screen bg-[#0b0e11] text-[#d6ded9] flex flex-col font-sans">
      {/* 1. Main Menu Screen */}
      {currentTab === 'menu' && (
        <MainMenu
          profile={profile}
          settings={settings}
          hasActiveBattle={hasActiveBattle}
          onSelectStory={() => setCurrentTab('story')}
          onSelectPlay={(subTab = 'campaigns') => {
            setPlaySubTab(subTab);
            setCurrentTab('play');
          }}
          onSelectSandbox={() => setCurrentTab('skirmish')}
          onSelectSettings={() => setIsSettingsOpen(true)}
          onResumeBattle={() => setCurrentTab('battle')}
          onOpenSaveManager={() => setIsSaveManagerOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onToggleMute={() => updateSettings({ ...settings, muted: !settings.muted })}
        />
      )}

      {/* 2. Top Header Nav (Visible on other screens) */}
      {currentTab !== 'menu' && (
        <HeaderNav
          currentTab={currentTab}
          onSelectTab={(tab) => {
            if (tab === 'play') {
              setPlaySubTab('campaigns');
              setCurrentTab('play');
            } else {
              setCurrentTab(tab);
            }
          }}
          mits={profile.mits}
          intel={profile.intel}
          muted={settings.muted}
          onToggleMute={() => updateSettings({ ...settings, muted: !settings.muted })}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenSaveManager={() => setIsSaveManagerOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
          isInActiveBattle={hasActiveBattle && currentTab !== 'battle'}
        />
      )}

      {/* 3. Play Hub Screen (Holds 3 Options: Campaigns, Inventory/Armory, Shop) */}
      {currentTab === 'play' && (
        <PlayHub
          initialSubTab={playSubTab}
          profile={profile}
          hasActiveBattle={hasActiveBattle}
          onQuickResumeBattle={() => setCurrentTab('battle')}
          onReturnToMenu={() => setCurrentTab('menu')}
          onBuyUnit={handleBuyUnit}
          onBuySkin={handleUnlockSkin}
          onEquipSkin={handleEquipSkin}
          onUnlockBranch={handleUnlockBranch}
          campaignComponent={
            <CampaignView
              campaignProgress={profile.campaignProgress}
              unlockedBranches={profile.unlockedBranches}
              mits={profile.mits}
              onLaunchMission={handleLaunchCampaign}
              onUnlockBranch={handleUnlockBranch}
            />
          }
          armoryComponent={
            <ArmoryView
              profile={profile}
              onUpgrade={handleUpgrade}
              onUnlockUnit={handleBuyUnit}
              onUnlockBranch={handleUnlockBranch}
              onUnlockSkin={handleUnlockSkin}
              onEquipSkin={handleEquipSkin}
              onResetUpgrades={handleResetUpgrades}
              onClaimQuest={handleClaimQuest}
            />
          }
        />
      )}

      {/* 4. Story Mode Screen */}
      {currentTab === 'story' && (
        <StoryView
          profile={profile}
          onLaunchStoryMission={handleLaunchStoryMission}
          onProfileUpdated={updateProfile}
        />
      )}

      {/* 5. Direct View Screens (if user navigates via Header tabs) */}
      {currentTab === 'campaign' && (
        <CampaignView
          campaignProgress={profile.campaignProgress}
          unlockedBranches={profile.unlockedBranches}
          mits={profile.mits}
          onLaunchMission={handleLaunchCampaign}
          onUnlockBranch={handleUnlockBranch}
        />
      )}

      {currentTab === 'armory' && (
        <ArmoryView
          profile={profile}
          onUpgrade={handleUpgrade}
          onUnlockUnit={handleBuyUnit}
          onUnlockBranch={handleUnlockBranch}
          onUnlockSkin={handleUnlockSkin}
          onEquipSkin={handleEquipSkin}
          onResetUpgrades={handleResetUpgrades}
          onClaimQuest={handleClaimQuest}
        />
      )}

      {currentTab === 'shop' && (
        <PlayHub
          initialSubTab="shop"
          profile={profile}
          hasActiveBattle={hasActiveBattle}
          onQuickResumeBattle={() => setCurrentTab('battle')}
          onReturnToMenu={() => setCurrentTab('menu')}
          onBuyUnit={handleBuyUnit}
          onBuySkin={handleUnlockSkin}
          onEquipSkin={handleEquipSkin}
          onUnlockBranch={handleUnlockBranch}
          campaignComponent={<div />}
          armoryComponent={<div />}
        />
      )}

      {currentTab === 'skirmish' && <SkirmishGenerator onStartMatch={handleStartSkirmish} />}

      {/* 5. Active Battlefield View */}
      {currentTab === 'battle' && (
        <main className="flex-1 max-w-[1920px] w-full mx-auto p-2 sm:p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
          <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 space-y-3">
            {/* Active Directive Bar (Campaign or Story Mode) */}
            {(engine.activeMission || activeStoryNode) && (
              <div className="p-3 bg-gradient-to-r from-[#12191e] to-[#0e1418] border border-amber-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono shadow-md">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400 font-bold text-xs">
                    {engine.activeMission?.number || 'STORY'}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">
                        {activeStoryNode
                          ? `STORY · ${activeStoryNode.codename}`
                          : `OP #${engine.activeMission?.number} · ${engine.activeMission?.codename}`}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                        {activeStoryNode ? activeStoryNode.objectiveType : engine.activeMission?.objectiveType}
                      </span>
                    </div>
                    <span className="text-slate-200 font-semibold text-xs truncate block mt-0.5">
                      {activeStoryNode?.objectiveText || engine.activeMission?.objectives[0]?.text || engine.activeMission?.title}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0 text-[11px] border-t sm:border-t-0 sm:border-l border-[#243038] pt-2 sm:pt-0 sm:pl-3">
                  {/* Forced Story Skin Regulation Badge */}
                  {activeStoryNode && (
                    <div className="flex items-center gap-1.5 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30 text-sky-300">
                      <span className="text-[10px] text-sky-400 font-bold uppercase">Camo:</span>
                      <span className="font-bold text-white truncate max-w-[140px] sm:max-w-[200px]">
                        {activeStoryNode.playerSkin === 'skin_ww2_britain'
                          ? 'WW2 British Expeditionary'
                          : activeStoryNode.playerSkin === 'skin_modern_usa'
                          ? 'Modern US Armed Forces'
                          : 'Story Assigned'}
                      </span>
                    </div>
                  )}

                  {(activeStoryNode?.holdoutTurns || engine.activeMission?.objectiveType === 'holdout') && (
                    <div className="flex items-center gap-1.5 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      <span className="text-amber-300 font-bold">Holdout:</span>
                      <span className="text-amber-400 font-black">
                        Turn {engine.turn} / {activeStoryNode?.holdoutTurns || engine.holdoutTurnsRemaining || 10}
                      </span>
                    </div>
                  )}

                  {/* Next Reinforcement Wave Alert */}
                  {(() => {
                    const waves = engine.reinforcementWaves.length > 0 ? engine.reinforcementWaves : (engine.activeMission?.reinforcementWaves || []);
                    const nextWave = waves.find((w) => w.turn > engine.turn);
                    if (!nextWave) return null;
                    return (
                      <div className="flex items-center gap-1.5 bg-cyan-500/15 px-2 py-0.5 rounded border border-cyan-500/40 text-cyan-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span>Next Wave: Turn {nextWave.turn}</span>
                        <span className="font-bold text-white">({nextWave.units.length} units)</span>
                      </div>
                    );
                  })()}

                  <div className="flex items-center gap-1 text-slate-400">
                    <span>Turn:</span>
                    <span className="text-slate-200 font-bold">{engine.turn}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Canvas */}
            <BattlefieldCanvas
              engine={engine}
              onTileClick={handleTileClick}
              graphicsQuality={settings.quality}
              screenShake={settings.screenShake}
            />
          </div>

          {/* Right Sidebar Controls */}
          <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 space-y-4">
            {/* End Turn / Ready Button */}
            <div className="sticky top-16 z-20 bg-[#0b0e11] pb-2 space-y-2">
              {engine.ctrl.every((c) => c) ? (
                <div className="p-3 bg-[#131a1e] border border-cyan-500/40 rounded-xl shadow-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3 h-3 rounded-full ${engine.paused ? 'bg-amber-400' : 'bg-cyan-400 animate-pulse'}`} />
                    <div>
                      <span className="text-xs font-bold text-cyan-300 font-mono block">
                        SPECTATOR SIMULATION
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {engine.paused ? 'Simulation Paused' : `${engine.gameSpeed}x Speed · ${engine.NP}-Way War`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        engine.paused = !engine.paused;
                        engine.triggerChange();
                      }}
                      className="py-1.5 px-3 bg-[#1b252c] hover:bg-[#23313a] text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                    >
                      {engine.paused ? <PlayIcon className="w-3.5 h-3.5 fill-cyan-400" /> : <Pause className="w-3.5 h-3.5" />}
                      <span>{engine.paused ? 'Resume' : 'Pause'}</span>
                    </button>
                    <button
                      onClick={() => {
                        const speeds = [1, 2, 4];
                        const next = speeds[(speeds.indexOf(engine.gameSpeed) + 1) % speeds.length] || 1;
                        engine.gameSpeed = next;
                        engine.triggerChange();
                      }}
                      className="py-1.5 px-2.5 bg-[#1b252c] hover:bg-[#23313a] text-amber-300 border border-amber-500/30 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-colors"
                    >
                      <FastForward className="w-3.5 h-3.5" />
                      <span>{engine.gameSpeed}x</span>
                    </button>
                  </div>
                </div>
              ) : engine.ph === 'setup' ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      engine.botAutoDeploy(engine.cur);
                      engine.endTurn();
                    }}
                    className="flex-1 py-3.5 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-950/20 uppercase tracking-wider transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-cyan-200" />
                    <span>Auto-Deploy & Ready</span>
                  </button>
                  <button
                    disabled={engine.ctrl[engine.cur] || engine.busy || engine.over}
                    onClick={() => engine.endTurn()}
                    className="flex-1 py-3.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-xl shadow-amber-950/20 uppercase tracking-wider transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    <span>Confirm Deploy</span>
                    <ArrowRight className="w-4 h-4 font-bold" />
                  </button>
                </div>
              ) : (
                <button
                  disabled={engine.ctrl[engine.cur] || engine.busy || engine.over}
                  onClick={() => {
                    AudioService.play('click');
                    engine.endTurn();
                  }}
                  className="w-full py-4 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-base shadow-xl shadow-amber-950/20 uppercase tracking-wider transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer transform active:scale-[0.98]"
                >
                  <span>
                    {engine.isPassAndPlay()
                      ? `End Turn & Pass to P${((engine.cur + 1) % engine.NP) + 1}`
                      : 'End Turn'}
                  </span>
                  <ArrowRight className="w-5 h-5 font-bold" />
                </button>
              )}
            </div>

            {/* Turn & Status Card */}
            <div
              className="bg-[#141a1e] border border-[#232c32] rounded-xl p-4 shadow-md"
              style={{ borderLeftColor: FACTION_COLORS[engine.cur], borderLeftWidth: '4px' }}
            >
              <div className="flex items-center justify-between font-bold text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: FACTION_COLORS[engine.cur] }}
                  />
                  <span className="font-mono">
                    {engine.ctrl.every((c) => c)
                      ? `AI: ${FACTION_NAMES[engine.cur]}`
                      : engine.ctrl[engine.cur]
                      ? `AI Bot (${FACTION_NAMES[engine.cur]})`
                      : engine.isPassAndPlay()
                      ? `Player ${engine.cur + 1} (${FACTION_NAMES[engine.cur]})`
                      : 'You (Command HQ)'}
                  </span>
                </div>
                <span className="font-mono text-xs text-slate-400">
                  {engine.ph === 'setup' ? 'PRE-BATTLE SETUP' : `TURN ${engine.turn}`}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono mt-2 pt-2 border-t border-[#232c32]">
                <span className="text-slate-400">
                  {engine.ph === 'setup' ? 'Deployment Budget' : `Income +${currentIncome} / turn`}
                </span>
                <span className="text-amber-400 font-extrabold text-base tabular-nums">
                  {engine.gold[engine.cur]} <span className="text-xs font-normal text-slate-400">Gold</span>
                </span>
              </div>

              {engine.note && (
                <div className="mt-2.5 p-2 bg-[#0b0e10] border border-[#232c32] rounded text-xs text-amber-300 font-mono">
                  {engine.note}
                </div>
              )}
            </div>

            {/* Recruitment Sidebar */}
            <RecruitmentBar
              engine={engine}
              onSelectUnitToDeploy={(code) => {
                engine.sp = engine.sp === code ? null : code;
                engine.recalculateHighlights();
                engine.triggerChange();
              }}
              selectedUnitCode={engine.sp}
              currentGold={engine.gold[engine.cur]}
              onOpenArmory={() => {
                setPlaySubTab('inventory');
                setCurrentTab('play');
              }}
              disabled={engine.busy || engine.ctrl[engine.cur]}
            />
          </div>
        </main>
      )}

      {/* Inspect Modals */}
      {inspectedUnit && currentTab === 'battle' && (
        <TacticalUnitModal
          unit={inspectedUnit}
          engine={engine}
          onMoveClick={() => {}}
          onSelectAbility={(idx) => engine.selectAbility(idx)}
          onCapture={(b) => executeBusyAction(() => engine.captureBuilding(inspectedUnit, b))}
          onToggleGroundAim={() => engine.toggleGroundAim()}
          onClose={() => setInspectedUnit(null)}
          disabled={engine.busy || engine.ctrl[engine.cur]}
        />
      )}

      {inspectedBuilding && currentTab === 'battle' && (
        <BuildingModal
          building={inspectedBuilding}
          engine={engine}
          onSelectUnitToDeploy={(code) => {
            engine.sp = code;
            engine.sel = null;
            engine.recalculateHighlights();
            engine.triggerChange();
          }}
          onClose={() => setInspectedBuilding(null)}
          disabled={engine.busy || engine.ctrl[engine.cur]}
        />
      )}

      {/* Victory / Defeat Modal */}
      {/* Victory / Defeat Modal */}
      {engine.over && !isDialogueModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#12171a] border border-[#232c32] rounded-2xl p-5 sm:p-7 max-w-md w-full text-center shadow-2xl space-y-4 border-t-2 border-t-amber-400 my-auto max-h-[92vh] overflow-y-auto relative z-30 pointer-events-auto">
            <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center bg-amber-500/10 border border-amber-500/30">
              <Trophy className="w-7 h-7 text-amber-400" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100 uppercase tracking-tight">
                {engine.isPassAndPlay()
                  ? `Player ${(engine.winner ?? 0) + 1} Victory!`
                  : engine.winner === 0
                  ? 'Tactical Victory!'
                  : 'Mission Defeat'}
              </h2>
              <p className="text-xs text-amber-400 font-mono font-bold mt-1">
                {engine.victoryReason ||
                  (engine.isPassAndPlay()
                    ? `${FACTION_NAMES[engine.winner ?? 0]} dominated the battlefield!`
                    : engine.winner === 0
                    ? 'Operation objectives completed! Sector pacified.'
                    : 'Friendly forces overwhelmed. Regroup and rethink tactics.')}
              </p>
            </div>

            {activeStoryNode && engine.winner === 0 ? (
              <div className="p-3 bg-gradient-to-r from-amber-500/15 to-cyan-500/15 border border-amber-500/40 rounded-xl flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-slate-100">{activeStoryNode.title} Complete</span>
                </div>
                <div className="flex items-center gap-3 font-bold">
                  <span className="text-amber-400">+{lastStoryReward?.mits || activeStoryNode.rewardMits} Mits</span>
                  <span className="text-cyan-400">+{lastStoryReward?.intel || activeStoryNode.rewardIntel} Intel</span>
                </div>
              </div>
            ) : engine.winner === 0 && !engine.isPassAndPlay() ? (
              <div className="p-3 bg-[#0c1012] border border-[#232c32] rounded-xl flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Tactical Mits Awarded</span>
                {engine.isCampaignMode ? (
                  <span className="text-amber-400 font-bold text-sm">
                    +{lastMissionReward?.gen === engine.gen ? lastMissionReward.mits : 350} MITS
                  </span>
                ) : (
                  <span className="text-slate-500 font-bold text-xs">
                    0 MITS (Sandbox Mode - No Rewards)
                  </span>
                )}
              </div>
            ) : null}

            <div className="flex flex-col gap-2 pt-1 pb-2">
              <button
                type="button"
                onClick={() => {
                  AudioService.play('turnReady');
                  if (activeStoryNode) {
                    handleLaunchStoryMission(activeStoryNode);
                  } else if (engine.activeMission) {
                    handleLaunchCampaign(engine.activeMission);
                  } else if (lastMatchParamsRef.current) {
                    handleStartSkirmish(lastMatchParamsRef.current);
                  } else {
                    engine.initMatch({
                      mapSize: engine.N,
                      playersCount: engine.NP,
                      humanFactions: engine.ctrl.map((c, i) => (!c ? i : -1)).filter((i) => i >= 0),
                      isCampaign: engine.isCampaignMode,
                    });
                  }
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-950/20 cursor-pointer transform active:scale-95 transition-all relative z-30"
              >
                Replay Match
              </button>

              {activeStoryNode && (
                <button
                  type="button"
                  onClick={() => {
                    AudioService.play('tab');
                    setCurrentTab('story');
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-sky-950/20 cursor-pointer transform active:scale-95 flex items-center justify-center gap-2 relative z-30"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Return to Story Timeline Map</span>
                </button>
              )}

              {engine.isCampaignMode && !activeStoryNode && (
                <button
                  type="button"
                  onClick={() => {
                    AudioService.play('tab');
                    setPlaySubTab('campaigns');
                    setCurrentTab('play');
                  }}
                  className="w-full py-2.5 px-4 bg-[#182126] hover:bg-[#202c34] text-slate-200 border border-[#28353d] font-bold rounded-xl text-xs uppercase tracking-wider font-mono cursor-pointer relative z-30"
                >
                  Return to Campaign Map
                </button>
              )}

              {!engine.isCampaignMode && !activeStoryNode && (
                <button
                  type="button"
                  onClick={() => {
                    AudioService.play('tab');
                    setCurrentTab('skirmish');
                  }}
                  className="w-full py-2.5 px-4 bg-[#182126] hover:bg-[#202c34] text-slate-200 border border-[#28353d] font-bold rounded-xl text-xs uppercase tracking-wider font-mono cursor-pointer relative z-30"
                >
                  Return to Sandbox Generator
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  AudioService.play('tab');
                  setCurrentTab('menu');
                }}
                className="w-full py-2.5 px-4 text-slate-400 hover:text-white hover:bg-slate-800/40 rounded-xl text-xs font-mono transition-colors cursor-pointer relative z-30"
              >
                Return to Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Story 8-Bit Typewriter Dialogue Modal */}
      <StoryDialogueModal
        sequence={activeDialogueSequence}
        isOpen={isDialogueModalOpen}
        onComplete={() => setIsDialogueModalOpen(false)}
      />

      {/* Pass & Play Handover Privacy Modal */}
      {engine.passPlayPending && currentTab === 'battle' && (
        <PassAndPlayModal
          engine={engine}
          onReady={() => engine.confirmPassAndPlayReady()}
          onTogglePrivacy={() => {
            engine.privacyShieldEnabled = !engine.privacyShieldEnabled;
            engine.triggerChange();
          }}
        />
      )}

      {/* Global Dialog Modals */}
      <SaveManagerModal
        currentProfile={profile}
        isOpen={isSaveManagerOpen}
        onClose={() => setIsSaveManagerOpen(false)}
        onProfileUpdated={updateProfile}
      />

      <SettingsModal
        settings={settings}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateSettings={updateSettings}
      />

      <AdminConsoleModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        engine={engine}
        profile={profile}
        onProfileUpdated={updateProfile}
        isCampaignMode={engine.isCampaignMode}
        activeTool={adminTool}
        setActiveTool={setAdminTool}
        adminSpawnUnit={adminSpawnUnit}
        setAdminSpawnUnit={setAdminSpawnUnit}
        adminSpawnFaction={adminSpawnFaction}
        setAdminSpawnFaction={setAdminSpawnFaction}
      />
    </div>
  );
}
