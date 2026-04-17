import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getClient } from '@/lib/ai/claude';
import { conversationSystemPrompt, endOfSessionReviewPrompt } from '@/lib/ai/prompts';
import { speak, stopSpeaking, startRecognition, type RecognitionSession } from '@/lib/ai/speech';
import { loadSettings } from '@/lib/store/keys';
import { getLanguage } from '@/languages';

interface Message { role: 'assistant' | 'user'; content: string; }
type Phase = 'loading' | 'conversation' | 'time-up' | 'reviewing' | 'done';
type MicState = 'idle' | 'recording' | 'toggle-on' | 'processing';

const INITIAL_SECS = 5 * 60;
const EXTEND_SECS  = 2 * 60;

export default function Speaking() {
  const navigate = useNavigate();
  const settings = loadSettings();
  const lang = getLanguage(settings.targetLanguage);

  const topic = sessionStorage.getItem('speaking-topic') || lang.ui.discussThis;

  const [phase, setPhase] = useState<Phase>('loading');
  const [messages, setMessages] = useState<Message[]>([]);
  const [micState, setMicState] = useState<MicState>('idle');
  const [secsLeft, setSecsLeft] = useState(INITIAL_SECS);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [review, setReview] = useState('');
  const [error, setError] = useState('');
  const [interimText, setInterimText] = useState('');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef = useRef<RecognitionSession | null>(null);
  const pressStartRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Auto-scroll transcript
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Timer
  useEffect(() => {
    if (phase !== 'conversation') return;
    timerRef.current = setInterval(() => {
      setSecsLeft((s) => {
        if (s <= 1) { clearInterval(timerRef.current!); setPhase('time-up'); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [phase]);

  // Generate opening message on mount
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const client = getClient();
        const res = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 120,
          system: conversationSystemPrompt(lang, topic, settings.level, settings.audience),
          messages: [{ role: 'user', content: '__start__' }],
        });
        const text = res.content[0].type === 'text' ? res.content[0].text : '';
        if (cancelled) return;
        setMessages([{ role: 'assistant', content: text }]);
        setPhase('conversation');
        setIsSpeaking(true);
        await speak(text, lang.webSpeechLocale, lang.ttsVoiceId);
        if (!cancelled) setIsSpeaking(false);
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    }
    init();
    return () => { cancelled = true; stopSpeaking(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTranscript = useCallback(async (transcript: string) => {
    sessionRef.current = null;
    if (!transcript) { setMicState('idle'); return; }

    const userMsg: Message = { role: 'user', content: transcript };
    setMessages((prev) => [...prev, userMsg]);
    setMicState('processing');

    try {
      const client = getClient();
      const history: Message[] = [...messagesRef.current, userMsg];
      const res = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 180,
        system: conversationSystemPrompt(lang, topic, settings.level, settings.audience),
        messages: history.map((m) => ({ role: m.role, content: m.content })),
      });
      const reply = res.content[0].type === 'text' ? res.content[0].text : '';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      setMicState('idle');
      setIsSpeaking(true);
      await speak(reply, lang.webSpeechLocale, lang.ttsVoiceId);
      setIsSpeaking(false);
    } catch {
      setMicState('idle');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, topic, settings]);

  function startMic() {
    if (isSpeaking || micState === 'processing') return;
    sessionRef.current = startRecognition(
      lang.webSpeechLocale,
      (t) => { setInterimText(''); handleTranscript(t); },
      (e) => { setError(e.message); setMicState('idle'); },
      (interim) => setInterimText(interim),
    );
  }

  function stopMic() {
    sessionRef.current?.stop();
    sessionRef.current = null;
    setMicState('processing');
  }

  // Pointer down: start recording
  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    if (micState === 'toggle-on') return; // second tap handled on up
    pressStartRef.current = Date.now();
    startMic();
    setMicState('recording');
  }

  // Pointer up: decide hold vs toggle
  function onPointerUp() {
    const held = Date.now() - pressStartRef.current;
    if (micState === 'toggle-on') {
      // second tap in toggle mode — stop
      stopMic();
    } else if (held > 400) {
      // hold-to-talk — release stops
      stopMic();
    } else {
      // short tap — enter toggle mode
      setMicState('toggle-on');
    }
  }

  async function finishConversation() {
    clearInterval(timerRef.current!);
    stopSpeaking();
    sessionRef.current?.stop();
    setPhase('reviewing');

    try {
      const transcript = messages
        .map((m) => `${m.role === 'user' ? 'Learner' : 'Tutor'}: ${m.content}`)
        .join('\n');
      const client = getClient();
      const res = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
        system: endOfSessionReviewPrompt(lang, settings.level),
        messages: [{ role: 'user', content: transcript }],
      });
      setReview(res.content[0].type === 'text' ? res.content[0].text : '');
      setPhase('done');
    } catch (e) {
      setReview('Could not generate review: ' + String(e));
      setPhase('done');
    }
  }

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  const micBusy = isSpeaking || micState === 'processing';

  // ── Review screen ──
  if (phase === 'reviewing') {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="animate-pulse text-neutral-400">Reviewing your conversation…</p>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="mx-auto max-w-xl px-6 py-16">
        <h1 className="font-serif text-3xl text-ink">Session review</h1>
        <p className="mt-1 text-sm text-neutral-400">{topic}</p>
        <div className="mt-8 whitespace-pre-wrap leading-relaxed text-ink text-sm">
          {review}
        </div>
        <div className="mt-10 flex gap-4">
          <button
            onClick={() => navigate('/')}
            className="rounded-full bg-ink px-6 py-2.5 text-sm text-paper hover:opacity-90"
          >
            Back to home
          </button>
          <Link to="/history" className="rounded-full border border-neutral-200 px-6 py-2.5 text-sm text-neutral-600 hover:border-neutral-400">
            History
          </Link>
        </div>
      </div>
    );
  }

  // ── Main conversation screen ──
  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
        <Link to="/" className="text-sm text-neutral-400 hover:text-ink">← Back</Link>
        <p className="text-sm text-neutral-500 line-clamp-1 max-w-xs">{topic}</p>
        <span className={`font-mono text-sm tabular-nums ${secsLeft < 60 ? 'text-red-500' : 'text-neutral-400'}`}>
          {formatTime(secsLeft)}
        </span>
      </div>

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {phase === 'loading' && (
          <p className="animate-pulse text-center text-sm text-neutral-400">Starting conversation…</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs rounded-2xl px-4 py-3 text-sm leading-relaxed lg:max-w-sm ${
              m.role === 'user'
                ? 'bg-ink text-paper'
                : 'bg-neutral-100 text-ink'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {/* Live interim transcript */}
        {interimText && (micState === 'recording' || micState === 'toggle-on') && (
          <div className="flex justify-end">
            <div className="max-w-xs rounded-2xl bg-ink/30 px-4 py-3 text-sm leading-relaxed text-white lg:max-w-sm">
              {interimText}
            </div>
          </div>
        )}
        {micState === 'processing' && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-neutral-100 px-4 py-3 text-sm text-neutral-400 animate-pulse">…</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <p className="px-6 pb-2 text-center text-xs text-red-500">{error}</p>
      )}

      {/* Time-up banner */}
      {phase === 'time-up' && (
        <div className="mx-6 mb-4 rounded-xl border border-neutral-200 bg-white p-4 text-center">
          <p className="text-sm font-medium text-ink">Time's up!</p>
          <div className="mt-3 flex justify-center gap-3">
            <button
              onClick={() => { setSecsLeft(EXTEND_SECS); setPhase('conversation'); }}
              className="rounded-full border border-neutral-200 px-4 py-2 text-sm text-neutral-600 hover:border-neutral-400"
            >
              Keep going +2 min
            </button>
            <button
              onClick={finishConversation}
              className="rounded-full bg-ink px-4 py-2 text-sm text-paper hover:opacity-90"
            >
              Finish & review
            </button>
          </div>
        </div>
      )}

      {/* Mic controls */}
      {(phase === 'conversation' || phase === 'time-up') && (
        <div className="flex flex-col items-center gap-4 px-6 pb-10 pt-4">
          {/* Mic button */}
          <button
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            disabled={micBusy}
            className={`relative h-20 w-20 rounded-full transition select-none touch-none ${
              micState === 'toggle-on' || micState === 'recording'
                ? 'bg-red-500 shadow-lg shadow-red-200 scale-110'
                : micBusy
                ? 'bg-neutral-200 cursor-not-allowed'
                : 'bg-ink hover:opacity-90 active:scale-95'
            }`}
          >
            {/* Pulse ring when recording */}
            {(micState === 'toggle-on' || micState === 'recording') && (
              <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-40" />
            )}
            <svg className="relative mx-auto" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </button>

          <p className="text-xs text-neutral-400">
            {micState === 'toggle-on' ? 'Tap to stop' :
             micState === 'recording' ? 'Release to send' :
             micState === 'processing' ? 'Processing…' :
             isSpeaking ? 'Listening…' :
             'Hold or tap to speak'}
          </p>

          {phase === 'conversation' && (
            <button
              onClick={finishConversation}
              className="text-xs text-neutral-400 hover:text-ink"
            >
              End conversation
            </button>
          )}
        </div>
      )}
    </div>
  );
}
