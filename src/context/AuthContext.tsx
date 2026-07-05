import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthState } from '../types.js';

interface AuthContextType {
  state: AuthState;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  getAuthHeader: () => { Authorization: string } | {};
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({ token: null, user: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session on component mount
    const savedToken = localStorage.getItem('campus_auth_token');
    const savedUser = localStorage.getItem('campus_auth_user');

    if (savedToken && savedUser) {
      try {
        setState({
          token: savedToken,
          user: JSON.parse(savedUser),
        });
      } catch (e) {
        console.error("Failed to parse restored session user data", e);
        localStorage.removeItem('campus_auth_token');
        localStorage.removeItem('campus_auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || 'Login failed' };
      }

      localStorage.setItem('campus_auth_token', data.token);
      localStorage.setItem('campus_auth_user', JSON.stringify(data.user));

      setState({
        token: data.token,
        user: data.user,
      });

      return { success: true };
    } catch (err: any) {
      console.error("Login API communication error", err);
      return { success: false, message: 'Server unreachable. Please check connection.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('campus_auth_token');
    localStorage.removeItem('campus_auth_user');
    localStorage.removeItem('is_site_verified');
    setState({ token: null, user: null });
    window.location.reload();
  };

  const getAuthHeader = () => {
    return state.token ? { Authorization: `Bearer ${state.token}` } : {};
  };

  return (
    <AuthContext.Provider value={{ state, isLoading, login, logout, getAuthHeader }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
