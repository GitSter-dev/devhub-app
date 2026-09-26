/// <reference types="node" />
import { existsSync } from "node:fs";
import type { ConfigContext, ExpoConfig } from "expo/config";

const GOOGLE_SERVICES_FILE = "./google-services.json";

function releaseVersionCode(): number | undefined {
  const code = Number(process.env.ANDROID_VERSION_CODE);
  return Number.isInteger(code) && code > 0 ? code : undefined;
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  version: process.env.APP_VERSION ?? config.version,
  android: {
    ...config.android,
    ...(releaseVersionCode() ? { versionCode: releaseVersionCode() } : {}),
    ...(existsSync(GOOGLE_SERVICES_FILE) ? { googleServicesFile: GOOGLE_SERVICES_FILE } : {}),
  },
});
