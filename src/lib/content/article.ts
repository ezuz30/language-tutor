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
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
  (url: string) => `https://cors.eu.org/${url}`,
];

async function tryProxy(makeProxy: (u: string) => string, url: string): Promise<string> {
  const res = await fetch(makeProxy(url), { signal: AbortSignal.timeout(7000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  try {
    const json = JSON.parse(text) as { contents?: string };
    if (json.contents) return json.contents;
  } catch { /* raw HTML */ }
  if (text.trim().length > 200) return text;
  throw new Error('Empty response');
}

async function fetchRaw(url: string): Promise<string> {
  try {
    return await Promise.any(PROXIES.map((p) => tryProxy(p, url)));
  } catch {
    throw new Error('Could not load the article. Try pasting the article text directly instead.');
  }
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

export function articleFromRss(item: { title: string; description: string; source: string; url: string }, url: string): Article {
  const text = item.description || '';
  const note = text
    ? `<p class="text-neutral-400 text-xs mb-6">Preview only — the full article could not be loaded. <a href="${url}" target="_blank" rel="noopener" class="underline">Open original ↗</a></p>`
    : `<p class="text-neutral-400 text-xs mb-6">The full article could not be loaded. <a href="${url}" target="_blank" rel="noopener" class="underline">Open original ↗</a></p>`;
  return {
    title: item.title,
    byline: '',
    content: note + `<p>${text}</p>`,
    textContent: item.title + '\n\n' + text,
    siteName: item.source,
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
