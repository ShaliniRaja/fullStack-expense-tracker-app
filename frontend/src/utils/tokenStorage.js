// Centralizes where the JWT lives so it's easy to change later
// (e.g. to an httpOnly cookie set by the backend) without touching
// every call site.
const TOKEN_KEY = "ledger_token";
const EMAIL_KEY = "ledger_user_email";
const ROLE_KEY = "ledger_user_role";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getUserEmail = () => localStorage.getItem(EMAIL_KEY);
export const getUserRole = () => localStorage.getItem(ROLE_KEY);

export const setSession = (token, email, role) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMAIL_KEY, email);
  localStorage.setItem(ROLE_KEY, role);
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(ROLE_KEY);
};
