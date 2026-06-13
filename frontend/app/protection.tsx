import {
  Text,
  View,
} from 'react-native';

import TheftDetection from './theft/Theftdetection';
import Navbar from '../src/components/ui/Navbar';

export default function Protection() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 24,
        paddingTop: 68,
        paddingBottom: 120,
      }}
    >
      <Text
        style={{
          color: '#0F172A',
          fontSize: 34,
          fontWeight: '800',
        }}
      >
        RoadSOS
      </Text>

      <Text
        style={{
          color: '#64748B',
          fontSize: 16,
          marginTop: 8,
        }}
      >
        Safety
      </Text>

      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <TheftDetection />
      </View>

      <Navbar />
    </View>
  );
}
