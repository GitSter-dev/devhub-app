const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error("EXPO_PUBLIC_API_URL is not set. Copy .env.example to .env.local and restart Metro.");
}

const wsUrl = `${apiUrl.replace(/^http/, "ws").replace(/\/+$/, "")}/ws`;

export const env = { apiUrl, wsUrl } as const;
