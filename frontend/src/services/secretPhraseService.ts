import nativeAuth from '@react-native-firebase/auth';
import {
  doc,
  getDoc,
  getFirestore,
  setDoc,
} from 'firebase/firestore';
import { auth, app } from './firebase/firebase.config';

const db = getFirestore(app);
const DEFAULT_SECRET_PHRASE = 'blue mango';

const getCurrentUid = () =>
  auth.currentUser?.uid || nativeAuth().currentUser?.uid || '';

export const getDefaultSecretPhrase = () =>
  DEFAULT_SECRET_PHRASE;

export const getSavedUserSecretPhrase = async () => {
  const uid = getCurrentUid();
  if (!uid) {
    return null;
  }

  const snapshot = await getDoc(doc(db, 'users', uid));
  const phrase = snapshot.data()?.secretPhrase;

  return typeof phrase === 'string' && phrase.trim()
    ? phrase.trim()
    : null;
};

export const getUserSecretPhrase = async () => {
  const phrase = await getSavedUserSecretPhrase();

  return phrase || DEFAULT_SECRET_PHRASE;
};

export const saveUserSecretPhrase = async (phrase: string) => {
  const uid = getCurrentUid();
  if (!uid) {
    throw new Error('No signed-in user found');
  }

  await setDoc(
    doc(db, 'users', uid),
    {
      secretPhrase: phrase.trim(),
      secretPhraseUpdatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
};
