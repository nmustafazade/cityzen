"use client";

import { useEffect } from "react";
import type { Marker as LeafletMarker } from "leaflet";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import { reportMarkerIcon } from "@/components/maps/leaflet-icon";
import { FALLBACK_MAP_CENTER } from "@/lib/location";
import type { Coordinates } from "@/types/location";

function MapClickHandler({
  onChange,
  disabled,
}: {
  onChange: (coordinates: Coordinates) => void;
  disabled: boolean;
}) {
  useMapEvents({
    click(event) {
      if (!disabled)
        onChange({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    },
  });
  return null;
}

function MapViewController({
  coordinates,
  focusVersion,
}: {
  coordinates: Coordinates | null;
  focusVersion: number;
}) {
  const map = useMap();
  const latitude = coordinates?.latitude;
  const longitude = coordinates?.longitude;
  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined) {
      map.setView(
        [latitude, longitude],
        focusVersion > 0 ? Math.max(map.getZoom(), 16) : map.getZoom(),
      );
    }
  }, [focusVersion, latitude, longitude, map]);
  return null;
}

export default function LocationPickerMap({
  coordinates,
  focusVersion,
  onChange,
  disabled,
}: {
  coordinates: Coordinates | null;
  focusVersion: number;
  onChange: (coordinates: Coordinates) => void;
  disabled: boolean;
}) {
  const center = coordinates ?? FALLBACK_MAP_CENTER;

  return (
    <MapContainer
      center={[center.latitude, center.longitude]}
      zoom={coordinates ? 16 : 12}
      scrollWheelZoom
      className="h-[350px] w-full rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onChange={onChange} disabled={disabled} />
      <MapViewController
        coordinates={coordinates}
        focusVersion={focusVersion}
      />
      {coordinates && (
        <Marker
          position={[coordinates.latitude, coordinates.longitude]}
          icon={reportMarkerIcon}
          draggable={!disabled}
          eventHandlers={{
            dragend(event) {
              const marker = event.target as LeafletMarker;
              const position = marker.getLatLng();
              if (!disabled)
                onChange({ latitude: position.lat, longitude: position.lng });
            },
          }}
        />
      )}
    </MapContainer>
  );
}
