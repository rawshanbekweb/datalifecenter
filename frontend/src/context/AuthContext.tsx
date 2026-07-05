import { useEffect, useState, useCallback } from 'react';
import { fetchMe, loginUser, logoutUser, registerUser } from '../api/auth';
import { AuthContext, AuthUser } from './auth-context';

type User = AuthUser;
type LoginForm = object;
type RegisterForm = object;

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.ReactElement {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .catch(() => setUser(null))
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
