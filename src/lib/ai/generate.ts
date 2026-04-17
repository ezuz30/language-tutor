import { getClient } from '@/lib/ai/claude';
import { generateStoryPrompt } from '@/lib/ai/prompts';
import type { LanguageConfig } from '@/languages/types';
import type { LearnerLevel, Audience } from '@/lib/store/keys';
import type { Article } from '@/lib/content/article';

export async function generateStory(
  lang: LanguageConfig,
  audience: Audience,
  level: LearnerLevel,
  interests: string[],
): Promise<Article> {
  const client = getClient();
  const res = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    system: generateStoryPrompt(lang, audience, level, interests),
    messages: [{ role: 'user', content: 'Generate the story now.' }],
  });

  const block = res.content[0];
  const raw = block.type === 'text' ? block.text.trim() : '';

  // First line is the title, rest is body
  const lines = raw.split('\n');
  const title = lines[0].replace(/^#+\s*/, '').trim();
  const body = lines.slice(1).join('\n').trim();

  return {
    title,
    byline: '',
    content: `<p>${body.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>')}</p>`,
    textContent: raw,
    siteName: audience === 'kids' ? 'Generated story' : `Generated for ${level} level`,
    url: '',
  };
}
