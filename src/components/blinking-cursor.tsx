import { View } from "react-native";
import Animated from "react-native-reanimated";

import { useMotion, useThemeColors } from "@/theme";

const BLINK = { "0%": { opacity: 1 }, "50%": { opacity: 0 }, "100%": { opacity: 1 } };

export function BlinkingCursor({ height = 16 }: { height?: number }) {
  const colors = useThemeColors();
  const { reduced } = useMotion();

  return (
    <Animated.View
      style={
        reduced
          ? undefined
          : {
              animationName: BLINK,
              animationDuration: "1060ms",
              animationIterationCount: "infinite",
              animationTimingFunction: "step-end",
            }
      }
    >
      <View style={{ width: height / 2, height, backgroundColor: colors.accent }} />
    </Animated.View>
  );
}
