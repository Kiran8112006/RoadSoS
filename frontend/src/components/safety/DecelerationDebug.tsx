import {
  View,
  Text,
} from 'react-native';

interface Props {

  deceleration: number;
}

export default function
DecelerationDebug({

  deceleration,

}: Props) {

  return (

    <View
      style={{
        marginTop: 20,

        padding: 20,

        borderRadius: 16,

        backgroundColor:
          deceleration > 15
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
        Deceleration
      </Text>

      <Text
        style={{
          marginTop: 10,

          fontSize: 28,

          fontWeight: 'bold',
        }}
      >
        {
          deceleration.toFixed(2)
        }
      </Text>

      <Text>
        km/h/s
      </Text>

    </View>

  );

}