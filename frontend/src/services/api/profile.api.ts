import axios from 'axios';

import nativeAuth from '@react-native-firebase/auth';

import { auth }
from '../firebase/firebase.config';

const rawApiUrl =
  process.env.EXPO_PUBLIC_API_URL || '';

const API_BASE_URL =
  rawApiUrl
    .replace(/\/+$/, '')
    .replace(/\/api$/, '');

const profileUrl =
  `${API_BASE_URL}/api/profile/profile`;

const completeProfileUrl =
  `${API_BASE_URL}/api/profile/complete`;

export const getAuthHeaders =
  async (tokenOverride?: string) => {

    const token =
      tokenOverride ||
      await auth.currentUser?.getIdToken() ||
      await nativeAuth().currentUser?.getIdToken();

    if (!token) {
      throw new Error(
        'No Firebase auth token available for API request'
      );
    }

    return {
      Authorization: `Bearer ${token}`,
    };
};

export const getUserProfile =
  async (tokenOverride?: string) => {

    const headers =
      await getAuthHeaders(tokenOverride);

    console.log(
      'GET USER PROFILE URL:',
      profileUrl
    );

    const response =
      await axios.get(
        profileUrl,
        {
          headers,
        }
      );

    console.log(
      'GET USER PROFILE RESPONSE:',
      response.data
    );

    return response.data;
};

export const completeProfile =
  async (
    data: any,
    tokenOverride?: string
  ) => {

    const headers =
      await getAuthHeaders(tokenOverride);

    console.log(
      'COMPLETE PROFILE URL:',
      completeProfileUrl
    );

    const response =
      await axios.post(
        completeProfileUrl,
        data,
        {
          headers,
        }
      );

    console.log(
      'COMPLETE PROFILE RESPONSE:',
      response.data
    );

    return response.data;
};
