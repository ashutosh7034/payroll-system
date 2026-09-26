import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

interface Tenant {
  id: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  token: string | null;
  login: (token: string, user: User, tenant: Tenant) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage on mount
    const storedToken = localStorage.getItem('payflow_token');
    const storedUser = localStorage.getItem('payflow_user');
    const storedTenant = localStorage.getItem('payflow_tenant');

    if (storedToken && storedUser && storedTenant) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setTenant(JSON.parse(storedTenant));
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User, newTenant: Tenant) => {
    localStorage.setItem('payflow_token', newToken);
    localStorage.setItem('payflow_user', JSON.stringify(newUser));
    localStorage.setItem('payflow_tenant', JSON.stringify(newTenant));
    
    setToken(newToken);
    setUser(newUser);
    setTenant(newTenant);
  };

  const logout = () => {
    localStorage.removeItem('payflow_token');
    localStorage.removeItem('payflow_user');
    localStorage.removeItem('payflow_tenant');
    
    setToken(null);
    setUser(null);
    setTenant(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        token,
        login,
        logout,
        isAuthenticated: !!token,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
