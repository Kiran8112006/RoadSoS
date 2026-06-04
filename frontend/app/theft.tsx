import {
  View,
  Text,
} from 'react-native';

import Navbar
from '../src/components/ui/Navbar';

export default function TheftScreen() {

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: 'bold',
        }}
      >
        Theft Protection
      </Text>

      <Navbar />
    </View>
  );

}
