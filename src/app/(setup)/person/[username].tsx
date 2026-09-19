import { useLocalSearchParams } from "expo-router";

import { ProfileView } from "@/features/profile/profile-view";

export default function SetupProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  return <ProfileView username={username} />;
}
