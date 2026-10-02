import { distanceKm } from "../utils/distance";
import { Prisma, RoadEventStatus, UserRole } from "@prisma/client";

import database from "../config/database";
import type { AuthenticatedUser } from "../types/auth.types";
import type {
  FacilityFilters,
  FacilityInput,
  ParkingFilters,
  ParkingInput,
  RoadEventFilters,
  RoadEventInput,
} from "../types/infrastructure.types";
import { AppError } from "../utils/app-error";

const departmentSelect = { id: true, name: true } as const;
const categorySelect = {
  id: true,
  name: true,
  icon: true,
  description: true,
  isActive: true,
} as const;
const paginate = (total: number, page: number, limit: number) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
const boundsWhere = (f: {
  north?: number;
  south?: number;
  east?: number;
  west?: number;
}) =>
  f.north === undefined
    ? {}
    : {
        latitude: { gte: f.south, lte: f.north },
        longitude: { gte: f.west, lte: f.east },
      };

async function managerDepartment(user: AuthenticatedUser) {
  if (user.role === UserRole.ADMIN) return null;
  const account = await database.user.findUnique({
    where: { id: user.userId },
    select: { departmentId: true },
  });
  if (!account?.departmentId)
    throw new AppError(403, "Department assignment required");
  return account.departmentId;
}
async function departmentForCreate(
  user: AuthenticatedUser,
  requested?: number | null,
  nullable = false,
) {
  const own = await managerDepartment(user);
  const departmentId = user.role === UserRole.ADMIN ? (requested ?? null) : own;
  if (!nullable && !departmentId)
    throw new AppError(400, "departmentId is required");
  if (
    departmentId &&
    !(await database.department.findFirst({
      where: { id: departmentId, isActive: true },
      select: { id: true },
    }))
  )
    throw new AppError(400, "Department does not exist or is inactive");
  return departmentId;
}
async function enforceScope(
  user: AuthenticatedUser,
  resourceDepartmentId: number | null,
) {
  const own = await managerDepartment(user);
  if (user.role !== UserRole.ADMIN && resourceDepartmentId !== own)
    throw new AppError(403, "You cannot manage this resource");
}

