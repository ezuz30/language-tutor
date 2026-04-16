import type { LanguageConfig } from './types';

export const spanish: LanguageConfig = {
  code: 'es',
  name: 'Spanish',
  nativeName: 'Español',
  flag: '🇪🇸',
  direction: 'ltr',
  whisperCode: 'es',
  ttsVoiceId: 'EXAVITQu4vr4xnSDxMaL',
  webSpeechLocale: 'es-ES',
  level: 'B1',
  feeds: [
    { name: 'El País', url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada', topics: ['general'] },
    { name: 'BBC Mundo', url: 'https://feeds.bbci.co.uk/mundo/rss.xml', topics: ['general', 'world'] },
    { name: 'DW Español', url: 'https://rss.dw.com/rdf/rss-sp-all', topics: ['general', 'world'] },
    { name: 'El País Tecnología', url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/tecnologia/portada', topics: ['tech'] },
    { name: 'El País Deportes', url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/deportes/portada', topics: ['sports'] },
    { name: 'El País Cultura', url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/cultura/portada', topics: ['culture'] },
  ],
  ui: {
    tagline: 'Aprende leyendo, escuchando y hablando.',
    inputPlaceholder: 'Pega un enlace, un vídeo o un tema…',
    browseLink: 'O explora noticias del día',
    discussThis: 'Hablemos de esto',
    marksDone: (n) => `${n} marcas · Terminar`,
    saveToVocab: 'Guardar',
    askFollowUp: 'Pregúntame algo…',
  },
};
