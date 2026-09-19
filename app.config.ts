/// <reference types="node" />
import { existsSync } from "node:fs";
import type { ConfigContext, ExpoConfig } from "expo/config";

const GOOGLE_SERVICES_FILE = "./google-services.json";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  android: {
    ...config.android,
    ...(existsSync(GOOGLE_SERVICES_FILE) ? { googleServicesFile: GOOGLE_SERVICES_FILE } : {}),
  },
});
