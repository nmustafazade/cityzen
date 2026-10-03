import { Prisma, UserRole } from "@prisma/client";

import database from "../config/database";
import type { AuthenticatedUser } from "../types/auth.types";
import type {
  AnnouncementInput,
  EventInput,
  PageFilters,
  ServiceInput,
} from "../types/municipal-content.types";
import { AppError } from "../utils/app-error";

const departmentSelect = { id: true, name: true } as const;
const announcementPublicSelect = {
  id: true,
  title: true,
  content: true,
  imageUrl: true,
  isPublished: true,
  publishedAt: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
  department: { select: departmentSelect },
} as const;
const eventPublicSelect = {
  id: true,
  title: true,
  description: true,
  imageUrl: true,
  locationName: true,
  address: true,
  latitude: true,
  longitude: true,
  startsAt: true,
  endsAt: true,
  externalUrl: true,
  isPublished: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  department: { select: departmentSelect },
} as const;
const pagination = (total: number, page: number, limit: number) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

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

async function resolvedDepartment(
  user: AuthenticatedUser,
  requested?: number | null,
  required = false,
) {
  const own = await managerDepartment(user);
  const id = user.role === UserRole.ADMIN ? requested : own;
  if (required && !id) throw new AppError(400, "departmentId is required");
  if (id) {
    const department = await database.department.findFirst({
      where: { id, isActive: true },
      select: { id: true },
    });
    if (!department)
      throw new AppError(400, "Department does not exist or is inactive");
  }
  return id ?? null;
}

function publishedData(
  value: boolean | undefined,
  current?: { isPublished: boolean; publishedAt: Date | null },
) {
  if (value === undefined) return {};
  return {
    isPublished: value,
    publishedAt: value ? (current?.publishedAt ?? new Date()) : null,
  };
}

