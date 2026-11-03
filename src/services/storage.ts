import { PlayerProfile, GameSettings } from '../types/game';
import { STARTER_UNITS } from '../data/units';

const PREFIX = 'frontline_command_';
const ACTIVE_SLOT_KEY = `${PREFIX}active_slot`;
const SETTINGS_KEY = `${PREFIX}settings`;

export const DEFAULT_SETTINGS: GameSettings = {
  quality: 6, // 1=Minimalist ... 6=Tactical High ... 8=Ultra
  soundMode: 0, // 0=fog echo, 1=everywhere, 2=muffler
  masterVolume: 0.8,
  sfxVolume: 0.85,
  muted: false,
  screenShake: true,
  gameSpeed: 1,
};

export const createDefaultProfile = (
  slotId: number,
  name: string = `Commander ${slotId}`
): PlayerProfile => ({
  slotId,
  profileName: name,
  lastSaved: Date.now(),
  mits: 450,
  credits: 450,
  intel: 2,
  unlockedUnits: [...STARTER_UNITS], // Suppliers, Engineers, Transports, etc. are unlocked by default!
  unlockedBranches: ['branch_iron_dawn'],
  unlockedSkins: ['skin_default'],
  activeSkin: 'skin_default',
  questProgress: {},
  claimedQuests: [],
  campaignProgress: {},
  purchasedUpgrades: {},
  skirmishStats: {
    battles: 0,
    victories: 0,
    defeats: 0,
    enemiesEliminated: 0,
    outpostsCaptured: 0,
    totalCreditsEarned: 0,
  },
});

export class StorageService {
  static getActiveSlotId(): number {
    try {
      const val = localStorage.getItem(ACTIVE_SLOT_KEY);
      if (val) {
        const parsed = parseInt(val, 10);
        if (parsed >= 1 && parsed <= 3) return parsed;
      }
    } catch {
      // ignore
    }
    return 1;
  }

  static setActiveSlotId(slot: number): void {
    try {
      localStorage.setItem(ACTIVE_SLOT_KEY, slot.toString());
    } catch (e) {
      console.warn('Failed to set active slot:', e);
    }
  }

