import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createApiClient } from "../api/client";

const TOKEN_KEY = "shopease_token";
const USER_KEY = "shopease_user";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getToken = useCallback(async () => token, [token]);
  const api = useMemo(() => createApiClient(getToken), [getToken]);

  useEffect(() => {
    async function load() {
      try {
        const t = await AsyncStorage.getItem(TOKEN_KEY);
        const u = await AsyncStorage.getItem(USER_KEY);
        setToken(t);
        setUser(u ? JSON.parse(u) : null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    const res = await api.post("/auth/login", { email, password });
    await AsyncStorage.setItem(TOKEN_KEY, res.data.token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
    setToken(res.data.token);
    setUser(res.data.user);
  }, [api]);

  const register = useCallback(async ({ name, email, password, role }) => {
    await api.post("/auth/register", { name, email, password, role });
  }, [api]);

  const updateProfile = useCallback(
    async ({ name, email, currentPassword, newPassword }) => {
      const payload = { name, email };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      const res = await api.put("/auth/me", payload);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(res.data));
      setUser(res.data);
      return res.data;
    },
    [api],
  );

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ api, token, user, loading, signIn, register, updateProfile, signOut }),
    [api, token, user, loading, signIn, register, updateProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

