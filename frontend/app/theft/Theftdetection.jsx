import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  startBackgroundService,
  stopBackgroundService,
} from '../../src/services/backgroundService';
import {
  callNearestPoliceStation,
  callPoliceStation,
  sendEmergencyWhatsAppMessage,
} from '../../src/services/emergencyService';
import {
  getSavedUserSecretPhrase,
  saveUserSecretPhrase,
} from '../../src/services/secretPhraseService';
import {
  resetSecretPhraseConfirmation,
  startVoiceDetection,
  stopVoiceDetection,
} from '../../src/services/voiceService';

export default function TheftDetection() {
  const [isRunning, setIsRunning] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showSecretPhraseModal, setShowSecretPhraseModal] = useState(false);
  const [secretPhrase, setSecretPhrase] = useState('');
  const [savingSecretPhrase, setSavingSecretPhrase] = useState(false);
  const [sendingEmergencyAlert, setSendingEmergencyAlert] = useState(false);
  const [callingPoliceStation, setCallingPoliceStation] = useState(false);
  const [showPoliceCallPrompt, setShowPoliceCallPrompt] = useState(false);
  const [pendingPoliceStation, setPendingPoliceStation] = useState(null);
  const shouldShowPolicePromptOnReturn = useRef(false);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      nextAppState => {
        if (
          nextAppState === 'active' &&
          shouldShowPolicePromptOnReturn.current
        ) {
          shouldShowPolicePromptOnReturn.current = false;
          setShowPoliceCallPrompt(true);
          setShowEmergencyModal(true);
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const handleStartProtection = async () => {
    const savedPhrase = await getSavedUserSecretPhrase();
    if (!savedPhrase) {
      setSecretPhrase('');
      setShowSecretPhraseModal(true);
      return;
    }

    await startBackgroundService();
    const voiceDetectionStarted =
      await startVoiceDetection(setShowEmergencyModal);
    if (!voiceDetectionStarted) {
      await stopBackgroundService();
    }
    setIsRunning(voiceDetectionStarted);
  };

  const saveSecretPhraseAndStartProtection = async () => {
    const trimmedPhrase = secretPhrase.trim();
    if (!trimmedPhrase) {
      Alert.alert(
        'Secret phrase required',
        'Please enter the phrase you want to use for threat detection.',
      );
      return;
    }

    try {
      setSavingSecretPhrase(true);
      await saveUserSecretPhrase(trimmedPhrase);
      setShowSecretPhraseModal(false);
      await startBackgroundService();
      const voiceDetectionStarted =
        await startVoiceDetection(setShowEmergencyModal);
      if (!voiceDetectionStarted) {
        await stopBackgroundService();
      }
      setIsRunning(voiceDetectionStarted);
    } catch (error) {
      Alert.alert(
        'Could not save phrase',
        error?.message || 'Please try again.',
      );
    } finally {
      setSavingSecretPhrase(false);
    }
  };

  const handleStopProtection = async () => {
    await stopBackgroundService();
    await stopVoiceDetection();
    setIsRunning(false);
  };

  const sendWhatsAppAlert = async () => {
    try {
      setSendingEmergencyAlert(true);
      const policeStation = await sendEmergencyWhatsAppMessage();
      setPendingPoliceStation(policeStation);
      shouldShowPolicePromptOnReturn.current = true;
      setShowPoliceCallPrompt(true);
      setShowEmergencyModal(true);
    } catch (error) {
      Alert.alert(
        'Emergency message failed',
        error?.message || 'Could not open WhatsApp',
      );
      resetSecretPhraseConfirmation();
    } finally {
      setSendingEmergencyAlert(false);
    }
  };

  const callPoliceStationAlert = async policeStation => {
    try {
      setCallingPoliceStation(true);
      setShowEmergencyModal(false);
      if (policeStation) {
        await callPoliceStation(policeStation);
      } else {
        await callNearestPoliceStation();
      }
    } catch (error) {
      Alert.alert(
        'Police contact failed',
        error?.message || 'Could not open the nearest police station number',
      );
    } finally {
      setCallingPoliceStation(false);
      setShowPoliceCallPrompt(false);
      setPendingPoliceStation(null);
      shouldShowPolicePromptOnReturn.current = false;
      resetSecretPhraseConfirmation();
    }
  };

  const handleEmergencyResponse = isEmergency => {
    if (isEmergency) {
      console.log('Emergency confirmed - calling nearest police station');
      void callPoliceStationAlert(pendingPoliceStation);
      return;
    }

    setShowEmergencyModal(false);
    setShowPoliceCallPrompt(false);
    setPendingPoliceStation(null);
    shouldShowPolicePromptOnReturn.current = false;
    console.log('False alarm - user is safe');
    resetSecretPhraseConfirmation();
  };

  return (
    <>
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={isRunning ? handleStopProtection : handleStartProtection}
          style={{
            width: 220,
            height: 220,
            borderRadius: 110,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isRunning ? '#16A34A' : '#DC2626',
            elevation: 12,
            shadowColor: isRunning ? '#16A34A' : '#DC2626',
            shadowOpacity: 0.32,
            shadowRadius: 24,
            shadowOffset: {
              width: 0,
              height: 12,
            },
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 22,
              fontWeight: '800',
              textAlign: 'center',
            }}
          >
            {isRunning ? 'Stop' : 'Start'}
          </Text>
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: '700',
              marginTop: 4,
              textAlign: 'center',
            }}
          >
            Protection
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            color: '#475569',
            fontSize: 15,
            marginTop: 24,
            textAlign: 'center',
          }}
        >
          {isRunning
            ? 'Voice threat detection is active.'
            : 'Tap to activate your safety monitor.'}
        </Text>
      </View>

      <Modal
        visible={showEmergencyModal}
        transparent
        animationType="fade"
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.8)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: '#1F2937',
              padding: 30,
              borderRadius: 20,
              width: '80%',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: '#FCA5A5',
                fontSize: 36,
                fontWeight: '800',
                marginBottom: 18,
              }}
            >
              SOS
            </Text>
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 24,
                fontWeight: '800',
                marginBottom: 10,
              }}
            >
              Emergency Detected
            </Text>
            <Text
              style={{
                color: '#9CA3AF',
                fontSize: 16,
                marginBottom: 30,
                textAlign: 'center',
              }}
            >
              {showPoliceCallPrompt
                ? 'Call the nearest police station now?'
                : 'Are you in trouble?'}
            </Text>

            <View
              style={{
                flexDirection: 'row',
                gap: 15,
                marginBottom: 16,
              }}
            >
              <TouchableOpacity
                disabled={sendingEmergencyAlert || callingPoliceStation}
                onPress={() => handleEmergencyResponse(false)}
                style={{
                  backgroundColor: '#6B7280',
                  paddingHorizontal: 40,
                  paddingVertical: 15,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 18,
                    fontWeight: '800',
                  }}
                >
                  No
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={sendingEmergencyAlert || callingPoliceStation}
                onPress={() => handleEmergencyResponse(true)}
                style={{
                  backgroundColor: '#EF4444',
                  paddingHorizontal: 40,
                  paddingVertical: 15,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 18,
                    fontWeight: '800',
                  }}
                >
                  {callingPoliceStation ? 'Calling...' : 'Yes'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={sendWhatsAppAlert}
              disabled={sendingEmergencyAlert || callingPoliceStation}
              style={{
                backgroundColor: '#22C55E',
                paddingVertical: 14,
                borderRadius: 12,
                width: '100%',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: '800',
                }}
              >
                {sendingEmergencyAlert
                  ? 'Sending WhatsApp Alert...'
                  : 'Send WhatsApp Alert'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSecretPhraseModal}
        transparent
        animationType="fade"
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.75)',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: '#111827',
              borderRadius: 16,
              padding: 22,
            }}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 22,
                fontWeight: '800',
                marginBottom: 10,
              }}
            >
              Set Secret Phrase
            </Text>

            <Text
              style={{
                color: '#A0AEC0',
                lineHeight: 22,
                marginBottom: 18,
              }}
            >
              Say this phrase during a threat to trigger emergency detection.
            </Text>

            <TextInput
              value={secretPhrase}
              onChangeText={setSecretPhrase}
              placeholder="Example: blue mango"
              placeholderTextColor="#718096"
              autoCapitalize="none"
              style={{
                backgroundColor: '#1A202C',
                color: '#FFFFFF',
                padding: 16,
                borderRadius: 14,
                fontSize: 16,
                marginBottom: 18,
              }}
            />

            <TouchableOpacity
              onPress={saveSecretPhraseAndStartProtection}
              disabled={savingSecretPhrase}
              style={{
                backgroundColor: '#E53E3E',
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: '800',
                }}
              >
                {savingSecretPhrase ? 'Saving...' : 'Save and Start'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
