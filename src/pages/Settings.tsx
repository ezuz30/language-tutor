import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadSettings, saveSettings, type LearnerLevel, type Audience } from '@/lib/store/keys';
import { validateAnthropicKey } from '@/lib/ai/claude';
import { validateOpenAIKey } from '@/lib/ai/whisper';
import { languages, NATIVE_LANGUAGES } from '@/languages';
import type { LanguageCode, NativeLanguageCode } from '@/languages';

type ValidState = 'idle' | 'checking' | 'ok' | 'bad';

const LEVEL_OPTIONS: { id: LearnerLevel; label: string; desc: string }[] = [
  { id: 'first-step',   label: 'First Step',   desc: 'A0–A1 — I know almost nothing yet' },
  { id: 'beginner',     label: 'Beginner',     desc: 'A2 — I know the basics, read slowly' },
  { id: 'intermediate', label: 'Intermediate', desc: 'B1–B2 — I can have basic conversations' },
  { id: 'advanced',     label: 'Advanced',     desc: 'C1–C2 — I want to polish to fluency' },
];

const ADULT_INTERESTS = [
  { id: 'general', label: 'General news' },
  { id: 'world',   label: 'World' },
  { id: 'sports',  label: 'Sports' },
  { id: 'tech',    label: 'Tech' },
  { id: 'culture', label: 'Culture' },
];

const KIDS_INTERESTS = [
  { id: 'animals',    label: 'Animals' },
  { id: 'adventure',  label: 'Adventure' },
  { id: 'school',     label: 'School' },
  { id: 'nature',     label: 'Nature' },
  { id: 'food',       label: 'Food' },
  { id: 'friendship', label: 'Friendship' },
];

type Tab = 'profile' | 'keys';

export default function Settings() {
  const navigate = useNavigate();
  const initial = loadSettings();
  const [tab, setTab] = useState<Tab>('profile');
  const [anthropicKey, setAnthropicKey] = useState(initial.anthropicKey);
  const [openaiKey, setOpenaiKey] = useState(initial.openaiKey);
  const [elevenlabsKey, setElevenlabsKey] = useState(initial.elevenlabsKey);
  const [audience, setAudience] = useState<Audience>(initial.audience ?? 'adult');
  const [level, setLevel] = useState<LearnerLevel>(initial.level ?? 'intermediate');
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>(initial.targetLanguage ?? 'es');
  const [nativeLanguage, setNativeLanguage] = useState<NativeLanguageCode>(initial.nativeLanguage ?? 'en');
  const [interests, setInterests] = useState<string[]>(
    initial.interests.length ? initial.interests : ['general']
  );
  const [aState, setAState] = useState<ValidState>('idle');
  const [oState, setOState] = useState<ValidState>('idle');
  const [saved, setSaved] = useState(false);

  const interestOptions = audience === 'kids' ? KIDS_INTERESTS : ADULT_INTERESTS;

  function handleAudienceChange(a: Audience) {
    setAudience(a);
    // Reset interests when switching audience
    setInterests(a === 'kids' ? ['animals'] : ['general']);
  }

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
      saveSettings({ ...initial, anthropicKey, openaiKey, elevenlabsKey, interests, level, audience, targetLanguage, nativeLanguage });
      setSaved(true);
      setTimeout(() => navigate('/'), 600);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <Link to="/" className="text-sm text-neutral-500 hover:text-ink">← Back</Link>
      <h1 className="mt-6 font-serif text-3xl">Settings</h1>

      {/* Tabs */}
      <div className="mt-8 flex gap-1 rounded-xl bg-neutral-100 p-1">
        {(['profile', 'keys'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-sm transition ${
              tab === t ? 'bg-white font-medium text-ink shadow-sm' : 'text-neutral-500 hover:text-ink'
            }`}
          >
            {t === 'profile' ? 'Profile' : 'API Keys'}
          </button>
        ))}
      </div>

      {/* ── Profile tab ── */}
      {tab === 'profile' && <section className="mt-8 space-y-6">

        {/* Language pair */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-2 text-sm font-medium">I speak</p>
            <LanguagePicker
              options={NATIVE_LANGUAGES.map((l) => ({ code: l.code, flag: l.flag, label: l.nativeName }))}
              value={nativeLanguage}
              onChange={(v) => setNativeLanguage(v as NativeLanguageCode)}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">I'm learning</p>
            <LanguagePicker
              options={(Object.entries(languages) as [LanguageCode, NonNullable<typeof languages[LanguageCode]>][])
                .map(([code, cfg]) => ({ code, flag: cfg.flag, label: cfg.nativeName }))}
              value={targetLanguage}
              onChange={(v) => setTargetLanguage(v as LanguageCode)}
            />
          </div>
        </div>

        {/* Audience */}
        <div>
          <p className="text-sm font-medium">Who is learning?</p>
          <div className="mt-3 flex gap-3">
            {(['adult', 'kids'] as Audience[]).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => handleAudienceChange(a)}
                className={`flex-1 rounded-xl border py-3 text-sm transition ${
                  audience === a
                    ? 'border-ink bg-ink text-paper'
                    : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'
                }`}
              >
                {a === 'adult' ? 'Adult' : 'Child (under 13)'}
              </button>
            ))}
          </div>
        </div>

        {/* Level — adults only */}
        {audience === 'adult' && (
          <div>
            <p className="text-sm font-medium">My level</p>
            <div className="mt-3 space-y-2">
              {LEVEL_OPTIONS.map(({ id, label, desc }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setLevel(id)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                    level === id
                      ? 'border-ink bg-ink text-paper'
                      : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'
                  }`}
                >
                  <span className="text-sm font-medium">{label}</span>
                  <span className={`text-xs ${level === id ? 'text-paper/70' : 'text-neutral-400'}`}>{desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        <div>
          <p className="text-sm font-medium">Interests</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {interestOptions.map(({ id, label }) => (
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
      </section>}

      {/* ── API Keys tab ── */}
      {tab === 'keys' && <section className="mt-8 space-y-6">
        <p className="text-xs text-neutral-400">
          Stored only in this browser — sent directly to each provider, never through our servers.
        </p>
        <Field
          label="Anthropic"
          hint="console.anthropic.com · required"
          value={anthropicKey}
          onChange={setAnthropicKey}
          state={aState}
        />
        <Field
          label="OpenAI"
          hint="Optional — upgrades speech to Whisper. Skip to use the free browser mic."
          value={openaiKey}
          onChange={setOpenaiKey}
          state={oState}
          optional
        />
        <Field
          label="ElevenLabs"
          hint="Optional — better TTS voice. Skip to use the browser voice."
          value={elevenlabsKey}
          onChange={setElevenlabsKey}
          state="idle"
          optional
        />
      </section>}

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

function LanguagePicker({ options, value, onChange }: {
  options: { code: string; flag: string; label: string }[];
  value: string;
  onChange: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.code === value) ?? options[0];

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 text-sm transition hover:border-neutral-400"
      >
        <span className="flex items-center gap-2">
          <span>{selected.flag}</span>
          <span className="text-ink">{selected.label}</span>
        </span>
        <span className="text-neutral-400">{open ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
          <div className="max-h-48 overflow-y-auto divide-y divide-neutral-100">
            {options.map((o) => (
              <button
                key={o.code}
                type="button"
                onClick={() => { onChange(o.code); setOpen(false); }}
                className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm transition ${
                  o.code === value ? 'bg-ink text-paper' : 'text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <span>{o.flag}</span>
                <span>{o.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
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
