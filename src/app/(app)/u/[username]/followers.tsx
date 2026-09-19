import { useLocalSearchParams } from "expo-router";

import { FollowListScreen } from "@/features/profile/follow-list-screen";

export default function FollowersScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  return <FollowListScreen username={username} list="followers" />;
}
