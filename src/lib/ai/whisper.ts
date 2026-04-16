import OpenAI from 'openai';
import { loadSettings } from '@/lib/store/keys';

export function getOpenAI(): OpenAI {
  const { openaiKey } = loadSettings();
  if (!openaiKey) throw new Error('Missing OpenAI API key');
  return new OpenAI({ apiKey: openaiKey, dangerouslyAllowBrowser: true });
}

export async function validateOpenAIKey(key: string): Promise<boolean> {
  try {
    const client = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
    await client.models.list();
    return true;
  } catch {
    return false;
  }
}

export async function transcribe(audio: Blob, languageCode: string): Promise<string> {
  const client = getOpenAI();
  const file = new File([audio], 'audio.webm', { type: audio.type || 'audio/webm' });
  const res = await client.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: languageCode,
  });
  return res.text;
}
