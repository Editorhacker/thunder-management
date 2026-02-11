import {
  createContext,
  useContext,
  useEffect,
  useState,

} from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import axios from 'axios';

/* ---------------------------------------
   Types
--------------------------------------- */
interface AppUser {
  uid: string;
  email: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

/* ---------------------------------------
   Context
--------------------------------------- */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---------------------------------------
     Auth Listener
  --------------------------------------- */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (!firebaseUser) {
        setUser(null);
        delete axios.defaults.headers.common.Authorization;
        setLoading(false);
        return;
      }

      try {
        const token = await firebaseUser.getIdToken();

        // 🔥 Attach token globally
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;

        const res = await axios.get('https://thunder-management.vercel.app//api/auth/me');

        setUser({
          uid: res.data.user.uid,
          email: res.data.user.email,
          username: res.data.user.username,
          role: res.data.user.role
        });

      } catch (err) {
        console.error('Failed to load user', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  /* ---------------------------------------
     Logout
  --------------------------------------- */
  const logout = async () => {
    await signOut(auth);
    delete axios.defaults.headers.common.Authorization;
    setUser(null);
    navigate('/login', { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

/* ---------------------------------------
   Hook
--------------------------------------- */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
};
