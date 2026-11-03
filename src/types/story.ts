import { TerrainTileType, BotDifficulty, ReinforcementWave, MinePosition } from './game';

export interface StoryDialogueSpeaker {
  id: string;
  name: string;
  title: string;
  portrait:
    | 'allied_general'
    | 'allied_soldier'
    | 'german_commander'
    | 'german_officer'
    | 'us_general'
    | 'us_ranger'
    | 'japan_commander'
    | 'japan_officer'
    | 'british_marshal'
    | 'british_soldier'
    | 'neko_queen'
    | 'neko_commander'
    | 'narrator';
  voicePitch: number; // e.g. 0.7 to 2.2
  isCute?: boolean; // high pitch cute meow chirp for Nekos
  accentColor: string;
}

export interface StoryDialogueEntry {
  id: string;
  speaker: StoryDialogueSpeaker;
  text: string;
}

export interface StoryDialogueSequence {
  id: string;
  trigger: 'onStart' | 'onEnd' | { turn: number };
  lines: StoryDialogueEntry[];
}

export interface StoryChoice {
  id: string;
  label: string;
  description: string;
  targetNodeId: string;
  tacticalAdvantage?: string;
  bonusStartingGold?: number;
}

export interface StoryMissionNode {
  id: string;
  storyId: string;
  title: string;
  subtitle: string;
  codename: string;
  locationName: string;
  loreBrief: string;
  tacticalBrief: string;
  mapSize: number;
  playerGold: number;
  enemyGold: number;
  playerSkin: string;
  enemySkin: string;
  enemyName: string;
  difficulty: BotDifficulty;
  mapTheme?: 'standard' | 'forest' | 'trenches' | 'river' | 'ruins';
  noPlayerHq?: boolean;
  customDeployTiles?: Array<{ x: number; y: number }>;
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
  objectiveType: 'destroy_hq' | 'destroy_all' | 'holdout' | 'capture_outposts' | 'destroy_vip';
  objectiveText: string;
  rewardMits: number;
  rewardIntel: number;
  dialogues: StoryDialogueSequence[];
  aftermathDialogue?: StoryDialogueEntry[];
  nextChoices?: StoryChoice[];
  isFinalNode?: boolean;
  timelineStep: number;
  timelineLane: 'main' | 'branch_a' | 'branch_b';
}

export interface StoryCampaign {
  id: string;
  title: string;
  era: string;
  synopsis: string;
  badge: string;
  heroSkin: string;
  enemySkin: string;
  heroFactionName: string;
  enemyFactionName: string;
  totalRewardMits: number;
  totalRewardIntel: number;
  startingNodeId: string;
  nodes: Record<string, StoryMissionNode>;
}

export interface StoryProgress {
  completedNodeIds: string[];
  currentNodeId: string;
  chosenBranchIds: Record<string, string>; // nodeId -> chosen targetNodeId
}
