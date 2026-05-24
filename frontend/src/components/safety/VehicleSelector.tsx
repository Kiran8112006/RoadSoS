import {
  View,
  TouchableOpacity,
  Text,
} from 'react-native';

import {
  useRideStore,
} from '../../store/ride.store';

export default function VehicleSelector() {

  const {
    vehicleType,
    setVehicleType,
  } = useRideStore();

  return (

    <View
      style={{
        flexDirection: 'row',

        gap: 12,

        marginTop: 20,
      }}
    >

      <TouchableOpacity
        onPress={() =>
          setVehicleType(
            'two_wheeler'
          )
        }
        style={{
          flex: 1,

          backgroundColor:
            vehicleType ===
            'two_wheeler'
              ? '#007aff'
              : '#e5e5ea',

          padding: 16,

          borderRadius: 14,

          alignItems: 'center',
        }}
      >
        <Text
          style={{
            color:
              vehicleType ===
              'two_wheeler'
                ? 'white'
                : 'black',

            fontWeight: 'bold',
          }}
        >
          Two Wheeler
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          setVehicleType(
            'four_wheeler'
          )
        }
        style={{
          flex: 1,

          backgroundColor:
            vehicleType ===
            'four_wheeler'
              ? '#007aff'
              : '#e5e5ea',

          padding: 16,

          borderRadius: 14,

          alignItems: 'center',
        }}
      >
        <Text
          style={{
            color:
              vehicleType ===
              'four_wheeler'
                ? 'white'
                : 'black',

            fontWeight: 'bold',
          }}
        >
          Four Wheeler
        </Text>
      </TouchableOpacity>

    </View>

  );
}