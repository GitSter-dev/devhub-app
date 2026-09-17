import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  componentRadius,
  continuous,
  iconSize,
  layoutSpacing,
  maxContentWidth,
  minTouchTarget,
  radius,
  spacing,
  type,
  useMotion,
  useTheme,
  useThemePreference,
  type ThemePreference,
  type TopicColor,
} from "@/theme";
// The one deliberate reach past the barrel: this screen exists to show the raw
// ramps. Nothing else in the app may do this — and this screen is temporary.
import { emerald, ink } from "@/theme/palette";

/* ------------------------------------------------------------------ contrast */

/** sRGB channel -> linear light. */
function toLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Parses #RRGGBB and rgba(r,g,b,a), compositing any alpha over `backdrop`. */
function toRgb(color: string, backdrop?: string): [number, number, number] | null {
  const hex = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  const rgba = /^rgba?\(([^)]+)\)$/i.exec(color.trim());
  if (!rgba) return null;

  const parts = rgba[1].split(",").map((p) => parseFloat(p));
  if (parts.length < 3 || parts.some(Number.isNaN)) return null;

  const [r, g, b] = parts;
  const alpha = parts.length > 3 ? parts[3] : 1;
  if (alpha >= 1) return [r, g, b];

  const base = backdrop ? toRgb(backdrop) : null;
  if (!base) return null;
  return [
    r * alpha + base[0] * (1 - alpha),
    g * alpha + base[1] * (1 - alpha),
    b * alpha + base[2] * (1 - alpha),
  ];
}

function luminance(rgb: [number, number, number]): number {
  return 0.2126 * toLinear(rgb[0]) + 0.7152 * toLinear(rgb[1]) + 0.0722 * toLinear(rgb[2]);
}

/** WCAG 2.1 contrast ratio, or null if either color can't be parsed. */
function contrast(foreground: string, background: string): number | null {
  const fg = toRgb(foreground, background);
  const bg = toRgb(background);
  if (!fg || !bg) return null;
  const [light, dark] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

/* -------------------------------------------------------------------- screen */

export default function DesignSystemScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, shadows } = theme;

  return (
    <ScrollView
      style={{ backgroundColor: colors.backgroundCanvas }}
      contentContainerStyle={[
        styles.page,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.giant },
      ]}
    >
      <View style={styles.column}>
        <Text style={[type.overline, styles.uppercase, { color: colors.accent }]}>DevHub</Text>
        <Text style={[type.title1, { color: colors.textPrimary, marginTop: spacing.xs }]}>
          Design tokens
        </Text>
        <Text style={[type.callout, { color: colors.textSecondary, marginTop: spacing.sm }]}>
          Every value below is read from `@/theme`. Contrast ratios are computed live from the
          token values themselves, not copied from a spec.
        </Text>

        <SchemeSwitcher />

        <Section title="Semantic roles" caption="Text roles are measured against the surface they sit on.">
          <Swatches />
        </Section>

        <Section title="Brand ramp" caption="emerald — 400/500 carry dark, 700 carries light.">
          <Ramp values={emerald} />
        </Section>

        <Section title="Neutral ramp" caption="ink — cool, faintly green, dark end tuned for OLED.">
          <Ramp values={ink} />
        </Section>

        <Section title="Type ramp" caption="Inter for prose, JetBrains Mono for identifiers and counts.">
          <TypeRamp />
        </Section>

        <Section title="A post, assembled" caption="The ramp and roles doing their actual job.">
          <PostPreview />
        </Section>

        <Section title="Topics" caption="Six categorical hues for language and tag chips.">
          <Topics />
        </Section>

        <Section title="Spacing" caption="4-point grid. Screen inset is `base` (16).">
          <SpacingRuler />
        </Section>

        <Section title="Radius" caption="Each paired with borderCurve: continuous.">
          <RadiusRuler />
        </Section>

        <Section title="Elevation" caption="boxShadow strings, authored per scheme.">
          <View style={{ gap: spacing.md }}>
            {(["sm", "md", "lg", "accent"] as const).map((level) => (
              <View
                key={level}
                style={[
                  styles.shadowTile,
                  continuous,
                  {
                    backgroundColor: colors.backgroundElevated,
                    borderColor: colors.border,
                    boxShadow: shadows[level],
                  },
                ]}
              >
                <Text style={[type.subhead, { color: colors.textPrimary }]}>shadows.{level}</Text>
                <Text style={[type.code, { color: colors.textTertiary }]}>{shadows[level]}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Motion" caption="Press and hold. Under Reduce Motion these resolve instantly.">
          <MotionDemo />
        </Section>
      </View>
    </ScrollView>
  );
}

/* ---------------------------------------------------------------- components */

function Section({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: layoutSpacing.sectionGap }}>
      <Text style={[type.title3, { color: colors.textPrimary }]}>{title}</Text>
      <Text
        style={[type.footnote, { color: colors.textTertiary, marginTop: spacing.xxs, marginBottom: spacing.base }]}
      >
        {caption}
      </Text>
      {children}
    </View>
  );
}

