import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { fetchArticle, articleFromText, articleFromRss, type Article } from '@/lib/content/article';
import { loadSettings } from '@/lib/store/keys';
import { NATIVE_LANGUAGES } from '@/languages';
import { saveSession } from '@/lib/store/history';
import { getLanguage } from '@/languages';
import MarkableText, { type Mark } from '@/components/MarkableText';
import ReviewPanel from '@/components/ReviewPanel';
import { simplifyArticle } from '@/lib/ai/simplify';

type PageState = 'loading' | 'error' | 'reading' | 'reviewing';
type SimplifyState = 'idle' | 'simplifying' | 'done';

export default function Reading() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const settings = loadSettings();
  const lang = getLanguage(settings.targetLanguage);
  const nativeLang = NATIVE_LANGUAGES.find((l) => l.code === settings.nativeLanguage)?.name ?? 'English';

  const [state, setState] = useState<PageState>('loading');
  const [article, setArticle] = useState<Article | null>(null);
  const [simplifiedArticle, setSimplifiedArticle] = useState<Article | null>(null);
  const [originalArticle, setOriginalArticle] = useState<Article | null>(null);
  const [simplifyState, setSimplifyState] = useState<SimplifyState>('idle');
  const [showingOriginal, setShowingOriginal] = useState(false);
  const [error, setError] = useState('');
  const [marks, setMarks] = useState<Mark[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [sessionId] = useState(() => `${Date.now()}-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    const url = params.get('url');
    const src = params.get('src');

    if (src === 'generated') {
      const stored = sessionStorage.getItem('generated-article');
      if (stored) {
        try { setArticle(JSON.parse(stored)); setState('reading'); return; } catch { /* fall */ }
      }
      setError('Could not load the generated story.');
      setState('error');
      return;
    }

    if (src === 'paste' || src === 'file') {
      const text = sessionStorage.getItem('pasted-text') ?? '';
      setArticle(articleFromText(text));
      setState('reading');
      return;
    }

    if (url) {
      fetchArticle(url)
        .then((a) => { setArticle(a); setState('reading'); })
        .catch(() => {
          // Fall back to RSS item stored by Home if available
          const stored = sessionStorage.getItem('rss-item');
          if (stored) {
            try {
              const item = JSON.parse(stored);
              setArticle(articleFromRss(item, url));
              setState('reading');
              return;
            } catch { /* fall through to error */ }
          }
          setError('Could not load the article — the site may block external access. Try pasting the article text directly.');
          setState('error');
        });
      return;
    }

    setError('No article source provided.');
    setState('error');
  }, [params]);

  async function handleSimplify() {
    if (!article || simplifyState !== 'idle') return;
    setSimplifyState('simplifying');
    try {
      const simplified = await simplifyArticle(article.textContent, lang, settings.level);
      const adapted: Article = {
        ...article,
        content: simplified.replace(/\n/g, '<br>'),
        textContent: simplified,
      };
      setOriginalArticle(article);
      setSimplifiedArticle(adapted);
      setArticle(adapted);
      setSimplifyState('done');
      setShowingOriginal(false);
    } catch {
      setSimplifyState('idle');
    }
  }

  function toggleOriginal() {
    if (!originalArticle || !simplifiedArticle) return;
    if (showingOriginal) {
      setArticle(simplifiedArticle);
      setShowingOriginal(false);
    } else {
      setArticle(originalArticle);
      setShowingOriginal(true);
    }
  }

  function handleDone() {
    if (marks.length === 0 || !article) return;
    saveSession({
      id: sessionId,
      date: new Date().toISOString(),
      title: article.title || 'Untitled',
      source: article.siteName || '',
      url: article.url,
      level: settings.level,
      audience: settings.audience,
      entries: marks.map((m) => ({
        id: m.id,
        sessionId,
        text: m.text,
        question: m.question,
        date: new Date().toISOString(),
        articleTitle: article.title || 'Untitled',
        articleSource: article.siteName || '',
        saved: false,
      })),
    });
    setShowReview(true);
  }

  if (state === 'loading') {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="animate-pulse text-neutral-400">Cargando artículo…</p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <p className="text-red-500">{error}</p>
        <Link to="/" className="mt-6 inline-block text-sm text-neutral-500 hover:text-ink">← Back</Link>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-2xl px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link to="/" className="text-sm text-neutral-400 hover:text-ink">← Back</Link>
        {article?.siteName && (
          <span className="ml-4 text-xs uppercase tracking-widest text-neutral-400">{article.siteName}</span>
        )}
        {article?.title && (
          <h1 className="mt-4 font-serif text-3xl leading-snug text-ink">{article.title}</h1>
        )}
        {article?.byline && (
          <p className="mt-2 text-sm text-neutral-400">{article.byline}</p>
        )}

        {/* Adapted banner */}
        {simplifyState === 'done' && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
            <span className="text-xs text-amber-700">
              ✦ Adapted for {settings.level} level — not the original text
            </span>
            <button
              onClick={toggleOriginal}
              className="ml-auto text-xs text-amber-600 underline underline-offset-2 hover:text-amber-800"
            >
              {showingOriginal ? 'Show adapted ↩' : 'Show original'}
            </button>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-neutral-400">
            Click a word or drag across a phrase to mark anything you don't understand.
          </p>
          {simplifyState === 'idle' && settings.level !== 'advanced' && settings.audience !== 'kids' && settings.level !== 'first-step' && (
            <button
              onClick={handleSimplify}
              className="ml-4 shrink-0 rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-500 transition hover:border-neutral-400 hover:text-ink"
            >
              Simplify for my level
            </button>
          )}
          {simplifyState === 'simplifying' && (
            <span className="ml-4 shrink-0 text-xs text-neutral-400 animate-pulse">Adapting…</span>
          )}
        </div>
      </div>

      {/* Article body */}
      {article && (
        <MarkableText
          html={article.content}
          onMarksChange={setMarks}
        />
      )}

      {/* Floating done button */}
      {marks.length > 0 && (
        <button
          onClick={handleDone}
          className="fixed bottom-8 right-8 rounded-full bg-ink px-6 py-3 text-sm text-paper shadow-lg transition hover:opacity-90"
        >
          {lang.ui.marksDone(marks.length)}
        </button>
      )}

      {/* Speak about this — always visible */}
      {article && state === 'reading' && (
        <div className="mt-16 border-t border-neutral-100 pt-8 pb-16 text-center">
          <button
            onClick={() => {
              sessionStorage.setItem('speaking-topic', article.title || article.textContent.slice(0, 120));
              navigate('/speak');
            }}
            className="rounded-full bg-ink px-8 py-3 text-sm text-paper transition hover:opacity-90"
          >
            Speak about this →
          </button>
        </div>
      )}

      {/* Review panel */}
      {showReview && article && (
        <ReviewPanel
          marks={marks}
          lang={lang}
          level={settings.level}
          audience={settings.audience}
          nativeLang={nativeLang}
          sessionId={sessionId}
          articleContext={article.textContent.slice(0, 1500)}
          onClose={() => setShowReview(false)}
          onStartSpeaking={() => {
            sessionStorage.setItem('speaking-topic', article.title || article.textContent.slice(0, 120));
            navigate('/speak');
          }}
        />
      )}
    </div>
  );
}
