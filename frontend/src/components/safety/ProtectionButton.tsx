import {
  TouchableOpacity,
  Text,
} from 'react-native';

import {
  useRideStore,
} from '../../store/ride.store';

export default function ProtectionButton() {

  const {
    isProtectionActive,
    setProtectionActive,
  } = useRideStore();

  const handleToggle = () => {

    setProtectionActive(
      !isProtectionActive
    );

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