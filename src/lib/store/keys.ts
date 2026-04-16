import type { LanguageCode } from '@/languages/types';

export interface UserSettings {
  anthropicKey: string;
  openaiKey: string;
  elevenlabsKey: string;
  targetLanguage: LanguageCode;
  interests: string[];
}

const STORAGE_KEY = 'language-tutor.settings';

const defaults: UserSettings = {
  anthropicKey: '',
  openaiKey: '',
  elevenlabsKey: '',
  targetLanguage: 'es',
  interests: [],
};

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

export function saveSettings(settings: UserSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function updateSettings(patch: Partial<UserSettings>): UserSettings {
  const next = { ...loadSettings(), ...patch };
  saveSettings(next);
  return next;
}

export function hasRequiredKeys(s: UserSettings = loadSettings()): boolean {
  return s.anthropicKey.trim().length > 0 && s.openaiKey.trim().length > 0;
}
