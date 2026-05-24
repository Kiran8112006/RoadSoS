import {
  View,
  Text,
} from 'react-native';

interface Props {

  location: any;
}

export default function GpsDebug({
  location,
}: Props) {

  return (

    <View
      style={{
        marginTop: 20,

        padding: 20,

        backgroundColor: '#e9f7ef',

        borderRadius: 16,
      }}
    >

      <Text
        style={{
          fontSize: 18,
          fontWeight: 'bold',
        }}
      >
        GPS Debug
      </Text>

      <Text
        style={{
          marginTop: 12,
        }}
      >
        Latitude:
        {
          location?.coords
            ?.latitude
        }
      </Text>

      <Text>
        Longitude:
        {
          location?.coords
            ?.longitude
        }
      </Text>

      <Text>
        Speed:
        {
          (
            (
              location?.coords
                ?.speed || 0
            ) * 3.6
          ).toFixed(2)
        }
        km/h
      </Text>

      <Text>
        Accuracy:
        {
          location?.coords
            ?.accuracy
        }
      </Text>

    </View>

  );
}