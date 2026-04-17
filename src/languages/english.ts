import type { LanguageConfig } from './types';

export const english: LanguageConfig = {
  code: 'en',
  name: 'English',
  nativeName: 'English',
  flag: '🇬🇧',
  direction: 'ltr',
  whisperCode: 'en',
  ttsVoiceId: '21m00Tcm4TlvDq8ikWAM',
  webSpeechLocale: 'en-GB',
  level: 'B1',
  feeds: [
    { name: 'BBC News',     url: 'https://feeds.bbci.co.uk/news/rss.xml',                 topics: ['general', 'world'] },
    { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss',                 topics: ['world'] },
    { name: 'NPR',          url: 'https://feeds.npr.org/1001/rss.xml',                    topics: ['general'] },
    { name: 'BBC Sport',    url: 'https://feeds.bbci.co.uk/sport/rss.xml',                topics: ['sports'] },
    { name: 'BBC Tech',     url: 'https://feeds.bbci.co.uk/news/technology/rss.xml',      topics: ['tech'] },
    { name: 'BBC Culture',  url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml', topics: ['culture'] },
  ],
  ui: {
    tagline: 'Learn by reading, listening and speaking.',
    inputPlaceholder: 'Paste a link, video or topic…',
    browseLink: 'Browse today\'s articles',
    discussThis: 'Let\'s talk about this',
    marksDone: (n) => `${n} mark${n === 1 ? '' : 's'} · Done`,
    saveToVocab: 'Save',
    askFollowUp: 'Ask a follow-up…',
  },
};
