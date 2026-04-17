import type { LanguageConfig } from '@/languages/types';
import type { LearnerLevel, Audience } from '@/lib/store/keys';

function levelDescriptor(level: LearnerLevel): string {
  switch (level) {
    case 'first-step':   return 'a complete beginner (A0–A1) who barely knows any words in the language';
    case 'beginner':     return 'an early beginner (A2) who knows the basics but reads slowly and gets stuck on vocabulary';
    case 'intermediate': return 'an intermediate learner (B1–B2) who can hold a basic day-to-day conversation but struggles with complex vocabulary and abstract topics';
    case 'advanced':     return 'an advanced learner (C1–C2) aiming for complete fluency in professional, academic, or literary contexts';
  }
}

function levelTone(level: LearnerLevel): string {
  switch (level) {
    case 'first-step':   return 'Use only the most common, everyday words. Maximum 6 words per sentence. Present tense only. Be very warm and encouraging — every small step matters.';
    case 'beginner':     return 'Use simple vocabulary and short sentences. Avoid subjunctive and complex tenses. Be warm and encouraging.';
    case 'intermediate': return 'Use everyday vocabulary. Avoid poetic or overly formal language. Focus on practical, conversational language.';
    case 'advanced':     return 'You can use sophisticated vocabulary, nuanced grammar notes, and professional or literary style.';
  }
}

export function tutorExplanationPrompt(lang: LanguageConfig, level: LearnerLevel = 'intermediate', audience: Audience = 'adult'): string {
  const who = audience === 'kids'
    ? `a child (ages 6–12) learning ${lang.name}`
    : `${levelDescriptor(level)}`;
  const tone = audience === 'kids'
    ? 'Use a playful, encouraging tone — like a fun teacher. Short sentences, simple words, maybe one fun example.'
    : levelTone(level);

  return `You are a ${lang.name} language tutor. The learner is ${who}.

When given a word or phrase from a ${lang.name} text, explain it IN ${lang.name.toUpperCase()} ONLY.
- Give a simple definition using vocabulary easier than the word being explained
- Give one natural example sentence
- Add a brief grammar note only if it's genuinely helpful
- Do NOT translate to English unless the learner explicitly asks
- Keep the explanation to 3–5 sentences maximum
- ${tone}`;
}

export function tutorExplanationNativePrompt(lang: LanguageConfig, level: LearnerLevel = 'intermediate', audience: Audience = 'adult', nativeLang = 'English'): string {
  const who = audience === 'kids'
    ? `a child (ages 6–12) learning ${lang.name}`
    : `${levelDescriptor(level)}`;

  return `You are a ${lang.name} language tutor. The learner is ${who}.

When given a word or phrase from a ${lang.name} text, explain it IN ${nativeLang.toUpperCase()}.
- Give a clear ${nativeLang} explanation of the meaning in context
- Include the direct ${nativeLang} translation
- Note any nuance or grammar point that makes this tricky
- Give one example sentence in ${lang.name} with its ${nativeLang} translation
- Keep it to 3–5 sentences — clear and practical`;
}

export function tutorFollowUpPrompt(lang: LanguageConfig, level: LearnerLevel = 'intermediate', audience: Audience = 'adult'): string {
  const who = audience === 'kids'
    ? `a child (ages 6–12) learning ${lang.name}`
    : `${levelDescriptor(level)}`;
  const tone = audience === 'kids'
    ? 'Be playful and encouraging. Use very simple words.'
    : levelTone(level);

  return `You are continuing a tutoring session in ${lang.name}. The learner is ${who} and asked a follow-up question.

- Reply IN ${lang.name.toUpperCase()} ONLY
- Keep your reply to 1–3 sentences
- Stay at the learner's level
- If still confused after 2 exchanges, you may add a brief English gloss in parentheses
- ${tone}`;
}

export function conversationSystemPrompt(lang: LanguageConfig, topic: string, level: LearnerLevel = 'intermediate', audience: Audience = 'adult'): string {
  const who = audience === 'kids'
    ? `a child (ages 6–12) learning ${lang.name}`
    : `${levelDescriptor(level)}`;
  const tone = audience === 'kids'
    ? 'Use a fun, gentle tone. Keep sentences very short. Ask simple, fun questions about the story.'
    : levelTone(level);

  return `You are a native ${lang.name} speaker having a conversation with ${who} about this specific text: "${topic}".

Rules:
- Speak ONLY in ${lang.name}
- Your FIRST message must: briefly summarise what the text is about in 1–2 sentences, then ask ONE question about its content or ideas
- All questions must be directly about the text — its topic, arguments, characters, or ideas. Never ask generic questions like the learner's name, where they are from, or unrelated topics
- Keep your turns to 2–3 sentences so the learner speaks more than you
- Ask follow-up questions that go deeper into the text
- DO NOT correct the learner's mistakes mid-conversation — this is a fluency exercise
- React genuinely to what the learner says about the text
- ${tone}`;
}

