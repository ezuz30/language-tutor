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
  return { kind: 'empty' };
}

export default function Home() {
  const [input, setInput] = useState('');
  const [dragging, setDragging] = useState(false);
  const [picking, setPicking] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [browseItems, setBrowseItems] = useState<FeedItem[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const navigate = useNavigate();

  const settings = loadSettings();
  const lang = getLanguage(settings.targetLanguage);
  const keysOk = hasRequiredKeys(settings);

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

  // Pick one article at random and open it immediately
  async function handlePickForMe() {
    setPicking(true);
    try {
      const items = await fetchFeed(lang, settings.interests);
      if (items.length === 0) return;
      const pick = items[Math.floor(Math.random() * items.length)];
      navigate(`/read?url=${encodeURIComponent(pick.url)}`);
    } catch {
      setPicking(false);
    }
  }

  // Browse: show exactly 5 articles
  const loadBrowse = useCallback(async () => {
    setBrowseLoading(true);
    try {
      const items = await fetchFeed(lang, settings.interests);
      setBrowseItems(items.slice(0, 5));
    } catch {
      setBrowseItems([]);
    } finally {
      setBrowseLoading(false);
    }
  }, [lang, settings.interests]);

  function toggleBrowse() {
    if (!browseOpen) {
      setBrowseOpen(true);
      loadBrowse();
    } else {
      setBrowseOpen(false);
    }
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
    <div className="relative flex min-h-full flex-col items-center justify-center px-6">
      <Link to="/settings" className="absolute right-6 top-6 text-2xl" title="Settings">
        {lang.flag}
      </Link>

      {/* Hero */}
      <h1 className="font-serif text-5xl tracking-tight text-ink">language tutor</h1>
      <p className="mt-3 text-neutral-500">{lang.ui.tagline}</p>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-10 w-full max-w-xl">
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={lang.ui.inputPlaceholder}
          className="w-full rounded-full border border-neutral-200 bg-white px-6 py-4 text-lg shadow-sm outline-none transition focus:border-ink focus:shadow-md"
        />
      </form>

      {!keysOk ? (
        <Link to="/settings" className="mt-6 text-sm text-neutral-500 underline-offset-4 hover:underline">
          Set up your API keys to begin →
        </Link>
      ) : (
        <div className="mt-6 flex flex-col items-center gap-3">
          {/* Primary CTA */}
          <button
            onClick={handlePickForMe}
            disabled={picking}
            className="rounded-full bg-ink px-7 py-3 text-sm text-paper transition hover:opacity-90 disabled:opacity-50"
          >
            {picking ? 'Finding an article…' : 'Pick an article for me'}
          </button>

          {/* Secondary: browse manually */}
          <button
            onClick={toggleBrowse}
            className="text-sm text-neutral-400 transition hover:text-ink"
          >
            {browseOpen ? 'Hide articles ↑' : lang.ui.browseLink + ' ↓'}
          </button>
        </div>
      )}

      {/* Browse panel — compact, max 5 articles */}
      {browseOpen && (
        <div className="mt-6 w-full max-w-xl">
          {browseLoading && (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-neutral-100" />
              ))}
            </div>
          )}
          <div className="space-y-2">
            {browseItems.map((item, i) => (
              <button
                key={i}
                onClick={() => navigate(`/read?url=${encodeURIComponent(item.url)}`)}
                className="w-full rounded-xl border border-neutral-100 bg-white px-5 py-4 text-left transition hover:border-neutral-300 hover:shadow-sm"
              >
                <p className="font-serif text-sm leading-snug text-ink line-clamp-2">{item.title}</p>
                <p className="mt-1 text-xs text-neutral-300">{item.source}</p>
              </button>
            ))}
            {!browseLoading && browseItems.length > 0 && (
              <button
                onClick={loadBrowse}
                className="w-full py-2 text-xs text-neutral-400 hover:text-ink"
              >
                ↺ Show different articles
              </button>
            )}
          </div>
        </div>
      )}

      {dragging && (
        <div className="pointer-events-none fixed inset-4 rounded-3xl border-2 border-dashed border-ink/30 bg-paper/80 backdrop-blur-sm" />
      )}
    </div>
  );
}
