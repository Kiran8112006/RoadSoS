import {
  View,
  Text,
} from 'react-native';

interface Props {

  accel: any;

  gyro: any;
}

export default function SensorDebug({
  accel,
  gyro,
}: Props) {

  return (

    <View
      style={{
        marginTop: 30,

        padding: 20,

        backgroundColor: '#f2f2f7',

        borderRadius: 16,
      }}
    >

      <Text
        style={{
          fontSize: 18,
          fontWeight: 'bold',
        }}
      >
        Sensor Debug
      </Text>

      <Text
        style={{
          marginTop: 16,
        }}
      >
        Accelerometer
      </Text>

      <Text>
        X:
        {accel?.x?.toFixed(2)}
      </Text>

      <Text>
        Y:
        {accel?.y?.toFixed(2)}
      </Text>

      <Text>
        Z:
        {accel?.z?.toFixed(2)}
      </Text>

      <Text
        style={{
          marginTop: 20,
        }}
      >
        Gyroscope
      </Text>

      <Text>
        X:
        {gyro?.x?.toFixed(2)}
      </Text>

      <Text>
        Y:
        {gyro?.y?.toFixed(2)}
      </Text>

      <Text>
        Z:
        {gyro?.z?.toFixed(2)}
      </Text>

    </View>

  );
}