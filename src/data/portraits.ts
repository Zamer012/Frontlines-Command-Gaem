/**
 * Character Dialogue Portrait Configurations & Themes
 * Configures distinct themes, badges, colors, and audio personalities for story mode commanders.
 */

export interface PortraitStyleConfig {
  badgeLabel: string;
  badgeColor: string;
  borderColor: string;
  themeGradient: string;
  glowColor: string;
  voiceStyle: 'neko' | 'allied' | 'german' | 'modern' | 'japan' | 'british';
  catchphrase?: string;
}

export const PORTRAIT_CONFIGS: Record<string, PortraitStyleConfig> = {
  // Nekoland (Neco-Arc inspired chibi characters)
  neko_queen: {
    badgeLabel: '🐾 NEKOPOLIS ROYALTY · BURU NYU~',
    badgeColor: '#f472b6',
    borderColor: 'border-pink-500',
    themeGradient: 'from-pink-950 via-purple-950 to-slate-950',
    glowColor: 'rgba(244, 114, 182, 0.45)',
    voiceStyle: 'neko',
    catchphrase: 'Buru Nyuu!~',
  },
  neko_commander: {
    badgeLabel: '🐾 NEKO CLAW BRIGADE',
    badgeColor: '#f472b6',
    borderColor: 'border-pink-400',
    themeGradient: 'from-pink-950 via-pink-900 to-slate-950',
    glowColor: 'rgba(244, 114, 182, 0.4)',
    voiceStyle: 'neko',
    catchphrase: 'Nya!~',
  },
  neko_soldier: {
    badgeLabel: '🐾 NEKO STRIKE SQUAD',
    badgeColor: '#f472b6',
    borderColor: 'border-pink-400',
    themeGradient: 'from-pink-950 via-slate-900 to-slate-950',
    glowColor: 'rgba(244, 114, 182, 0.35)',
    voiceStyle: 'neko',
    catchphrase: 'Dori dori dori!~',
  },

  // British WW2
  british_marshal: {
    badgeLabel: 'WAR OFFICE · BRITANNIA',
    badgeColor: '#eab308',
    borderColor: 'border-amber-500',
    themeGradient: 'from-amber-950 via-slate-900 to-slate-950',
    glowColor: 'rgba(234, 179, 8, 0.35)',
    voiceStyle: 'british',
  },
  british_soldier: {
    badgeLabel: '8TH ARMY CORPS · BRITISH EXPEDITIONARY',
    badgeColor: '#eab308',
    borderColor: 'border-amber-400',
    themeGradient: 'from-amber-950 via-slate-900 to-slate-950',
    glowColor: 'rgba(234, 179, 8, 0.3)',
    voiceStyle: 'british',
  },
  royal_tanker: {
    badgeLabel: 'ROYAL TANK REGIMENT',
    badgeColor: '#eab308',
    borderColor: 'border-amber-500',
    themeGradient: 'from-amber-950 via-slate-900 to-slate-950',
    glowColor: 'rgba(234, 179, 8, 0.35)',
    voiceStyle: 'british',
  },

  // Allied WW2
  allied_general: {
    badgeLabel: 'SHAEF HIGH COMMAND',
    badgeColor: '#38bdf8',
    borderColor: 'border-sky-500',
    themeGradient: 'from-sky-950 via-slate-900 to-slate-950',
    glowColor: 'rgba(56, 189, 248, 0.35)',
    voiceStyle: 'allied',
  },
  allied_soldier: {
    badgeLabel: '2ND RANGER BATTALION',
    badgeColor: '#38bdf8',
    borderColor: 'border-sky-400',
    themeGradient: 'from-sky-950 via-slate-900 to-slate-950',
    glowColor: 'rgba(56, 189, 248, 0.3)',
    voiceStyle: 'allied',
  },

  // German WW2
  german_commander: {
    badgeLabel: 'OBERKOMMANDO WEHRMACHT',
    badgeColor: '#f87171',
    borderColor: 'border-red-600',
    themeGradient: 'from-red-950 via-slate-900 to-slate-950',
    glowColor: 'rgba(248, 113, 113, 0.35)',
    voiceStyle: 'german',
  },
  german_officer: {
    badgeLabel: 'PANZER RECON COMMAND',
    badgeColor: '#f87171',
    borderColor: 'border-red-500',
    themeGradient: 'from-red-950 via-slate-900 to-slate-950',
    glowColor: 'rgba(248, 113, 113, 0.3)',
    voiceStyle: 'german',
  },

  // Modern US
  us_general: {
    badgeLabel: 'US INDO-PACIFIC COMMAND',
    badgeColor: '#38bdf8',
    borderColor: 'border-sky-500',
    themeGradient: 'from-sky-950 via-blue-950 to-slate-950',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    voiceStyle: 'modern',
  },
  modern_soldier: {
    badgeLabel: '1ST MARINE EXPEDITIONARY',
    badgeColor: '#38bdf8',
    borderColor: 'border-sky-400',
    themeGradient: 'from-sky-950 via-slate-900 to-slate-950',
    glowColor: 'rgba(56, 189, 248, 0.3)',
    voiceStyle: 'modern',
  },

  // Imperial Japan
  japan_commander: {
    badgeLabel: 'IMPERIAL GENERAL HEADQUARTERS',
    badgeColor: '#fbbf24',
    borderColor: 'border-yellow-600',
    themeGradient: 'from-amber-950 via-yellow-950 to-slate-950',
    glowColor: 'rgba(251, 191, 36, 0.35)',
    voiceStyle: 'japan',
  },
  japan_officer: {
    badgeLabel: 'DEFENSE SECTOR COMMAND',
    badgeColor: '#fbbf24',
    borderColor: 'border-yellow-500',
    themeGradient: 'from-amber-950 via-slate-900 to-slate-950',
    glowColor: 'rgba(251, 191, 36, 0.3)',
    voiceStyle: 'japan',
  },
};
