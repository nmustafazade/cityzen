"use client";

/* eslint-disable react-hooks/exhaustive-deps -- the loader is intentionally keyed by the selected management mode */
import { useEffect, useState } from "react";

import { MunicipalityRoute } from "@/components/auth/ProtectedRoute";
import { FormLocationPicker } from "@/components/maps/FormLocationPicker";
import {
  getFacilityCategories,
  getManagedFacilities,
  getManagedParking,
  getManagedRoads,
  saveManagedFacility,
  saveManagedParking,
  saveManagedRoad,
} from "@/lib/infrastructure";
import type {
  CityFacility,
  FacilityCategory,
  ParkingFacility,
  RoadEvent,
} from "@/types/infrastructure";

import { InfrastructureShell, StateMessage } from "./InfrastructureShell";

type Mode = "roads" | "parking" | "facilities";
const initial = {
  title: "",
  description: "",
  address: "",
  latitude: "",
  longitude: "",
  departmentId: "",
  type: "",
  severity: "MODERATE",
  status: "ACTIVE",
  startsAt: "",
  endsAt: "",
  name: "",
  totalSpaces: "0",
  availableSpaces: "0",
  accessibleSpaces: "0",
  evChargingSpaces: "0",
  hourlyPrice: "",
  currency: "AZN",
  openingHours: "",
  supportsReservation: false,
  isActive: true,
  categoryId: "",
};

