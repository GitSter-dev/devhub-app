import { Tabs } from "expo-router";
import type { ColorValue } from "react-native";

import { useUnreadTotal } from "@/chat/chat-queries";
import { AppText } from "@/components/app-text";
import { Icon, type IconName } from "@/components/icon";
import { useUnseenNotifications } from "@/features/notifications/notification-queries";
import { useTheme } from "@/theme";

function tabIcon(name: IconName) {
  function TabIcon({ color }: { color: ColorValue }) {
    return <Icon name={name} color={String(color)} size="lg" />;
  }
  return TabIcon;
}

function TabLabel({ color, children }: { color: ColorValue; children: string }) {
  return (
    <AppText variant="caption" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} center style={{ color }}>
      {children}
    </AppText>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  const unread = useUnreadTotal();
  const unseen = useUnseenNotifications();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarLabel: TabLabel,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: { backgroundColor: colors.backgroundSurface, borderTopColor: colors.border },
        tabBarBadgeStyle: { backgroundColor: colors.accentSolid, color: colors.onAccentSolid },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: tabIcon("home") }} />
      <Tabs.Screen name="search" options={{ title: "Search", tabBarIcon: tabIcon("search") }} />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Activity",
          tabBarIcon: tabIcon("notifications"),
          tabBarBadge: unseen > 0 ? (unseen > 99 ? "99+" : unseen) : undefined,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: tabIcon("chat"),
          tabBarBadge: unread > 0 ? (unread > 99 ? "99+" : unread) : undefined,
        }}
      />
      <Tabs.Screen name="profile" options={{ title: "You", tabBarIcon: tabIcon("person") }} />
    </Tabs>
  );
}
