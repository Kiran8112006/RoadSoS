import { Audio } from 'expo-av';
import { File } from 'expo-file-system';
import { transcribeAudio } from './googleSpeechService';
import {
  getDefaultSecretPhrase,
  getSavedUserSecretPhrase,
} from './secretPhraseService';

let secretPhrase = getDefaultSecretPhrase();
const RECORDING_WINDOW_MS = 3000;
const ERROR_RETRY_MS = 1000;
const MAX_AUDIO_QUEUE_SIZE = 20;

type AudioQueueItem = {
  uri: string;
  createdAt: number;
};

let recording: Audio.Recording | null = null;
let isListening = false;
let isProcessingQueue = false;
let isConfirmationPending = false;
let lastTranscript = '';
let audioQueue: AudioQueueItem[] = [];
let showEmergencyCallback: ((show: boolean) => void) | null = null;

const sleep = (time: number) =>
  new Promise(resolve => setTimeout(resolve, time));

const safelyStopAndUnloadRecording = async (
  activeRecording: Audio.Recording,
) => {
  try {
    await activeRecording.stopAndUnloadAsync();
  } catch (error: any) {
    if (
      typeof error?.message === 'string' &&
      error.message.includes('already been unloaded')
    ) {
      return;
    }

    throw error;
  }
};

const normalizeSpeech = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const containsSecretPhrase = (transcript: string) =>
  normalizeSpeech(transcript).includes(normalizeSpeech(secretPhrase));

const playDetectionBeep = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync({
      uri: 'data:audio/wav;base64,UklGRl9vAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTtvAACAgICAgICAgICAgICAl56kvMnO3/LcsaOPmJqgnJWRj4yJk5qivdjv9P///+DQxb2yt7/C0eLx+v///+Da0sW7tLO8ytbi8Pr////g1szBubK5x9Tl8/3///7l2M7Cu7S4wdLk8P3///7l2c7Cu7S4wdLk8P3///7g1czCubO5x9Xl8/3///7a0sW8tLO8ytbi8Pr////Qxb2yt7/C0eLx+v///+/v9PjgoZiRjoqTnKLG3/H///+xw6+il5OUm6ax0+7///+koJSQk5qpxd7////z46uUkI+SlqS81OT///+7rpqQj5OYpLDR6f///+XYu6KUkpWdrMre//////bOtaGUj5GZo73T8f///9rBoZiRkpaes8zh/////+fQuKGUkpWdp8jj///////m0rOhk5KZoLDT7//////yyrGXkJOVnbTR6v///+/eubKTkZWatdPm///////49Mq1pJKVn8vc/v///+3iybOgkJabqtXn//////Dgx7qhkpWesp3M8P///+/46M+4opSXnKjY7f///+fcw6yZk5iasN7w/////+/x3sm0n5SXnq3g8v/////t5dO+pZacp7DS5//////29dK9pZqnp7DS5//////t5dC8pZqnp7DS5//////x38m0oJWenq3g8v///+vcxKyak5qbsN7w/////+rYv6iWlJ2o2O3///+8w6SUkp2ynczw/////6i6nZKVmqPc/v///4qckY6Ul5+/1Of///+AgICAgICAgICAgIA=',
    });

    await sound.playAsync();
    setTimeout(() => {
      void sound.unloadAsync();
    }, 1000);
  } catch (error) {
    console.error('Failed to play detection beep:', error);
  }
};

const requestEmergencyConfirmation = () => {
  if (isConfirmationPending) {
    return;
  }

  isConfirmationPending = true;
  void playDetectionBeep();
  showEmergencyCallback?.(true);
};

const enqueueAudioForTranscription = (uri: string) => {
  audioQueue.push({ uri, createdAt: Date.now() });

  if (audioQueue.length > MAX_AUDIO_QUEUE_SIZE) {
    audioQueue = audioQueue.slice(-MAX_AUDIO_QUEUE_SIZE);
    console.warn('Audio transcription queue is full; kept the newest samples');
  }

  void processAudioQueue();
};

