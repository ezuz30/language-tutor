import { useRef, useEffect, useCallback, useState } from 'react';

export interface Mark {
  id: string;
  text: string;
  question?: string; // optional specific question from the user
}

interface PendingPopup {
  id: string;
  text: string;
  x: number;
  y: number;
}

interface Props {
  html: string;
  onMarksChange: (marks: Mark[]) => void;
}

export default function MarkableText({ html, onMarksChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const marksRef = useRef<Mark[]>([]);
  const [popup, setPopup] = useState<PendingPopup | null>(null);
  const [question, setQuestion] = useState('');

  useEffect(() => {
    if (containerRef.current) containerRef.current.innerHTML = html;
    marksRef.current = [];
  }, [html]);

  // Close popup on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && popup) confirmMark(popup.id, '');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popup]);

  const removeMark = useCallback((id: string) => {
    const el = containerRef.current?.querySelector(`mark[data-mark-id="${id}"]`) as HTMLElement | null;
    if (!el) return;
    el.classList.add('lt-mark--removing');
    el.addEventListener('animationend', () => {
      const parent = el.parentNode;
      if (!parent) return;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
    }, { once: true });
    const next = marksRef.current.filter((m) => m.id !== id);
    marksRef.current = next;
    onMarksChange(next);
  }, [onMarksChange]);

  function confirmMark(id: string, q: string) {
    const next = marksRef.current.map((m) =>
      m.id === id ? { ...m, question: q.trim() || undefined } : m
    );
    marksRef.current = next;
    onMarksChange(next);
    setPopup(null);
    setQuestion('');
  }

  const addMark = useCallback((text: string, range: Range) => {
    const trimmed = text.trim().replace(/\s+/g, ' ');
    if (!trimmed || trimmed.length < 2) return;
    if (marksRef.current.some((m) => m.text === trimmed)) return;

    const id = crypto.randomUUID();
    let markEl: HTMLElement | null = null;

    try {
      const el = document.createElement('mark');
      el.className = 'lt-mark';
      el.dataset.markId = id;
      range.surroundContents(el);
      requestAnimationFrame(() => {
        el.classList.add('lt-mark--new');
        el.addEventListener('animationend', () => el.classList.remove('lt-mark--new'), { once: true });
      });
      markEl = el;
    } catch {
      // surroundContents fails across block boundaries
    }

    const next = [...marksRef.current, { id, text: trimmed }];
    marksRef.current = next;
    onMarksChange(next);

    // Position popup near the mark element
    if (markEl) {
      const rect = markEl.getBoundingClientRect();
      setQuestion('');
      setPopup({
        id,
        text: trimmed,
        x: rect.left + window.scrollX,
        y: rect.bottom + window.scrollY + 8,
      });
    }
  }, [onMarksChange]);

  function handleMouseUp() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0).cloneRange();
    const text = sel.toString();
    sel.removeAllRanges();
    if (text.trim()) addMark(text, range);
  }

  function handleClick(e: React.MouseEvent) {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) return;

    const target = e.target as HTMLElement;
    const mark = target.closest('.lt-mark') as HTMLElement | null;

    if (mark?.dataset.markId) {
      removeMark(mark.dataset.markId);
      return;
    }

    const range = document.caretRangeFromPoint?.(e.clientX, e.clientY);
    if (!range) return;

    const tmpSel = window.getSelection();
    if (!tmpSel) return;
    tmpSel.removeAllRanges();
    tmpSel.addRange(range);
    tmpSel.modify('move', 'backward', 'word');
    tmpSel.modify('extend', 'forward', 'word');
    const wordRange = tmpSel.rangeCount > 0 ? tmpSel.getRangeAt(0).cloneRange() : null;
    tmpSel.removeAllRanges();

    if (wordRange) {
      const text = wordRange.toString();
      if (text.trim().length > 1) addMark(text, wordRange);
    }
  }

  return (
    <>
      <div
        ref={containerRef}
        className="prose prose-lg max-w-none cursor-text select-text font-serif leading-relaxed"
        onMouseUp={handleMouseUp}
        onClick={handleClick}
      />

      {popup && (
        <div
          className="fixed z-50"
          style={{ left: popup.x, top: popup.y }}
        >
          <div className="w-72 rounded-2xl border border-neutral-200 bg-white shadow-xl">
            <div className="px-4 pt-4 pb-1">
              <p className="text-xs text-neutral-400 mb-2">
                ¿Tienes alguna pregunta sobre <span className="font-medium text-ink">"{popup.text}"</span>?
              </p>
              <form
                onSubmit={(e) => { e.preventDefault(); confirmMark(popup.id, question); }}
              >
                <input
                  autoFocus
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="¿Qué significa aquí exactamente…?"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none transition focus:border-ink"
                />
                <div className="mt-3 flex items-center justify-between pb-3">
                  <button
                    type="button"
                    onClick={() => confirmMark(popup.id, '')}
                    className="text-xs text-neutral-400 hover:text-neutral-600"
                  >
                    Saltar →
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-ink px-4 py-1.5 text-xs text-paper hover:opacity-90"
                  >
                    Confirmar
                  </button>
                </div>
              </form>
            </div>
          </div>
          {/* Arrow pointing up */}
          <div className="absolute -top-1.5 left-4 h-3 w-3 rotate-45 border-l border-t border-neutral-200 bg-white" />
        </div>
      )}
    </>
  );
}
