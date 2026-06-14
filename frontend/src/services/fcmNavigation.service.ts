import {
  router,
} from 'expo-router';

export const navigateToEmergencyAlert =
(data: any) => {

  console.log(
    'NAVIGATING TO EMERGENCY ALERT:',
    data
  );

  router.push({

    pathname:
      '/emergency-alert' as any,

    params: {

      alertId:
        data.alertId || '',

      userId:
        data.userId || '',

      victimName:
        data.victimName || '',

      victimPhone:
        data.victimPhone || '',

      bloodGroup:
        data.bloodGroup || '',

      allergies:
        data.allergies || '',

      medicalConditions:
        data.medicalConditions || '',

      medications:
        data.medications || '',

      emergencyNotes:
        data.emergencyNotes || '',

      compatibleDonors:
        data.compatibleDonors || '[]',

      latitude:
        data.latitude || '',

      longitude:
        data.longitude || '',

      locationLink:
        data.locationLink || '',

    },

  });

};