const processAudioQueue = async () => {
  if (isProcessingQueue) {
    return;
  }

  isProcessingQueue = true;

  try {
    while (isListening && audioQueue.length > 0) {
      const item = audioQueue.shift();
      if (!item) {
        continue;
      }

      const file = new File(item.uri);
      const base64Audio = await file.base64();
      const transcript = await transcribeAudio(base64Audio, [secretPhrase]);
      const bridgedTranscript = `${lastTranscript} ${transcript}`.trim();

      if (containsSecretPhrase(bridgedTranscript)) {
        console.log(`Emergency phrase "${secretPhrase}" detected`);
        requestEmergencyConfirmation();
      } else if (transcript) {
        console.log(`No emergency phrase detected in: "${transcript}"`);
      } else {
        console.log('No speech detected');
      }

      lastTranscript = transcript;
    }
  } catch (error) {
    console.error('Transcription queue error:', error);
  } finally {
    isProcessingQueue = false;

    if (isListening && audioQueue.length > 0) {
      void processAudioQueue();
    }
  }
};

export const startVoiceDetection = async (setShowModal: (show: boolean) => void) => {
  showEmergencyCallback = setShowModal;
  if (isListening) {
    console.log('Voice detection already running');
    return true;
  }

  try {
    const savedSecretPhrase = await getSavedUserSecretPhrase();
    if (!savedSecretPhrase) {
      console.error('Voice detection requires a saved user secret phrase');
      return false;
    }

    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      console.error('Microphone permission denied');
      return false;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    secretPhrase = savedSecretPhrase;
    isListening = true;
    lastTranscript = '';
    audioQueue = [];
    console.log(`Voice detection started - say "${secretPhrase}" clearly`);

    void listenContinuously();
    return true;
  } catch (error) {
    console.error('Failed to start voice detection:', error);
    isListening = false;
    return false;
  }
};

const listenContinuously = async () => {
  while (isListening) {
    let currentRecording: Audio.Recording | null = null;

    try {
      currentRecording = new Audio.Recording();
      await currentRecording.prepareToRecordAsync({
        android: {
          extension: '.3gp',
          outputFormat: Audio.AndroidOutputFormat.THREE_GPP,
          audioEncoder: Audio.AndroidAudioEncoder.AMR_NB,
          sampleRate: 8000,
          numberOfChannels: 1,
          bitRate: 12200,
        },
        ios: {
          extension: '.caf',
          audioQuality: Audio.IOSAudioQuality.MIN,
          sampleRate: 8000,
          numberOfChannels: 1,
          bitRate: 12200,
        },
        web: {},
      });

      console.log('Recording short voice sample...');
      await currentRecording.startAsync();
      recording = currentRecording;

      await sleep(RECORDING_WINDOW_MS);

      const uri = currentRecording.getURI();
      await safelyStopAndUnloadRecording(currentRecording);
      recording = null;
      console.log('Recording stopped');

      if (uri) {
        enqueueAudioForTranscription(uri);
      }
    } catch (error) {
      if (isListening) {
        console.error('Recording error:', error);
      }

      if (currentRecording) {
        try {
          await safelyStopAndUnloadRecording(currentRecording);
        } catch (cleanupError) {
          if (isListening) {
            console.error('Recording cleanup error:', cleanupError);
          }
        }
      }

      recording = null;
      await sleep(ERROR_RETRY_MS);
    }
  }
};

export const stopVoiceDetection = async () => {
  isListening = false;

  if (recording) {
    try {
      await safelyStopAndUnloadRecording(recording);
    } catch (error) {
      console.error('Failed to stop active recording:', error);
    }
    recording = null;
  }

  audioQueue = [];
  isConfirmationPending = false;
  lastTranscript = '';
  console.log('Voice detection stopped');
};

export const resetSecretPhraseConfirmation = () => {
  isConfirmationPending = false;
  audioQueue = [];
  lastTranscript = '';
};
