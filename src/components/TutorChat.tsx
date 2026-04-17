import { useState } from 'react';
import { getClient } from '@/lib/ai/claude';
import { tutorFollowUpPrompt } from '@/lib/ai/prompts';
import type { LanguageConfig } from '@/languages/types';
import type { LearnerLevel, Audience } from '@/lib/store/keys';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  lang: LanguageConfig;
  markedText: string;
  initialExplanation: string;
  level?: LearnerLevel;
  audience?: Audience;
}

export default function TutorChat({ lang, markedText, initialExplanation, level = 'intermediate', audience = 'adult' }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: initialExplanation },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const next: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setLoading(true);
    try {
      const client = getClient();
      const res = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: tutorFollowUpPrompt(lang, level, audience),
        messages: [
          { role: 'user', content: `The word/phrase being discussed: "${markedText}"` },
          ...next.map((m) => ({ role: m.role, content: m.content })),
        ],
      });
      const reply = res.content[0].type === 'text' ? res.content[0].text : '';
      setMessages([...next, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages([...next, { role: 'assistant', content: '— error, try again —' }]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 space-y-3">
      {messages.map((m, i) => (
        <p
          key={i}
          className={`text-sm leading-relaxed ${
            m.role === 'assistant' ? 'text-ink' : 'text-neutral-500 italic'
          }`}
        >
          {m.content}
        </p>
      ))}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={lang.ui.askFollowUp}
          disabled={loading}
          className="flex-1 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-ink disabled:opacity-50"
        />
        {loading && <span className="self-center text-xs text-neutral-400">…</span>}
      </form>
    </div>
  );
}
