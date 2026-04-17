import type { LearnerLevel, Audience } from '@/lib/store/keys';

export interface VocabEntry {
  id: string;
  sessionId: string;
  text: string;
  question?: string;
  date: string;
  articleTitle: string;
  articleSource: string;
  saved: boolean;
}

export interface SessionRecord {
  id: string;
  date: string;
  title: string;
  source: string;
  url: string;
  level: LearnerLevel;
  audience: Audience;
  entries: VocabEntry[];
}

const SESSIONS_KEY = 'language-tutor.sessions';

export function loadSessions(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? (JSON.parse(raw) as SessionRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveSession(record: SessionRecord): void {
  const sessions = loadSessions();
  // Prepend so newest is first
  localStorage.setItem(SESSIONS_KEY, JSON.stringify([record, ...sessions]));
}

export function updateVocabSaved(sessionId: string, entryId: string, saved: boolean): void {
  const sessions = loadSessions();
  const updated = sessions.map((s) =>
    s.id !== sessionId ? s : {
      ...s,
      entries: s.entries.map((e) => e.id === entryId ? { ...e, saved } : e),
    }
  );
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
}

export function getAllVocab(): VocabEntry[] {
  return loadSessions().flatMap((s) => s.entries);
}

// Group vocab entries by normalised text.
// Returns groups sorted: saved-first, then by frequency desc, then alphabetically.
export interface VocabGroup {
  text: string;
  count: number;
  saved: boolean; // true if ANY occurrence is saved
  entries: VocabEntry[];
}

export function groupVocab(entries: VocabEntry[]): VocabGroup[] {
  const map = new Map<string, VocabEntry[]>();
  for (const e of entries) {
    const key = e.text.toLowerCase().trim();
    const bucket = map.get(key) ?? [];
    bucket.push(e);
    map.set(key, bucket);
  }
  const groups: VocabGroup[] = Array.from(map.entries()).map(([, bucket]) => ({
    text: bucket[0].text, // preserve original casing from first occurrence
    count: bucket.length,
    saved: bucket.some((e) => e.saved),
    entries: bucket.sort((a, b) => b.date.localeCompare(a.date)),
  }));
  return groups.sort((a, b) => {
    if (a.saved !== b.saved) return a.saved ? -1 : 1;
    if (b.count !== a.count) return b.count - a.count;
    return a.text.localeCompare(b.text);
  });
}
