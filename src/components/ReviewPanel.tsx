import { useEffect, useState } from 'react';
import { getClient } from '@/lib/ai/claude';
import { tutorExplanationPrompt, tutorExplanationNativePrompt } from '@/lib/ai/prompts';
import type { LanguageConfig } from '@/languages/types';
import type { Mark } from './MarkableText';
import TutorChat from './TutorChat';

interface ExplainedMark extends Mark {
  explanation: string | null;
  nativeExplanation: string | null;
  loading: boolean;
  loadingNative: boolean;
  showNative: boolean;
  saved: boolean;
  expanded: boolean;
}

interface Props {
  marks: Mark[];
  lang: LanguageConfig;
  articleContext: string;
  onClose: () => void;
  onStartSpeaking: () => void;
}

export default function ReviewPanel({ marks, lang, articleContext, onClose, onStartSpeaking }: Props) {
  const [items, setItems] = useState<ExplainedMark[]>(
    marks.map((m) => ({
      ...m,
      explanation: null,
      nativeExplanation: null,
      loading: true,
      loadingNative: false,
      showNative: false,
      saved: false,
      expanded: false,
    }))
  );

  useEffect(() => {
    items.forEach((item, idx) => {
      if (item.explanation !== null) return;
      fetchExplanation(item, idx, false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchExplanation(item: ExplainedMark, idx: number, native: boolean) {
    const loadingKey = native ? 'loadingNative' : 'loading';
    const resultKey = native ? 'nativeExplanation' : 'explanation';
    const systemPrompt = native ? tutorExplanationNativePrompt(lang) : tutorExplanationPrompt(lang);

    try {
      const client = getClient();
      const res = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: [
            `Context from the article:\n"${articleContext.slice(0, 800)}"`,
            `Word/phrase to explain: "${item.text}"`,
            item.question ? `The learner's specific question: "${item.question}"` : '',
          ].filter(Boolean).join('\n\n'),
        }],
      });
      const text = res.content[0].type === 'text' ? res.content[0].text : '';
      setItems((prev) =>
        prev.map((it, i) =>
          i === idx ? { ...it, [resultKey]: text, [loadingKey]: false, expanded: true } : it
        )
      );
    } catch {
      setItems((prev) =>
        prev.map((it, i) =>
          i === idx ? { ...it, [resultKey]: 'Error loading explanation.', [loadingKey]: false } : it
        )
      );
    }
  }

  function toggleLanguage(idx: number) {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const goingNative = !it.showNative;
        // Fetch native explanation lazily on first toggle
        if (goingNative && it.nativeExplanation === null && !it.loadingNative) {
          fetchExplanation({ ...it }, idx, true);
          return { ...it, showNative: true, loadingNative: true };
        }
        return { ...it, showNative: goingNative };
      })
    );
  }

  function toggleExpanded(idx: number) {
    setItems((prev) =>
      prev.map((it, i) => i === idx ? { ...it, expanded: !it.expanded } : it)
    );
  }

  function toggleSaved(idx: number) {
    setItems((prev) =>
      prev.map((it, i) => i === idx ? { ...it, saved: !it.saved } : it)
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-ink/20 backdrop-blur-sm" onClick={onClose} />

      <div className="w-full max-w-md overflow-y-auto bg-paper px-6 py-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl">Review</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-ink">✕</button>
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          {items.length} {items.length === 1 ? 'word' : 'words'} marked
        </p>

        <div className="mt-6 space-y-6">
          {items.map((item, idx) => (
            <div key={item.id} className="border-b border-neutral-100 pb-6">
              {/* Header row */}
              <button
                onClick={() => toggleExpanded(idx)}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="font-serif text-lg text-ink">
                  "{item.text}"
                  {item.question && (
                    <span className="ml-2 text-xs font-sans text-neutral-400 font-normal">— {item.question}</span>
                  )}
                </span>
                <span className="ml-3 shrink-0 text-neutral-400">{item.expanded ? '▲' : '▼'}</span>
              </button>

              {item.expanded && (
                <div className="mt-3">
                  {/* Language toggle */}
                  <div className="mb-3 flex items-center gap-1">
                    <button
                      onClick={() => !item.showNative && toggleLanguage(idx)}
                      className={`rounded-full px-3 py-1 text-xs transition ${
                        !item.showNative
                          ? 'bg-ink text-paper'
                          : 'text-neutral-400 hover:text-ink'
                      }`}
                    >
                      {lang.name}
                    </button>
                    <button
                      onClick={() => item.showNative && toggleLanguage(idx) || !item.showNative && toggleLanguage(idx)}
                      className={`rounded-full px-3 py-1 text-xs transition ${
                        item.showNative
                          ? 'bg-ink text-paper'
                          : 'text-neutral-400 hover:text-ink'
                      }`}
                    >
                      English
                    </button>
                  </div>

                  {/* Explanation */}
                  {item.showNative ? (
                    item.loadingNative ? (
                      <p className="text-sm text-neutral-400 animate-pulse">Loading…</p>
                    ) : (
                      <p className="text-sm leading-relaxed text-ink whitespace-pre-wrap">
                        {item.nativeExplanation}
                      </p>
                    )
                  ) : (
                    item.loading ? (
                      <p className="text-sm text-neutral-400 animate-pulse">Pensando…</p>
                    ) : (
                      <TutorChat
                        lang={lang}
                        markedText={item.text}
                        initialExplanation={item.explanation ?? ''}
                      />
                    )
                  )}

                  <button
                    onClick={() => toggleSaved(idx)}
                    className={`mt-3 text-xs ${item.saved ? 'text-amber-600 font-medium' : 'text-neutral-400 hover:text-ink'}`}
                  >
                    {item.saved ? '✓ Saved' : 'Save to vocab'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={onStartSpeaking}
          className="mt-8 w-full rounded-full bg-ink py-3 text-sm text-paper hover:opacity-90"
        >
          {lang.ui.discussThis} →
        </button>
      </div>
    </div>
  );
}
