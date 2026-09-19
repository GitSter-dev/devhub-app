import { useEffect, useState } from "react";

const TICK_MS = 1000;

export function useCountdown(seconds: number | null, restartKey: unknown = null): number {
  const [remaining, setRemaining] = useState(seconds ?? 0);

  useEffect(() => {
    const endsAt = Date.now() + (seconds ?? 0) * 1000;
    const update = () => setRemaining(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    update();
    const timer = setInterval(update, TICK_MS);
    return () => clearInterval(timer);
  }, [seconds, restartKey]);

  return remaining;
}
