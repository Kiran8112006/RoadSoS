import {
  View,
  Text,
} from 'react-native';

interface Props {

  inactive: boolean;
}

export default function
InactivityDebug({

  inactive,

}: Props) {

  return (

    <View
      style={{
        marginTop: 20,

        padding: 20,

        borderRadius: 16,

        backgroundColor:
          inactive
            ? '#ffcccc'
            : '#dff7df',
      }}
    >

      <Text
        style={{
          fontSize: 20,

          fontWeight: 'bold',
        }}
      >
        Inactivity
      </Text>

      <Text
        style={{
          marginTop: 10,

          fontSize: 24,

          fontWeight: 'bold',
        }}
      >

        {
          inactive
            ? 'STILL'
            : 'MOVING'
        }

      </Text>

    </View>

  );

}