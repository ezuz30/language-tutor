import type { LanguageCode, LanguageConfig } from './types';
import { spanish } from './spanish';

export const languages: Partial<Record<LanguageCode, LanguageConfig>> = {
  es: spanish,
};

export const defaultLanguage: LanguageCode = 'es';

export function getLanguage(code: LanguageCode): LanguageConfig {
  const cfg = languages[code];
  if (!cfg) throw new Error(`Language not configured: ${code}`);
  return cfg;
}

export type { LanguageConfig, LanguageCode } from './types';
