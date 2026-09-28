import React, { createContext, useContext, useEffect, useState } from 'react';
import { loginUser, registerUser, logoutUser } from '../api/authApi';
import { saveAuthData, getToken, getStoredUser, clearAuthData } from '../utils/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  // isLoading is true only while we check AsyncStorage on app startup.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const storedToken = await getToken();
      const storedUser = await getStoredUser();
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email, password) {
    const data = await loginUser(email, password);
    const loggedInUser = { id: data.userId, fullName: data.fullName, email: data.email };
    await saveAuthData(data.token, loggedInUser);
    setToken(data.token);
    setUser(loggedInUser);
  }

  async function register(fullName, email, password) {
    const data = await registerUser(fullName, email, password);
    const registeredUser = { id: data.userId, fullName: data.fullName, email: data.email };
    await saveAuthData(data.token, registeredUser);
    setToken(data.token);
    setUser(registeredUser);
  }

  async function logout() {
    try {
      await logoutUser();
    } catch (e) {
      // Even if the network call fails, clear local state so the user
      // is not stuck in a logged-in UI with a dead token.
    } finally {
      await clearAuthData();
      setToken(null);
      setUser(null);
    }
  }

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
