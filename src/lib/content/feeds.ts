import type { LanguageConfig } from '@/languages/types';

export interface FeedItem {
  title: string;
  url: string;
  description: string;
  source: string;
  pubDate: string;
  topic: string;
}

const PROXIES = [
  (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
];

async function fetchXml(url: string): Promise<Document> {
  let lastErr = '';
  for (const makeProxy of PROXIES) {
    try {
      const res = await fetch(makeProxy(url), { signal: AbortSignal.timeout(8000) });
      if (!res.ok) { lastErr = `HTTP ${res.status}`; continue; }
      const text = await res.text();
      // allorigins wraps in JSON
      let raw = text;
      try {
        const json = JSON.parse(text) as { contents?: string };
        if (json.contents) raw = json.contents;
      } catch { /* raw HTML/XML */ }
      return new DOMParser().parseFromString(raw, 'text/xml');
    } catch (e) {
      lastErr = String(e);
    }
  }
  throw new Error(`Feed fetch failed: ${lastErr}`);
}

function parseItems(doc: Document, sourceName: string, topic: string): FeedItem[] {
  const items = Array.from(doc.querySelectorAll('item, entry'));
  return items.slice(0, 8).map((item) => {
    const get = (tag: string) =>
      item.querySelector(tag)?.textContent?.trim() ?? '';
    const link =
      item.querySelector('link')?.getAttribute('href') ??
      item.querySelector('link')?.textContent?.trim() ??
      '';
    return {
      title: get('title').replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
      url: link,
      description: get('description').replace(/<[^>]+>/g, '').slice(0, 140),
      source: sourceName,
      pubDate: get('pubDate') || get('published') || get('updated'),
      topic,
    };
  }).filter((i) => i.title && i.url);
}

export async function fetchFeed(
  lang: LanguageConfig,
  interests: string[]
): Promise<FeedItem[]> {
  const active = interests.length === 0
    ? lang.feeds
    : lang.feeds.filter((f) =>
        f.topics.some((t) => interests.includes(t) || interests.includes('general'))
      );

  const results = await Promise.allSettled(
    active.map((f) =>
      fetchXml(f.url)
        .then((doc) => parseItems(doc, f.name, f.topics[0]))
        .catch(() => [] as FeedItem[])
    )
  );

  const all: FeedItem[] = results.flatMap((r) =>
    r.status === 'fulfilled' ? r.value : []
  );

  // Shuffle slightly so it doesn't always show the same source first
  return all.sort(() => Math.random() - 0.48);
}
