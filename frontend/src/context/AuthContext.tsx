import { useState, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { AuthContext } from './AuthContextDefinition';

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => authService.isAuthenticated());

  const login = (userData: User) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Login called without valid token');
      return;
    }
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = { user, isAuthenticated, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}