export function InfrastructureManager({ mode }: { mode: Mode }) {
  const [items, setItems] = useState<
    (RoadEvent | ParkingFacility | CityFacility)[]
  >([]);
  const [categories, setCategories] = useState<FacilityCategory[]>([]);
  const [form, setForm] = useState(initial);
  const [editing, setEditing] = useState<number>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const result =
        mode === "roads"
          ? await getManagedRoads()
          : mode === "parking"
            ? await getManagedParking()
            : await getManagedFacilities();
      setItems(
        mode === "roads"
          ? result.roadEvents
          : mode === "parking"
            ? result.parking
            : result.facilities,
      );
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [mode]);
  useEffect(() => {
    if (mode === "facilities")
      getFacilityCategories()
        .then((result) => setCategories(result.categories))
        .catch(() => undefined);
  }, [mode]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "roads")
        await saveManagedRoad(
          {
            departmentId: form.departmentId
              ? Number(form.departmentId)
              : undefined,
            title: form.title,
            description: form.description,
            type: form.type,
            severity: form.severity,
            status: form.status,
            address: form.address || undefined,
            latitude: Number(form.latitude),
            longitude: Number(form.longitude),
            startsAt: new Date(form.startsAt).toISOString(),
            endsAt: form.endsAt
              ? new Date(form.endsAt).toISOString()
              : undefined,
            isPublic: true,
          },
          editing,
        );
      if (mode === "parking")
        await saveManagedParking(
          {
            departmentId: form.departmentId
              ? Number(form.departmentId)
              : undefined,
            name: form.name,
            description: form.description || undefined,
            type: form.type,
            address: form.address,
            latitude: Number(form.latitude),
            longitude: Number(form.longitude),
            totalSpaces: Number(form.totalSpaces),
            availableSpaces: Number(form.availableSpaces),
            accessibleSpaces: Number(form.accessibleSpaces),
            evChargingSpaces: Number(form.evChargingSpaces),
            hourlyPrice: form.hourlyPrice
              ? Number(form.hourlyPrice)
              : undefined,
            currency: form.currency || undefined,
            openingHours: form.openingHours || undefined,
            supportsReservation: form.supportsReservation,
            isActive: form.isActive,
          },
          editing,
        );
      if (mode === "facilities")
        await saveManagedFacility(
          {
            departmentId: form.departmentId
              ? Number(form.departmentId)
              : undefined,
            categoryId: Number(form.categoryId),
            name: form.name,
            description: form.description || undefined,
            address: form.address,
            latitude: Number(form.latitude),
            longitude: Number(form.longitude),
            openingHours: form.openingHours || undefined,
            isActive: form.isActive,
          },
          editing,
        );
      setForm(initial);
      setEditing(undefined);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save");
    } finally {
      setBusy(false);
    }
  }

  function edit(item: RoadEvent | ParkingFacility | CityFacility) {
    setEditing(item.id);
    setForm({
      ...initial,
      name: "name" in item ? item.name : "",
      title: "title" in item ? item.title : "",
      description: item.description || "",
      address: item.address || "",
      latitude: String(item.latitude),
      longitude: String(item.longitude),
      departmentId: String(item.department?.id || ""),
      type: "type" in item ? item.type : "",
      severity: "severity" in item ? item.severity : "MODERATE",
      status: "status" in item ? item.status : "ACTIVE",
      startsAt: "startsAt" in item ? item.startsAt.slice(0, 16) : "",
      endsAt: "endsAt" in item && item.endsAt ? item.endsAt.slice(0, 16) : "",
      totalSpaces: "totalSpaces" in item ? String(item.totalSpaces) : "0",
      availableSpaces:
        "availableSpaces" in item ? String(item.availableSpaces) : "0",
      accessibleSpaces:
        "accessibleSpaces" in item ? String(item.accessibleSpaces) : "0",
      evChargingSpaces:
        "evChargingSpaces" in item ? String(item.evChargingSpaces) : "0",
      hourlyPrice:
        "hourlyPrice" in item && item.hourlyPrice != null
          ? String(item.hourlyPrice)
          : "",
      currency: "currency" in item ? item.currency || "AZN" : "AZN",
      openingHours: "openingHours" in item ? item.openingHours || "" : "",
      supportsReservation:
        "supportsReservation" in item ? item.supportsReservation : false,
      isActive: "isActive" in item ? item.isActive : true,
      categoryId: "category" in item ? String(item.category.id) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const title =
    mode === "roads"
      ? "Road Conditions"
      : mode === "parking"
        ? "Parking"
        : "City Facilities";
  return (
    <MunicipalityRoute>
      <InfrastructureShell
        title={`Manage ${title}`}
        subtitle="Department heads manage their department only; administrators have city-wide access."
      >
        <form
          onSubmit={submit}
          className="mt-8 rounded-2xl border bg-white p-6"
        >
          <h2 className="font-bold">
            {editing ? "Edit" : "Create"} {title}
          </h2>
          {error && (
            <p role="alert" className="mt-3 text-sm text-rose-700">
              {error}
            </p>
          )}
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label={mode === "roads" ? "Title" : "Name"}
              value={mode === "roads" ? form.title : form.name}
              set={(value) =>
                setForm((current) => ({
                  ...current,
                  [mode === "roads" ? "title" : "name"]: value,
                }))
              }
            />
            <Input
              label="Address"
              value={form.address}
              set={(value) =>
                setForm((current) => ({ ...current, address: value }))
              }
            />
            <Input
              label="Department ID (admin)"
              value={form.departmentId}
              set={(value) =>
                setForm((current) => ({ ...current, departmentId: value }))
              }
              required={false}
            />
            <Input
              label="Latitude"
              type="number"
              value={form.latitude}
              set={(value) =>
                setForm((current) => ({ ...current, latitude: value }))
              }
            />
            <Input
              label="Longitude"
              type="number"
              value={form.longitude}
              set={(value) =>
                setForm((current) => ({ ...current, longitude: value }))
              }
            />
            {mode === "roads" && (
              <>
                <Select
                  label="Type"
                  value={form.type}
                  set={(value) =>
                    setForm((current) => ({ ...current, type: value }))
                  }
                  options={[
                    "ACCIDENT",
                    "ROAD_CLOSURE",
                    "CONSTRUCTION",
                    "MAINTENANCE",
                    "LANE_CLOSURE",
                    "FLOODING",
                    "CONGESTION",
                    "TEMPORARY_RESTRICTION",
                    "HAZARD",
                    "OTHER",
                  ]}
                />
                <Select
                  label="Severity"
                  value={form.severity}
                  set={(value) =>
                    setForm((current) => ({ ...current, severity: value }))
                  }
                  options={["LOW", "MODERATE", "HIGH", "CRITICAL"]}
                />
                <Select
                  label="Status"
                  value={form.status}
                  set={(value) =>
                    setForm((current) => ({ ...current, status: value }))
                  }
                  options={["SCHEDULED", "ACTIVE", "RESOLVED", "CANCELLED"]}
                />
                <Input
                  label="Starts"
                  type="datetime-local"
                  value={form.startsAt}
                  set={(value) =>
                    setForm((current) => ({ ...current, startsAt: value }))
                  }
                />
                <Input
                  label="Ends"
                  type="datetime-local"
                  value={form.endsAt}
                  set={(value) =>
                    setForm((current) => ({ ...current, endsAt: value }))
                  }
                  required={false}
                />
              </>
            )}
            {mode === "parking" && (
              <>
                <Select
                  label="Type"
                  value={form.type}
                  set={(value) =>
                    setForm((current) => ({ ...current, type: value }))
                  }
                  options={["STREET", "GARAGE", "LOT", "UNDERGROUND"]}
                />
                {[
                  "totalSpaces",
                  "availableSpaces",
                  "accessibleSpaces",
                  "evChargingSpaces",
                ].map((key) => (
                  <Input
                    key={key}
                    label={key.replace(/([A-Z])/g, " $1")}
                    type="number"
                    value={form[key as keyof typeof form] as string}
                    set={(value) =>
                      setForm((current) => ({ ...current, [key]: value }))
                    }
                  />
                ))}
                <Input
                  label="Hourly price"
                  type="number"
                  value={form.hourlyPrice}
                  set={(value) =>
                    setForm((current) => ({ ...current, hourlyPrice: value }))
                  }
                  required={false}
                />
                <Input
                  label="Opening hours"
                  value={form.openingHours}
                  set={(value) =>
                    setForm((current) => ({ ...current, openingHours: value }))
                  }
                  required={false}
                />
              </>
            )}
            {mode === "facilities" && (
              <>
                <Select
                  label="Category"
                  value={form.categoryId}
                  set={(value) =>
                    setForm((current) => ({ ...current, categoryId: value }))
                  }
                  options={categories.map((category) => String(category.id))}
                  names={Object.fromEntries(
                    categories.map((category) => [
                      String(category.id),
                      category.name,
                    ]),
                  )}
                />
                <Input
                  label="Opening hours"
                  value={form.openingHours}
                  set={(value) =>
                    setForm((current) => ({ ...current, openingHours: value }))
                  }
                  required={false}
                />
              </>
            )}
          </div>
          <div className="mt-5">
            <FormLocationPicker
              latitude={form.latitude}
              longitude={form.longitude}
              required
              disabled={busy}
              onChange={(latitude, longitude) =>
                setForm((current) => ({ ...current, latitude, longitude }))
              }
            />
          </div>
          <label className="mt-4 block text-sm font-semibold">
            Description
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              required={mode === "roads"}
              className="mt-1 min-h-24 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <button
            disabled={busy}
            className="mt-5 rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Saving..." : "Save"}
          </button>
        </form>
        {loading ? (
          <StateMessage>Loading...</StateMessage>
        ) : (
          <div className="mt-8 space-y-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-4"
              >
                <div>
                  <h3 className="font-bold">
                    {"title" in item ? item.title : item.name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {item.department?.name || "No department"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => edit(item)}
                  className="font-semibold text-emerald-700"
                >
                  Edit
                </button>
              </article>
            ))}
          </div>
        )}
      </InfrastructureShell>
    </MunicipalityRoute>
  );
}

function Input({
  label,
  value,
  set,
  type = "text",
  required = true,
}: {
  label: string;
  value: string;
  set: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-semibold capitalize">
      {label}
      <input
        type={type}
        step={type === "number" ? "any" : undefined}
        value={value}
        onChange={(event) => set(event.target.value)}
        required={required}
        className="mt-1 w-full rounded-lg border px-3 py-2"
      />
    </label>
  );
}

function Select({
  label,
  value,
  set,
  options,
  names,
}: {
  label: string;
  value: string;
  set: (value: string) => void;
  options: string[];
  names?: Record<string, string>;
}) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <select
        value={value}
        onChange={(event) => set(event.target.value)}
        required
        className="mt-1 w-full rounded-lg border px-3 py-2"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {names?.[option] || option.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}
