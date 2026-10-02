import { LocationCard } from "@/components/LocationCard";
import { useLocalSearchParams } from "expo-router";
import { Text, View, Image } from "react-native";
import { Card, Screen, State, StatusBadge, styles } from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import { api, mediaUrl } from "@/services/api";
import type { Report } from "@/types";
import { formatDate } from "@/utils/format";
export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    result = useLoad(() => api<{ report: Report }>(`/api/reports/${id}`), [id]);
  if (result.loading) return <State loading message="Loading report…" />;
  if (!result.data)
    return (
      <State
        message={result.error || "Report not found"}
        action={result.reload}
      />
    );
  const r = result.data.report;
  return (
    <Screen>
      <StatusBadge value={r.status} />
      <Text style={styles.title}>{r.title}</Text>
      <Text style={styles.muted}>
        {r.category.name} · {formatDate(r.createdAt)}
      </Text>
      <Card>
        <Text style={styles.heading}>Description</Text>
        <Text style={{ lineHeight: 22 }}>{r.description}</Text>
      </Card>
      {r.images.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {r.images.map((x) => (
            <Image
              key={x.id}
              source={{ uri: mediaUrl(x.imageUrl) }}
              style={{ width: "47%", height: 140, borderRadius: 14 }}
            />
          ))}
        </View>
      )}
      <LocationCard
        title={r.title}
        latitude={r.latitude}
        longitude={r.longitude}
        address={r.addressText}
      />
      <Text style={styles.heading}>Timeline</Text>
      {r.statusHistory?.map((h) => (
        <View
          key={h.id}
          style={{
            borderLeftWidth: 3,
            borderColor: "#14B8A6",
            paddingLeft: 14,
            paddingBottom: 18,
          }}
        >
          <Text style={{ fontWeight: "800" }}>
            {h.newStatus.replaceAll("_", " ")}
          </Text>
          <Text style={styles.muted}>{formatDate(h.createdAt)}</Text>
          {h.note && <Text>{h.note}</Text>}
        </View>
      ))}
    </Screen>
  );
}
