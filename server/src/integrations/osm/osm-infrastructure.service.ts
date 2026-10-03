import {
  InfrastructureDataSource,
  ParkingFacilityType,
  PrismaClient,
  RoadEventSeverity,
  RoadEventStatus,
  RoadEventType,
  WasteFacilityType,
  WasteType,
} from "@prisma/client";

import { bbox, queryOverpass } from "./overpass.client";
import type { ImportBounds, ImportStats, OsmElement } from "./osm.types";

const database = new PrismaClient();
const source = InfrastructureDataSource.OPENSTREETMAP;
const now = () => new Date();
const coordinates = (element: OsmElement) =>
  element.lat !== undefined && element.lon !== undefined
    ? { latitude: element.lat, longitude: element.lon }
    : element.center
      ? { latitude: element.center.lat, longitude: element.center.lon }
      : null;
const externalId = (element: OsmElement) => `${element.type}/${element.id}`;
const sourceUrl = (element: OsmElement) =>
  `https://www.openstreetmap.org/${element.type}/${element.id}`;
const integer = (value?: string) => {
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
};
const address = (tags: Record<string, string>) =>
  tags["addr:full"] ||
  [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ") ||
  tags["addr:place"] ||
  "Address not provided by OpenStreetMap";
const label = (tags: Record<string, string>, fallback: string) =>
  tags.name || tags.operator || fallback;

function parkingType(tags: Record<string, string>) {
  const value = tags.parking;
  if (value === "street_side" || value === "lane" || value === "on_street")
    return ParkingFacilityType.STREET;
  if (value === "multi-storey") return ParkingFacilityType.GARAGE;
  if (value === "underground") return ParkingFacilityType.UNDERGROUND;
  return ParkingFacilityType.LOT;
}

const facilityMappings: Array<{
  key: string;
  value: string;
  category: string;
  icon: string;
}> = [
  { key: "amenity", value: "hospital", category: "Hospital", icon: "🏥" },
  { key: "amenity", value: "clinic", category: "Clinic", icon: "🩺" },
  { key: "amenity", value: "pharmacy", category: "Pharmacy", icon: "💊" },
  { key: "amenity", value: "police", category: "Police Station", icon: "🚓" },
  {
    key: "amenity",
    value: "fire_station",
    category: "Fire Station",
    icon: "🚒",
  },
  { key: "amenity", value: "toilets", category: "Public Toilet", icon: "🚻" },
  { key: "amenity", value: "library", category: "Library", icon: "📚" },
  {
    key: "amenity",
    value: "community_centre",
    category: "Community Center",
    icon: "🏘️",
  },
  {
    key: "amenity",
    value: "recycling",
    category: "Recycling Center",
    icon: "♻️",
  },
  {
    key: "amenity",
    value: "charging_station",
    category: "EV Charging Station",
    icon: "⚡",
  },
  {
    key: "amenity",
    value: "townhall",
    category: "Municipal Office",
    icon: "🏛️",
  },
  { key: "leisure", value: "park", category: "Park", icon: "🌳" },
  {
    key: "leisure",
    value: "sports_centre",
    category: "Sports Facility",
    icon: "🏟️",
  },
  { key: "leisure", value: "playground", category: "Playground", icon: "🛝" },
];
function facilityMapping(tags: Record<string, string>) {
  return facilityMappings.find(
    (mapping) => tags[mapping.key] === mapping.value,
  );
}

async function requirements() {
  const department = await database.department.findFirst({
    where: { name: "Transportation and Traffic", isActive: true },
    select: { id: true },
  });
  const admin = await database.user.findFirst({
    where: { role: "ADMIN", isActive: true },
    select: { id: true },
  });
  if (!department || !admin)
    throw new Error(
      "An active Transportation and Traffic department and admin are required for OSM import ownership",
    );
  return { departmentId: department.id, createdById: admin.id };
}
async function exists(model: "parking" | "facility" | "road", id: string) {
  if (model === "parking")
    return Boolean(
      await database.parkingFacility.findUnique({
        where: { source_externalSourceId: { source, externalSourceId: id } },
        select: { id: true },
      }),
    );
  if (model === "facility")
    return Boolean(
      await database.cityFacility.findUnique({
        where: { source_externalSourceId: { source, externalSourceId: id } },
        select: { id: true },
      }),
    );
  return Boolean(
    await database.roadEvent.findUnique({
      where: { source_externalSourceId: { source, externalSourceId: id } },
      select: { id: true },
    }),
  );
}

function acceptedWaste(tags: Record<string, string>) {
  const mappings: Array<[string, WasteType]> = [
    ["recycling:glass", WasteType.GLASS],
    ["recycling:paper", WasteType.PAPER],
    ["recycling:plastic", WasteType.PLASTIC],
    ["recycling:metal", WasteType.METAL],
    ["recycling:electrical_items", WasteType.ELECTRONIC],
  ];
  return mappings
    .filter(([key]) => tags[key] === "yes")
    .map(([, value]) => value);
}

export async function importOsmInfrastructure(bounds: ImportBounds) {
  const owner = await requirements();
  const region = bbox(bounds);
  const query = `[out:json][timeout:40];(nwr[amenity=parking](${region});nwr[amenity~"^(hospital|clinic|pharmacy|police|fire_station|toilets|library|community_centre|recycling|waste_basket|charging_station|townhall)$"](${region});nwr["waste_basket"="yes"](${region});nwr[leisure~"^(park|sports_centre|playground)$"](${region});nwr[highway=construction](${region});nwr[hazard=roadworks](${region}););out center tags;`;
  const response = await queryOverpass(query);
  const parking: ImportStats = {
      fetched: 0,
      created: 0,
      updated: 0,
      skipped: 0,
    },
    facilities: ImportStats = {
      fetched: 0,
      created: 0,
      updated: 0,
      skipped: 0,
    },
    wasteFacilities: ImportStats = {
      fetched: 0,
      created: 0,
      updated: 0,
      skipped: 0,
    },
    roadEvents: ImportStats = {
      fetched: 0,
      created: 0,
      updated: 0,
      skipped: 0,
    };
  for (const element of response.elements) {
    const tags = element.tags || {},
      point = coordinates(element),
      id = externalId(element);
    if (!point) continue;
    if (tags.amenity === "parking") {
      parking.fetched++;
      const wasExisting = await exists("parking", id);
      const capacity = integer(tags.capacity) ?? 0;
      await database.parkingFacility.upsert({
        where: { source_externalSourceId: { source, externalSourceId: id } },
        update: {
          name: label(tags, `OSM parking ${element.id}`),
          description: tags.description,
          type: parkingType(tags),
          address: address(tags),
          ...point,
          totalSpaces: capacity,
          availableSpaces: null,
          accessibleSpaces: integer(tags["capacity:disabled"]) ?? 0,
          evChargingSpaces: integer(tags["capacity:charging"]) ?? 0,
          openingHours: tags.opening_hours,
          isActive: true,
          sourceUrl: sourceUrl(element),
          lastSyncedAt: now(),
        },
        create: {
          departmentId: owner.departmentId,
          name: label(tags, `OSM parking ${element.id}`),
          description: tags.description,
          type: parkingType(tags),
          address: address(tags),
          ...point,
          totalSpaces: capacity,
          availableSpaces: null,
          accessibleSpaces: integer(tags["capacity:disabled"]) ?? 0,
          evChargingSpaces: integer(tags["capacity:charging"]) ?? 0,
          openingHours: tags.opening_hours,
          supportsReservation: false,
          isActive: true,
          source,
          externalSourceId: id,
          sourceUrl: sourceUrl(element),
          lastSyncedAt: now(),
        },
      });
      parking[wasExisting ? "updated" : "created"]++;
      continue;
    }
    if (
      tags.amenity === "recycling" ||
      tags.amenity === "waste_basket" ||
      tags.waste_basket === "yes"
    ) {
      wasteFacilities.fetched++;
      const existing = await database.wasteFacility.findUnique({
        where: { source_externalSourceId: { source, externalSourceId: id } },
        select: { id: true },
      });
      const type =
        tags.amenity === "recycling"
          ? tags.recycling_type === "centre"
            ? WasteFacilityType.RECYCLING_CENTER
            : WasteFacilityType.RECYCLING_BIN
          : WasteFacilityType.PUBLIC_BIN;
      const accepted = acceptedWaste(tags);
      const data = {
        type,
        name: label(
          tags,
          type === WasteFacilityType.PUBLIC_BIN
            ? "Public waste bin"
            : "Recycling point",
        ),
        description: tags.description,
        address: address(tags),
        ...point,
        openingHours: tags.opening_hours,
        isActive: true,
        sourceUrl: sourceUrl(element),
        lastSyncedAt: now(),
      };
      const record = await database.wasteFacility.upsert({
        where: { source_externalSourceId: { source, externalSourceId: id } },
        update: data,
        create: { ...data, departmentId: null, source, externalSourceId: id },
      });
      await database.wasteFacilityAcceptedType.deleteMany({
        where: { facilityId: record.id },
      });
      if (accepted.length)
        await database.wasteFacilityAcceptedType.createMany({
          data: accepted.map((wasteType) => ({
            facilityId: record.id,
            wasteType,
          })),
          skipDuplicates: true,
        });
      wasteFacilities[existing ? "updated" : "created"]++;
      continue;
    }
    const mapping = facilityMapping(tags);
    if (mapping) {
      facilities.fetched++;
      const wasExisting = await exists("facility", id);
      const category = await database.cityFacilityCategory.upsert({
        where: { name: mapping.category },
        update: { isActive: true },
        create: {
          name: mapping.category,
          icon: mapping.icon,
          description: `OpenStreetMap ${mapping.category.toLowerCase()} locations`,
        },
      });
      const data = {
        categoryId: category.id,
        name: label(tags, `${mapping.category} ${element.id}`),
        description: tags.description,
        address: address(tags),
        ...point,
        phone: tags.phone || tags["contact:phone"],
        email: tags.email || tags["contact:email"],
        website: tags.website || tags["contact:website"],
        openingHours: tags.opening_hours,
        isActive: true,
        sourceUrl: sourceUrl(element),
        lastSyncedAt: now(),
      };
      await database.cityFacility.upsert({
        where: { source_externalSourceId: { source, externalSourceId: id } },
        update: data,
        create: { ...data, departmentId: null, source, externalSourceId: id },
      });
      facilities[wasExisting ? "updated" : "created"]++;
      continue;
    }
    if (tags.highway === "construction" || tags.hazard === "roadworks") {
      roadEvents.fetched++;
      const wasExisting = await exists("road", id);
      const type =
        tags.hazard === "roadworks" && tags.highway !== "construction"
          ? RoadEventType.MAINTENANCE
          : RoadEventType.CONSTRUCTION;
      const data = {
        title: label(
          tags,
          type === RoadEventType.CONSTRUCTION
            ? "Mapped road construction"
            : "Mapped road maintenance",
        ),
        description:
          tags.description ||
          "Long-running roadwork mapped by OpenStreetMap contributors. This is not live incident data.",
        type,
        severity: RoadEventSeverity.MODERATE,
        status: RoadEventStatus.ACTIVE,
        address: address(tags),
        ...point,
        startsAt: now(),
        endsAt: null,
        isPublic: true,
        sourceUrl: sourceUrl(element),
        lastSyncedAt: now(),
      };
      await database.roadEvent.upsert({
        where: { source_externalSourceId: { source, externalSourceId: id } },
        update: data,
        create: {
          ...data,
          departmentId: owner.departmentId,
          createdById: owner.createdById,
          source,
          externalSourceId: id,
        },
      });
      roadEvents[wasExisting ? "updated" : "created"]++;
    }
  }
  return { parking, facilities, wasteFacilities, roadEvents };
}

export async function closeOsmImporter() {
  await database.$disconnect();
}
