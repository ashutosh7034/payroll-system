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
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('payflow_token');
      
      if (storedToken) {
        try {
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
          const res = await fetch(`${baseUrl}/auth/me`, {
            headers: { 'Authorization': `Bearer ${storedToken}` }
          });
          
          if (res.ok) {
            const data = await res.json();
            setToken(storedToken);
            setUser(data.user);
            setTenant(data.tenant);
            
            // Keep localStorage in sync with fresh DB data
            localStorage.setItem('payflow_user', JSON.stringify(data.user));
            if (data.tenant) {
              localStorage.setItem('payflow_tenant', JSON.stringify(data.tenant));
            } else {
              localStorage.removeItem('payflow_tenant');
            }
          } else {
            // Token invalid or expired
            localStorage.removeItem('payflow_token');
            localStorage.removeItem('payflow_user');
            localStorage.removeItem('payflow_tenant');
          }
        } catch (err) {
          // Network error or backend down, fallback to localStorage if available so app doesn't brick entirely
          const storedUser = localStorage.getItem('payflow_user');
          const storedTenant = localStorage.getItem('payflow_tenant');
          if (storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            if (storedTenant) setTenant(JSON.parse(storedTenant));
          }
        }
      }
      setIsLoading(false);
    };

    verifyAuth();
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
    
    // Force a full page reload to completely clear all React state, component caches, and memory
    window.location.href = '/login';
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
