import { createContext } from 'react';

export interface AuthUser {
  id: string | number;
  name: string;
  email: string;
  role: string;
  [key: string]: unknown;
}

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (form: object) => Promise<AuthUser>;
  register: (form: object) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
