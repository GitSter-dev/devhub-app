import type { TokenPair } from "@/api/auth-api";

export function tokenPair(name: string, accessTtlMs = 15 * 60_000): TokenPair {
  return {
    tokenType: "Bearer",
    accessToken: `${name}-access`,
    accessTokenExpiresAt: new Date(Date.now() + accessTtlMs).toISOString(),
    refreshToken: `${name}-refresh`,
    refreshTokenExpiresAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
  };
}
