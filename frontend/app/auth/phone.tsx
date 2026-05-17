import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

import auth from '@react-native-firebase/auth';

import CountryPicker from 'react-native-country-picker-modal';

export default function PhoneScreen() {
  const [phoneNumber, setPhoneNumber] =
    useState('');

  const [otp, setOtp] =
    useState('');

  const [confirmation, setConfirmation] =
    useState<any>(null);

  const [countryCode, setCountryCode] =
    useState('BD');

  const [callingCode, setCallingCode] =
    useState('880');

  const [otpSent, setOtpSent] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const sendOTP = async () => {
    try {
      if (!phoneNumber) {
        Alert.alert(
          'Error',
          'Please enter phone number'
        );
        return;
      }

      setLoading(true);

      const fullPhoneNumber =
        `+${callingCode}${phoneNumber}`;

      const confirmationResult =
        await auth().signInWithPhoneNumber(
          fullPhoneNumber
        );

      setConfirmation(confirmationResult);

      setOtpSent(true);

      Alert.alert(
        'OTP Sent',
        `OTP sent to ${fullPhoneNumber}`
      );

    } catch (error) {
      console.log(error);

      Alert.alert(
        'Error',
        'Failed to send OTP'
      );

    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    try {
      if (!otp) {
        Alert.alert(
          'Error',
          'Please enter OTP'
        );
        return;
      }

      setLoading(true);

      await confirmation.confirm(otp);

      Alert.alert(
        'Success',
        'Phone Login Successful'
      );

    } catch (error) {
      console.log(error);

      Alert.alert(
        'Error',
        'Invalid OTP'
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#0B0F19',
      }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            fontSize: 38,
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: 12,
          }}
        >
          Phone Login
        </Text>

        <Text
          style={{
            color: '#A0AEC0',
            marginBottom: 40,
            fontSize: 16,
          }}
        >
          Verify your phone number using OTP
        </Text>

        {/* Phone Number */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              color: '#CBD5E0',
              marginBottom: 8,
              fontSize: 14,
            }}
          >
            Phone Number
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#1A202C',
              borderRadius: 16,
              paddingHorizontal: 14,
            }}
          >
            <CountryPicker
              countryCode={countryCode as any}
              withFlag
              withCallingCode
              withFilter
              withEmoji
              modalProps={{
                presentationStyle: 'formSheet',
              }}
              theme={{
                backgroundColor: '#0B0F19',
                onBackgroundTextColor: '#ffffff',
                filterPlaceholderTextColor:
                  '#A0AEC0',
              }}
              onSelect={(country) => {
                setCountryCode(country.cca2);

                if (country.callingCode[0]) {
                  setCallingCode(
                    country.callingCode[0]
                  );
                }
              }}
              countryCodes={[
                'BD', // Bangladesh
                'LK', // Sri Lanka
                'NP', // Nepal
                'BT', // Bhutan
                'MM', // Myanmar
                'TH', // Thailand
              ]}
            />

            <Text
              style={{
                color: '#ffffff',
                fontSize: 16,
                marginRight: 8,
              }}
            >
              +{callingCode}
            </Text>

            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter phone number"
              placeholderTextColor="#718096"
              keyboardType="phone-pad"
              style={{
                flex: 1,
                color: '#ffffff',
                paddingVertical: 18,
                fontSize: 16,
              }}
            />
          </View>
        </View>

        {/* Send OTP */}
        {!otpSent && (
          <TouchableOpacity
            onPress={sendOTP}
            disabled={loading}
            style={{
              backgroundColor: '#EF4444',
              paddingVertical: 18,
              borderRadius: 16,
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text
                style={{
                  color: '#ffffff',
                  fontSize: 16,
                  fontWeight: '700',
                }}
              >
                Send OTP
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* OTP Section */}
        {otpSent && (
          <>
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: '#CBD5E0',
                  marginBottom: 8,
                  fontSize: 14,
                }}
              >
                OTP
              </Text>

              <TextInput
                value={otp}
                onChangeText={setOtp}
                placeholder="Enter OTP"
                placeholderTextColor="#718096"
                keyboardType="number-pad"
                style={{
                  backgroundColor: '#1A202C',
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 18,
                  color: '#ffffff',
                  fontSize: 16,
                }}
              />
            </View>

            <TouchableOpacity
              onPress={verifyOTP}
              disabled={loading}
              style={{
                backgroundColor: '#22C55E',
                paddingVertical: 18,
                borderRadius: 16,
                alignItems: 'center',
              }}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text
                  style={{
                    color: '#ffffff',
                    fontSize: 16,
                    fontWeight: '700',
                  }}
                >
                  Verify OTP
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}