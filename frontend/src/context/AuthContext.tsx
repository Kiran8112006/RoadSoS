import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  onAuthStateChanged,
} from 'firebase/auth';

import nativeAuth from '@react-native-firebase/auth';

import { auth } from '../services/firebase/firebase.config';

type AuthContextType = {
  user: any;
  loading: boolean;
};

const AuthContext =
  createContext<AuthContextType>({
    user: null,
    loading: true,
  });

export function AuthProvider({
  children,
}: any) {

  const [firebaseUser, setFirebaseUser] =
    useState<any>(null);

  const [nativeUser, setNativeUser] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  const [nativeLoading, setNativeLoading] =
    useState(true);

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (firebaseUser) => {

          setFirebaseUser(firebaseUser);

          setLoading(false);

        }
      );

    return unsubscribe;

  }, []);

  useEffect(() => {

    const unsubscribe =
      nativeAuth().onAuthStateChanged(
        (phoneUser) => {

          setNativeUser(phoneUser);

          setNativeLoading(false);

        }
      );

    return unsubscribe;

  }, []);

  return (
    <AuthContext.Provider
      value={{
        user:
          firebaseUser || nativeUser,
        loading:
          loading || nativeLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () =>
  useContext(AuthContext);
