import { httpClient } from "./httpClient";
import { ENDPOINTS } from "./endpoints";

// POST /auth/login  — body: { email, password } -> { token, tokenType, email, expiresInSeconds }
export const login = (credentials) => httpClient.post(ENDPOINTS.login, credentials);

// POST /auth/register — same shape, for creating a new account
export const register = (credentials) => httpClient.post(ENDPOINTS.register, credentials);
