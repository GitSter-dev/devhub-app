import { useEffect, useState } from "react";

import { useMotion } from "@/theme";

export function useTypewriter(text: string, active: boolean, charactersPerTick = 1, tickMs = 32): string {
  const { reduced } = useMotion();
  const [length, setLength] = useState(0);
  const done = length >= text.length;

  useEffect(() => {
    if (!active || reduced || done) return;
    const timer = setInterval(() => setLength((value) => Math.min(text.length, value + charactersPerTick)), tickMs);
    return () => clearInterval(timer);
  }, [active, reduced, done, text.length, charactersPerTick, tickMs]);

  return reduced ? text : text.slice(0, length);
}
