import { router, useLocalSearchParams } from "expo-router";

import { ProfileView } from "@/features/profile/profile-view";

export default function ProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();

  return (
    <ProfileView
      username={username}
      onOpenList={(list) =>
        router.push({ pathname: list === "followers" ? "/u/[username]/followers" : "/u/[username]/following", params: { username } })
      }
      onEditProfile={() => router.push("/profile/edit")}
      onEditStack={() => router.push("/profile/stack")}
      showPosts
    />
  );
}
