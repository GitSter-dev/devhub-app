import { publicClient, unwrap } from "./http-client";
import { idempotencyHeaders } from "./idempotency";

export type SignupPayload = {
  username: string;
  displayName: string;
  email: string;
  password: string;
};

export type SignupResult = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: string;
  createdAt: string;
};

export type TokenPair = {
  tokenType: string;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};

export type LoginPayload = { identifier: string; password: string };
export type VerifyEmailPayload = { email: string; code: string };
export type ResetPasswordPayload = { email: string; code: string; newPassword: string };

function post<T>(path: string, body: unknown, idempotencyKey?: string): Promise<T> {
  return unwrap<T>(publicClient.post(path, { json: body, headers: idempotencyHeaders(idempotencyKey) }));
}

export const authApi = {
  signup: (payload: SignupPayload, key: string) => post<SignupResult>("auth/signup", payload, key),
  verifyEmail: (payload: VerifyEmailPayload, key: string) => post<void>("auth/verify-email", payload, key),
  resendVerification: (email: string, key: string) => post<void>("auth/resend-verification", { email }, key),
  login: (payload: LoginPayload, key: string) => post<TokenPair>("auth/login", payload, key),
  refresh: (refreshToken: string, key: string) => post<TokenPair>("auth/refresh", { refreshToken }, key),
  logout: (refreshToken: string, key: string) => post<void>("auth/logout", { refreshToken }, key),
  forgotPassword: (email: string, key: string) => post<void>("auth/forgot-password", { email }, key),
  resetPassword: (payload: ResetPasswordPayload, key: string) => post<void>("auth/reset-password", payload, key),
};
