import { useEffect, useState, useCallback } from 'react';
import { fetchMe, loginUser, logoutUser, registerUser } from '../api/auth';
import { clearToken, getToken } from '../api/token';
import { AuthContext, AuthUser } from './auth-context';

type User = AuthUser;
type LoginForm = object;
type RegisterForm = object;

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.ReactElement {
  const [user, setUser]       = useState<User | null>(null);
  // Token yo'q bo'lsa mehmon — /auth/me so'ramaymiz, demak kutish ham shart emas.
  // Production'da datalife.uz ↔ onrender.com krossdomen bo'lgani uchun cookie
  // baribir ko'p brauzerda yuborilmaydi: haqiqiy manba localStorage'dagi token.
  // Bu har bir anonim mehmon uchun bitta so'rovni (uxlab qolgan serverda ~50s
  // kutishni) butunlay olib tashlaydi.
  const [loading, setLoading] = useState<boolean>(() => Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;
    fetchMe()
      .then(setUser)
      .catch((err: unknown) => {
        setUser(null);
        // Token eskirgan/bekor qilingan bo'lsa tozalaymiz — aks holda har
        // sahifa ochilishida albatta muvaffaqiyatsiz so'rov takrorlanaverardi.
        // Tarmoq xatosida (status 0) tegmaymiz: token hali yaroqli bo'lishi mumkin.
        const status = (err as { status?: number })?.status;
        if (status === 401 || status === 403) clearToken();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (form: LoginForm): Promise<User> => {
    const loggedInUser = await loginUser(form);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (form: RegisterForm): Promise<User> => {
    const newUser = await registerUser(form);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await logoutUser();
    setUser(null);
  }, []);

  const applyUser = useCallback((updated: User): void => {
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, applyUser }}>
      {children}
    </AuthContext.Provider>
  );
}
