import {
  Prisma,
  ServiceFieldType,
  ServiceRequestStatus,
  UserRole,
} from "@prisma/client";
import database from "../config/database";
import type { AuthenticatedUser } from "../types/auth.types";
import { AppError } from "../utils/app-error";

export type ServiceFieldInput = {
  label: string;
  fieldKey: string;
  type: ServiceFieldType;
  description?: string | null;
  placeholder?: string | null;
  isRequired?: boolean;
  options?: unknown;
  minLength?: number | null;
  maxLength?: number | null;
  minValue?: number | null;
  maxValue?: number | null;
  sortOrder?: number;
  isActive?: boolean;
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
async function managedService(user: AuthenticatedUser, serviceId: number) {
  const service = await database.municipalService.findUnique({
    where: { id: serviceId },
  });
  if (!service) throw new AppError(404, "Service not found");
  const own = await managerDepartment(user);
  if (user.role !== UserRole.ADMIN && service.departmentId !== own)
    throw new AppError(403, "You cannot configure this service");
  return service;
}
function selectOptions(value: unknown) {
  if (!Array.isArray(value) || value.length < 1)
    throw new AppError(400, "SELECT fields require options");
  const options = value.map((item) => {
    if (!item || typeof item !== "object")
      throw new AppError(400, "Invalid select option");
    const { value, label } = item as Record<string, unknown>;
    if (
      typeof value !== "string" ||
      !value.trim() ||
      typeof label !== "string" ||
      !label.trim()
    )
      throw new AppError(400, "Each option requires value and label");
    return { value: value.trim(), label: label.trim() };
  });
  if (new Set(options.map((x) => x.value)).size !== options.length)
    throw new AppError(400, "Select option values must be unique");
  return options;
}
export async function saveField(
  user: AuthenticatedUser,
  serviceId: number,
  input: ServiceFieldInput,
  id?: number,
) {
  await managedService(user, serviceId);
  if (!/^[a-z][a-z0-9_]{1,49}$/.test(input.fieldKey))
    throw new AppError(
      400,
      "fieldKey must use lowercase letters, numbers, and underscores",
    );
  if (
    input.minLength != null &&
    input.maxLength != null &&
    input.minLength > input.maxLength
  )
    throw new AppError(400, "minLength cannot exceed maxLength");
  if (
    input.minValue != null &&
    input.maxValue != null &&
    input.minValue > input.maxValue
  )
    throw new AppError(400, "minValue cannot exceed maxValue");
  const data = {
    ...input,
    options:
      input.type === ServiceFieldType.SELECT
        ? selectOptions(input.options)
        : Prisma.JsonNull,
  };
  if (id) {
    const field = await database.municipalServiceField.findFirst({
      where: { id, serviceId },
    });
    if (!field) throw new AppError(404, "Service field not found");
    return database.municipalServiceField.update({ where: { id }, data });
  }
  return database.municipalServiceField.create({
    data: { ...data, serviceId },
  });
}
export async function configureService(
  user: AuthenticatedUser,
  serviceId: number,
  input: {
    allowsDocuments?: boolean;
    documentsRequired?: boolean;
    maxDocuments?: number;
    supportsAppointments?: boolean;
    appointmentRequired?: boolean;
  },
) {
  const current = await managedService(user, serviceId);
  if (
    input.maxDocuments !== undefined &&
    (!Number.isInteger(input.maxDocuments) ||
      input.maxDocuments < 1 ||
      input.maxDocuments > 5)
  )
    throw new AppError(400, "maxDocuments must be between 1 and 5");
  const allowsDocuments = input.allowsDocuments ?? current.allowsDocuments,
    documentsRequired = input.documentsRequired ?? current.documentsRequired,
    supportsAppointments =
      input.supportsAppointments ?? current.supportsAppointments,
    appointmentRequired =
      input.appointmentRequired ?? current.appointmentRequired;
  if (documentsRequired && !allowsDocuments)
    throw new AppError(400, "Required documents must be enabled");
  if (appointmentRequired && !supportsAppointments)
    throw new AppError(400, "Required appointments must be enabled");
  return database.municipalService.update({
    where: { id: serviceId },
    data: {
      ...input,
      documentsRequired: allowsDocuments ? documentsRequired : false,
      appointmentRequired: supportsAppointments ? appointmentRequired : false,
    },
    include: { fields: { orderBy: { sortOrder: "asc" } } },
  });
}
export async function publicSlots(serviceId: number) {
  const service = await database.municipalService.findFirst({
    where: { id: serviceId, isActive: true },
    select: { supportsAppointments: true },
  });
  if (!service) throw new AppError(404, "Service not found");
  if (!service.supportsAppointments) return [];
  const slots = await database.serviceAppointmentSlot.findMany({
    where: { serviceId, isActive: true, startsAt: { gt: new Date() } },
    include: {
      _count: {
        select: {
          requests: {
            where: {
              status: {
                notIn: [
                  ServiceRequestStatus.CANCELLED,
                  ServiceRequestStatus.REJECTED,
                ],
              },
            },
          },
        },
      },
    },
    orderBy: { startsAt: "asc" },
  });
  return slots
    .map(({ _count, ...slot }) => ({
      ...slot,
      remainingCapacity: Math.max(0, slot.capacity - _count.requests),
    }))
    .filter((slot) => slot.remainingCapacity > 0);
}
export async function managedSlots(user: AuthenticatedUser, serviceId: number) {
  await managedService(user, serviceId);
  const slots = await database.serviceAppointmentSlot.findMany({
    where: { serviceId },
    include: {
      _count: {
        select: {
          requests: {
            where: {
              status: {
                notIn: [
                  ServiceRequestStatus.CANCELLED,
                  ServiceRequestStatus.REJECTED,
                ],
              },
            },
          },
        },
      },
    },
    orderBy: { startsAt: "asc" },
  });
  return slots.map(({ _count, ...slot }) => ({
    ...slot,
    bookings: _count.requests,
    remainingCapacity: Math.max(0, slot.capacity - _count.requests),
  }));
}
export async function saveSlot(
  user: AuthenticatedUser,
  serviceId: number,
  input: { startsAt: Date; endsAt: Date; capacity: number; isActive?: boolean },
  id?: number,
) {
  const service = await managedService(user, serviceId);
  if (input.startsAt >= input.endsAt)
    throw new AppError(400, "Slot end must be after start");
  if (!Number.isInteger(input.capacity) || input.capacity < 1)
    throw new AppError(400, "capacity must be at least 1");
  if (id) {
    const slot = await database.serviceAppointmentSlot.findFirst({
      where: { id, serviceId },
    });
    if (!slot) throw new AppError(404, "Appointment slot not found");
    const bookings = await database.serviceRequest.count({
      where: {
        appointmentSlotId: id,
        status: {
          notIn: [
            ServiceRequestStatus.CANCELLED,
            ServiceRequestStatus.REJECTED,
          ],
        },
      },
    });
    if (input.capacity < bookings)
      throw new AppError(409, "Capacity cannot be lower than current bookings");
    return database.serviceAppointmentSlot.update({
      where: { id },
      data: input,
    });
  }
  return database.serviceAppointmentSlot.create({
    data: { ...input, serviceId, departmentId: service.departmentId },
  });
}

export function validateFieldValues(
  fields: Array<{
    id: number;
    fieldKey: string;
    label: string;
    type: ServiceFieldType;
    isRequired: boolean;
    options: unknown;
    minLength: number | null;
    maxLength: number | null;
    minValue: Prisma.Decimal | null;
    maxValue: Prisma.Decimal | null;
  }>,
  values: unknown,
) {
  if (values === undefined) values = {};
  if (!values || typeof values !== "object" || Array.isArray(values))
    throw new AppError(400, "fields must be an object");
  const input = values as Record<string, unknown>,
    known = new Set(fields.map((f) => f.fieldKey));
  for (const key of Object.keys(input))
    if (!known.has(key))
      throw new AppError(400, `Unknown service field: ${key}`);
  return fields.flatMap((field) => {
    const value = input[field.fieldKey];
    if (value === undefined || value === null || value === "") {
      if (field.isRequired)
        throw new AppError(400, `${field.label} is required`);
      return [];
    }
    let normalized: Prisma.InputJsonValue;
    if (field.type === ServiceFieldType.CHECKBOX) {
      if (typeof value !== "boolean")
        throw new AppError(400, `${field.label} must be true or false`);
      normalized = value;
    } else if (field.type === ServiceFieldType.NUMBER) {
      const number = Number(value);
      if (!Number.isFinite(number))
        throw new AppError(400, `${field.label} must be a number`);
      if (
        (field.minValue != null && number < Number(field.minValue)) ||
        (field.maxValue != null && number > Number(field.maxValue))
      )
        throw new AppError(400, `${field.label} is outside the allowed range`);
      normalized = number;
    } else {
      if (typeof value !== "string")
        throw new AppError(400, `${field.label} must be text`);
      const text = value.trim();
      if (
        (field.minLength != null && text.length < field.minLength) ||
        (field.maxLength != null && text.length > field.maxLength)
      )
        throw new AppError(400, `${field.label} has an invalid length`);
      if (
        field.type === ServiceFieldType.EMAIL &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
      )
        throw new AppError(400, `${field.label} must be a valid email`);
      if (
        field.type === ServiceFieldType.PHONE &&
        !/^[+()\d\s-]{7,30}$/.test(text)
      )
        throw new AppError(400, `${field.label} must be a valid phone number`);
      if (
        (field.type === ServiceFieldType.DATE ||
          field.type === ServiceFieldType.DATETIME) &&
        Number.isNaN(new Date(text).getTime())
      )
        throw new AppError(400, `${field.label} must be a valid date`);
      if (field.type === ServiceFieldType.SELECT) {
        const options = Array.isArray(field.options)
          ? (field.options as Array<{ value?: unknown }>)
          : [];
        if (!options.some((option) => option.value === text))
          throw new AppError(400, `${field.label} has an invalid selection`);
      }
      normalized = text;
    }
    return [
      {
        serviceFieldId: field.id,
        value: normalized,
        fieldLabelSnapshot: field.label,
        fieldTypeSnapshot: field.type,
      },
    ];
  });
}
