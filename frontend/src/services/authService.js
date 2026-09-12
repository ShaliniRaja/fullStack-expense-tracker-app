import * as authApi from "../api/authApi";
import { setSession, clearSession, getToken, getUserEmail, getUserRole } from "../utils/tokenStorage";

export async function login(email, password) {
  const res = await authApi.login({ email, password });
  setSession(res.token, res.email, res.role);
  return res;
}

export async function register(email, password, role) {
  const res = await authApi.register({ email, password, role });
  setSession(res.token, res.email, res.role);
  return res;
}

export function logout() {
  clearSession();
}

export function isAuthenticated() {
  return !!getToken();
}

export function currentUserEmail() {
  return getUserEmail();
}

export function currentUserRole() {
  return getUserRole();
}

export function isVisitor() {
  return getUserRole() === "VISITOR";
}

// Alias — src/context/AuthContext.jsx calls this name.
export const getCurrentEmail = currentUserEmail;
