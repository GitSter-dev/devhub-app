import type { TopicColor } from "@/theme";

const KNOWN_COLORS: Record<string, TopicColor> = {
  "react-native": "emerald",
  typescript: "cyan",
  ai: "violet",
  rust: "amber",
  design: "rose",
  devops: "blue",
  kotlin: "violet",
  "open-source": "emerald",
  databases: "cyan",
  go: "blue",
  security: "rose",
  "game-dev": "amber",
};

const PALETTE: readonly TopicColor[] = ["emerald", "cyan", "violet", "amber", "rose", "blue"];

export function topicColor(slug: string): TopicColor {
  const known = KNOWN_COLORS[slug];
  if (known) return known;
  let hash = 0;
  for (const character of slug) hash = (hash * 31 + character.charCodeAt(0)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
