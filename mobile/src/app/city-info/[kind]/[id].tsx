import { Stack, useLocalSearchParams } from "expo-router";
import { Image, Linking, Text, View } from "react-native";
import { useState } from "react";
import {
  Button,
  Card,
  Screen,
  State,
  StatusBadge,
  styles,
} from "@/components/ui";
import { cityContent, type CityContentKind } from "@/constants/cityContent";
import { colors } from "@/constants/theme";
import { useLoad } from "@/hooks/useLoad";
import { api, mediaUrl } from "@/services/api";
import type { CityContentItem } from "@/types/cityContent";
import { formatDate } from "@/utils/format";
import { LocationCard } from "@/components/LocationCard";

export default function CityDetail() {
  const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>();
  if (!Object.hasOwn(cityContent, kind) || !/^\d+$/.test(id) || Number(id) < 1)
    return (
      <Screen>
        <State message="This page could not be found." />
      </Screen>
    );
  return <Detail key={kind + id} kind={kind as CityContentKind} id={id} />;
}
function Detail({ kind, id }: { kind: CityContentKind; id: string }) {
  const config = cityContent[kind];
  const result = useLoad(
    () => api<Record<string, CityContentItem>>(`${config.endpoint}/${id}`),
    [],
  );
  const item = result.data?.[config.key];
  return (
    <Screen>
      <Stack.Screen options={{ title: config.label }} />
      {result.loading ? (
        <State loading message="Loading details…" />
      ) : result.error || !item ? (
        <State
          message={result.error || "This item is no longer available."}
          action={result.reload}
        />
      ) : (
        <Content item={item} kind={kind} />
      )}
    </Screen>
  );
}
function Info({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return value === undefined || value === null || value === "" ? null : (
    <View style={{ gap: 4 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "800",
          color: colors.muted,
          letterSpacing: 1,
        }}
      >
        {label.toUpperCase()}
      </Text>
      <Text
        selectable
        style={{ fontSize: 16, lineHeight: 24, color: colors.ink }}
      >
        {value}
      </Text>
    </View>
  );
}
const nice = (value: string) =>
  value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
function Website({ url, label }: { url: string; label: string }) {
  const [error, setError] = useState("");
  if (!/^https?:\/\//i.test(url)) return null;
  return (
    <View style={{ gap: 8 }}>
      <Button
        variant="outline"
        title={label + " ↗"}
        onPress={() => {
          void Linking.openURL(url).catch(() =>
            setError("This link could not be opened."),
          );
        }}
      />
      {!!error && (
        <Text accessibilityRole="alert" style={styles.muted}>
          {error}
        </Text>
      )}
    </View>
  );
}
function Content({
  item,
  kind,
}: {
  item: CityContentItem;
  kind: CityContentKind;
}) {
  const title = item.title || item.name || cityContent[kind].label;
  const body = item.content || item.description || item.message;
  const photos = item.imageUrl
    ? [{ id: 0, imageUrl: item.imageUrl }]
    : item.images || [];
  const dates = [
    ["Published", item.publishedAt],
    ["Starts", item.startsAt],
    ["Ends", item.endsAt],
    ["Expires", item.expiresAt],
    ["Last synced", item.lastSyncedAt],
  ] as const;
  return (
    <>
      {photos.map((photo) => (
        <Image
          key={photo.id}
          source={{ uri: mediaUrl(photo.imageUrl) }}
          accessibilityLabel={title}
          resizeMode="cover"
          style={{ height: 220, width: "100%", borderRadius: 20 }}
        />
      ))}
      <View
        style={{
          backgroundColor: colors.navy,
          borderRadius: 22,
          padding: 22,
          gap: 12,
        }}
      >
        <Text style={{ color: colors.accent, fontWeight: "800" }}>
          {item.department?.name || "Cityzen · City information"}
        </Text>
        <Text style={[styles.title, { color: "white", fontSize: 27 }]}>
          {title}
        </Text>
        {item.status && <StatusBadge value={item.status} />}
      </View>
      {!!body && (
        <Card>
          <Text
            selectable
            style={{ color: colors.ink, fontSize: 16, lineHeight: 26 }}
          >
            {body}
          </Text>
        </Card>
      )}
      <Card>
        <Info label="Category" value={item.category?.name} />
        <Info label="Type" value={item.type ? nice(item.type) : undefined} />
        <Info
          label="Severity"
          value={item.severity ? nice(item.severity) : undefined}
        />
        {dates.map(
          ([label, value]) =>
            value && (
              <Info key={label} label={label} value={formatDate(value)} />
            ),
        )}
        {!item.publishedAt && !item.startsAt && item.createdAt && (
          <Info label="Added" value={formatDate(item.createdAt)} />
        )}
        <Info label="Location" value={item.locationName} />
        <Info label="Opening hours" value={item.openingHours} />
        <Info label="Phone" value={item.phone} />
        <Info label="Email" value={item.email} />
        {kind === "parking" && (
          <>
            <Info
              label="Availability"
              value={
                item.availableSpaces == null
                  ? "Live availability unavailable"
                  : `${item.availableSpaces} spaces available`
              }
            />
            <Info label="Total spaces" value={item.totalSpaces} />
            <Info label="Accessible spaces" value={item.accessibleSpaces} />
            <Info label="EV charging spaces" value={item.evChargingSpaces} />
            <Info
              label="Hourly price"
              value={
                item.hourlyPrice == null
                  ? null
                  : `${item.hourlyPrice} ${item.currency || ""}`
              }
            />
          </>
        )}
        {!!item.acceptedTypes?.length && (
          <Info
            label="Accepted waste"
            value={item.acceptedTypes.map((t) => nice(t.wasteType)).join(", ")}
          />
        )}
        <Info
          label="Community support"
          value={
            item.upvoteCount == null ? null : `${item.upvoteCount} upvotes`
          }
        />
        <Info
          label="Source"
          value={
            item.source === "OPENSTREETMAP"
              ? "© OpenStreetMap contributors (not live data)"
              : item.source
                ? nice(item.source)
                : undefined
          }
        />
      </Card>
      <LocationCard
        title={title}
        latitude={item.latitude}
        longitude={item.longitude}
        address={item.address || item.addressText}
        approximate={kind === "community"}
      />
      {!!item.statusHistory?.length && (
        <Card>
          <Text style={styles.heading}>Status history</Text>
          {item.statusHistory.map((entry) => (
            <View key={entry.id} style={{ gap: 6, paddingVertical: 8 }}>
              <StatusBadge value={entry.newStatus} />
              <Text style={styles.muted}>{formatDate(entry.createdAt)}</Text>
              {!!entry.note && <Text style={styles.muted}>{entry.note}</Text>}
            </View>
          ))}
        </Card>
      )}
      {item.source === "OPENSTREETMAP" && (
        <Website
          url="https://www.openstreetmap.org/copyright"
          label="OpenStreetMap attribution"
        />
      )}
      {!!(item.externalUrl || item.website) && (
        <Website
          url={(item.externalUrl || item.website)!}
          label="Official website"
        />
      )}
      {!!item.sourceUrl && (
        <Website url={item.sourceUrl} label="Original source" />
      )}
    </>
  );
}
