import { createContext, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const { user: me } = await authApi.getMe();
        setUser(me);
        setToken(storedToken);
      } catch {
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, []);

  async function login(credentials) {
    const { token: newToken, user: newUser } = await authApi.login(credentials);
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }

  async function signup(details) {
    const { token: newToken, user: newUser } = await authApi.signup(details);
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
