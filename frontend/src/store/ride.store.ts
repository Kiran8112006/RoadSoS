import { create } from 'zustand';

type VehicleType =
  | 'two_wheeler'
  | 'four_wheeler';

interface RideState {

  isProtectionActive: boolean;

  vehicleType: VehicleType;

  setProtectionActive: (
    value: boolean
  ) => void;

  setVehicleType: (
    type: VehicleType
  ) => void;
}

export const useRideStore =
  create<RideState>((set) => ({

    isProtectionActive: false,

    vehicleType: 'two_wheeler',

    setProtectionActive: (
      value
    ) =>
      set({
        isProtectionActive: value,
      }),

    setVehicleType: (
      type
    ) =>
      set({
        vehicleType: type,
      }),

  }));