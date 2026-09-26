import { useRef } from "react";
import { FlatList, Image, ScrollView, Text, View } from "react-native";

export type SharedValue<T> = { value: T; get: () => T; set: (next: T) => void };

function sharedValue<T>(initial: T): SharedValue<T> {
  const shared = {
    value: initial,
    get: () => shared.value,
    set: (next: T) => {
      shared.value = next;
    },
  };
  return shared;
}

function createAnimatedComponent<T>(component: T): T {
  return component;
}

const Animated = { View, Text, ScrollView, FlatList, Image, createAnimatedComponent };

export default Animated;

export const Extrapolation = { CLAMP: "clamp", EXTEND: "extend", IDENTITY: "identity" } as const;

export const Easing = {
  linear: (t: number) => t,
  ease: (t: number) => t,
  quad: (t: number) => t,
  cubic: (t: number) => t,
  bezier: () => (t: number) => t,
  in: (easing: (t: number) => number) => easing,
  out: (easing: (t: number) => number) => easing,
  inOut: (easing: (t: number) => number) => easing,
};

export function cubicBezier(): (t: number) => number {
  return (t) => t;
}

export function useSharedValue<T>(initial: T): SharedValue<T> {
  return useRef(sharedValue(initial)).current;
}

export function useAnimatedStyle<T>(updater: () => T): T {
  return updater();
}

export function useAnimatedRef<T>(): React.RefObject<T | null> {
  return useRef<T>(null);
}

export function useAnimatedScrollHandler(): () => void {
  return () => {};
}

export function withTiming<T>(value: T): T {
  return value;
}

export function withSpring<T>(value: T): T {
  return value;
}

export function withSequence<T>(...values: T[]): T {
  return values[values.length - 1];
}

export function interpolate(value: number, input: number[], output: number[]): number {
  const [inStart, inEnd] = [input[0], input[input.length - 1]];
  const [outStart, outEnd] = [output[0], output[output.length - 1]];
  if (inEnd === inStart) return outStart;
  const ratio = Math.min(1, Math.max(0, (value - inStart) / (inEnd - inStart)));
  return outStart + ratio * (outEnd - outStart);
}

export function useReducedMotion(): boolean {
  return true;
}
