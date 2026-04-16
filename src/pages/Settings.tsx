import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadSettings, saveSettings } from '@/lib/store/keys';
import { validateAnthropicKey } from '@/lib/ai/claude';
import { validateOpenAIKey } from '@/lib/ai/whisper';

type ValidState = 'idle' | 'checking' | 'ok' | 'bad';

export default function Settings() {
  const navigate = useNavigate();
  const initial = loadSettings();
  const [anthropicKey, setAnthropicKey] = useState(initial.anthropicKey);
  const [openaiKey, setOpenaiKey] = useState(initial.openaiKey);
  const [elevenlabsKey, setElevenlabsKey] = useState(initial.elevenlabsKey);
  const [aState, setAState] = useState<ValidState>('idle');
  const [oState, setOState] = useState<ValidState>('idle');
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setAState('checking');
    setOState('checking');
    const [aOk, oOk] = await Promise.all([
      validateAnthropicKey(anthropicKey),
      validateOpenAIKey(openaiKey),
    ]);
    setAState(aOk ? 'ok' : 'bad');
    setOState(oOk ? 'ok' : 'bad');
    if (aOk && oOk) {
      saveSettings({ ...initial, anthropicKey, openaiKey, elevenlabsKey });
      setSaved(true);
      setTimeout(() => navigate('/'), 600);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <Link to="/" className="text-sm text-neutral-500 hover:text-ink">← Back</Link>
      <h1 className="mt-6 font-serif text-3xl">Settings</h1>
      <p className="mt-2 text-neutral-500">
        Keys are stored only in this browser. They are sent directly to the provider and never to any server of ours.
      </p>

      <div className="mt-10 space-y-8">
        <Field
          label="Anthropic API key"
          hint="console.anthropic.com — used for tutor & conversation"
          value={anthropicKey}
          onChange={setAnthropicKey}
          state={aState}
        />
        <Field
          label="OpenAI API key"
          hint="platform.openai.com — used for Whisper speech-to-text"
          value={openaiKey}
          onChange={setOpenaiKey}
          state={oState}
        />
        <Field
          label="ElevenLabs API key"
          hint="Optional — better TTS. Skip to use the browser voice."
          value={elevenlabsKey}
          onChange={setElevenlabsKey}
          state="idle"
          optional
        />
      </div>

      <button
        onClick={handleSave}
        disabled={aState === 'checking' || oState === 'checking'}
        className="mt-10 rounded-full bg-ink px-8 py-3 text-paper transition hover:opacity-90 disabled:opacity-50"
      >
        {aState === 'checking' || oState === 'checking' ? 'Checking…' : saved ? 'Saved ✓' : 'Save'}
      </button>
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  state,
  optional,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (s: string) => void;
  state: ValidState;
  optional?: boolean;
}) {
  const badge =
    state === 'ok' ? '✓' : state === 'bad' ? '✗' : state === 'checking' ? '…' : '';
  const badgeColor =
    state === 'ok' ? 'text-green-600' : state === 'bad' ? 'text-red-600' : 'text-neutral-400';
  return (
    <div>
      <label className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {label}
          {optional && <span className="ml-2 text-neutral-400">(optional)</span>}
        </span>
        <span className={`text-sm ${badgeColor}`}>{badge}</span>
      </label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-ink"
        placeholder="sk-…"
      />
      <p className="mt-1 text-xs text-neutral-500">{hint}</p>
    </div>
  );
}
