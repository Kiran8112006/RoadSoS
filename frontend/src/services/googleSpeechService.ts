import axios from 'axios';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_CLOUD_SPEECH_API_KEY;
const GOOGLE_SPEECH_API = `https://speech.googleapis.com/v1/speech:recognize?key=${API_KEY}`;

export const transcribeAudio = async (
  base64Audio: string,
  phraseHints: string[] = [],
) => {
  try {
    if (!API_KEY) {
      console.error('Google Speech API key is missing');
      return '';
    }

    console.log('Sending audio to Google Speech API...');

    const response = await axios.post(GOOGLE_SPEECH_API, {
      config: {
        encoding: 'AMR',
        sampleRateHertz: 8000,
        languageCode: 'en-US',
        enableAutomaticPunctuation: false,
        speechContexts: phraseHints.length
          ? [{ phrases: phraseHints, boost: 20 }]
          : undefined,
      },
      audio: {
        content: base64Audio,
      },
    });

    const results = response.data?.results;
    if (!results || results.length === 0) {
      console.log('No speech detected by Google API');
      return '';
    }

    const transcript = results
      .map((result: any) => result.alternatives?.[0]?.transcript || '')
      .join(' ')
      .toLowerCase()
      .trim();

    console.log('Final transcript:', transcript);
    return transcript;
  } catch (error: any) {
    console.error(
      'Google Speech API error:',
      JSON.stringify(error.response?.data || error.message),
    );
    return '';
  }
};
