import { Text } from "react-native";
import { Button, Card, Screen, State, styles } from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import { api } from "@/services/api";
import type { Notification } from "@/types";
import { formatDate } from "@/utils/format";
export default function Page() {
  const r = useLoad(
    () => api<{ notifications: Notification[] }>("/api/notifications?limit=20"),
    [],
  );
  async function all() {
    await api("/api/notifications/read-all", { method: "PATCH" });
    r.reload();
  }
  return (
    <Screen>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.muted}>Updates about your Cityzen activity.</Text>
      <Button
        title="Mark all as read"
        variant="outline"
        onPress={() => void all()}
      />
      {r.loading ? (
        <State loading message="Loading notifications…" />
      ) : r.data?.notifications.length ? (
        r.data.notifications.map((n) => (
          <Card key={n.id}>
            <Text style={{ fontWeight: n.isRead ? "600" : "900" }}>
              {n.title}
            </Text>
            <Text>{n.message}</Text>
            <Text style={styles.muted}>
              {formatDate(n.createdAt)} · {n.isRead ? "Read" : "Unread"}
            </Text>
          </Card>
        ))
      ) : (
        <State message={r.error || "No notifications yet."} />
      )}
    </Screen>
  );
}
