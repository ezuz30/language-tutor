import type { LanguageCode, LanguageConfig } from './types';
import { spanish } from './spanish';
import { hebrew } from './hebrew';
import { english } from './english';

export const languages: Partial<Record<LanguageCode, LanguageConfig>> = {
  es: spanish,
  he: hebrew,
  en: english,
};

export const defaultLanguage: LanguageCode = 'es';

export function getLanguage(code: LanguageCode): LanguageConfig {
  const cfg = languages[code];
  if (!cfg) throw new Error(`Language not configured: ${code}`);
  return cfg;
}

export type { LanguageConfig, LanguageCode } from './types';
export { NATIVE_LANGUAGES } from './types';
export type { NativeLanguageCode, NativeLanguage } from './types';
