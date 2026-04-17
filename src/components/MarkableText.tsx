import { useRef, useState, useCallback } from 'react';

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
  const [marks, setMarks] = useState<Mark[]>([]);

  const addMark = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 2) return;
    setMarks((prev) => {
      if (prev.some((m) => m.text === trimmed)) return prev;
      const next = [...prev, { id: crypto.randomUUID(), text: trimmed }];
      onMarksChange(next);
      return next;
    });
  }, [onMarksChange]);

  function handleMouseUp() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const text = sel.toString();
    if (text.trim()) {
      addMark(text);
      sel.removeAllRanges();
    }
  }

  function handleClick(e: React.MouseEvent) {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) return; // handled by mouseup
    const target = e.target as HTMLElement;
    const word = target.closest('[data-word]');
    if (word) {
      addMark(word.textContent ?? '');
    }
  }

  // Wrap each word in a span so single-click works
  function buildWordWrapped(rawHtml: string): string {
    const div = document.createElement('div');
    div.innerHTML = rawHtml;
    wrapWords(div);
    return div.innerHTML;
  }

  function wrapWords(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';
      if (!text.trim()) return;
      const span = document.createElement('span');
      span.innerHTML = text.replace(/(\S+)/g, '<span data-word>$1</span>');
      node.parentNode?.replaceChild(span, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();
      if (['script', 'style', 'code', 'pre'].includes(tag)) return;
      Array.from(node.childNodes).forEach(wrapWords);
    }
  }

  const wrappedHtml = buildWordWrapped(html);

  const highlightedHtml = marks.reduce((acc, mark) => {
    const escaped = mark.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return acc.replace(
      new RegExp(`(${escaped})`, 'g'),
      `<mark class="bg-yellow-200 rounded px-0.5 cursor-pointer" data-mark-id="${mark.id}">$1</mark>`
    );
  }, wrappedHtml);

  return (
    <div
      ref={containerRef}
      className="prose prose-lg max-w-none cursor-text select-text font-serif leading-relaxed"
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: highlightedHtml }}
    />
  );
}