export async function listRoadEvents(
  filters: RoadEventFilters,
  managed = false,
  user?: AuthenticatedUser,
) {
  const own = managed && user ? await managerDepartment(user) : null;
  const where: Prisma.RoadEventWhereInput = {
    ...(managed
      ? {
          departmentId:
            user?.role === UserRole.ADMIN ? filters.departmentId : own!,
        }
      : {
          isPublic: true,
          status: filters.status ?? {
            in: [RoadEventStatus.ACTIVE, RoadEventStatus.SCHEDULED],
          },
        }),
    type: filters.type,
    severity: filters.severity,
    status:
      filters.status ??
      (managed
        ? undefined
        : { in: [RoadEventStatus.ACTIVE, RoadEventStatus.SCHEDULED] }),
    departmentId: managed
      ? user?.role === UserRole.ADMIN
        ? filters.departmentId
        : own!
      : filters.departmentId,
    startsAt: filters.to ? { lte: filters.to } : undefined,
    OR: filters.from
      ? [{ endsAt: null }, { endsAt: { gte: filters.from } }]
      : undefined,
    ...boundsWhere(filters),
  };
  const [roadEvents, total] = await database.$transaction([
    database.roadEvent.findMany({
      where,
      include: { department: { select: departmentSelect } },
      orderBy: [{ severity: "desc" }, { startsAt: "desc" }],
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    database.roadEvent.count({ where }),
  ]);
  return {
    roadEvents,
    pagination: paginate(total, filters.page, filters.limit),
  };
}
export async function getRoadEvent(
  id: number,
  managed = false,
  user?: AuthenticatedUser,
) {
  const item = await database.roadEvent.findUnique({
    where: { id },
    include: { department: { select: departmentSelect } },
  });
  if (!item || (!managed && !item.isPublic))
    throw new AppError(404, "Road event not found");
  if (managed && user) await enforceScope(user, item.departmentId);
  return item;
}
export async function createRoadEvent(
  user: AuthenticatedUser,
  input: RoadEventInput,
) {
  const departmentId = await departmentForCreate(user, input.departmentId);
  return database.roadEvent.create({
    data: {
      ...input,
      departmentId: departmentId!,
      createdById: user.userId,
      resolvedAt: input.status === RoadEventStatus.RESOLVED ? new Date() : null,
    },
    include: { department: { select: departmentSelect } },
  });
}
export async function updateRoadEvent(
  user: AuthenticatedUser,
  id: number,
  input: Partial<RoadEventInput>,
) {
  const current = await database.roadEvent.findUnique({ where: { id } });
  if (!current) throw new AppError(404, "Road event not found");
  await enforceScope(user, current.departmentId);
  const { departmentId: requested, ...changes } = input;
  const departmentId =
    user.role === UserRole.ADMIN && requested !== undefined
      ? await departmentForCreate(user, requested)
      : current.departmentId;
  const nextStatus = changes.status ?? current.status;
  return database.roadEvent.update({
    where: { id },
    data: {
      ...changes,
      departmentId: departmentId!,
      resolvedAt:
        nextStatus === RoadEventStatus.RESOLVED
          ? (current.resolvedAt ?? new Date())
          : null,
    },
    include: { department: { select: departmentSelect } },
  });
}

export async function listParking(
  filters: ParkingFilters,
  managed = false,
  user?: AuthenticatedUser,
) {
  const own = managed && user ? await managerDepartment(user) : null;
  const where: Prisma.ParkingFacilityWhereInput = {
    isActive: managed ? undefined : true,
    departmentId:
      managed && user?.role !== UserRole.ADMIN ? own! : filters.departmentId,
    type: filters.type,
    availableSpaces: filters.hasAvailableSpaces ? { gt: 0 } : undefined,
    supportsReservation: filters.supportsReservation,
    evChargingSpaces: filters.hasEVCharging ? { gt: 0 } : undefined,
    accessibleSpaces: filters.hasAccessibleParking ? { gt: 0 } : undefined,
    OR: filters.search
      ? [
          { name: { contains: filters.search } },
          { address: { contains: filters.search } },
        ]
      : undefined,
    ...boundsWhere(filters),
  };
  const [parking, total] = await database.$transaction([
    database.parkingFacility.findMany({
      where,
      include: { department: { select: departmentSelect } },
      orderBy: { name: "asc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    database.parkingFacility.count({ where }),
  ]);
  return { parking, pagination: paginate(total, filters.page, filters.limit) };
}
export async function getParking(
  id: number,
  managed = false,
  user?: AuthenticatedUser,
) {
  const item = await database.parkingFacility.findUnique({
    where: { id },
    include: { department: { select: departmentSelect } },
  });
  if (!item || (!managed && !item.isActive))
    throw new AppError(404, "Parking facility not found");
  if (managed && user) await enforceScope(user, item.departmentId);
  return item;
}
export async function createParking(
  user: AuthenticatedUser,
  input: ParkingInput,
) {
  const departmentId = await departmentForCreate(user, input.departmentId);
  return database.parkingFacility.create({
    data: { ...input, departmentId: departmentId! },
    include: { department: { select: departmentSelect } },
  });
}
export async function updateParking(
  user: AuthenticatedUser,
  id: number,
  input: Partial<ParkingInput>,
) {
  const current = await database.parkingFacility.findUnique({ where: { id } });
  if (!current) throw new AppError(404, "Parking facility not found");
  await enforceScope(user, current.departmentId);
  const { departmentId: requested, ...changes } = input;
  const departmentId =
    user.role === UserRole.ADMIN && requested !== undefined
      ? await departmentForCreate(user, requested)
      : current.departmentId;
  const totalSpaces = input.totalSpaces ?? current.totalSpaces;
  const availableSpaces =
    input.availableSpaces === undefined
      ? current.availableSpaces
      : input.availableSpaces;
  if (availableSpaces !== null && availableSpaces > totalSpaces)
    throw new AppError(400, "availableSpaces cannot exceed totalSpaces");
  return database.parkingFacility.update({
    where: { id },
    data: { ...changes, departmentId: departmentId! },
    include: { department: { select: departmentSelect } },
  });
}

export async function listFacilities(
  filters: FacilityFilters,
  managed = false,
  user?: AuthenticatedUser,
) {
  const own = managed && user ? await managerDepartment(user) : null;
  const where: Prisma.CityFacilityWhereInput = {
    isActive: managed ? undefined : true,
    categoryId: filters.categoryId,
    departmentId:
      managed && user?.role !== UserRole.ADMIN ? own! : filters.departmentId,
    OR: filters.search
      ? [
          { name: { contains: filters.search } },
          { address: { contains: filters.search } },
        ]
      : undefined,
    ...boundsWhere(filters),
  };
  const [facilities, total] = await database.$transaction([
    database.cityFacility.findMany({
      where,
      include: {
        category: { select: categorySelect },
        department: { select: departmentSelect },
      },
      orderBy: { name: "asc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    database.cityFacility.count({ where }),
  ]);
  return {
    facilities,
    pagination: paginate(total, filters.page, filters.limit),
  };
}
export async function getFacility(
  id: number,
  managed = false,
  user?: AuthenticatedUser,
) {
  const item = await database.cityFacility.findUnique({
    where: { id },
    include: {
      category: { select: categorySelect },
      department: { select: departmentSelect },
    },
  });
  if (!item || (!managed && !item.isActive))
    throw new AppError(404, "City facility not found");
  if (managed && user) await enforceScope(user, item.departmentId);
  return item;
}
export async function createFacility(
  user: AuthenticatedUser,
  input: FacilityInput,
) {
  const departmentId = await departmentForCreate(
    user,
    input.departmentId,
    user.role === UserRole.ADMIN,
  );
  if (
    !(await database.cityFacilityCategory.findFirst({
      where: { id: input.categoryId, isActive: true },
      select: { id: true },
    }))
  )
    throw new AppError(400, "Facility category does not exist or is inactive");
  return database.cityFacility.create({
    data: { ...input, departmentId },
    include: {
      category: { select: categorySelect },
      department: { select: departmentSelect },
    },
  });
}
export async function updateFacility(
  user: AuthenticatedUser,
  id: number,
  input: Partial<FacilityInput>,
) {
  const current = await database.cityFacility.findUnique({ where: { id } });
  if (!current) throw new AppError(404, "City facility not found");
  await enforceScope(user, current.departmentId);
  const { departmentId: requested, ...changes } = input;
  if (
    changes.categoryId &&
    !(await database.cityFacilityCategory.findUnique({
      where: { id: changes.categoryId },
      select: { id: true },
    }))
  )
    throw new AppError(400, "Facility category does not exist");
  const departmentId =
    user.role === UserRole.ADMIN && requested !== undefined
      ? await departmentForCreate(user, requested, true)
      : current.departmentId;
  return database.cityFacility.update({
    where: { id },
    data: { ...changes, departmentId },
    include: {
      category: { select: categorySelect },
      department: { select: departmentSelect },
    },
  });
}

export async function nearby(
  kind: "parking" | "facilities",
  latitude: number,
  longitude: number,
  radiusKm: number,
  limit: number,
  categoryId?: number,
) {
  const rows =
    kind === "parking"
      ? await database.parkingFacility.findMany({
          where: { isActive: true },
          include: { department: { select: departmentSelect } },
        })
      : await database.cityFacility.findMany({
          where: { isActive: true, categoryId },
          include: {
            category: { select: categorySelect },
            department: { select: departmentSelect },
          },
        });
  return rows
    .map((item) => ({
      ...item,
      distanceKm: distanceKm(
        latitude,
        longitude,
        Number(item.latitude),
        Number(item.longitude),
      ),
    }))
    .filter((item) => item.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

export async function listFacilityCategories(includeInactive = false) {
  return database.cityFacilityCategory.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: "asc" },
  });
}
export async function createFacilityCategory(data: {
  name: string;
  icon?: string;
  description?: string;
  isActive?: boolean;
}) {
  return database.cityFacilityCategory.create({ data });
}
export async function updateFacilityCategory(
  id: number,
  data: Partial<{
    name: string;
    icon: string | null;
    description: string | null;
    isActive: boolean;
  }>,
) {
  if (
    !(await database.cityFacilityCategory.findUnique({
      where: { id },
      select: { id: true },
    }))
  )
    throw new AppError(404, "Facility category not found");
  return database.cityFacilityCategory.update({ where: { id }, data });
}
