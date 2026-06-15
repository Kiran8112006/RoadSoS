import {
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';

import {
  useRideStore,
} from '../../store/ride.store';

import {
  startProtectionManager,
  stopProtectionManager,
} from '../../services/protectionManager.service';

export default function ProtectionButton() {

  const {
    isProtectionActive,
    setProtectionActive,
  } = useRideStore();

  const handleToggle =
  async () => {

    const nextValue =
      !isProtectionActive;

    try {

      if (
        nextValue
      ) {

        await startProtectionManager();

      } else {

        await stopProtectionManager();

      }

      setProtectionActive(
        nextValue
      );

    } catch (error) {

      console.log(
        'PROTECTION TOGGLE ERROR:',
        error
      );

      Alert.alert(
        'Protection unavailable',
        error instanceof Error
          ? error.message
          : 'RoadSoS could not start background protection.'
      );

    }

  };

  return (

    <TouchableOpacity
      onPress={handleToggle}
      style={{
        backgroundColor:
          isProtectionActive
            ? '#ff3b30'
            : '#34c759',

        paddingVertical: 18,

        borderRadius: 18,

        alignItems: 'center',

        marginTop: 30,
      }}
    >

      <Text
        style={{
          color: 'white',
          fontSize: 18,
          fontWeight: 'bold',
        }}
      >
        {
          isProtectionActive
            ? 'STOP PROTECTION'
            : 'START PROTECTION'
        }
      </Text>

    </TouchableOpacity>

  );
}
