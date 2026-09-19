import { router } from "expo-router";
import { useEffect } from "react";

import type { PersonSummary } from "@/api/profiles-api";
import { haptics } from "@/feedback/haptics";
import { followSync, useFollowing } from "@/features/follows/follow-sync";
import { useCurrentUser } from "@/session/use-session";

import { PersonRow } from "./person-row";

export function ConnectedPersonRow({ person }: { person: PersonSummary }) {
  const me = useCurrentUser().data;
  const following = useFollowing().get(person.id) ?? person.following;

  useEffect(() => {
    followSync.seed(person.id, person.following);
  }, [person.id, person.following]);

  return (
    <PersonRow
      person={person}
      following={following}
      canFollow={me?.id !== person.id}
      onToggleFollow={() => {
        haptics.selection();
        followSync.toggle(person.id);
      }}
      onOpen={() => router.push({ pathname: "/u/[username]", params: { username: person.username } })}
    />
  );
}
