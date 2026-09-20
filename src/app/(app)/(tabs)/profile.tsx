import { router } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { ProfileView } from "@/features/profile/profile-view";
import { useCurrentUser } from "@/session/use-session";
import { useThemeColors } from "@/theme";

export default function MyProfileScreen() {
  const colors = useThemeColors();
  const me = useCurrentUser().data;

  if (!me) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.backgroundCanvas }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ProfileView
      username={me.username}
      onOpenList={(list) =>
        router.push({
          pathname: list === "followers" ? "/u/[username]/followers" : "/u/[username]/following",
          params: { username: me.username },
        })
      }
      onEditProfile={() => router.push("/profile/edit")}
      onEditStack={() => router.push("/profile/stack")}
      onOpenSettings={() => router.push("/settings")}
      showBack={false}
      showPosts
    />
  );
}
