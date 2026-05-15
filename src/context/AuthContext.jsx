import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [role, setRole] = useState(() => localStorage.getItem('role'));
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const initSession = async () => {
      const storedToken = localStorage.getItem('token');
      const storedRole = localStorage.getItem('role');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setRole(storedRole);
          setUser(parsedUser);
          
          // Fetch fresh profile in the background to ensure data is up-to-date
          try {
            const { data } = await authApi.getProfile(parsedUser.userId);
            const freshUser = { ...parsedUser, ...data };
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          } catch (e) {
            console.error('Failed to sync fresh profile', e);
          }
        } catch {
          localStorage.clear();
        }
      }
      setLoading(false);
    };
    
    initSession();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password });
    const { token, refreshToken, role, userId, fullName, email: userEmail, profilePicUrl, bio, mobile } = data;

    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('role', role);

    let userData = { userId, fullName, email: userEmail, role, profilePicUrl, bio, mobile };
    
    // Fetch fresh profile right after login to guarantee we have all updated fields
    try {
      const profileRes = await authApi.getProfile(userId);
      userData = { ...userData, ...profileRes.data };
    } catch (e) {
      console.error('Failed to fetch profile during login', e);
    }

    localStorage.setItem('user', JSON.stringify(userData));

    setToken(token);
    setRole(role);
    setUser(userData);

    toast.success(`Welcome back, ${userData.fullName}!`);
    return role;
  }, []);

  const googleLogin = useCallback(async (idToken) => {
    const { data } = await authApi.googleLogin(idToken);
    const { token, refreshToken, role, userId, fullName, email: userEmail, profilePicUrl, bio, mobile } = data;

    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('role', role);

    let userData = { userId, fullName, email: userEmail, role, profilePicUrl, bio, mobile };
    
    try {
      const profileRes = await authApi.getProfile(userId);
      userData = { ...userData, ...profileRes.data };
    } catch (e) {
      console.error('Failed to fetch profile during google login', e);
    }

    localStorage.setItem('user', JSON.stringify(userData));

    setToken(token);
    setRole(role);
    setUser(userData);

    toast.success(`Welcome back, ${userData.fullName}!`);
    return role;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await authApi.register(formData);
    toast.success('Account created! Please login.');
    return data;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    localStorage.clear();
    setToken(null);
    setRole(null);
    setUser(null);
    toast.success('Logged out successfully.');
  }, []);

  const updateUser = useCallback((updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  }, [user]);

  const isAuthenticated = !!token;

  const value = {
    user, token, role, loading,
    isAuthenticated,
    isStudent: role === 'STUDENT',
    isInstructor: role === 'INSTRUCTOR',
    isAdmin: role === 'ADMIN',
    login, googleLogin, register, logout, updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
