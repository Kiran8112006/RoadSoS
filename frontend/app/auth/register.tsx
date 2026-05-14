import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

import { registerUser } from '@/src/services/firebase/firebase.auth';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      const response = await registerUser(
        email,
        password
      );

      console.log('REGISTER SUCCESS');
      console.log(response.user);

    } catch (error: any) {
      console.log(error.message);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#0B0F19',
        padding: 24,
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: '#fff',
          fontSize: 34,
          fontWeight: 'bold',
          marginBottom: 30,
        }}
      >
        Register
      </Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#777"
        value={email}
        onChangeText={setEmail}
        style={{
          backgroundColor: '#1A202C',
          color: '#fff',
          padding: 16,
          borderRadius: 14,
          marginBottom: 16,
        }}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#777"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{
          backgroundColor: '#1A202C',
          color: '#fff',
          padding: 16,
          borderRadius: 14,
          marginBottom: 20,
        }}
      />

      <TouchableOpacity
        onPress={handleRegister}
        style={{
          backgroundColor: '#E53E3E',
          padding: 16,
          borderRadius: 14,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 16,
          }}
        >
          Create Account
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}