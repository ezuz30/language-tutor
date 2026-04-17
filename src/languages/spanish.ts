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
    { name: 'BBC Mundo',          url: 'https://feeds.bbci.co.uk/mundo/rss.xml',                                                                  topics: ['general', 'world'] },
    { name: 'DW Español',         url: 'https://rss.dw.com/rdf/rss-sp-all',                                                                       topics: ['general', 'world'] },
    { name: 'El País',            url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada',                                        topics: ['general'] },
    { name: 'Marca',              url: 'https://e00-marca.uecdn.es/rss/portada.xml',                                                               topics: ['sports'] },
    { name: 'AS',                 url: 'https://as.com/rss/tags/ultimas_noticias.xml',                                                             topics: ['sports'] },
    { name: 'BBC Mundo Deportes', url: 'https://feeds.bbci.co.uk/mundo/rss.xml',                                                                  topics: ['sports'] },
    { name: 'Xataka',             url: 'https://www.xataka.com/feedburner.xml',                                                                    topics: ['tech'] },
    { name: 'El País Tecnología', url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/tecnologia/portada',                     topics: ['tech'] },
    { name: 'El País Cultura',    url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/cultura/portada',                        topics: ['culture'] },
    { name: 'El Cultural',        url: 'https://www.elcultural.com/rss/ultimas_noticias',                                                          topics: ['culture'] },
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
