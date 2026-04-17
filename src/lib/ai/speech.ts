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
type AnySpeechRecognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => AnySpeechRecognition;

export function transcribeWithWebSpeech(languageLocale: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const w = window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;

    if (!SR) {
      reject(new Error('Speech recognition is not supported in this browser. Use Chrome or Safari.'));
      return;
    }

    const recognition = new SR();
    recognition.lang = languageLocale;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    let finalTranscript = '';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
    };

    recognition.onend = () => resolve(finalTranscript.trim());
    recognition.onerror = (e: SpeechRecognitionErrorEvent) => reject(new Error(`Speech recognition error: ${e.error}`));

    recognition.start();
  });
}

export function preferredSpeechMethod(): 'whisper' | 'webspeech' {
  return hasOpenAIKey() ? 'whisper' : 'webspeech';
}

// Speak text aloud using ElevenLabs if key present, otherwise browser TTS.
// Returns a promise that resolves when audio finishes — await it before enabling the mic.
export async function speak(text: string, languageLocale: string, elevenLabsVoiceId: string): Promise<void> {
  const clean = cleanForSpeech(text);
  const { elevenlabsKey } = loadSettings();
  if (elevenlabsKey && elevenLabsVoiceId) {
    try {
      await speakElevenLabs(clean, elevenLabsVoiceId, elevenlabsKey);
      return;
    } catch (err) {
      console.warn('ElevenLabs TTS failed, falling back to browser:', err);
    }
  }
  await speakBrowser(clean, languageLocale);
}

export function stopSpeaking(): void {
  window.speechSynthesis.cancel();
}

function cleanForSpeech(text: string): string {
  return text.replace(/[¿¡]/g, '').replace(/([.!?])\s*/g, '$1 ').trim();
}

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const prefix = lang.split('-')[0];
  return (
    voices.find((v) => v.lang === lang && v.localService) ||
    voices.find((v) => v.lang === lang) ||
    voices.find((v) => v.lang.startsWith(prefix) && v.localService) ||
    voices.find((v) => v.lang.startsWith(prefix)) ||
    null
  );
}

function speakBrowser(text: string, lang: string): Promise<void> {
  return new Promise((resolve) => {
    window.speechSynthesis.cancel();

    function doSpeak() {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      const voice = pickVoice(lang);
      if (voice) utterance.voice = voice;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    }

    // Voices may not be loaded yet on first call
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      doSpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => { doSpeak(); };
    }
  });
}

async function speakElevenLabs(text: string, voiceId: string, apiKey: string): Promise<void> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
  });
  if (!res.ok) throw new Error('ElevenLabs error');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  return new Promise((resolve) => {
    const audio = new Audio(url);
    const done = () => { URL.revokeObjectURL(url); resolve(); };
    audio.onended = done;
    audio.onerror = done; // always resolve so isSpeaking never gets stuck
    audio.play().catch(done); // Safari autoplay rejection also resolves
  });
}

// Controllable speech recognition session — call stop() to finalise transcript.
export interface RecognitionSession {
  stop: () => void;
}

export function startRecognition(
  locale: string,
  onResult: (transcript: string) => void,
  onError: (err: Error) => void,
  onInterim?: (interim: string) => void,
): RecognitionSession {
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
  const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;

  if (!SR) {
    onError(new Error('Speech recognition not supported. Please use Chrome or Safari.'));
    return { stop: () => {} };
  }

  let accumulated = '';
  let stopped = false;
  let instance: AnySpeechRecognition | null = null;

  function createAndStart() {
    const recognition = new SR!();
    recognition.lang = locale;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;
    instance = recognition;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          accumulated += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (onInterim) onInterim((accumulated + interim).trim());
    };

    recognition.onend = () => {
      if (onInterim) onInterim('');
      if (stopped) {
        onResult(accumulated.trim());
      } else {
        try { createAndStart(); } catch { onResult(accumulated.trim()); }
      }
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'aborted' || e.error === 'no-speech') return;
      onError(new Error(e.error));
    };

    recognition.start();
  }

  createAndStart();

  return {
    stop: () => {
      stopped = true;
      try { instance?.stop(); } catch { onResult(accumulated.trim()); }
    },
  };
}
