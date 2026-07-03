import { useEffect, useState, useCallback } from 'react';
import { fetchMe, loginUser, logoutUser, registerUser } from '../api/auth';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (form) => {
    const loggedInUser = await loginUser(form);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (form) => {
    const newUser = await registerUser(form);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
