const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error("EXPO_PUBLIC_API_URL is not set. Copy .env.example to .env.local and restart Metro.");
}

const wsUrl = `${apiUrl.replace(/^http/, "ws").replace(/\/+$/, "")}/ws`;

// Where an outdated build sends people. The APK is sideloaded, so this is the
// latest GitHub release rather than a store listing.
const updateUrl = process.env.EXPO_PUBLIC_UPDATE_URL ?? "https://github.com/GitSter-dev/devhub-app/releases/latest";

export const env = { apiUrl, wsUrl, updateUrl } as const;
