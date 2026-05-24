import {
  View,
  Text,
} from 'react-native';

interface Props {

  risk: number;
}

export default function RiskDebug({
  risk,
}: Props) {

  return (

    <View
      style={{
        marginTop: 20,

        padding: 20,

        borderRadius: 16,

        backgroundColor:
          risk > 70
            ? '#ffcccc'
            : risk > 40
            ? '#fff1cc'
            : '#dff7df',
      }}
    >

      <Text
        style={{
          fontSize: 18,

          fontWeight: 'bold',
        }}
      >
        Crash Risk
      </Text>

      <Text
        style={{
          marginTop: 10,

          fontSize: 32,

          fontWeight: 'bold',
        }}
      >
        {risk}%
      </Text>

    </View>

  );
}