export function endOfSessionReviewPrompt(lang: LanguageConfig, level: LearnerLevel = 'intermediate'): string {
  return `You are a ${lang.name} language teacher reviewing a conversation transcript from ${levelDescriptor(level)}.

Write your review IN ${lang.name.toUpperCase()}. Structure it exactly like this:

**Lo que hiciste bien** (one genuine strength — be specific, not generic)

**Errores gramaticales** (top 3–5 errors with the corrected form — show: ✗ what they said → ✓ the correct form)

**Vocabulario** (3–5 words or phrases the learner seemed to reach for but didn't quite have — suggest the natural ${lang.name} equivalent)

**Fluidez** (brief note on patterns: filler words, hesitations, sentence length, anything to work on)

Keep the entire review under 300 words. Be honest but kind — the goal is motivation, not discouragement.`;
}

export function simplifyArticlePrompt(lang: LanguageConfig, level: LearnerLevel): string {
  const levelInstructions: Record<LearnerLevel, string> = {
    'first-step': `Rewrite this article for a complete beginner (A0–A1) of ${lang.name}. Use only the most common 200 words. Maximum 6 words per sentence. Present tense only. Keep only the single main idea — cut everything else.`,
    'beginner':   `Rewrite this article for an early beginner (A2) of ${lang.name}. Use short sentences and common vocabulary only. Avoid subjunctive, complex tenses, and idioms. Keep the main ideas but cut complex details.`,
    'intermediate': `Lightly adapt this article for a B1–B2 learner of ${lang.name}. Simplify the hardest sentences and replace very advanced vocabulary with common alternatives. Keep most of the content.`,
    'advanced':   `Make minimal changes to this article for a C1 learner of ${lang.name}. Only replace very unusual vocabulary or highly technical jargon. Preserve the author's style.`,
  };

  return `You are adapting a ${lang.name} article for a language learner.

${levelInstructions[level]}

IMPORTANT RULES:
- Output ONLY the rewritten article text — no preamble, no explanation, no meta-commentary
- Preserve the article's title as the first line
- Keep the same language (${lang.name}) — do NOT translate
- Keep the same general structure
- Do not add information that wasn't in the original`;
}

export function generateStoryPrompt(lang: LanguageConfig, audience: Audience, level: LearnerLevel, interests: string[]): string {
  const topicHint = interests.length > 0 ? `The story should relate to one of these themes: ${interests.join(', ')}.` : '';

  if (audience === 'kids') {
    return `Write a very short, fun story in ${lang.name} for a child (ages 6–12) who is learning the language.

Rules:
- 150–200 words maximum
- Simple vocabulary — words a child already knows in their native language
- Short sentences (max 8 words each)
- A clear beginning, middle, and end
- A fun or heartwarming theme — animals, friendship, food, adventure, school, nature
- No violence, no adult themes, no scary content
- End with one simple question the child can think about (in ${lang.name})
${topicHint}

Output ONLY the story text — no title label, no preamble. Start with the title on the first line, then the story.`;
  }

  const levelRules: Record<LearnerLevel, string> = {
    'first-step': `- Maximum 150 words
- Only the 200 most common ${lang.name} words
- Maximum 6 words per sentence
- Present tense only
- Very concrete, everyday topic (ordering food, greeting someone, describing your home)
- No idioms, no complex grammar`,
    'beginner': `- 200–300 words
- Common vocabulary only (top 1000 words)
- Simple present and simple past tense
- Short paragraphs
- Everyday topic: travel, food, meeting someone, a typical day`,
    'intermediate': `- 300–400 words
- Everyday conversational vocabulary — no poetic or highly formal language
- Natural dialogue included
- Topic related to daily life, culture, or current events (light topics only)`,
    'advanced': `- 400–500 words
- Sophisticated vocabulary and varied sentence structure
- Can include professional, scientific, or literary themes
- Nuanced perspective or argument`,
  };

  return `Write a short story or article in ${lang.name} for an adult language learner.

The learner is ${levelDescriptor(level)}.

Rules:
${levelRules[level]}
${topicHint}

Output ONLY the text — no preamble, no meta-commentary. Start with the title on the first line, then the content.`;
}
