import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadSettings, hasRequiredKeys } from '@/lib/store/keys';
import { getLanguage } from '@/languages';

type Intent =
  | { kind: 'youtube'; url: string }
  | { kind: 'article'; url: string }
  | { kind: 'text'; text: string }
  | { kind: 'topic'; query: string }
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
  return { kind: 'topic', query: s };
}

export default function Home() {
  const [input, setInput] = useState('');
  const [dragging, setDragging] = useState(false);
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
      case 'topic':
        navigate(`/?topic=${encodeURIComponent(intent.query)}`);
        break;
    }
  }

  useEffect(() => {
    function onDragOver(e: DragEvent) {
      e.preventDefault();
      setDragging(true);
    }
    function onDragLeave(e: DragEvent) {
      if (e.relatedTarget === null) setDragging(false);
    }
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
      <Link
        to="/settings"
        className="absolute right-6 top-6 text-2xl"
        title={lang.name}
      >
        {lang.flag}
      </Link>

      <h1 className="font-serif text-5xl tracking-tight text-ink">language tutor</h1>
      <p className="mt-3 text-neutral-500">{lang.ui.tagline}</p>

      <form onSubmit={handleSubmit} className="mt-10 w-full max-w-xl">
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={lang.ui.inputPlaceholder}
          className="w-full rounded-full border border-neutral-200 bg-white px-6 py-4 text-lg shadow-sm outline-none transition focus:border-ink focus:shadow-md"
        />
      </form>

      {!keysOk && (
        <Link
          to="/settings"
          className="mt-10 text-sm text-neutral-500 underline-offset-4 hover:underline"
        >
          Set up your API keys to begin
        </Link>
      )}

      {dragging && (
        <div className="pointer-events-none fixed inset-4 rounded-3xl border-2 border-dashed border-ink/30 bg-paper/80 backdrop-blur-sm" />
      )}
    </div>
  );
}