export async function publicServices(
  filters: PageFilters & { search?: string },
) {
  const where: Prisma.MunicipalServiceWhereInput = {
    isActive: true,
    departmentId: filters.departmentId,
    OR: filters.search
      ? [
          { title: { contains: filters.search } },
          { description: { contains: filters.search } },
        ]
      : undefined,
  };
  const [services, total] = await database.$transaction([
    database.municipalService.findMany({
      where,
      include: { department: { select: departmentSelect } },
      orderBy: { title: "asc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    database.municipalService.count({ where }),
  ]);
  return {
    services,
    pagination: pagination(total, filters.page, filters.limit),
  };
}
export async function publicService(id: number) {
  const service = await database.municipalService.findFirst({
    where: { id, isActive: true },
    include: {
      department: { select: departmentSelect },
      fields: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
  });
  if (!service) throw new AppError(404, "Service not found");
  return service;
}

export async function publicAnnouncements(filters: PageFilters) {
  const where: Prisma.AnnouncementWhereInput = {
    isPublished: true,
    departmentId: filters.departmentId,
    OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
  };
  const [announcements, total] = await database.$transaction([
    database.announcement.findMany({
      where,
      select: announcementPublicSelect,
      orderBy: { publishedAt: "desc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    database.announcement.count({ where }),
  ]);
  return {
    announcements,
    pagination: pagination(total, filters.page, filters.limit),
  };
}
export async function publicAnnouncement(id: number) {
  const announcement = await database.announcement.findFirst({
    where: {
      id,
      isPublished: true,
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    },
    select: announcementPublicSelect,
  });
  if (!announcement) throw new AppError(404, "Announcement not found");
  return announcement;
}

export async function publicEvents(
  filters: PageFilters & { upcoming?: boolean },
) {
  const where: Prisma.CityEventWhereInput = {
    isPublished: true,
    departmentId: filters.departmentId,
    startsAt: filters.upcoming ? { gte: new Date() } : undefined,
  };
  const [events, total] = await database.$transaction([
    database.cityEvent.findMany({
      where,
      select: eventPublicSelect,
      orderBy: { startsAt: "asc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    database.cityEvent.count({ where }),
  ]);
  return { events, pagination: pagination(total, filters.page, filters.limit) };
}
export async function publicEvent(id: number) {
  const event = await database.cityEvent.findFirst({
    where: { id, isPublished: true },
    select: eventPublicSelect,
  });
  if (!event) throw new AppError(404, "Event not found");
  return event;
}

export async function managedServices(
  user: AuthenticatedUser,
  filters: PageFilters,
) {
  const own = await managerDepartment(user);
  const departmentId =
    user.role === UserRole.ADMIN ? filters.departmentId : own!;
  const where = { departmentId };
  const [services, total] = await database.$transaction([
    database.municipalService.findMany({
      where,
      include: {
        department: { select: departmentSelect },
        fields: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    database.municipalService.count({ where }),
  ]);
  return {
    services,
    pagination: pagination(total, filters.page, filters.limit),
  };
}
export async function createService(
  user: AuthenticatedUser,
  input: ServiceInput,
) {
  const departmentId = await resolvedDepartment(user, input.departmentId, true);
  return database.municipalService.create({
    data: { ...input, departmentId: departmentId!, department: undefined },
    include: { department: { select: departmentSelect } },
  });
}
export async function updateService(
  user: AuthenticatedUser,
  id: number,
  input: Partial<ServiceInput>,
) {
  const own = await managerDepartment(user);
  const current = await database.municipalService.findUnique({ where: { id } });
  if (!current) throw new AppError(404, "Service not found");
  if (user.role !== UserRole.ADMIN && current.departmentId !== own)
    throw new AppError(403, "You cannot manage this service");
  const { departmentId: _ignored, ...data } = input;
  return database.municipalService.update({
    where: { id },
    data,
    include: { department: { select: departmentSelect } },
  });
}

export async function managedAnnouncements(
  user: AuthenticatedUser,
  filters: PageFilters,
) {
  const own = await managerDepartment(user);
  const departmentId =
    user.role === UserRole.ADMIN ? filters.departmentId : own!;
  const where = { departmentId };
  const [announcements, total] = await database.$transaction([
    database.announcement.findMany({
      where,
      include: { department: { select: departmentSelect } },
      orderBy: { updatedAt: "desc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    database.announcement.count({ where }),
  ]);
  return {
    announcements,
    pagination: pagination(total, filters.page, filters.limit),
  };
}
export async function createAnnouncement(
  user: AuthenticatedUser,
  input: AnnouncementInput,
) {
  const departmentId = await resolvedDepartment(user, input.departmentId);
  return database.announcement.create({
    data: {
      ...input,
      departmentId,
      createdById: user.userId,
      ...publishedData(input.isPublished),
    },
    include: { department: { select: departmentSelect } },
  });
}
export async function updateAnnouncement(
  user: AuthenticatedUser,
  id: number,
  input: Partial<AnnouncementInput>,
) {
  const own = await managerDepartment(user);
  const current = await database.announcement.findUnique({
    where: { id },
    select: { departmentId: true, isPublished: true, publishedAt: true },
  });
  if (!current) throw new AppError(404, "Announcement not found");
  if (user.role !== UserRole.ADMIN && current.departmentId !== own)
    throw new AppError(403, "You cannot manage this announcement");
  const { departmentId: _ignored, isPublished, ...data } = input;
  return database.announcement.update({
    where: { id },
    data: { ...data, ...publishedData(isPublished, current) },
    include: { department: { select: departmentSelect } },
  });
}

export async function managedEvents(
  user: AuthenticatedUser,
  filters: PageFilters,
) {
  const own = await managerDepartment(user);
  const departmentId =
    user.role === UserRole.ADMIN ? filters.departmentId : own!;
  const where = { departmentId };
  const [events, total] = await database.$transaction([
    database.cityEvent.findMany({
      where,
      include: { department: { select: departmentSelect } },
      orderBy: { startsAt: "asc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    database.cityEvent.count({ where }),
  ]);
  return { events, pagination: pagination(total, filters.page, filters.limit) };
}
export async function createEvent(user: AuthenticatedUser, input: EventInput) {
  const departmentId = await resolvedDepartment(user, input.departmentId);
  return database.cityEvent.create({
    data: {
      ...input,
      departmentId,
      createdById: user.userId,
      ...publishedData(input.isPublished),
    },
    include: { department: { select: departmentSelect } },
  });
}
export async function updateEvent(
  user: AuthenticatedUser,
  id: number,
  input: Partial<EventInput>,
) {
  const own = await managerDepartment(user);
  const current = await database.cityEvent.findUnique({
    where: { id },
    select: {
      departmentId: true,
      isPublished: true,
      publishedAt: true,
      startsAt: true,
      endsAt: true,
      latitude: true,
      longitude: true,
    },
  });
  if (!current) throw new AppError(404, "Event not found");
  if (user.role !== UserRole.ADMIN && current.departmentId !== own)
    throw new AppError(403, "You cannot manage this event");
  const startsAt = input.startsAt ?? current.startsAt,
    endsAt = input.endsAt === undefined ? current.endsAt : input.endsAt,
    latitude = input.latitude === undefined ? current.latitude : input.latitude,
    longitude =
      input.longitude === undefined ? current.longitude : input.longitude;
  if (endsAt && endsAt < startsAt)
    throw new AppError(400, "endsAt must be after startsAt");
  if ((latitude == null) !== (longitude == null))
    throw new AppError(400, "latitude and longitude must be provided together");
  const { departmentId: _ignored, isPublished, ...data } = input;
  return database.cityEvent.update({
    where: { id },
    data: { ...data, ...publishedData(isPublished, current) },
    include: { department: { select: departmentSelect } },
  });
}
