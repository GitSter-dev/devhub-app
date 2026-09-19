export type PendingCredentials = { identifier: string; password: string };

let pending: PendingCredentials | null = null;

export const pendingCredentials = {
  remember(credentials: PendingCredentials): void {
    pending = credentials;
  },
  take(): PendingCredentials | null {
    const credentials = pending;
    pending = null;
    return credentials;
  },
  forget(): void {
    pending = null;
  },
};
