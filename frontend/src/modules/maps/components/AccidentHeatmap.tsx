import React from 'react';
import { Circle, MapHeatmap } from 'react-native-maps';
import { AccidentHotspot } from '../safety/types/safety.types';

interface Props {
  hotspots: AccidentHotspot[];
}

const getRiskColor = (riskScore: number) => {
  if (riskScore >= 0.8) return 'rgba(239, 68, 68, 0.28)';
  if (riskScore >= 0.6) return 'rgba(245, 158, 11, 0.24)';
  return 'rgba(250, 204, 21, 0.20)';
};

const getStrokeColor = (riskScore: number) => {
  if (riskScore >= 0.8) return '#EF4444';
  if (riskScore >= 0.6) return '#F59E0B';
  return '#FACC15';
};

export default function AccidentHeatmap({ hotspots }: Props) {
  if (hotspots.length === 0) return null;

  const points = hotspots.map((hotspot) => ({
    latitude: hotspot.latitude,
    longitude: hotspot.longitude,
    weight: hotspot.riskScore,
  }));

  return (
    <>
      <MapHeatmap
        points={points}
        opacity={0.65}
        radius={45}
        gradient={{
          colors: ['#FACC15', '#F97316', '#EF4444'],
          startPoints: [0.2, 0.55, 1],
          colorMapSize: 256,
        }}
      />

      {hotspots.map((hotspot, index) => (
        <Circle
          key={`${hotspot.latitude}-${hotspot.longitude}-${index}`}
          center={{
            latitude: hotspot.latitude,
            longitude: hotspot.longitude,
          }}
          radius={250 + hotspot.riskScore * 450}
          fillColor={getRiskColor(hotspot.riskScore)}
          strokeColor={getStrokeColor(hotspot.riskScore)}
          strokeWidth={1}
        />
      ))}
    </>
  );
}
