import { useEffect, useState } from "react";
import { useSharedValue } from "react-native-reanimated";

import { LikeControl, playLikeBurst } from "@/features/posts/like-control";
import { useMotion } from "@/theme";

const AUTO_LIKE_DELAY_MS = 900;

export function LikeButton({ baseCount, autoLike }: { baseCount: number; autoLike: boolean }) {
  const { spring, duration } = useMotion();
  const [liked, setLiked] = useState(false);
  const scale = useSharedValue(1);

  const squashMs = duration.fast / 2;
  const bouncy = spring.bouncy;

  useEffect(() => {
    if (!autoLike) return;
    const timer = setTimeout(() => {
      setLiked(true);
      playLikeBurst(scale, squashMs, bouncy);
    }, AUTO_LIKE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [autoLike, scale, squashMs, bouncy]);

  return (
    <LikeControl liked={liked} count={baseCount + (liked ? 1 : 0)} scale={scale} onToggle={() => setLiked((value) => !value)} />
  );
}
