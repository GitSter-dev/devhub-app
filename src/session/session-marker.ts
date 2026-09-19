import { readValue, removeValue, writeValue } from "@/storage/key-value";

const MARKER_KEY = "devhub.session.present";

export const sessionMarker = {
  isPresent: (): boolean => readValue(MARKER_KEY) === "true",
  set: (): void => writeValue(MARKER_KEY, "true"),
  clear: (): void => removeValue(MARKER_KEY),
};
