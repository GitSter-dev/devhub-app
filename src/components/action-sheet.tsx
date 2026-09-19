import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/app-text";
import { componentRadius, continuous, minTouchTarget, spacing, useThemeColors } from "@/theme";

export type SheetAction = {
  label: string;
  destructive?: boolean;
  onPress: () => void;
};

type ActionSheetProps = {
  visible: boolean;
  actions: SheetAction[];
  onClose: () => void;
};

export function ActionSheet({ visible, actions, onClose }: ActionSheetProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <Pressable style={[styles.scrim, { backgroundColor: colors.scrim }]} onPress={onClose} accessibilityLabel="Close menu" />
      <View
        style={[
          styles.sheet,
          continuous,
          { backgroundColor: colors.backgroundElevated, borderColor: colors.border, paddingBottom: insets.bottom + spacing.sm },
        ]}
      >
        {actions.map((action) => (
          <Pressable
            key={action.label}
            accessibilityRole="button"
            onPress={() => {
              onClose();
              action.onPress();
            }}
            style={({ pressed }) => [styles.action, pressed && { backgroundColor: colors.border }]}
          >
            <AppText variant="body" tone={action.destructive ? "danger" : "primary"}>
              {action.label}
            </AppText>
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: spacing.sm,
    borderTopLeftRadius: componentRadius.sheet,
    borderTopRightRadius: componentRadius.sheet,
    borderWidth: StyleSheet.hairlineWidth,
  },
  action: {
    minHeight: minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
});
