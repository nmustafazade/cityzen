import { router } from "expo-router";
import { FlatList, Pressable, RefreshControl, Text } from "react-native";
import {
  Button,
  Card,
  Screen,
  State,
  StatusBadge,
  styles,
} from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import { api } from "@/services/api";
import type { PageMeta, Report } from "@/types";
import { formatDate } from "@/utils/format";
export default function Reports() {
  const result = useLoad(
    () =>
      api<{ reports: Report[]; pagination: PageMeta }>(
        "/api/reports/my?limit=20",
      ),
    [],
  );
  if (result.loading) return <State loading message="Loading your reports…" />;
  return (
    <Screen scroll={false}>
      <Text style={styles.title}>My Reports</Text>
      <Text style={styles.muted}>
        Track issues you have reported to the city.
      </Text>
      <Button
        title="Report an Issue"
        onPress={() => router.push("/reports/new")}
      />
      {result.error ? (
        <State message={result.error} action={result.reload} />
      ) : (
        <FlatList
          data={result.data?.reports ?? []}
          refreshControl={
            <RefreshControl
              refreshing={result.refreshing}
              onRefresh={result.reload}
            />
          }
          contentContainerStyle={{ gap: 12, paddingVertical: 8 }}
          ListEmptyComponent={
            <State message="No reports yet. Report your first city issue." />
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/reports/${item.id}`)}>
              <Card>
                <Text style={styles.heading}>{item.title}</Text>
                <Text style={styles.muted}>
                  {item.category.name} · {formatDate(item.createdAt)}
                </Text>
                <StatusBadge value={item.status} />
                <Text style={styles.muted}>
                  {item.addressText || "Location not provided"}
                </Text>
              </Card>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}
