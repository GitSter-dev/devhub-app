import * as Network from "expo-network";
import { useEffect } from "react";
import { AppState } from "react-native";

import { useSessionState } from "@/session/use-session";

import { realtimeConnection } from "./realtime-connection";

export function RealtimeEffects() {
  const signedIn = useSessionState().status === "signedIn";

  useEffect(() => {
    if (!signedIn) return;
    realtimeConnection.start();
    return () => realtimeConnection.stop();
  }, [signedIn]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") realtimeConnection.resume();
      if (next === "background") realtimeConnection.suspend();
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const subscription = Network.addNetworkStateListener((state) => {
      if (state.isConnected) realtimeConnection.retryNow();
    });
    return () => subscription.remove();
  }, []);

  return null;
}
