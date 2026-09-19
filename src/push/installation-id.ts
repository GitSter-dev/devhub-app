import { randomUUID } from "expo-crypto";

import { readValue, writeValue } from "@/storage/key-value";

const INSTALLATION_ID_KEY = "devhub.push.installationId";

export function installationId(): string {
  const existing = readValue(INSTALLATION_ID_KEY);
  if (existing) return existing;
  const created = randomUUID();
  writeValue(INSTALLATION_ID_KEY, created);
  return created;
}
