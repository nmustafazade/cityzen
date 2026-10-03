import type { NextFunction, Request, Response } from "express";

import * as content from "../services/municipal-content.service";
import {
  uploadContentImage,
  type ContentKind,
} from "../services/content-image.service";
import type {
  AnnouncementInput,
  EventInput,
  ServiceInput,
} from "../types/municipal-content.types";
import { AppError } from "../utils/app-error";
import { ServiceFieldType } from "@prisma/client";
import * as advanced from "../services/advanced-service.service";

const record = (body: unknown) => {
  if (!body || typeof body !== "object")
    throw new AppError(400, "Invalid request body");
  return body as Record<string, unknown>;
};
const positive = (value: unknown, field: string) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0)
    throw new AppError(400, `${field} must be a positive integer`);
  return number;
};
const optionalId = (value: unknown) =>
  value === undefined || value === ""
    ? undefined
    : positive(value, "departmentId");
const text = (value: unknown, field: string, max = 5000) => {
  if (typeof value !== "string" || !value.trim())
    throw new AppError(400, `${field} is required`);
  const result = value.trim();
  if (result.length > max) throw new AppError(400, `${field} is too long`);
  return result;
};
const optionalText = (value: unknown, field: string, max = 5000) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string")
    throw new AppError(400, `${field} must be a string`);
  const result = value.trim();
  if (result.length > max) throw new AppError(400, `${field} is too long`);
  return result || null;
};
const bool = (value: unknown, field: string) => {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  throw new AppError(400, `${field} must be true or false`);
};
const optionalBool = (value: unknown, field: string) =>
  value === undefined ? undefined : bool(value, field);
const date = (
  value: unknown,
  field: string,
  optional = false,
): Date | null | undefined => {
  if ((value === undefined || value === null || value === "") && optional)
    return value === undefined ? undefined : null;
  if (typeof value !== "string")
    throw new AppError(400, `${field} must be a valid date`);
  const result = new Date(value);
  if (Number.isNaN(result.getTime()))
    throw new AppError(400, `${field} must be a valid date`);
  return result;
};
const url = (value: unknown) => {
  const result = optionalText(value, "externalUrl", 500);
  if (!result) return result;
  try {
    const parsed = new URL(result);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
  } catch {
    throw new AppError(400, "externalUrl must be a valid HTTP or HTTPS URL");
  }
  return result;
};
const email = (value: unknown) => {
  const result = optionalText(value, "contactEmail", 254);
  if (result && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result))
    throw new AppError(400, "contactEmail must be valid");
  return result;
};
const coordinate = (
  value: unknown,
  field: string,
  min: number,
  max: number,
) => {
  if (value === undefined || value === null || value === "")
    return value === undefined ? undefined : null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max)
    throw new AppError(400, `${field} must be between ${min} and ${max}`);
  return number;
};
const id = (request: Request) => positive(request.params.id, "id");
const user = (request: Request) => {
  if (!request.user) throw new AppError(401, "Authentication required");
  return request.user;
};
function paging(request: Request, fallback: number) {
  const page =
    request.query.page === undefined ? 1 : positive(request.query.page, "page");
  const limit =
    request.query.limit === undefined
      ? fallback
      : positive(request.query.limit, "limit");
  if (limit > 100) throw new AppError(400, "limit cannot exceed 100");
  return { page, limit, departmentId: optionalId(request.query.departmentId) };
}

