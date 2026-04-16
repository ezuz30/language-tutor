export type LanguageCode = 'es' | 'he' | 'fr' | 'pt' | 'it' | 'en';

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
