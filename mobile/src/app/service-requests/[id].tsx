import { LocationCard } from "@/components/LocationCard";
import { useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import { Card, Screen, State, StatusBadge, styles } from "@/components/ui";
import { useLoad } from "@/hooks/useLoad";
import { api } from "@/services/api";
export default function Page() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    r = useLoad(
      () =>
        api<{
          request: {
            id: number;
            status: string;
            description: string;
            address: string | null;
            latitude: string | number | null;
            longitude: string | number | null;
            municipalityResponse: string | null;
            service: { title: string };
            department: { name: string };
            history: {
              id: number;
              newStatus: string;
              createdAt: string;
              note: string | null;
            }[];
          };
        }>(`/api/service-requests/${id}`),
      [id],
    );
  if (!r.data)
    return (
      <State loading={r.loading} message={r.error || "Loading request…"} />
    );
  const x = r.data.request;
  return (
    <Screen>
      <StatusBadge value={x.status} />
      <Text style={styles.title}>{x.service.title}</Text>
      <Text style={styles.muted}>
        {x.department.name} · SR-{String(x.id).padStart(6, "0")}
      </Text>
      <Card>
        <Text>{x.description}</Text>
      </Card>
      {x.municipalityResponse && (
        <Card>
          <Text style={styles.heading}>Municipality response</Text>
          <Text>{x.municipalityResponse}</Text>
        </Card>
      )}
      <LocationCard
        title={x.service.title}
        latitude={x.latitude}
        longitude={x.longitude}
        address={x.address}
      />
      <Text style={styles.heading}>Timeline</Text>
      {x.history.map((h) => (
        <Card key={h.id}>
          <StatusBadge value={h.newStatus} />
          {h.note && <Text>{h.note}</Text>}
        </Card>
      ))}
    </Screen>
  );
}
