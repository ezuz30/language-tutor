import { loadSettings, hasOpenAIKey } from '@/lib/store/keys';

// Transcribe audio using Whisper if OpenAI key is present, otherwise Web Speech API.
export async function transcribeAudio(audio: Blob, languageCode: string): Promise<string> {
  if (hasOpenAIKey()) {
    const { transcribe } = await import('./whisper');
    return transcribe(audio, languageCode);
  }
  throw new Error('USE_WEB_SPEECH');
}

// Web Speech API live transcription — returns a promise that resolves when the
// user stops speaking. Call this instead of transcribeAudio for real-time mic input.
export function transcribeWithWebSpeech(languageLocale: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition; webkitSpeechRecognition?: typeof window.SpeechRecognition })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition })
        .webkitSpeechRecognition;

    if (!SpeechRecognition) {
      reject(new Error('Speech recognition is not supported in this browser. Use Chrome or Safari.'));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = languageLocale;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    let finalTranscript = '';

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
    };

    recognition.onend = () => resolve(finalTranscript.trim());
    recognition.onerror = (e) => reject(new Error(`Speech recognition error: ${e.error}`));

    recognition.start();
  });
}

export function preferredSpeechMethod(): 'whisper' | 'webspeech' {
  return hasOpenAIKey() ? 'whisper' : 'webspeech';
}

// Speak text aloud using ElevenLabs if key present, otherwise browser TTS.
export function speak(text: string, languageLocale: string, elevenLabsVoiceId: string): void {
  const { elevenlabsKey } = loadSettings();
  if (elevenlabsKey) {
    speakElevenLabs(text, elevenLabsVoiceId, elevenlabsKey);
  } else {
    speakBrowser(text, languageLocale);
  }
}

function speakBrowser(text: string, lang: string): void {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

async function speakElevenLabs(text: string, voiceId: string, apiKey: string): Promise<void> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.onended = () => URL.revokeObjectURL(url);
  audio.play();
}
