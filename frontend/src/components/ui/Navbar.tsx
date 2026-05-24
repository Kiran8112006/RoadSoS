import {
  View,
  TouchableOpacity,
  Text,
} from 'react-native';

import {
  router,
} from 'expo-router';

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

      <TouchableOpacity
        onPress={() =>
          router.push('/protection')
        }
      >
        <Text
          style={{
            fontWeight: 'bold',
          }}
        >
          Safety
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          router.push('/maps')
        }
      >
        <Text
          style={{
            fontWeight: 'bold',
          }}
        >
          Maps
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          router.push('/theft')
        }
      >
        <Text
          style={{
            fontWeight: 'bold',
          }}
        >
          Theft
        </Text>
      </TouchableOpacity>

    </View>

  );

}