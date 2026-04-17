import { Readability } from '@mozilla/readability';
import DOMPurify from 'dompurify';

export interface Article {
  title: string;
  byline: string;
  content: string;
  textContent: string;
  siteName: string;
  url: string;
}

const PROXIES = [
  (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
];

async function fetchRaw(url: string): Promise<string> {
  let lastError = '';
  for (const makeProxy of PROXIES) {
    try {
      const res = await fetch(makeProxy(url), { signal: AbortSignal.timeout(10000) });
      if (!res.ok) { lastError = `HTTP ${res.status}`; continue; }
      const text = await res.text();
      // allorigins wraps in JSON; others return raw HTML
      try {
        const json = JSON.parse(text) as { contents?: string };
        if (json.contents) return json.contents;
      } catch {
        // not JSON — return raw HTML
      }
      return text;
    } catch (e) {
      lastError = String(e);
    }
  }
  throw new Error(`Could not load the article. ${lastError}. Try pasting the article text directly instead.`);
}

export async function fetchArticle(url: string): Promise<Article> {
  const html = await fetchRaw(url);
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const base = doc.createElement('base');
  base.href = url;
  doc.head.appendChild(base);

  const reader = new Readability(doc, { charThreshold: 100 });
  const parsed = reader.parse();
  if (!parsed) throw new Error('Could not extract article text from this page. Try pasting the text directly.');

  return {
    title: parsed.title ?? '',
    byline: parsed.byline ?? '',
    content: DOMPurify.sanitize(parsed.content ?? ''),
    textContent: parsed.textContent ?? '',
    siteName: parsed.siteName ?? new URL(url).hostname,
    url,
  };
}

export function articleFromText(text: string): Article {
  return {
    title: '',
    byline: '',
    content: `<p>${text.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>')}</p>`,
    textContent: text,
    siteName: '',
    url: '',
  };
}
