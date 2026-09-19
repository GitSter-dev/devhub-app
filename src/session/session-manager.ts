import { isApiError } from "@/api/api-error";
import { authApi, type TokenPair } from "@/api/auth-api";
import { createAuthedClient, type AccessTokenSource } from "@/api/http-client";
import { newIdempotencyKey } from "@/api/idempotency";
import { createStore } from "@/state/create-store";

import { sessionMarker } from "./session-marker";
import { tokenStore } from "./token-store";

export type ReauthReason = "expired" | "replaced";

export type SessionState =
  | { status: "hydrating" }
  | { status: "signedOut" }
  | { status: "reauthRequired"; reason: ReauthReason; message: string | null }
  | { status: "signedIn"; online: boolean };

const EXPIRY_MARGIN_MS = 30_000;
const COLD_START_WAIT_MS = 4_000;

class SessionManager implements AccessTokenSource {
  readonly store = createStore<SessionState>({ status: "hydrating" });
  readonly client = createAuthedClient(this);

  private accessToken: string | null = null;
  private accessTokenExpiresAt = 0;
  private refreshToken: string | null = null;
  private inflightRefresh: Promise<string | null> | null = null;
  private hydration: Promise<void> | null = null;

  hydrate(): Promise<void> {
    this.hydration ??= this.restore();
    return this.hydration;
  }

  private async restore(): Promise<void> {
    const stored = await tokenStore.read();
    if (stored.kind === "error") {
      console.warn("[session] refresh token unreadable at startup", stored.error);
      this.store.set({ status: "reauthRequired", reason: "expired", message: null });
      return;
    }
    if (stored.kind === "missing") {
      if (sessionMarker.isPresent()) {
        console.warn("[session] refresh token missing while a session was expected");
        await this.endSession("expired", null, "token missing at startup");
      } else {
        this.store.set({ status: "signedOut" });
      }
      return;
    }
    this.refreshToken = stored.token;
    const restored = this.refreshedAccessToken().then(() => true);
    const settled = await Promise.race([restored, delay(COLD_START_WAIT_MS).then(() => false)]);
    if (!settled && this.store.get().status === "hydrating") {
      this.store.set({ status: "signedIn", online: false });
    }
  }

  async startSession(pair: TokenPair): Promise<void> {
    await this.applyPair(pair);
    this.store.set({ status: "signedIn", online: true });
  }

  async signOut(reason = "signed out"): Promise<void> {
    const refreshToken = this.refreshToken;
    await this.clearTokens(reason);
    this.store.set({ status: "signedOut" });
    if (refreshToken) {
      authApi.logout(refreshToken, newIdempotencyKey()).catch(() => undefined);
    }
  }

  async endSessionFromServer(reason: ReauthReason): Promise<void> {
    if (this.store.get().status !== "signedIn") return;
    await this.endSession(reason, null, `server closed the session (${reason})`);
  }

  dismissReauth(): void {
    if (this.store.get().status === "reauthRequired") {
      this.store.set({ status: "signedOut" });
    }
  }

  retryConnection(): void {
    const state = this.store.get();
    if (state.status === "signedIn" && !state.online) {
      void this.refreshedAccessToken();
    }
  }

  async currentAccessToken(): Promise<string | null> {
    if (this.accessToken && Date.now() < this.accessTokenExpiresAt - EXPIRY_MARGIN_MS) {
      return this.accessToken;
    }
    return this.refreshedAccessToken();
  }

  refreshedAccessToken(): Promise<string | null> {
    if (!this.inflightRefresh) {
      this.inflightRefresh = this.performRefresh().finally(() => {
        this.inflightRefresh = null;
      });
    }
    return this.inflightRefresh;
  }

  reportConnectivity(online: boolean): void {
    const state = this.store.get();
    if (state.status === "signedIn" && state.online !== online) {
      this.store.set({ status: "signedIn", online });
    }
  }

  private async performRefresh(): Promise<string | null> {
    const refreshToken = this.refreshToken;
    if (!refreshToken) return null;

    try {
      await this.applyPair(await authApi.refresh(refreshToken, newIdempotencyKey()));
      this.store.set({ status: "signedIn", online: true });
      return this.accessToken;
    } catch (error) {
      if (isApiError(error) && error.code === "SESSION_REPLACED") {
        await this.endSession("replaced", error.message, "refresh: session replaced");
      } else if (isApiError(error) && (error.code === "INVALID_REFRESH_TOKEN" || error.status === 401)) {
        await this.endSession("expired", null, `refresh rejected (${error.code})`);
      } else {
        this.store.set({ status: "signedIn", online: false });
      }
      return null;
    }
  }

  private async endSession(reason: ReauthReason, message: string | null, cause: string): Promise<void> {
    await this.clearTokens(cause);
    this.store.set({ status: "reauthRequired", reason, message });
  }

  private async applyPair(pair: TokenPair): Promise<void> {
    this.accessToken = pair.accessToken;
    this.accessTokenExpiresAt = Date.parse(pair.accessTokenExpiresAt);
    this.refreshToken = pair.refreshToken;
    await tokenStore.write(pair.refreshToken);
    sessionMarker.set();
  }

  private async clearTokens(cause: string): Promise<void> {
    console.info(`[session] cleared: ${cause}`);
    this.accessToken = null;
    this.accessTokenExpiresAt = 0;
    this.refreshToken = null;
    sessionMarker.clear();
    await tokenStore.clear();
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const sessionManager = new SessionManager();
