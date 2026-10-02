import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, spacing } from "@/constants/theme";

export function Screen({
  children,
  scroll = true,
  style,
  ...props
}: ViewProps & { scroll?: boolean }) {
  const body = (
    <View {...props} style={[styles.body, style]}>
      {children}
    </View>
  );
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}
export function Button({
  title,
  onPress,
  disabled = false,
  variant = "primary",
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "outline" | "danger";
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "outline" && styles.outline,
        variant === "danger" && styles.danger,
        (pressed || disabled) && { opacity: 0.6 },
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === "outline" && { color: colors.ink },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#94A3B8"
        style={styles.input}
        {...props}
      />
    </View>
  );
}
export function Card({ children, style, ...props }: ViewProps) {
  return (
    <View {...props} style={[styles.card, style]}>
      {children}
    </View>
  );
}
export function PageHeading({
  title,
  subtitle,
  eyebrow = "CITYZEN",
}: {
  title: string;
  subtitle: string;
  eyebrow?: string;
}) {
  return (
    <View style={{ gap: 7, paddingVertical: 8 }}>
      <Text
        style={{
          color: colors.primary,
          fontWeight: "800",
          fontSize: 11,
          letterSpacing: 2,
        }}
      >
        {eyebrow}
      </Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.muted}>{subtitle}</Text>
    </View>
  );
}
export function StatusBadge({ value }: { value: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>
        {value
          .replaceAll("_", " ")
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase())}
      </Text>
    </View>
  );
}
export function State({
  message,
  loading = false,
  action,
}: {
  message: string;
  loading?: boolean;
  action?: () => void;
}) {
  return (
    <View style={styles.state}>
      {loading && <ActivityIndicator color={colors.primary} />}
      <Text style={styles.muted}>{message}</Text>
      {action && <Button title="Retry" onPress={action} variant="outline" />}
    </View>
  );
}
export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1 },
  body: { flex: 1, padding: spacing.md, gap: spacing.md },
  title: { fontSize: 30, fontWeight: "800", color: colors.ink },
  heading: { fontSize: 20, fontWeight: "800", color: colors.ink },
  muted: { fontSize: 14, lineHeight: 21, color: colors.muted },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 8,
  },
  button: {
    minHeight: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  outline: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  danger: { backgroundColor: colors.danger },
  buttonText: { color: "white", fontWeight: "800", fontSize: 15 },
  label: { fontWeight: "700", color: colors.ink },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: "white",
    paddingHorizontal: 14,
    color: colors.ink,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#CCFBF1",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: { color: colors.primaryDark, fontWeight: "800", fontSize: 12 },
  state: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
});
