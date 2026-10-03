import { useRef, useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, UrlTile } from "react-native-maps";
import { Button, Card, styles } from "./ui";
import { colors } from "@/constants/theme";
import {
  parseCoordinates,
  type CoordinateValue,
  type Coordinates,
} from "@/utils/location";

type Props = {
  latitude?: CoordinateValue;
  longitude?: CoordinateValue;
  address?: string | null;
  title: string;
  approximate?: boolean;
};

export function LocationCard({
  latitude,
  longitude,
  address,
  title,
  approximate = false,
}: Props) {
  const point = parseCoordinates(latitude, longitude);
  if (!point && !address?.trim()) return null;
  return (
    <Card>
      <Text style={styles.heading}>Location</Text>
      {!!address?.trim() && (
        <Text selectable style={styles.muted}>
          {address}
        </Text>
      )}
      {point ? (
        <>
          <LocationMap
            key={point.latitude + "," + point.longitude}
            point={point}
            title={title}
          />
          <Text selectable style={styles.muted}>
            Latitude: {point.latitude.toFixed(6)} · Longitude:{" "}
            {point.longitude.toFixed(6)}
          </Text>
          {approximate && (
            <Text style={styles.muted}>Approximate location for privacy.</Text>
          )}
        </>
      ) : (
        <Text style={styles.muted}>Map location is not available.</Text>
      )}
    </Card>
  );
}

function LocationMap({ point, title }: { point: Coordinates; title: string }) {
  const map = useRef<MapView>(null);
  const [error, setError] = useState("");
  const region = { ...point, latitudeDelta: 0.012, longitudeDelta: 0.012 };
  return (
    <>
      <View
        style={{
          height: 260,
          width: "100%",
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: colors.background,
        }}
      >
        <MapView
          ref={map}
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          mapType={Platform.OS === "android" ? "none" : "standard"}
          accessibilityLabel={`Map showing ${title}`}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          pitchEnabled={false}
          rotateEnabled={false}
          toolbarEnabled={false}
        >
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            tileSize={256}
          />
          <Marker
            coordinate={point}
            title={title}
            draggable={false}
            pinColor={colors.primary}
          />
        </MapView>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="OpenStreetMap attribution"
          onPress={() =>
            void Linking.openURL(
              "https://www.openstreetmap.org/copyright",
            ).catch(() => setError("The attribution link could not be opened."))
          }
          style={{
            position: "absolute",
            bottom: 6,
            left: 6,
            padding: 8,
            borderRadius: 8,
            backgroundColor: "white",
          }}
        >
          <Text style={{ fontSize: 10, color: colors.ink }}>
            © OpenStreetMap contributors
          </Text>
        </Pressable>
      </View>
      <Button
        title="Recenter map"
        variant="outline"
        onPress={() => map.current?.animateToRegion(region, 300)}
      />
      <Text style={[styles.muted, { fontSize: 12 }]}>
        Drag to explore and pinch to zoom. Map tiles need an internet
        connection.
      </Text>
      {!!error && (
        <Text accessibilityRole="alert" style={styles.muted}>
          {error}
        </Text>
      )}
    </>
  );
}