function serviceInput(body: unknown, partial = false): Partial<ServiceInput> {
  const value = record(body);
  return {
    departmentId: optionalId(value.departmentId),
    title:
      partial && value.title === undefined
        ? undefined
        : text(value.title, "title", 150),
    description:
      partial && value.description === undefined
        ? undefined
        : text(value.description, "description"),
    instructions: optionalText(value.instructions, "instructions"),
    requirements: optionalText(value.requirements, "requirements"),
    contactPhone: optionalText(value.contactPhone, "contactPhone", 50),
    contactEmail: email(value.contactEmail),
    externalUrl: url(value.externalUrl),
    address: optionalText(value.address, "address", 300),
    isActive: optionalBool(value.isActive, "isActive"),
  };
}
function announcementInput(
  body: unknown,
  partial = false,
): Partial<AnnouncementInput> {
  const value = record(body);
  return {
    departmentId:
      value.departmentId === null ? null : optionalId(value.departmentId),
    title:
      partial && value.title === undefined
        ? undefined
        : text(value.title, "title", 150),
    content:
      partial && value.content === undefined
        ? undefined
        : text(value.content, "content"),
    expiresAt: date(value.expiresAt, "expiresAt", true),
    isPublished: optionalBool(value.isPublished, "isPublished"),
  };
}
function eventInput(body: unknown, partial = false): Partial<EventInput> {
  const value = record(body);
  const latitude = coordinate(value.latitude, "latitude", -90, 90);
  const longitude = coordinate(value.longitude, "longitude", -180, 180);
  if ((latitude == null) !== (longitude == null))
    throw new AppError(400, "latitude and longitude must be provided together");
  const startsAt =
    partial && value.startsAt === undefined
      ? undefined
      : (date(value.startsAt, "startsAt") as Date);
  const endsAt = date(value.endsAt, "endsAt", true);
  if (startsAt && endsAt && endsAt < startsAt)
    throw new AppError(400, "endsAt must be after startsAt");
  return {
    departmentId:
      value.departmentId === null ? null : optionalId(value.departmentId),
    title:
      partial && value.title === undefined
        ? undefined
        : text(value.title, "title", 150),
    description:
      partial && value.description === undefined
        ? undefined
        : text(value.description, "description"),
    locationName: optionalText(value.locationName, "locationName", 200),
    address: optionalText(value.address, "address", 300),
    latitude,
    longitude,
    startsAt,
    endsAt,
    externalUrl: url(value.externalUrl),
    isPublished: optionalBool(value.isPublished, "isPublished"),
  };
}

export const listServices = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const search = req.query.search;
    if (search !== undefined && typeof search !== "string")
      throw new AppError(400, "search must be a string");
    res.json(
      await content.publicServices({
        ...paging(req, 12),
        search: search?.trim() || undefined,
      }),
    );
  } catch (error) {
    next(error);
  }
};
export const serviceById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json({ service: await content.publicService(id(req)) });
  } catch (error) {
    next(error);
  }
};
export const listAnnouncements = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await content.publicAnnouncements(paging(req, 10)));
  } catch (error) {
    next(error);
  }
};
export const announcementById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json({ announcement: await content.publicAnnouncement(id(req)) });
  } catch (error) {
    next(error);
  }
};
export const listEvents = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(
      await content.publicEvents({
        ...paging(req, 10),
        upcoming:
          req.query.upcoming === undefined
            ? undefined
            : bool(req.query.upcoming, "upcoming"),
      }),
    );
  } catch (error) {
    next(error);
  }
};
export const eventById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json({ event: await content.publicEvent(id(req)) });
  } catch (error) {
    next(error);
  }
};

