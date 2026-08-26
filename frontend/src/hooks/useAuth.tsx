import React, { createContext, useContext, useState } from 'react';
import { normalizeRole, type AppRole } from '../utils/authRole';

interface User {
  id: number;
  username: string;
  name: string;
  role: AppRole;
  machine?: {
    id: number;
    code: string;
    name: string;
    type: string;
  };
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getSavedUser = (): User | null => {
  const savedUser = localStorage.getItem('silcar_user');
  if (!savedUser) return null;

  try {
    const parsedUser = JSON.parse(savedUser);
    const normalizedUser = { ...parsedUser, role: normalizeRole(parsedUser.role) };
    localStorage.setItem('silcar_user', JSON.stringify(normalizedUser));
    return normalizedUser;
  } catch {
    localStorage.removeItem('silcar_user');
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => getSavedUser());
  const [loading] = useState(false);

  const login = (userData: User) => {
    const normalizedUser = { ...userData, role: normalizeRole(userData.role) };
    setUser(normalizedUser);
    localStorage.setItem('silcar_user', JSON.stringify(normalizedUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('silcar_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
