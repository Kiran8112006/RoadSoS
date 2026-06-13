import { router } from 'expo-router';
import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function Navbar() {
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 20,
        elevation: 10,
      }}
    >
      <TouchableOpacity onPress={() => router.push('/home')}>
        <Text style={{ fontWeight: 'bold' }}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/protection')}>
        <Text style={{ fontWeight: 'bold' }}>Safety</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/maps')}>
        <Text style={{ fontWeight: 'bold' }}>Maps</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/theft/index')}>
        <Text style={{ fontWeight: 'bold' }}>Theft</Text>
      </TouchableOpacity>
    </View>
  );
}
