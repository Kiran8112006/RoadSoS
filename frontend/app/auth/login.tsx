import {
  useEffect,
  useState,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { loginUser } from '@/src/services/firebase/firebase.auth';
import { router } from 'expo-router';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from '@/src/services/firebase/firebase.config';

import {
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';

import {
  getUserProfile,
} from '@/src/services/api/profile.api';;



export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async () => {
  if (loading) return;

  try {
    setLoading(true);

    const response = await loginUser(email, password);

    console.log("LOGIN SUCCESS:", response.user.email);

    const profileResponse = await getUserProfile();

    console.log("PROFILE RESPONSE:", profileResponse);

    if (profileResponse?.profileCompleted === true) {
      router.replace("/home");
    } else {
      router.replace("/auth/complete-profile");
    }
  } catch (error: any) {
    console.log("LOGIN ERROR:", error);

    if (error.response?.status === 404) {
      router.replace("/auth/complete-profile");
    } else {
      Alert.alert(
        "Login Failed",
        error.code === 'ECONNABORTED'
          ? 'Profile request timed out. Check that your backend is running and reachable from this device.'
          : error.message || "Something went wrong"
      );
    }
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  GoogleSignin.configure({
    webClientId:
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });
}, []);

const handleGoogleLogin = async () => {
  if (loading) return;

  try {
    setLoading(true);

    await GoogleSignin.hasPlayServices();

    const userInfo = await GoogleSignin.signIn();

    const idToken = userInfo.data?.idToken;

    if (!idToken) {
      throw new Error('No ID token found');
    }

    const googleCredential =
      GoogleAuthProvider.credential(idToken);

    const userCredential =
      await signInWithCredential(
        auth,
        googleCredential
      );

    console.log('USER:', userCredential.user);

    const response =
      await getUserProfile();
      console.log(response);
      console.log("PROFILE RESPONSE:", response);

    if (response?.profileCompleted) {

    router.replace('/home');

    } else {

        router.replace('/auth/complete-profile');

    }

  } catch (error: any) {

    console.log(error);

    if (
        error.response?.status === 404
      ) {

        router.replace(
          '/auth/complete-profile'
      );

    } else {
      Alert.alert(
        'Login Failed',
        error.code === 'ECONNABORTED'
          ? 'Profile request timed out. Check that your backend is running and reachable from this device.'
          : error.message || 'Something went wrong'
      );
    }

} finally {
  setLoading(false);
}
};




  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0F19' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            padding: 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / Branding */}
          <View style={{ marginBottom: 40 }}>
            <Text
              style={{
                fontSize: 36,
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: 10,
              }}
            >
              RoadSOS
            </Text>

            <Text
              style={{
                fontSize: 16,
                color: '#A0AEC0',
                lineHeight: 24,
              }}
            >
              Emergency response and road safety assistance platform.
            </Text>
          </View>

          {/* Email Input */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                color: '#CBD5E0',
                marginBottom: 8,
                fontSize: 14,
              }}
            >
              Email
            </Text>

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#718096"
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                backgroundColor: '#1A202C',
                color: '#ffffff',
                padding: 16,
                borderRadius: 14,
                fontSize: 16,
              }}
            />
          </View>

          {/* Password Input */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                color: '#CBD5E0',
                marginBottom: 8,
                fontSize: 14,
              }}
            >
              Password
            </Text>

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#718096"
              secureTextEntry
              style={{
                backgroundColor: '#1A202C',
                color: '#ffffff',
                padding: 16,
                borderRadius: 14,
                fontSize: 16,
              }}
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleEmailLogin}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#7F1D1D' : '#E53E3E',
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: 'center',
              marginBottom: 18,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text
                style={{
                  color: '#ffffff',
                  fontSize: 16,
                  fontWeight: '600',
                }}
              >
                Login
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginVertical: 20,
            }}
          >
            <View
              style={{
                flex: 1,
                height: 1,
                backgroundColor: '#2D3748',
              }}
            />

            <Text
              style={{
                color: '#718096',
                marginHorizontal: 12,
              }}
            >
              OR
            </Text>

            <View
              style={{
                flex: 1,
                height: 1,
                backgroundColor: '#2D3748',
              }}
            />
          </View>

          {/* Google Login */}
          <TouchableOpacity
            onPress={handleGoogleLogin}
            disabled={loading}
            style={{
              backgroundColor: '#ffffff',
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                color: '#000000',
                fontSize: 16,
                fontWeight: '600',
              }}
            >
              Continue with Google
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => router.push('/auth/phone')}
            style={{
              backgroundColor: '#1A202C',
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#2D3748',
            }}
          >
            <Text
              style={{
                color: '#ffffff',
                fontSize: 16,
                fontWeight: '600',
              }}
            >
              Continue with Phone
            </Text>
          </TouchableOpacity>
          
          {/* Register */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginTop: 30,
            }}
          >
            <Text style={{ color: '#A0AEC0' }}>
              Don&apos;t have an account?
            </Text>

            <TouchableOpacity
                 onPress={() => router.push('/auth/register')}
                style={{ flexDirection: 'row', alignItems: 'center' }}  >
              <Text
                style={{
                  color: '#E53E3E',
                  marginLeft: 6,
                  fontWeight: '600',
                }}
              >
                Register
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
