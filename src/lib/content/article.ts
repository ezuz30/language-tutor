import { Readability } from '@mozilla/readability';
import DOMPurify from 'dompurify';

export interface Article {
  title: string;
  byline: string;
  content: string; // sanitised HTML
  textContent: string; // plain text
  siteName: string;
  url: string;
}

const PROXY = 'https://api.allorigins.win/get?url=';

export async function fetchArticle(url: string): Promise<Article> {
  const proxyUrl = `${PROXY}${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error(`Failed to fetch article (${res.status})`);
  const data = await res.json() as { contents: string };

  const doc = new DOMParser().parseFromString(data.contents, 'text/html');
  // Set base so relative URLs resolve correctly
  const base = doc.createElement('base');
  base.href = url;
  doc.head.appendChild(base);

  const reader = new Readability(doc, { charThreshold: 100 });
  const parsed = reader.parse();
  if (!parsed) throw new Error('Could not extract article content from this page.');

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
