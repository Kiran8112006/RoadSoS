import {
  View,
  Text,
} from 'react-native';

interface Props {

  event: any;
}

export default function EventDebug({

  event,

}: Props) {

  return (

    <View
      style={{
        marginTop: 20,

        padding: 20,

        borderRadius: 16,

        backgroundColor:
          event
            ? '#ffe5cc'
            : '#e8f5e9',
      }}
    >

      <Text
        style={{
          fontSize: 20,

          fontWeight: 'bold',
        }}
      >
        Suspicious Event
      </Text>

      <Text
        style={{
          marginTop: 10,
        }}
      >

        {
          event
            ? 'ACTIVE'
            : 'NONE'
        }

      </Text>

    </View>

  );

}