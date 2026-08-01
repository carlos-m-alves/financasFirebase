import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from '../services/firebase';

const AuthContext = createContext(null);

export const ALLOWED_EMAIL = (
  import.meta.env.VITE_ALLOWED_EMAIL || 'enriqq3d@gmail.com'
).toLowerCase();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signIn(email, password) {
    if (email.toLowerCase() !== ALLOWED_EMAIL) {
      throw new Error('Acesso restrito. Este e-mail não é autorizado.');
    }
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
