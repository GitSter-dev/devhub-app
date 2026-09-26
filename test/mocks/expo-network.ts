import { vi } from "vitest";

type Listener = (state: { isConnected: boolean; isInternetReachable: boolean }) => void;

const listeners = new Set<Listener>();

export const addNetworkStateListener = vi.fn((listener: Listener) => {
  listeners.add(listener);
  return { remove: () => listeners.delete(listener) };
});

export const getNetworkStateAsync = vi.fn(async () => ({ isConnected: true, isInternetReachable: true }));

export function emitNetworkState(isConnected: boolean): void {
  listeners.forEach((listener) => listener({ isConnected, isInternetReachable: isConnected }));
}
