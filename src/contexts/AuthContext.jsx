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

        try {
          // Ambil profile dari Firestore
          const userRef = doc(
            db,
            'users',
            currentUser.uid
          );

          const userSnapshot = await getDoc(userRef);

          const profile = userSnapshot.exists()
            ? userSnapshot.data()
            : {};

          // Gabungkan Firebase Auth + Firestore
          setUser({
            ...currentUser,
            ...profile,

            // pastikan UID tetap dari Auth
            uid: currentUser.uid,

            // email dari Firestore jika ada,
            // fallback ke Firebase Auth
            email:
              profile.email ||
              currentUser.email,

            // foto
            photoURL:
              profile.photoURL ||
              currentUser.photoURL,
          });
        } catch (error) {
          console.error(
            'Get user profile error:',
            error
          );

          // fallback kalau Firestore gagal
          setUser(currentUser);
        } finally {
          setLoading(false);
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