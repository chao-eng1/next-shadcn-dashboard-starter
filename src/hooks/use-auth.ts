import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  token?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟用户认证状态
    const mockUser: User = {
      id: '1',
      name: 'Demo User',
      email: 'demo@example.com',
      token: 'demo-token-123'
    };

    setUser(mockUser);
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    // 模拟登录
    setTimeout(() => {
      const mockUser: User = {
        id: '1',
        name: 'Demo User',
        email,
        token: 'demo-token-123'
      };
      setUser(mockUser);
      setLoading(false);
    }, 1000);
  };

  const logout = () => {
    setUser(null);
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    setUser,
    setLoading
  };
};
