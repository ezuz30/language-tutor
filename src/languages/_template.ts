// Copy this file to add a new language (e.g. hebrew.ts), fill in the fields,
// then register it in `languages/index.ts`.
import type { LanguageConfig } from './types';

export const _template: LanguageConfig = {
  code: 'en', // change to the target language code (ISO 639-1)
  name: 'English',
  nativeName: 'English',
  flag: '🇬🇧',
  direction: 'ltr',
  whisperCode: 'en',
  ttsVoiceId: '',
  webSpeechLocale: 'en-US',
  level: 'B1',
  feeds: [],
  ui: {
    tagline: '',
    inputPlaceholder: '',
    browseLink: '',
    discussThis: '',
    marksDone: (n) => `${n} marks · Done`,
    saveToVocab: '',
    askFollowUp: '',
  },
};