  static loadProfile(slotId: number = this.getActiveSlotId()): PlayerProfile {
    try {
      const key = `${PREFIX}slot_${slotId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const data = JSON.parse(raw);
        if (data) {
          // Merge starter units to ensure Suppliers, Engineers, etc. are NOT locked for existing profiles
          const mits = typeof data.mits === 'number' ? data.mits : typeof data.credits === 'number' ? data.credits : 450;
          const unlockedUnits = Array.isArray(data.unlockedUnits)
            ? Array.from(new Set([...STARTER_UNITS, ...data.unlockedUnits]))
            : [...STARTER_UNITS];
          const unlockedBranches = Array.isArray(data.unlockedBranches) && data.unlockedBranches.length > 0
            ? Array.from(new Set(['branch_iron_dawn', ...data.unlockedBranches]))
            : ['branch_iron_dawn'];
          const unlockedSkins = Array.isArray(data.unlockedSkins) && data.unlockedSkins.length > 0
            ? Array.from(new Set(['skin_default', ...data.unlockedSkins]))
            : ['skin_default'];
          const questProgress = data.questProgress && typeof data.questProgress === 'object' ? data.questProgress : {};
          const claimedQuests = Array.isArray(data.claimedQuests) ? data.claimedQuests : [];

          return {
            ...createDefaultProfile(slotId),
            ...data,
            slotId,
            mits,
            credits: mits,
            unlockedUnits,
            unlockedBranches,
            unlockedSkins,
            activeSkin: data.activeSkin || 'skin_default',
            questProgress,
            claimedQuests,
          };
        }
      }
    } catch (e) {
      console.warn('Error reading save profile from device:', e);
    }

    const fresh = createDefaultProfile(slotId);
    this.saveProfile(fresh);
    return fresh;
  }

  static saveProfile(profile: PlayerProfile): boolean {
    try {
      const updated = {
        ...profile,
        lastSaved: Date.now(),
      };
      localStorage.setItem(`${PREFIX}slot_${profile.slotId}`, JSON.stringify(updated));
      return true;
    } catch (e) {
      console.error('Failed to save profile on device:', e);
      return false;
    }
  }

  static listAllSlots(): Array<{ slotId: number; exists: boolean; profile: PlayerProfile }> {
    return [1, 2, 3].map((slotId) => {
      try {
        const raw = localStorage.getItem(`${PREFIX}slot_${slotId}`);
        if (raw) {
          const profile = JSON.parse(raw);
          return { slotId, exists: true, profile };
        }
      } catch {
        // ignore
      }
      return { slotId, exists: false, profile: createDefaultProfile(slotId) };
    });
  }

  static resetSlot(slotId: number): PlayerProfile {
    const fresh = createDefaultProfile(slotId);
    this.saveProfile(fresh);
    return fresh;
  }

  static loadSettings(): GameSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          quality: Math.min(8, Math.max(1, Math.round(Number(parsed.quality) || DEFAULT_SETTINGS.quality))),
          soundMode: [0, 1, 2].includes(Number(parsed.soundMode)) ? Number(parsed.soundMode) : DEFAULT_SETTINGS.soundMode,
          masterVolume: Math.min(1, Math.max(0, Number(parsed.masterVolume) ?? DEFAULT_SETTINGS.masterVolume)),
          sfxVolume: Math.min(1, Math.max(0, Number(parsed.sfxVolume) ?? DEFAULT_SETTINGS.sfxVolume)),
          muted: !!parsed.muted,
          screenShake: parsed.screenShake !== false,
          gameSpeed: Number(parsed.gameSpeed) || 1,
        };
      }
    } catch (e) {
      console.warn('Settings load error:', e);
    }
    return { ...DEFAULT_SETTINGS };
  }

  static saveSettings(settings: GameSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Settings save error:', e);
    }
  }

  static exportSaveFile(profile: PlayerProfile): void {
    const payload = JSON.stringify(
      {
        app: 'Frontline Command',
        version: '3.0.0',
        exportedAt: new Date().toISOString(),
        profile,
      },
      null,
      2
    );
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `frontline_save_slot${profile.slotId}_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static importSaveFile(
    jsonText: string,
    targetSlotId?: number
  ): { success: boolean; profile?: PlayerProfile; error?: string } {
    try {
      const parsed = JSON.parse(jsonText);
      const rawProfile = parsed.profile || parsed;
      const mits = typeof rawProfile.mits === 'number'
        ? rawProfile.mits
        : typeof rawProfile.credits === 'number'
        ? rawProfile.credits
        : null;

      if (mits == null || typeof rawProfile.campaignProgress !== 'object') {
        return { success: false, error: 'Invalid save file format. Missing currency or progress data.' };
      }

      const unlockedUnits = Array.isArray(rawProfile.unlockedUnits)
        ? Array.from(new Set([...STARTER_UNITS, ...rawProfile.unlockedUnits]))
        : [...STARTER_UNITS];
      const unlockedBranches = Array.isArray(rawProfile.unlockedBranches) && rawProfile.unlockedBranches.length > 0
        ? Array.from(new Set(['branch_iron_dawn', ...rawProfile.unlockedBranches]))
        : ['branch_iron_dawn'];
      const unlockedSkins = Array.isArray(rawProfile.unlockedSkins) && rawProfile.unlockedSkins.length > 0
        ? Array.from(new Set(['skin_default', ...rawProfile.unlockedSkins]))
        : ['skin_default'];

      const slot = targetSlotId ?? rawProfile.slotId ?? this.getActiveSlotId();
      const profile: PlayerProfile = {
        ...createDefaultProfile(slot),
        ...rawProfile,
        slotId: slot,
        mits,
        credits: mits,
        unlockedUnits,
        unlockedBranches,
        unlockedSkins,
        activeSkin: rawProfile.activeSkin || 'skin_default',
        lastSaved: Date.now(),
      };

      this.saveProfile(profile);
      return { success: true, profile };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to parse JSON file.' };
    }
  }
}
