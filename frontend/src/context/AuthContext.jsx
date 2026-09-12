import React, { createContext, useContext, useEffect, useState } from "react";
import * as authService from "../services/authService";
import { setUnauthorizedHandler } from "../api/httpClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [email, setEmail] = useState(authService.getCurrentEmail());
  const [role, setRole] = useState(authService.currentUserRole());
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    // If a request ever comes back 401 (expired/invalid token),
    // drop back to the login screen automatically.
    setUnauthorizedHandler(() => {
      authService.logout();
      setEmail(null);
      setRole(null);
    });
  }, []);

  const login = async (emailInput, password) => {
    setPending(true);
    setError(null);
    try {
      const data = await authService.login(emailInput, password);
      setEmail(data.email);
      setRole(data.role);
      return true;
    } catch (err) {
      setError("Invalid email or password.");
      return false;
    } finally {
      setPending(false);
    }
  };

  const register = async (emailInput, password, roleInput) => {
    setPending(true);
    setError(null);
    try {
      const data = await authService.register(emailInput, password, roleInput);
      setEmail(data.email);
      setRole(data.role);
      return true;
    } catch (err) {
      setError(
        err?.message?.includes("409")
          ? "An account with this email already exists."
          : "Could not create your account. Please try again."
      );
      return false;
    } finally {
      setPending(false);
    }
  };

  const logout = () => {
    authService.logout();
    setEmail(null);
    setRole(null);
  };

  const clearError = () => setError(null);

  const isVisitor = role === "VISITOR";

  return (
    <AuthContext.Provider value={{ email, role, isVisitor, isAuthenticated: Boolean(email), login, register, logout, error, pending, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
