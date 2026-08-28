/**
 * ElevenLabs High-Fidelity Voice Synthesis Service for PromptWars AI Personas
 */

export const ELEVENLABS_API_KEY = 'sk_cc492edf726f0fd0fdca0858d46db73d0f108f3a7f7c070c';

export interface PersonaVoiceConfig {
  voiceId: string;
  name: string;
  gender: 'female' | 'male';
  style: string;
  stability: number;
  similarity_boost: number;
}

// 4 Persona Voices: 2 Female and 2 Male
export const PERSONA_VOICES: Record<string, PersonaVoiceConfig> = {
  'Technical Evaluator': {
    voiceId: 'JBFqnCBsd6RMkjVDRZzb', // George (Male)
    name: 'George',
    gender: 'male',
    style: 'Deep Analytical & Resonant',
    stability: 0.55,
    similarity_boost: 0.80,
  },
  'HR & Culture Analyst': {
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah (Female 1)
    name: 'Sarah',
    gender: 'female',
    style: 'Warm, Reassuring & Empathetic',
    stability: 0.50,
    similarity_boost: 0.75,
  },
  'Hiring Manager': {
    voiceId: 'N2lVS1w4EtoT3dr4eOWO', // Callum (Male)
    name: 'Callum',
    gender: 'male',
    style: 'Assertive, Executive & Crisp',
    stability: 0.50,
    similarity_boost: 0.75,
  },
  'Skeptic Analyst': {
    voiceId: 'Xb7hH8MSUJpSbSDYk0k2', // Alice (Female 2)
    name: 'Alice',
    gender: 'female',
    style: 'Sharp, Incisive & Probing',
    stability: 0.60,
    similarity_boost: 0.85,
  },
};

// In-memory audio cache to prevent redundant API calls
const audioCache = new Map<string, string>();

/**
 * Synthesizes speech using ElevenLabs API and returns a playable Blob URL.
 */
export async function synthesizeElevenLabsSpeech(
  text: string,
  agentName: string
): Promise<string> {
  const persona = PERSONA_VOICES[agentName] || PERSONA_VOICES['Technical Evaluator'];
  const cacheKey = `${persona.voiceId}_${text.slice(0, 100)}`;

  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey)!;
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${persona.voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: persona.stability,
          similarity_boost: persona.similarity_boost,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs TTS failed (${response.status}): ${errorText}`);
  }

  const blob = await response.blob();
  const audioUrl = URL.createObjectURL(blob);
  audioCache.set(cacheKey, audioUrl);
  return audioUrl;
}
