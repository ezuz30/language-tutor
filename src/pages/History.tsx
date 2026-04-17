import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { loadSessions, groupVocab, getAllVocab, updateVocabSaved, type SessionRecord, type VocabGroup } from '@/lib/store/history';

type Tab = 'sessions' | 'vocab';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function History() {
  const [tab, setTab] = useState<Tab>('sessions');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [vocabFilter, setVocabFilter] = useState<'all' | 'saved'>('all');
  const [, forceUpdate] = useState(0);

  const sessions = useMemo(() => loadSessions(), []);
  const vocabGroups = useMemo(() => {
    const all = getAllVocab();
    return groupVocab(vocabFilter === 'saved' ? all.filter((e) => e.saved) : all);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vocabFilter, /* re-derive after save toggle */]);

  function handleToggleSaved(group: VocabGroup, saved: boolean) {
    group.entries.forEach((e) => updateVocabSaved(e.sessionId, e.id, saved));
    forceUpdate((n) => n + 1);
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <Link to="/" className="text-sm text-neutral-500 hover:text-ink">← Back</Link>
      <h1 className="mt-6 font-serif text-3xl">History</h1>

      {/* Tabs */}
      <div className="mt-8 flex gap-1 rounded-xl bg-neutral-100 p-1">
        {(['sessions', 'vocab'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-sm transition ${
              tab === t ? 'bg-white font-medium text-ink shadow-sm' : 'text-neutral-500 hover:text-ink'
            }`}
          >
            {t === 'sessions' ? `Sessions${sessions.length ? ` (${sessions.length})` : ''}` : 'Vocabulary'}
          </button>
        ))}
      </div>

      {/* Sessions tab */}
      {tab === 'sessions' && (
        <div className="mt-6 space-y-3">
          {sessions.length === 0 && (
            <p className="py-12 text-center text-sm text-neutral-400">No sessions yet. Read an article to get started.</p>
          )}
          {sessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              expanded={expandedSession === s.id}
              onToggle={() => setExpandedSession(expandedSession === s.id ? null : s.id)}
            />
          ))}
        </div>
      )}

      {/* Vocabulary tab */}
      {tab === 'vocab' && (
        <div className="mt-6">
          {/* Filter */}
          <div className="mb-4 flex gap-2">
            {(['all', 'saved'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setVocabFilter(f)}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  vocabFilter === f
                    ? 'border-ink bg-ink text-paper'
                    : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'
                }`}
              >
                {f === 'all' ? 'All words' : 'Saved'}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {vocabGroups.length === 0 && (
              <p className="py-12 text-center text-sm text-neutral-400">
                {vocabFilter === 'saved' ? 'No saved words yet.' : 'No words marked yet.'}
              </p>
            )}
            {vocabGroups.map((group) => (
              <VocabRow
                key={group.text.toLowerCase()}
                group={group}
                onToggleSaved={(saved) => handleToggleSaved(group, saved)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, expanded, onToggle }: {
  session: SessionRecord;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-neutral-100 bg-white">
      <button
        onClick={onToggle}
        className="flex w-full items-start justify-between px-5 py-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="font-serif text-base leading-snug text-ink line-clamp-1">{session.title}</p>
          <p className="mt-1 text-xs text-neutral-400">
            {formatDate(session.date)}
            {session.source && <> · {session.source}</>}
            {' · '}{session.entries.length} {session.entries.length === 1 ? 'word' : 'words'} marked
          </p>
        </div>
        <span className="ml-3 mt-0.5 shrink-0 text-neutral-300">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="border-t border-neutral-100 px-5 py-4">
          {session.entries.length === 0 ? (
            <p className="text-sm text-neutral-400">No words marked.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {session.entries.map((e) => (
                <span
                  key={e.id}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    e.saved
                      ? 'border-amber-200 bg-amber-50 text-amber-700'
                      : 'border-neutral-200 text-neutral-600'
                  }`}
                >
                  {e.text}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VocabRow({ group, onToggleSaved }: {
  group: VocabGroup;
  onToggleSaved: (saved: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-neutral-100 bg-white">
      <div className="flex items-center gap-3 px-5 py-3">
        {/* Word */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="min-w-0 flex-1 text-left"
        >
          <span className="font-serif text-base text-ink">{group.text}</span>
          {group.count > 1 && (
            <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
              ×{group.count}
            </span>
          )}
        </button>

        {/* Save toggle */}
        <button
          onClick={() => onToggleSaved(!group.saved)}
          className={`shrink-0 text-xs transition ${
            group.saved ? 'text-amber-600 font-medium' : 'text-neutral-300 hover:text-neutral-500'
          }`}
          title={group.saved ? 'Remove from saved' : 'Save to vocab'}
        >
          {group.saved ? '✓ Saved' : 'Save'}
        </button>
      </div>

      {/* Occurrences */}
      {expanded && (
        <div className="border-t border-neutral-100 px-5 py-3 space-y-1.5">
          {group.entries.map((e) => (
            <p key={e.id} className="text-xs text-neutral-400">
              <span className="text-neutral-600">{e.articleTitle}</span>
              {e.question && <span className="italic"> — "{e.question}"</span>}
              <span className="ml-2">{formatDate(e.date)}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