function SchemeSwitcher() {
  const { colors } = useTheme();
  const { preference, setPreference } = useThemePreference();
  const options: ThemePreference[] = ["system", "light", "dark"];

  return (
    <View
      style={[
        styles.segmented,
        continuous,
        { backgroundColor: colors.backgroundSunken, borderColor: colors.border },
      ]}
    >
      {options.map((option) => {
        const active = preference === option;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Appearance: ${option}`}
            onPress={() => setPreference(option)}
            style={({ pressed }) => [
              styles.segment,
              continuous,
              {
                backgroundColor: active ? colors.accentSolid : "transparent",
                opacity: pressed && !active ? 0.6 : 1,
              },
            ]}
          >
            <Text
              style={[
                type.subhead,
                { color: active ? colors.onAccentSolid : colors.textSecondary },
              ]}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Roles worth eyeballing, each with the background it's contractually read against. */
function Swatches() {
  const { colors } = useTheme();

  const textRoles = [
    ["textPrimary", colors.textPrimary],
    ["textSecondary", colors.textSecondary],
    ["textTertiary", colors.textTertiary],
    ["textDisabled", colors.textDisabled],
    ["accent", colors.accent],
    ["danger", colors.danger],
    ["warning", colors.warning],
    ["success", colors.success],
    ["info", colors.info],
  ] as const;

  const fills = [
    ["accentSolid", colors.accentSolid, colors.onAccentSolid],
    ["dangerSolid", colors.dangerSolid, colors.onDangerSolid],
    ["warningSolid", colors.warningSolid, colors.onWarningSolid],
    ["successSolid", colors.successSolid, colors.onSuccessSolid],
    ["infoSolid", colors.infoSolid, colors.onInfoSolid],
  ] as const;

  const surfaces = [
    ["backgroundCanvas", colors.backgroundCanvas],
    ["backgroundSurface", colors.backgroundSurface],
    ["backgroundElevated", colors.backgroundElevated],
    ["backgroundSunken", colors.backgroundSunken],
    ["border", colors.border],
    ["borderStrong", colors.borderStrong],
  ] as const;

  return (
    <View style={{ gap: spacing.sm }}>
      {textRoles.map(([name, value]) => (
        <Row
          key={name}
          name={name}
          value={value}
          sample={<Text style={[type.body, { color: value }]}>Aa</Text>}
          sampleBackground={colors.backgroundSurface}
          ratio={contrast(value, colors.backgroundSurface)}
          floor={name === "textDisabled" ? null : 4.5}
        />
      ))}

      {fills.map(([name, value, on]) => (
        <Row
          key={name}
          name={name}
          value={value}
          sample={<Text style={[type.subhead, { color: on }]}>Label</Text>}
          sampleBackground={value}
          ratio={contrast(on, value)}
          floor={4.5}
        />
      ))}

      {surfaces.map(([name, value]) => (
        <Row key={name} name={name} value={value} sampleBackground={value} />
      ))}
    </View>
  );
}

function Row({
  name,
  value,
  sample,
  sampleBackground,
  ratio,
  floor,
}: {
  name: string;
  value: string;
  sample?: ReactNode;
  sampleBackground: string;
  ratio?: number | null;
  floor?: number | null;
}) {
  const { colors } = useTheme();
  const passes = ratio != null && floor != null ? ratio >= floor : null;

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.chipSample,
          continuous,
          { backgroundColor: sampleBackground, borderColor: colors.border },
        ]}
      >
        {sample}
      </View>
      <View style={styles.rowText}>
        <Text style={[type.subhead, { color: colors.textPrimary }]}>{name}</Text>
        <Text style={[type.code, { color: colors.textTertiary }]}>{value}</Text>
      </View>
      {ratio != null && (
        <Text
          style={[
            type.metric,
            {
              color:
                passes == null
                  ? colors.textTertiary
                  : passes
                    ? colors.success
                    : colors.danger,
            },
          ]}
        >
          {ratio.toFixed(2)}:1{passes === false ? " ✕" : ""}
        </Text>
      )}
    </View>
  );
}

function Ramp({ values }: { values: Record<string | number, string> }) {
  const { colors } = useTheme();
  return (
    <View style={styles.ramp}>
      {Object.entries(values).map(([step, value]) => (
        <View key={step} style={styles.rampCell}>
          <View
            style={[
              styles.rampSwatch,
              continuous,
              { backgroundColor: value, borderColor: colors.border },
            ]}
          />
          <Text style={[type.metric, { color: colors.textTertiary }]}>{step}</Text>
        </View>
      ))}
    </View>
  );
}

function TypeRamp() {
  const { colors } = useTheme();
  const steps = Object.keys(type) as (keyof typeof type)[];

  return (
    <View style={{ gap: spacing.md }}>
      {steps.map((step) => {
        const style = type[step];
        return (
          <View key={step} style={{ gap: spacing.xxs }}>
            <Text style={[type.metric, { color: colors.textTertiary }]}>
              {step} · {style.fontSize}/{style.lineHeight}
            </Text>
            <Text
              style={[
                style,
                { color: colors.textPrimary },
                step === "overline" && styles.uppercase,
              ]}
            >
              Ship it before the standup
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** The tokens doing the job they were designed for. */
function PostPreview() {
  const { colors, shadows } = useTheme();

  return (
    <View
      style={[
        styles.post,
        continuous,
        {
          backgroundColor: colors.backgroundSurface,
          borderColor: colors.border,
          boxShadow: shadows.sm,
        },
      ]}
    >
      <View style={styles.postHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.backgroundAccentSubtle }]}>
          <Text style={[type.headline, { color: colors.accent }]}>A</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[type.headline, { color: colors.textPrimary }]}>Ada Lovelace</Text>
          <Text style={[type.handle, { color: colors.textTertiary }]}>@ada · 2h</Text>
        </View>
      </View>

      <Text style={[type.body, { color: colors.textPrimary, marginTop: spacing.md }]}>
        Shipped the Rust port today — 40% faster cold start, and the binary got smaller.
      </Text>

      <View
        style={[
          styles.code,
          continuous,
          { backgroundColor: colors.codeBackground, borderColor: colors.codeBorder },
        ]}
      >
        <Text style={[type.code, { color: colors.textSecondary }]}>cargo build --release</Text>
      </View>

      <View style={styles.metrics}>
        {[
          ["↑", "128"],
          ["↻", "12"],
          ["☰", "34"],
        ].map(([glyph, count]) => (
          <View key={glyph} style={styles.metric}>
            <Text style={[type.metric, { color: colors.textTertiary }]}>{glyph}</Text>
            <Text style={[type.metric, { color: colors.textSecondary }]}>{count}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Topics() {
  const { colors } = useTheme();
  const names = Object.keys(colors.topic) as TopicColor[];
  const labels: Record<TopicColor, string> = {
    emerald: "react-native",
    cyan: "typescript",
    violet: "ai",
    amber: "rust",
    rose: "design",
    blue: "devops",
  };

  return (
    <View style={styles.topics}>
      {names.map((name) => {
        const swatch = colors.topic[name];
        const ratio = contrast(swatch.fg, colors.backgroundSurface);
        return (
          <View
            key={name}
            style={[styles.topicChip, { backgroundColor: swatch.bg }]}
          >
            <Text style={[type.caption, { color: swatch.fg }]}>
              {labels[name]}
              {ratio ? `  ${ratio.toFixed(1)}:1` : ""}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function SpacingRuler() {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      {(Object.keys(spacing) as (keyof typeof spacing)[]).map((step) => (
        <View key={step} style={styles.rulerRow}>
          <Text style={[type.metric, styles.rulerLabel, { color: colors.textTertiary }]}>
            {step}
          </Text>
          <View
            style={{
              width: Math.max(spacing[step], 1),
              height: spacing.md,
              backgroundColor: colors.accent,
              borderRadius: radius.xs,
            }}
          />
          <Text style={[type.metric, { color: colors.textSecondary }]}>{spacing[step]}</Text>
        </View>
      ))}
    </View>
  );
}

function RadiusRuler() {
  const { colors } = useTheme();
  const entries = Object.entries(componentRadius) as [
    keyof typeof componentRadius,
    number,
  ][];

  return (
    <View style={styles.topics}>
      {entries.map(([name, value]) => (
        <View key={name} style={{ alignItems: "center", gap: spacing.xs }}>
          <View
            style={[
              styles.radiusTile,
              continuous,
              {
                borderRadius: value,
                backgroundColor: colors.backgroundAccentSubtle,
                borderColor: colors.borderAccentSubtle,
              },
            ]}
          />
          <Text style={[type.metric, { color: colors.textTertiary }]}>{name}</Text>
        </View>
      ))}
    </View>
  );
}

function MotionDemo() {
  const { colors } = useTheme();
  const { spring, press, reduced } = useMotion();
  const [springName, setSpringName] = useState<keyof typeof spring>("snappy");
  const scale = useSharedValue(1);

  // `.get()`/`.set()` rather than `.value`: React Compiler is enabled here, and
  // it treats a bare `.value` assignment as mutating something it owns.
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.topics}>
        {(Object.keys(spring) as (keyof typeof spring)[]).map((name) => {
          const active = name === springName;
          return (
            <Pressable
              key={name}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setSpringName(name)}
              style={[
                styles.topicChip,
                {
                  backgroundColor: active
                    ? colors.backgroundAccentSubtle
                    : colors.backgroundSunken,
                },
              ]}
            >
              <Text
                style={[
                  type.caption,
                  { color: active ? colors.accent : colors.textSecondary },
                ]}
              >
                {name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Animated.View style={animated}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Press to preview the ${springName} spring`}
          onPressIn={() => {
            scale.set(withSpring(press.scale, spring[springName]));
          }}
          onPressOut={() => {
            scale.set(withSpring(1, spring[springName]));
          }}
          style={[
            styles.cta,
            continuous,
            { backgroundColor: colors.accentSolid },
          ]}
        >
          <Text style={[type.subhead, { color: colors.onAccentSolid }]}>
            Press and hold
          </Text>
        </Pressable>
      </Animated.View>

      <Text style={[type.footnote, { color: colors.textTertiary }]}>
        Reduce Motion is {reduced ? "ON — springs resolve instantly" : "off"}.
      </Text>
    </View>
  );
}

/* --------------------------------------------------------------------- style */

// Layout only. Every color and every shadow is applied inline from the active
// theme, because those are the values that change with the scheme.
const styles = StyleSheet.create({
  page: {
    paddingHorizontal: layoutSpacing.screenX,
    alignItems: "center",
  },
  column: {
    width: "100%",
    maxWidth: maxContentWidth,
  },
  uppercase: {
    textTransform: "uppercase",
  },
  segmented: {
    flexDirection: "row",
    marginTop: spacing.lg,
    padding: spacing.xs,
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  segment: {
    flex: 1,
    minHeight: minTouchTarget - spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: minTouchTarget,
  },
  chipSample: {
    width: 56,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  rowText: {
    flex: 1,
    gap: spacing.xxs,
  },
  ramp: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  rampCell: {
    alignItems: "center",
    gap: spacing.xs,
  },
  rampSwatch: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  post: {
    padding: layoutSpacing.cardPadding,
    borderRadius: componentRadius.card,
    borderWidth: 1,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: componentRadius.avatar,
    alignItems: "center",
    justifyContent: "center",
  },
  code: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  metrics: {
    flexDirection: "row",
    gap: spacing.xl,
    marginTop: spacing.base,
  },
  metric: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: iconSize.lg,
  },
  topics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  topicChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: componentRadius.chip,
    minHeight: minTouchTarget - spacing.md,
    justifyContent: "center",
  },
  rulerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  rulerLabel: {
    width: 44,
  },
  radiusTile: {
    width: 64,
    height: 64,
    borderWidth: 1,
  },
  shadowTile: {
    padding: layoutSpacing.cardPadding,
    borderRadius: componentRadius.card,
    borderWidth: 1,
    gap: spacing.xs,
  },
  cta: {
    minHeight: minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    borderRadius: componentRadius.button,
    alignSelf: "flex-start",
  },
});
