import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadSettings, hasRequiredKeys } from '@/lib/store/keys';
import { getLanguage } from '@/languages';
import { fetchFeed, type FeedItem } from '@/lib/content/feeds';

type Intent =
  | { kind: 'youtube'; url: string }
  | { kind: 'article'; url: string }
  | { kind: 'text'; text: string }
  | { kind: 'empty' };

function classify(input: string): Intent {
  const s = input.trim();
  if (!s) return { kind: 'empty' };
  const isUrl = /^https?:\/\//i.test(s);
  if (isUrl) {
    if (/youtube\.com\/watch|youtu\.be\//i.test(s)) return { kind: 'youtube', url: s };
    return { kind: 'article', url: s };
  }
  if (s.length > 200) return { kind: 'text', text: s };
  // Short text = treat as topic filter for the feed
  return { kind: 'empty' };
}

export default function Home() {
  const [input, setInput] = useState('');
  const [dragging, setDragging] = useState(false);
  const [articles, setArticles] = useState<FeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState('');
  const navigate = useNavigate();

  const settings = loadSettings();
  const lang = getLanguage(settings.targetLanguage);
  const keysOk = hasRequiredKeys(settings);

  // Filtered articles based on what the user typed (topic search)
  const filtered = input.trim().length > 1 && input.trim().length < 200
    ? articles.filter((a) =>
        a.title.toLowerCase().includes(input.toLowerCase()) ||
        a.description.toLowerCase().includes(input.toLowerCase()) ||
        a.source.toLowerCase().includes(input.toLowerCase())
      )
    : articles;

  const loadFeed = useCallback(async () => {
    if (!keysOk) return;
    setFeedLoading(true);
    setFeedError('');
    try {
      const items = await fetchFeed(lang, settings.interests);
      setArticles(items);
    } catch {
      setFeedError('Could not load articles. Check your connection.');
    } finally {
      setFeedLoading(false);
    }
  }, [keysOk, lang, settings.interests]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const intent = classify(input);
    switch (intent.kind) {
      case 'youtube':
        navigate(`/listen?url=${encodeURIComponent(intent.url)}`);
        break;
      case 'article':
        navigate(`/read?url=${encodeURIComponent(intent.url)}`);
        break;
      case 'text':
        sessionStorage.setItem('pasted-text', intent.text);
        navigate('/read?src=paste');
        break;
    }
  }

  function openArticle(url: string) {
    navigate(`/read?url=${encodeURIComponent(url)}`);
  }

  useEffect(() => {
    function onDragOver(e: DragEvent) { e.preventDefault(); setDragging(true); }
    function onDragLeave(e: DragEvent) { if (e.relatedTarget === null) setDragging(false); }
    function onDrop(e: DragEvent) {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
        sessionStorage.setItem('dropped-media-name', file.name);
        navigate('/listen?src=file');
      } else {
        file.text().then((txt) => {
          sessionStorage.setItem('pasted-text', txt);
          navigate('/read?src=file');
        });
      }
    }
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [navigate]);

  return (
    <div className="relative mx-auto flex min-h-full w-full max-w-2xl flex-col px-6 py-12">
      {/* Settings / language flag */}
      <Link to="/settings" className="absolute right-6 top-6 text-2xl" title="Settings">
        {lang.flag}
      </Link>

      {/* Hero */}
      <div className="flex flex-col items-center pt-16 pb-8">
        <h1 className="font-serif text-5xl tracking-tight text-ink">language tutor</h1>
        <p className="mt-3 text-neutral-500">{lang.ui.tagline}</p>

        <form onSubmit={handleSubmit} className="mt-8 w-full max-w-xl">
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={lang.ui.inputPlaceholder}
            className="w-full rounded-full border border-neutral-200 bg-white px-6 py-4 text-lg shadow-sm outline-none transition focus:border-ink focus:shadow-md"
          />
        </form>

        {!keysOk && (
          <Link to="/settings" className="mt-6 text-sm text-neutral-500 underline-offset-4 hover:underline">
            Set up your API keys to begin →
          </Link>
        )}
      </div>

      {/* Article feed */}
      {keysOk && (
        <div className="mt-2">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-neutral-400">
              {input.trim().length > 1 ? `Results for "${input.trim()}"` : 'Today\'s articles'}
            </p>
            <button
              onClick={loadFeed}
              className="text-xs text-neutral-400 hover:text-ink transition"
              title="Refresh"
            >
              ↺ Refresh
            </button>
          </div>

          {feedLoading && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl bg-neutral-100 h-20" />
              ))}
            </div>
          )}

          {feedError && (
            <p className="text-sm text-red-400">{feedError}</p>
          )}

          {!feedLoading && filtered.length === 0 && !feedError && (
            <p className="text-sm text-neutral-400">
              {input.trim().length > 1 ? 'No articles matched. Try a different topic.' : 'No articles loaded.'}
            </p>
          )}

          <div className="space-y-2">
            {filtered.map((item, i) => (
              <button
                key={i}
                onClick={() => openArticle(item.url)}
                className="w-full rounded-xl border border-neutral-100 bg-white px-5 py-4 text-left transition hover:border-neutral-300 hover:shadow-sm"
              >
                <p className="font-serif text-base leading-snug text-ink line-clamp-2">
                  {item.title}
                </p>
                {item.description && (
                  <p className="mt-1 text-xs text-neutral-400 line-clamp-1">{item.description}</p>
                )}
                <p className="mt-2 text-xs text-neutral-300">{item.source}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Drag overlay */}
      {dragging && (
        <div className="pointer-events-none fixed inset-4 rounded-3xl border-2 border-dashed border-ink/30 bg-paper/80 backdrop-blur-sm" />
      )}
    </div>
  );
}
