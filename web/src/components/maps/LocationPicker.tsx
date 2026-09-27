"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { formatCoordinate, geolocationErrorMessage } from "@/lib/location";
import type { Coordinates } from "@/types/location";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => <MapPlaceholder message="Loading interactive map..." />,
});

export function LocationPicker({
  coordinates,
  onChange,
  disabled = false,
  required = false,
  helpText = "Click the map or drag the marker to pinpoint the issue.",
}: {
  coordinates: Coordinates | null;
  onChange: (coordinates: Coordinates | null) => void;
  disabled?: boolean;
  required?: boolean;
  helpText?: string;
}) {
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [focusVersion, setFocusVersion] = useState(0);

  function useCurrentLocation() {
    if (!("geolocation" in navigator)) {
      setLocationError("Location services are not supported by your browser. You can select the location manually on the map.");
      return;
    }

    setIsLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setFocusVersion((current) => current + 1);
        setIsLocating(false);
      },
      (error) => {
        setLocationError(geolocationErrorMessage(error.code));
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  return (
    <section aria-labelledby="location-heading" className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 id="location-heading" className="text-lg font-bold text-slate-950">Location {required && <span aria-hidden="true" className="text-red-600">*</span>}</h2>
          <p className="mt-1 text-sm text-slate-600">{helpText}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={useCurrentLocation} disabled={disabled || isLocating} className="rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-60">
            {isLocating ? "Getting location..." : "Use My Current Location"}
          </button>
          <button type="button" onClick={() => { onChange(null); setLocationError(""); }} disabled={disabled || !coordinates} className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-50">
            Clear Location
          </button>
        </div>
      </div>

      {locationError && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{locationError}</p>}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
        <LocationPickerMap coordinates={coordinates} focusVersion={focusVersion} onChange={onChange} disabled={disabled} />
      </div>
      <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700" aria-live="polite">
        <p className="font-semibold text-slate-900">Selected Location</p>
        {coordinates ? (
          <p className="mt-1">Latitude: {formatCoordinate(coordinates.latitude)} · Longitude: {formatCoordinate(coordinates.longitude)}</p>
        ) : (
          <p className="mt-1 text-slate-500">No location selected.</p>
        )}
      </div>
    </section>
  );
}

function MapPlaceholder({ message }: { message: string }) {
  return <div className="flex h-[350px] items-center justify-center bg-slate-100 px-6 text-center text-sm font-medium text-slate-500">{message}</div>;
}
