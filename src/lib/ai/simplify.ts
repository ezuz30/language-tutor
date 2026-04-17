import { getClient } from '@/lib/ai/claude';
import { simplifyArticlePrompt } from '@/lib/ai/prompts';
import type { LanguageConfig } from '@/languages/types';
import type { LearnerLevel } from '@/lib/store/keys';

export async function simplifyArticle(
  text: string,
  lang: LanguageConfig,
  level: LearnerLevel,
): Promise<string> {
  const client = getClient();
  const res = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    system: simplifyArticlePrompt(lang, level),
    messages: [{ role: 'user', content: text.slice(0, 6000) }],
  });
  const block = res.content[0];
  return block.type === 'text' ? block.text : text;
}
