import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';

import {
  doc,
  getDoc,
} from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(
    auth,
    async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // 1. Langsung set user dari Firebase Auth agar router menyadari user sudah terautentikasi
      setUser(currentUser);
      setLoading(false); // Router bisa langsung izinkan akses ke '/' tanpa menunggu Firestore!

      try {
        // 2. Fetch data Firestore di background
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnapshot = await getDoc(userRef);
        const profile = userSnapshot.exists() ? userSnapshot.data() : {};

        // 3. Update state user dengan gabungan data Firestore saat fetch selesai
        setUser({
          ...currentUser,
          ...profile,
          uid: currentUser.uid,
          email: profile.email || currentUser.email,
          photoURL: profile.photoURL || currentUser.photoURL,
        });
      } catch (error) {
        console.error('Get user profile error:', error);
      }
    }
  );

  return unsubscribe;
}, []);

  const logout = async () => {
    await signOut(auth);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      logout,
    }),
    [user, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth harus digunakan di dalam AuthProvider'
    );
  }

  return context;
};