export const managedServices = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await content.managedServices(user(req), paging(req, 20)));
  } catch (error) {
    next(error);
  }
};
export const createService = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.status(201).json({
      service: await content.createService(
        user(req),
        serviceInput(req.body) as ServiceInput,
      ),
    });
  } catch (error) {
    next(error);
  }
};
export const updateService = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json({
      service: await content.updateService(
        user(req),
        id(req),
        serviceInput(req.body, true),
      ),
    });
  } catch (error) {
    next(error);
  }
};
export const managedAnnouncements = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await content.managedAnnouncements(user(req), paging(req, 20)));
  } catch (error) {
    next(error);
  }
};
export const createAnnouncement = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.status(201).json({
      announcement: await content.createAnnouncement(
        user(req),
        announcementInput(req.body) as AnnouncementInput,
      ),
    });
  } catch (error) {
    next(error);
  }
};
export const updateAnnouncement = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json({
      announcement: await content.updateAnnouncement(
        user(req),
        id(req),
        announcementInput(req.body, true),
      ),
    });
  } catch (error) {
    next(error);
  }
};
export const managedEvents = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await content.managedEvents(user(req), paging(req, 20)));
  } catch (error) {
    next(error);
  }
};
export const createEvent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.status(201).json({
      event: await content.createEvent(
        user(req),
        eventInput(req.body) as EventInput,
      ),
    });
  } catch (error) {
    next(error);
  }
};
export const updateEvent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json({
      event: await content.updateEvent(
        user(req),
        id(req),
        eventInput(req.body, true),
      ),
    });
  } catch (error) {
    next(error);
  }
};
export const uploadImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const kind = req.params.kind as ContentKind;
    if (!["services", "announcements", "events"].includes(kind))
      throw new AppError(404, "Content not found");
    res
      .status(201)
      .json(await uploadContentImage(kind, id(req), user(req), req.file));
  } catch (error) {
    next(error);
  }
};
export const appointmentSlots = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json({ slots: await advanced.publicSlots(id(req)) });
  } catch (error) {
    next(error);
  }
};
export const managedAppointmentSlots = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json({ slots: await advanced.managedSlots(user(req), id(req)) });
  } catch (error) {
    next(error);
  }
};
export const saveAppointmentSlot = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = record(req.body),
      startsAt = date(body.startsAt, "startsAt") as Date,
      endsAt = date(body.endsAt, "endsAt") as Date,
      capacity = positive(body.capacity, "capacity");
    res.status(201).json({
      slot: await advanced.saveSlot(user(req), id(req), {
        startsAt,
        endsAt,
        capacity,
        isActive: optionalBool(body.isActive, "isActive"),
      }),
    });
  } catch (error) {
    next(error);
  }
};
export const updateAppointmentSlot = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = record(req.body),
      startsAt = date(body.startsAt, "startsAt") as Date,
      endsAt = date(body.endsAt, "endsAt") as Date,
      capacity = positive(body.capacity, "capacity");
    res.json({
      slot: await advanced.saveSlot(
        user(req),
        positive(req.params.serviceId, "serviceId"),
        {
          startsAt,
          endsAt,
          capacity,
          isActive: optionalBool(body.isActive, "isActive"),
        },
        positive(req.params.slotId, "slotId"),
      ),
    });
  } catch (error) {
    next(error);
  }
};
export const saveServiceField = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = record(req.body),
      type = body.type;
    if (
      typeof type !== "string" ||
      !Object.values(ServiceFieldType).includes(type as ServiceFieldType)
    )
      throw new AppError(400, "Invalid field type");
    const numberOrNull = (v: unknown) =>
      v === undefined ? undefined : v === null || v === "" ? null : Number(v);
    res.status(201).json({
      field: await advanced.saveField(user(req), id(req), {
        label: text(body.label, "label", 150),
        fieldKey: text(body.fieldKey, "fieldKey", 50),
        type: type as ServiceFieldType,
        description: optionalText(body.description, "description", 500),
        placeholder: optionalText(body.placeholder, "placeholder", 200),
        isRequired: optionalBool(body.isRequired, "isRequired"),
        options: body.options,
        minLength: numberOrNull(body.minLength),
        maxLength: numberOrNull(body.maxLength),
        minValue: numberOrNull(body.minValue),
        maxValue: numberOrNull(body.maxValue),
        sortOrder:
          body.sortOrder === undefined ? undefined : Number(body.sortOrder),
        isActive: optionalBool(body.isActive, "isActive"),
      }),
    });
  } catch (error) {
    next(error);
  }
};
export const updateServiceField = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    req.params.id = req.params.serviceId;
    const body = record(req.body),
      type = body.type;
    if (
      typeof type !== "string" ||
      !Object.values(ServiceFieldType).includes(type as ServiceFieldType)
    )
      throw new AppError(400, "Invalid field type");
    res.json({
      field: await advanced.saveField(
        user(req),
        positive(req.params.serviceId, "serviceId"),
        {
          label: text(body.label, "label", 150),
          fieldKey: text(body.fieldKey, "fieldKey", 50),
          type: type as ServiceFieldType,
          isRequired: optionalBool(body.isRequired, "isRequired"),
          options: body.options,
          sortOrder:
            body.sortOrder === undefined ? undefined : Number(body.sortOrder),
          isActive: optionalBool(body.isActive, "isActive"),
        },
        positive(req.params.fieldId, "fieldId"),
      ),
    });
  } catch (error) {
    next(error);
  }
};
export const configureService = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = record(req.body);
    res.json({
      service: await advanced.configureService(user(req), id(req), {
        allowsDocuments: optionalBool(body.allowsDocuments, "allowsDocuments"),
        documentsRequired: optionalBool(
          body.documentsRequired,
          "documentsRequired",
        ),
        maxDocuments:
          body.maxDocuments === undefined
            ? undefined
            : positive(body.maxDocuments, "maxDocuments"),
        supportsAppointments: optionalBool(
          body.supportsAppointments,
          "supportsAppointments",
        ),
        appointmentRequired: optionalBool(
          body.appointmentRequired,
          "appointmentRequired",
        ),
      }),
    });
  } catch (error) {
    next(error);
  }
};
