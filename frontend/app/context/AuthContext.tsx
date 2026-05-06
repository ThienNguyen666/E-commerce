import React, { createContext, useContext, useState, useEffect } from "react";

interface User { id: number; full_name: string; email: string; is_admin?: boolean; }
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isInitializing: boolean; // <-- Thêm biến này
}

const AuthContext = createContext<AuthContextType>({
  user: null, token: null,
  login: () => {}, logout: () => {}, isAuthenticated: false,
  isInitializing: true, // <-- Mặc định lúc mới vào là đang loading
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,  setUser]  = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true); // <-- Thêm state loading

  useEffect(() => {
    if (typeof window !== "undefined") {
      const t = localStorage.getItem("token");
      const u = localStorage.getItem("user");
      if (t && u) { 
        setToken(t); 
        setUser(JSON.parse(u)); 
      }
      setIsInitializing(false); // <-- Check xong thì tắt loading đi
    }
  }, []);

  const login = (t: string, u: User) => {
    setToken(t); setUser(u);
    localStorage.setItem("token", t);
    localStorage.setItem("user",  JSON.stringify(u));
  };

  const logout = () => {
    setToken(null); setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, isInitializing }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);