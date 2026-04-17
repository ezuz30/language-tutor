import { useRef, useEffect, useCallback } from 'react';

export interface Mark {
  id: string;
  text: string;
}

interface Props {
  html: string;
  onMarksChange: (marks: Mark[]) => void;
}

export default function MarkableText({ html, onMarksChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const marksRef = useRef<Mark[]>([]);

  // Set innerHTML once — we manage all changes directly in the DOM after that.
  useEffect(() => {
    if (containerRef.current) containerRef.current.innerHTML = html;
    marksRef.current = [];
  }, [html]);

  const addMark = useCallback((text: string, range: Range) => {
    const trimmed = text.trim().replace(/\s+/g, ' ');
    if (!trimmed || trimmed.length < 2) return;
    if (marksRef.current.some((m) => m.text === trimmed)) return;

    const id = crypto.randomUUID();
    try {
      const el = document.createElement('mark');
      el.className = 'lt-mark';
      el.dataset.markId = id;
      range.surroundContents(el);
      // Trigger the flash animation on next frame
      requestAnimationFrame(() => {
        el.classList.add('lt-mark--new');
        el.addEventListener('animationend', () => el.classList.remove('lt-mark--new'), { once: true });
      });
    } catch {
      // surroundContents fails when selection crosses block elements — skip visual wrap
    }

    const next = [...marksRef.current, { id, text: trimmed }];
    marksRef.current = next;
    onMarksChange(next);
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
    if (sel && !sel.isCollapsed) return; // drag-select handled above
    const target = e.target as HTMLElement;
    if (target.closest('.lt-mark')) return; // already marked

    // Expand caret position to a full word using browser APIs
    const range = document.caretRangeFromPoint?.(e.clientX, e.clientY);
    if (!range) return;

    // Use Selection.modify to expand to word boundaries
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
    <div
      ref={containerRef}
      className="prose prose-lg max-w-none cursor-text select-text font-serif leading-relaxed"
      onMouseUp={handleMouseUp}
      onClick={handleClick}
    />
  );
}
