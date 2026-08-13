import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';

import {
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';

export const registerUser = async ({
  name,
  email,
  phone,
  gender,
  dateOfBirth,
  password,
}) => {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = credential.user;

  // Simpan nama ke Firebase Authentication
  await updateProfile(user, {
    displayName: name,
  });

  // Simpan profile ke Firestore
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,

    name,
    email: user.email,
    phone: phone || null,
    photoURL: null,

    gender: gender || null,
    dateOfBirth: dateOfBirth || null,

    accountStatus: 'ACTIVE',
    role: 'USER',

    subscriptionStatus: 'FREE',
    subscriptionPlan: 'FREE',

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  });

  return user;
};