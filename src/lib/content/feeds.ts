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
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
  (url: string) => `https://cors.eu.org/${url}`,
];

async function tryProxyXml(makeProxy: (u: string) => string, url: string): Promise<Document> {
  const res = await fetch(makeProxy(url), { signal: AbortSignal.timeout(7000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  let raw = text;
  try {
    const json = JSON.parse(text) as { contents?: string };
    if (json.contents) raw = json.contents;
  } catch { /* raw XML */ }
  const doc = new DOMParser().parseFromString(raw, 'text/xml');
  if (doc.querySelector('parsererror')) throw new Error('Invalid XML');
  return doc;
}

async function fetchXml(url: string): Promise<Document> {
  try {
    return await Promise.any(PROXIES.map((p) => tryProxyXml(p, url)));
  } catch {
    throw new Error(`Feed fetch failed for ${url}`);
  }
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

async function fetchFeeds(feeds: LanguageConfig['feeds']): Promise<FeedItem[]> {
  const results = await Promise.allSettled(
    feeds.map((f) =>
      fetchXml(f.url)
        .then((doc) => parseItems(doc, f.name, f.topics[0]))
        .catch(() => [] as FeedItem[])
    )
  );
  return results.flatMap((r) => r.status === 'fulfilled' ? r.value : []);
}

export async function fetchFeed(
  lang: LanguageConfig,
  interests: string[]
): Promise<FeedItem[]> {
  const filtered = interests.length === 0
    ? lang.feeds
    : lang.feeds.filter((f) =>
        f.topics.some((t) => interests.includes(t) || interests.includes('general'))
      );

  let all = await fetchFeeds(filtered);

  // If filtered feeds returned nothing, fall back to all feeds
  if (all.length === 0 && filtered.length < lang.feeds.length) {
    all = await fetchFeeds(lang.feeds);
  }

  // Shuffle slightly so it doesn't always show the same source first
  return all.sort(() => Math.random() - 0.48);
}
