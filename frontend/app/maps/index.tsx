import { View, StyleSheet } from 'react-native';
import { RoadSoSMap } from '../../src/modules/maps';

export default function MapsPage() {
  return (
    <View style={styles.container}>
      <RoadSoSMap />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
