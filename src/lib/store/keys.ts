import type { LanguageCode, NativeLanguageCode } from '@/languages/types';

export type LearnerLevel = 'first-step' | 'beginner' | 'intermediate' | 'advanced';
export type Audience = 'kids' | 'adult';

export interface UserSettings {
  anthropicKey: string;
  openaiKey: string;
  elevenlabsKey: string;
  targetLanguage: LanguageCode;
  nativeLanguage: NativeLanguageCode;
  interests: string[];
  level: LearnerLevel;
  audience: Audience;
}

const STORAGE_KEY = 'language-tutor.settings';

const defaults: UserSettings = {
  anthropicKey: '',
  openaiKey: '',
  elevenlabsKey: '',
  targetLanguage: 'es',
  nativeLanguage: 'en',
  interests: [],
  level: 'intermediate',
  audience: 'adult',
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
  return s.anthropicKey.trim().length > 0;
}

export function hasOpenAIKey(s: UserSettings = loadSettings()): boolean {
  return s.openaiKey.trim().length > 0;
}
