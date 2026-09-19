import { useState } from "react";

import { useCountdown } from "@/hooks/use-countdown";

const RESEND_COOLDOWN_SECONDS = 60;

export function useResendCooldown(): { remaining: number; restart: () => void } {
  const [round, setRound] = useState(0);
  const remaining = useCountdown(RESEND_COOLDOWN_SECONDS, round);
  return { remaining, restart: () => setRound((value) => value + 1) };
}
