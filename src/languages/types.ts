export type LanguageCode = 'es' | 'he' | 'en' | 'fr' | 'pt' | 'it' | 'de' | 'ar';

export type NativeLanguageCode = 'en' | 'he' | 'fr' | 'es' | 'it' | 'de' | 'ar';

export interface NativeLanguage {
  code: NativeLanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

export const NATIVE_LANGUAGES: NativeLanguage[] = [
  { code: 'en', name: 'English',  nativeName: 'English',   flag: '🇬🇧' },
  { code: 'he', name: 'Hebrew',   nativeName: 'עברית',     flag: '🇮🇱' },
  { code: 'fr', name: 'French',   nativeName: 'Français',  flag: '🇫🇷' },
  { code: 'es', name: 'Spanish',  nativeName: 'Español',   flag: '🇪🇸' },
  { code: 'it', name: 'Italian',  nativeName: 'Italiano',  flag: '🇮🇹' },
  { code: 'de', name: 'German',   nativeName: 'Deutsch',   flag: '🇩🇪' },
  { code: 'ar', name: 'Arabic',   nativeName: 'العربية',   flag: '🇸🇦' },
];

export interface RssFeed {
  name: string;
  url: string;
  topics: string[];
}

export interface LanguageConfig {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
  whisperCode: string;
  ttsVoiceId: string;
  webSpeechLocale: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  feeds: RssFeed[];
  ui: {
    tagline: string;
    inputPlaceholder: string;
    browseLink: string;
    discussThis: string;
    marksDone: (n: number) => string;
    saveToVocab: string;
    askFollowUp: string;
  };
}
