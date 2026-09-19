import { SymbolView, type SymbolViewProps } from "expo-symbols";

import { iconSize, type IconSizeToken } from "@/theme";

const symbols = {
  back: { ios: "chevron.left", android: "arrow_back" },
  forward: { ios: "arrow.right", android: "arrow_forward" },
  show: { ios: "eye", android: "visibility" },
  hide: { ios: "eye.slash", android: "visibility_off" },
  verified: { ios: "checkmark.seal.fill", android: "verified" },
  logout: { ios: "rectangle.portrait.and.arrow.right", android: "logout" },
  offline: { ios: "wifi.slash", android: "wifi_off" },
  liked: { ios: "heart.fill", android: "favorite" },
  like: { ios: "heart", android: "favorite_border" },
  reply: { ios: "bubble.left", android: "chat_bubble_outline" },
  repost: { ios: "arrow.2.squarepath", android: "repeat" },
  success: { ios: "checkmark.circle.fill", android: "check_circle" },
  error: { ios: "exclamationmark.circle.fill", android: "error" },
  info: { ios: "info.circle.fill", android: "info" },
  code: { ios: "chevron.left.forwardslash.chevron.right", android: "code" },
  terminal: { ios: "terminal", android: "terminal" },
  mail: { ios: "envelope.fill", android: "mail" },
  lock: { ios: "lock.fill", android: "lock" },
  spark: { ios: "sparkles", android: "auto_awesome" },
  bell: { ios: "bell.badge.fill", android: "notifications_active" },
  bellOff: { ios: "bell.slash.fill", android: "notifications_off" },
} as const satisfies Record<string, Extract<SymbolViewProps["name"], object>>;

export type IconName = keyof typeof symbols;

type IconProps = {
  name: IconName;
  color: string;
  size?: IconSizeToken;
};

export function Icon({ name, color, size = "md" }: IconProps) {
  return <SymbolView name={symbols[name]} tintColor={color} size={iconSize[size]} />;
}
