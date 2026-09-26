import * as Application from "expo-application";
import { Platform } from "react-native";

export const APP_PLATFORM_HEADER = "X-App-Platform";
export const APP_VERSION_HEADER = "X-App-Version";

// The backend compares these against the oldest build it still supports and
// answers APP_UPDATE_REQUIRED below it, so the API can change without silently
// breaking installs that never update themselves.
export function identifyClient(request: Request): void {
  request.headers.set(APP_PLATFORM_HEADER, Platform.OS);
  const version = Application.nativeApplicationVersion;
  if (version) request.headers.set(APP_VERSION_HEADER, version);
}
