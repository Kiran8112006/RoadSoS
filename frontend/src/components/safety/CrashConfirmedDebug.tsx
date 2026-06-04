import {
  View,
  Text,
} from 'react-native';

interface Props {

  confirmed: boolean;
}

export default function
CrashConfirmedDebug({

  confirmed,

}: Props) {

  return (

    <View
      style={{
        marginTop: 20,

        padding: 20,

        borderRadius: 16,

        backgroundColor:
          confirmed
            ? '#ff4444'
            : '#dff7df',
      }}
    >

      <Text
        style={{
          fontSize: 22,

          fontWeight: 'bold',

          color:
            confirmed
              ? 'white'
              : 'black',
        }}
      >
        Crash Confirmation
      </Text>

      <Text
        style={{
          marginTop: 12,

          fontSize: 28,

          fontWeight: 'bold',

          color:
            confirmed
              ? 'white'
              : 'black',
        }}
      >

        {
          confirmed
            ? 'CRASH DETECTED'
            : 'SAFE'
        }

      </Text>

    </View>

  );

}