import axios from 'axios';

export const triggerEmergency =
async (

  location: any,

  risk: number,

) => {

  return axios.post(

    'http://YOUR_IP:5000/api/emergency/trigger',

    {

      latitude:
        location?.coords?.latitude,

      longitude:
        location?.coords?.longitude,

      risk,

      timestamp:
        Date.now(),

    }

  );

};