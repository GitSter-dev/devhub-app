import { View } from "react-native";

import { AppText } from "@/components/app-text";
import { BlinkingCursor } from "@/components/blinking-cursor";
import { spacing } from "@/theme";

import { MockPost } from "./mock-post";
import { StaticLikes } from "./static-likes";
import { useTypewriter } from "./use-typewriter";

const SNIPPET = "const feed = await devhub\n  .follow([\"rust\", \"expo\"])\n  .stream();";

export function FeedSlide({ active }: { active: boolean }) {
  const typed = useTypewriter(SNIPPET, active);

  return (
    <View style={{ gap: spacing.md }}>
      <MockPost
        name="Grace Hopper"
        handle="grace"
        age="2m"
        text="Rewrote our sync engine around streams. The whole feed pipeline is now three lines:"
        code={
          <View style={{ flexDirection: "row", alignItems: "flex-end", flexWrap: "wrap" }}>
            <AppText variant="code" tone="secondary">
              {typed}
            </AppText>
            <BlinkingCursor height={14} />
          </View>
        }
        likes={<StaticLikes count={128} />}
        replies={24}
        reposts={12}
      />
      <MockPost
        name="Linus T."
        handle="linus_t"
        age="1h"
        text="Hot take: the best code review comment is a failing test."
        likes={<StaticLikes count={342} />}
        replies={87}
        reposts={40}
      />
    </View>
  );
}
