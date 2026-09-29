import type { ReactNode } from "react";
import { KeyboardAvoidingView as NativeKeyboardAvoidingView, ScrollView } from "react-native";

export function KeyboardProvider({ children }: { children?: ReactNode }): ReactNode {
  return children;
}

export const KeyboardAwareScrollView = ScrollView;

export const KeyboardAvoidingView = NativeKeyboardAvoidingView;
