import Anthropic from '@anthropic-ai/sdk';
import { loadSettings } from '@/lib/store/keys';

// Single entry point for Claude calls. In v2, swap the internals to POST to a
// backend endpoint instead of calling the provider directly from the browser.
export function getClient(): Anthropic {
  const { anthropicKey } = loadSettings();
  if (!anthropicKey) throw new Error('Missing Anthropic API key');
  return new Anthropic({ apiKey: anthropicKey, dangerouslyAllowBrowser: true });
}

export async function validateAnthropicKey(key: string): Promise<boolean> {
  try {
    const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
    await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8,
      messages: [{ role: 'user', content: 'ping' }],
    });
    return true;
  } catch {
    return false;
  }
}
