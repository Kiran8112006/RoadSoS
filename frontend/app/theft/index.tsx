import {
  Text,
  View,
} from 'react-native';

import Navbar from '../../src/components/ui/Navbar';

export default function Theft() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        paddingBottom: 120,
      }}
    >
      <Text style={{ color: '#475569', fontSize: 18 }}>Theft</Text>
      <Navbar />
    </View>
  );
}
