import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Platform, Text, View } from "react-native";
import MapView, { Marker, UrlTile } from "react-native-maps";
import { Button, Field, Screen, styles } from "@/components/ui";
import { api } from "@/services/api";
export default function Page() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    [description, setDescription] = useState(""),
    [address, setAddress] = useState(""),
    [phone, setPhone] = useState(""),
    [preferredDate, setPreferredDate] = useState(""),
    [point, setPoint] = useState<{
      latitude: number;
      longitude: number;
    } | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit() {
    if (busy) return;
    if (
      !description.trim() ||
      !address.trim() ||
      !phone.trim() ||
      !point ||
      !preferredDate.trim()
    ) {
      setError(
        "Enter the description, address, phone, appointment date, and select a map location.",
      );
      return;
    }
    const appointmentDate = new Date(preferredDate);
    if (Number.isNaN(appointmentDate.getTime())) {
      setError("Enter a valid appointment date, for example 2026-10-05T09:00.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const r = await api<{ request: { id: number } }>(
        "/api/service-requests",
        {
          method: "POST",
          body: {
            serviceId: Number(id),
            description: description.trim(),
            address: address.trim(),
            contactPhone: phone.trim(),
            preferredDate: appointmentDate.toISOString(),
            latitude: point.latitude,
            longitude: point.longitude,
          },
        },
      );
      router.replace(`/service-requests/${r.request.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to submit request");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Text style={styles.title}>Request Service</Text>
      <Text style={styles.muted}>
        Describe what you need from this municipal service.
      </Text>
      <Field
        label="Description *"
        multiline
        numberOfLines={6}
        value={description}
        onChangeText={setDescription}
      />
      <Field label="Address *" value={address} onChangeText={setAddress} />
      <Field
        label="Contact phone *"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      <Field
        label="Appointment date *"
        placeholder="YYYY-MM-DDTHH:mm (e.g. 2026-10-05T09:00)"
        value={preferredDate}
        onChangeText={setPreferredDate}
        autoCapitalize="none"
      />
      <Text style={styles.heading}>Location *</Text>
      <Text style={styles.muted}>
        Tap the map to select where the service is needed. Drag the marker to
        adjust it.
      </Text>
      <View style={{ height: 300, borderRadius: 16, overflow: "hidden" }}>
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: 40.4093,
            longitude: 49.8671,
            latitudeDelta: 0.15,
            longitudeDelta: 0.15,
          }}
          mapType={Platform.OS === "android" ? "none" : "standard"}
          onPress={(event) => {
            if (!busy) setPoint(event.nativeEvent.coordinate);
          }}
          accessibilityLabel="Select service request location"
        >
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
          />
          {point && (
            <Marker
              coordinate={point}
              draggable={!busy}
              onDragEnd={(event) => setPoint(event.nativeEvent.coordinate)}
            />
          )}
        </MapView>
      </View>
      <Text style={styles.muted}>
        {point
          ? `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`
          : "No location selected."}
      </Text>
      <Text style={styles.muted}>© OpenStreetMap contributors</Text>
      {error ? <Text style={{ color: "#BE123C" }}>{error}</Text> : null}
      <Button
        title={busy ? "Submitting…" : "Submit Request"}
        disabled={busy || !description.trim()}
        onPress={() => void submit()}
      />
    </Screen>
  );
}
