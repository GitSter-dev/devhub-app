import type { Suggestion } from "@/api/suggestions-api";
import { PersonRow } from "@/features/people/person-row";

const MAX_REASON_TOPICS = 3;

type SuggestionRowProps = {
  suggestion: Suggestion;
  following: boolean;
  onToggle: () => void;
  onOpen: () => void;
};

function reasonOf({ reason }: Suggestion): string {
  if (reason.type === "SHARED_TOPICS" && reason.topics.length > 0) {
    return `Also into ${reason.topics.slice(0, MAX_REASON_TOPICS).map((topic) => `#${topic}`).join(", ")}`;
  }
  return "Suggested for you";
}

export function SuggestionRow({ suggestion, following, onToggle, onOpen }: SuggestionRowProps) {
  return (
    <PersonRow
      person={suggestion.user}
      subtitle={reasonOf(suggestion)}
      following={following}
      onToggleFollow={onToggle}
      onOpen={onOpen}
    />
  );
}
