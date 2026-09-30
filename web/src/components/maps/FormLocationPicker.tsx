"use client";

import { coordinatesFromValues, formatCoordinate } from "@/lib/location";

import { LocationPicker } from "./LocationPicker";

type FormLocationPickerProps = {
  latitude: string;
  longitude: string;
  onChange: (latitude: string, longitude: string) => void;
  disabled?: boolean;
  required?: boolean;
  helpText?: string;
};

export function FormLocationPicker({
  latitude,
  longitude,
  onChange,
  disabled = false,
  required = false,
  helpText = "Click the map or drag the marker to select the location. The coordinate fields stay synchronized.",
}: FormLocationPickerProps) {
  const coordinates = coordinatesFromValues(latitude, longitude);

  return (
    <LocationPicker
      coordinates={coordinates}
      disabled={disabled}
      required={required}
      helpText={helpText}
      onChange={(nextCoordinates) => {
        if (!nextCoordinates) {
          onChange("", "");
          return;
        }

        onChange(
          formatCoordinate(nextCoordinates.latitude),
          formatCoordinate(nextCoordinates.longitude),
        );
      }}
    />
  );
}
