import { useState, type ReactNode } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { cubicBezier } from "react-native-reanimated";

import { haptics } from "@/feedback/haptics";
import { hitSlop, useMotion } from "@/theme";

const EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);

type PressableScaleProps = Omit<PressableProps, "style" | "children"> & {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  haptic?: boolean;
};

export function PressableScale({ style, children, haptic = true, disabled, onPressIn, onPressOut, ...rest }: PressableScaleProps) {
  const { press, duration } = useMotion();
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      hitSlop={hitSlop}
      pressRetentionOffset={hitSlop}
      onPressIn={(event) => {
        setPressed(true);
        if (haptic) haptics.tap();
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        onPressOut?.(event);
      }}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale: pressed && !disabled ? press.scale : 1 }],
            transitionProperty: "transform",
            transitionDuration: duration.fast,
            transitionTimingFunction: EASE_OUT,
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
