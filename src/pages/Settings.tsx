import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadSettings, saveSettings } from '@/lib/store/keys';
import { validateAnthropicKey } from '@/lib/ai/claude';
import { validateOpenAIKey } from '@/lib/ai/whisper';

type ValidState = 'idle' | 'checking' | 'ok' | 'bad';

const INTEREST_OPTIONS = [
  { id: 'general', label: 'General news' },
  { id: 'world',   label: 'World' },
  { id: 'sports',  label: 'Sports' },
  { id: 'tech',    label: 'Tech' },
  { id: 'culture', label: 'Culture' },
];

export default function Settings() {
  const navigate = useNavigate();
  const initial = loadSettings();
  const [anthropicKey, setAnthropicKey] = useState(initial.anthropicKey);
  const [openaiKey, setOpenaiKey] = useState(initial.openaiKey);
  const [elevenlabsKey, setElevenlabsKey] = useState(initial.elevenlabsKey);
  const [interests, setInterests] = useState<string[]>(
    initial.interests.length ? initial.interests : ['general']
  );
  const [aState, setAState] = useState<ValidState>('idle');
  const [oState, setOState] = useState<ValidState>('idle');
  const [saved, setSaved] = useState(false);

  function toggleInterest(id: string) {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    setAState('checking');
    const aOk = await validateAnthropicKey(anthropicKey);
    setAState(aOk ? 'ok' : 'bad');

    if (openaiKey.trim()) {
      setOState('checking');
      const oOk = await validateOpenAIKey(openaiKey);
      setOState(oOk ? 'ok' : 'bad');
      if (!oOk) return;
    } else {
      setOState('idle');
    }

    if (aOk) {
      saveSettings({ ...initial, anthropicKey, openaiKey, elevenlabsKey, interests });
      setSaved(true);
      setTimeout(() => navigate('/'), 600);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <Link to="/" className="text-sm text-neutral-500 hover:text-ink">← Back</Link>
      <h1 className="mt-6 font-serif text-3xl">Settings</h1>
      <p className="mt-2 text-neutral-500">
        Keys are stored only in this browser and sent directly to the provider.
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
          hint="Optional — upgrades speaking to Whisper (more accurate). Skip to use the free browser mic."
          value={openaiKey}
          onChange={setOpenaiKey}
          state={oState}
          optional
        />
        <Field
          label="ElevenLabs API key"
          hint="Optional — better TTS voice. Skip to use the browser voice."
          value={elevenlabsKey}
          onChange={setElevenlabsKey}
          state="idle"
          optional
        />

        {/* Interests */}
        <div>
          <p className="text-sm font-medium">Interests</p>
          <p className="mt-1 text-xs text-neutral-500">
            Used to filter the article feed on the home page.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => toggleInterest(id)}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  interests.includes(id)
                    ? 'border-ink bg-ink text-paper'
                    : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
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
  label, hint, value, onChange, state, optional,
}: {
  label: string; hint: string; value: string;
  onChange: (s: string) => void; state: ValidState; optional?: boolean;
}) {
  const badge = state === 'ok' ? '✓' : state === 'bad' ? '✗' : state === 'checking' ? '…' : '';
  const badgeColor = state === 'ok' ? 'text-green-600' : state === 'bad' ? 'text-red-600' : 'text-neutral-400';
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
