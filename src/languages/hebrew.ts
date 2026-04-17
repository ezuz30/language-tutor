import type { LanguageConfig } from './types';

export const hebrew: LanguageConfig = {
  code: 'he',
  name: 'Hebrew',
  nativeName: 'עברית',
  flag: '🇮🇱',
  direction: 'rtl',
  whisperCode: 'he',
  ttsVoiceId: '',
  webSpeechLocale: 'he-IL',
  level: 'B1',
  feeds: [
    { name: 'Ynet',    url: 'https://www.ynet.co.il/Integration/StoryRss2.xml',                       topics: ['general'] },
    { name: 'Walla',   url: 'https://rss.walla.co.il/feed/1',                                         topics: ['general', 'world'] },
    { name: 'Haaretz', url: 'https://www.haaretz.co.il/srv/rss-articles',                             topics: ['general', 'world'] },
    { name: 'Ynet ספורט', url: 'https://www.ynet.co.il/Integration/StoryRss3.xml',                   topics: ['sports'] },
    { name: 'Ynet טכנולוגיה', url: 'https://www.ynet.co.il/Integration/StoryRss542.xml',             topics: ['tech'] },
    { name: 'Ynet תרבות', url: 'https://www.ynet.co.il/Integration/StoryRss185.xml',                 topics: ['culture'] },
  ],
  ui: {
    tagline: 'למד על ידי קריאה, האזנה ודיבור.',
    inputPlaceholder: 'הדבק קישור, סרטון או נושא…',
    browseLink: 'עיין בחדשות של היום',
    discussThis: 'בוא נדבר על זה',
    marksDone: (n) => `${n} סימנים · סיום`,
    saveToVocab: 'שמור',
    askFollowUp: 'שאל משהו…',
  },
};
