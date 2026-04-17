import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { fetchArticle, articleFromText, type Article } from '@/lib/content/article';
import { loadSettings } from '@/lib/store/keys';
import { getLanguage } from '@/languages';
import MarkableText, { type Mark } from '@/components/MarkableText';
import ReviewPanel from '@/components/ReviewPanel';

type PageState = 'loading' | 'error' | 'reading' | 'reviewing';

export default function Reading() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const settings = loadSettings();
  const lang = getLanguage(settings.targetLanguage);

  const [state, setState] = useState<PageState>('loading');
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState('');
  const [marks, setMarks] = useState<Mark[]>([]);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    const url = params.get('url');
    const src = params.get('src');

    if (src === 'paste' || src === 'file') {
      const text = sessionStorage.getItem('pasted-text') ?? '';
      setArticle(articleFromText(text));
      setState('reading');
      return;
    }

    if (url) {
      fetchArticle(url)
        .then((a) => { setArticle(a); setState('reading'); })
        .catch((e) => { setError(e.message); setState('error'); });
      return;
    }

    setError('No article source provided.');
    setState('error');
  }, [params]);

  function handleDone() {
    if (marks.length === 0) return;
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
        <p className="mt-3 text-xs text-neutral-400">
          Click a word or drag across a phrase to mark anything you don't understand.
        </p>
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

      {/* Review panel */}
      {showReview && article && (
        <ReviewPanel
          marks={marks}
          lang={lang}
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
