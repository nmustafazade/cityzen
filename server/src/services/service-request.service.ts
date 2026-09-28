import { NotificationType, Prisma, ServiceRequestStatus, UserRole } from "@prisma/client";

import database from "../config/database";
import type { AuthenticatedUser } from "../types/auth.types";
import type { CreateServiceRequestInput, ServiceRequestFilters, UpdateServiceRequestStatusInput } from "../types/service-request.types";
import { AppError } from "../utils/app-error";
import { createNotification } from "./notification.service";
import { validateFieldValues } from "./advanced-service.service";

const userSelect = { id: true, firstName: true, lastName: true, email: true, phone: true, profileImageUrl: true } as const;
const employeeSelect = { id: true, firstName: true, lastName: true, profileImageUrl: true } as const;
const listInclude = {
  service: { select: { id: true, title: true, isActive: true,allowsDocuments:true,documentsRequired:true,maxDocuments:true } },
  department: { select: { id: true, name: true } },
  assignedEmployee: { select: employeeSelect },
} as const;
const detailInclude = {
  ...listInclude,
  citizen: { select: userSelect },
  history: { orderBy: { createdAt: "asc" as const }, include: { changedBy: { select: employeeSelect } } },
  fieldValues: { orderBy: { id: "asc" as const } },
  documents: { orderBy: { createdAt: "asc" as const }, select: { id:true,originalFileName:true,mimeType:true,fileSize:true,createdAt:true } },
  appointmentSlot: true,
} as const;

const transitions: Record<ServiceRequestStatus, ServiceRequestStatus[]> = {
  SUBMITTED: [ServiceRequestStatus.UNDER_REVIEW, ServiceRequestStatus.REJECTED],
  UNDER_REVIEW: [ServiceRequestStatus.ASSIGNED, ServiceRequestStatus.REJECTED],
  ASSIGNED: [ServiceRequestStatus.IN_PROGRESS, ServiceRequestStatus.REJECTED],
  IN_PROGRESS: [ServiceRequestStatus.COMPLETED, ServiceRequestStatus.REJECTED],
  COMPLETED: [], REJECTED: [], CANCELLED: [],
};
const cancellableStatuses: ServiceRequestStatus[] = [ServiceRequestStatus.SUBMITTED, ServiceRequestStatus.UNDER_REVIEW];
const assignableStatuses: ServiceRequestStatus[] = [ServiceRequestStatus.SUBMITTED, ServiceRequestStatus.UNDER_REVIEW];

function pagination(total: number, page: number, limit: number) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

async function actorWithDepartment(user: AuthenticatedUser, client: Prisma.TransactionClient | typeof database = database) {
  const actor = await client.user.findUnique({ where: { id: user.userId }, select: { id: true, role: true, departmentId: true } });
  if (!actor?.id) throw new AppError(401, "Authentication required");
  return actor;
}

function scopeFor(actor: { id: number; role: UserRole; departmentId: number | null }): Prisma.ServiceRequestWhereInput {
  if (actor.role === UserRole.ADMIN) return {};
  if (actor.role === UserRole.DEPARTMENT_HEAD) {
    if (!actor.departmentId) return { id: -1 };
    return { departmentId: actor.departmentId };
  }
  if (actor.role === UserRole.EMPLOYEE) return { assignedEmployeeId: actor.id };
  return { citizenId: actor.id };
}

export async function createServiceRequest(citizenId: number, input: CreateServiceRequestInput) {
  return database.$transaction(async (transaction) => {
    const service = await transaction.municipalService.findFirst({
      where: { id: input.serviceId, isActive: true, department: { isActive: true } },
      select: { id: true, title: true, departmentId: true, supportsAppointments:true,appointmentRequired:true,fields:{where:{isActive:true},orderBy:{sortOrder:"asc"}}, department: { select: { name: true, employees: { where: { role: UserRole.DEPARTMENT_HEAD, isActive: true }, select: { id: true } } } } },
    });
    if (!service) throw new AppError(400, "Municipal service does not exist or is inactive");
    const values=validateFieldValues(service.fields,input.fields);
    if(service.appointmentRequired&&!input.appointmentSlotId)throw new AppError(400,"An appointment is required for this service");
    if(input.appointmentSlotId){if(!service.supportsAppointments)throw new AppError(400,"This service does not support appointments");const slot=await transaction.serviceAppointmentSlot.findFirst({where:{id:input.appointmentSlotId,serviceId:service.id,departmentId:service.departmentId,isActive:true,startsAt:{gt:new Date()}}});if(!slot)throw new AppError(400,"Appointment slot is invalid or unavailable");const booked=await transaction.serviceRequest.count({where:{appointmentSlotId:slot.id,status:{notIn:[ServiceRequestStatus.CANCELLED,ServiceRequestStatus.REJECTED]}}});if(booked>=slot.capacity)throw new AppError(409,"Appointment slot is fully booked")}

    const request = await transaction.serviceRequest.create({
      data: { serviceId: service.id, citizenId, departmentId: service.departmentId, appointmentSlotId:input.appointmentSlotId,description: input.description.trim(), address: input.address?.trim() || undefined, latitude: input.latitude, longitude: input.longitude, preferredDate: input.preferredDate, contactPhone: input.contactPhone?.trim() || undefined,fieldValues:{create:values} },
    });
    await transaction.serviceRequestStatusHistory.create({ data: { serviceRequestId: request.id, oldStatus: null, newStatus: ServiceRequestStatus.SUBMITTED, changedById: citizenId } });
    for (const head of service.department.employees) {
      await createNotification({ userId: head.id, actorId: citizenId, serviceRequestId: request.id, type: NotificationType.SERVICE_REQUEST_CREATED, title: "New service request", message: `A new ${service.title} request has been submitted.` }, transaction);
    }
    return transaction.serviceRequest.findUniqueOrThrow({ where: { id: request.id }, include: detailInclude });
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
}

export async function listMyServiceRequests(citizenId: number, filters: ServiceRequestFilters) {
  const where: Prisma.ServiceRequestWhereInput = { citizenId, status: filters.status, serviceId: filters.serviceId };
  const [requests, total] = await database.$transaction([
    database.serviceRequest.findMany({ where, include: listInclude, orderBy: { createdAt: "desc" }, skip: (filters.page - 1) * filters.limit, take: filters.limit }),
    database.serviceRequest.count({ where }),
  ]);
  return { requests, pagination: pagination(total, filters.page, filters.limit) };
}

export async function getServiceRequest(id: number, user: AuthenticatedUser) {
  const actor = await actorWithDepartment(user);
  const request = await database.serviceRequest.findFirst({ where: { id, ...scopeFor(actor) }, include: detailInclude });
  if (!request) throw new AppError(404, "Service request not found");
  return request;
}

export async function cancelServiceRequest(id: number, citizenId: number) {
  return database.$transaction(async (transaction) => {
    const request = await transaction.serviceRequest.findFirst({ where: { id, citizenId }, select: { id: true, status: true } });
    if (!request) throw new AppError(404, "Service request not found");
    if (!cancellableStatuses.includes(request.status)) throw new AppError(409, "This service request can no longer be cancelled");
    await transaction.serviceRequest.update({ where: { id }, data: { status: ServiceRequestStatus.CANCELLED } });
    await transaction.serviceRequestStatusHistory.create({ data: { serviceRequestId: id, oldStatus: request.status, newStatus: ServiceRequestStatus.CANCELLED, changedById: citizenId, note: "Cancelled by citizen" } });
    return transaction.serviceRequest.findUniqueOrThrow({ where: { id }, include: detailInclude });
  });
}

export async function listManagedServiceRequests(user: AuthenticatedUser, filters: ServiceRequestFilters) {
  const actor = await actorWithDepartment(user);
  const requested: Prisma.ServiceRequestWhereInput = { status: filters.status, serviceId: filters.serviceId, departmentId: filters.departmentId, assignedEmployeeId: filters.assignedEmployeeId, citizenId: filters.citizenId };
  const where: Prisma.ServiceRequestWhereInput = { AND: [scopeFor(actor), requested] };
  const [requests, total] = await database.$transaction([
    database.serviceRequest.findMany({ where, include: { ...listInclude, citizen: { select: userSelect } }, orderBy: { createdAt: "desc" }, skip: (filters.page - 1) * filters.limit, take: filters.limit }),
    database.serviceRequest.count({ where }),
  ]);
  return { requests, pagination: pagination(total, filters.page, filters.limit) };
}

export async function assignServiceRequest(id: number, user: AuthenticatedUser, employeeId: number) {
  return database.$transaction(async (transaction) => {
    const actor = await actorWithDepartment(user, transaction);
    const request = await transaction.serviceRequest.findUnique({ where: { id }, select: { id: true, status: true, citizenId: true, departmentId: true } });
    if (!request) throw new AppError(404, "Service request not found");
    if (actor.role === UserRole.DEPARTMENT_HEAD && request.departmentId !== actor.departmentId) throw new AppError(403, "Department heads may assign only their department's requests");
    const employee = await transaction.user.findFirst({ where: { id: employeeId, role: UserRole.EMPLOYEE, isActive: true, departmentId: request.departmentId }, select: employeeSelect });
    if (!employee) throw new AppError(400, "Employee must be active and belong to the responsible department");
    const changesStatus = assignableStatuses.includes(request.status);
    await transaction.serviceRequest.update({ where: { id }, data: { assignedEmployeeId: employee.id, status: changesStatus ? ServiceRequestStatus.ASSIGNED : undefined } });
    if (changesStatus) await transaction.serviceRequestStatusHistory.create({ data: { serviceRequestId: id, oldStatus: request.status, newStatus: ServiceRequestStatus.ASSIGNED, changedById: actor.id, note: `Assigned to ${employee.firstName} ${employee.lastName}` } });
    await createNotification({ userId: employee.id, actorId: actor.id, serviceRequestId: id, type: NotificationType.SERVICE_REQUEST_ASSIGNED, title: "New service request assigned", message: `You have been assigned service request SR-${String(id).padStart(6, "0")}.` }, transaction);
    await createNotification({ userId: request.citizenId, actorId: actor.id, serviceRequestId: id, type: NotificationType.SERVICE_REQUEST_ASSIGNED, title: "Service request assigned", message: `Your service request SR-${String(id).padStart(6, "0")} has been assigned.` }, transaction);
    return transaction.serviceRequest.findUniqueOrThrow({ where: { id }, include: detailInclude });
  });
}

export async function updateServiceRequestStatus(id: number, user: AuthenticatedUser, input: UpdateServiceRequestStatusInput) {
  return database.$transaction(async (transaction) => {
    const actor = await actorWithDepartment(user, transaction);
    const request = await transaction.serviceRequest.findFirst({ where: { id, ...scopeFor(actor) }, select: { id: true, status: true, citizenId: true } });
    if (!request) throw new AppError(404, "Service request not found");
    if (request.status === input.status) throw new AppError(409, "Service request already has this status");
    if (!transitions[request.status].includes(input.status)) throw new AppError(409, `Cannot change status from ${request.status} to ${input.status}`);
    const completed = input.status === ServiceRequestStatus.COMPLETED;
    await transaction.serviceRequest.update({ where: { id }, data: { status: input.status, completedAt: completed ? new Date() : undefined, municipalityResponse: input.municipalityResponse?.trim() || undefined } });
    await transaction.serviceRequestStatusHistory.create({ data: { serviceRequestId: id, oldStatus: request.status, newStatus: input.status, changedById: actor.id, note: input.note?.trim() || undefined } });
    await createNotification({ userId: request.citizenId, actorId: actor.id, serviceRequestId: id, type: completed ? NotificationType.SERVICE_REQUEST_COMPLETED : NotificationType.SERVICE_REQUEST_STATUS_CHANGED, title: completed ? "Service request completed" : "Service request updated", message: completed ? `Your service request SR-${String(id).padStart(6, "0")} has been completed.` : `Your service request SR-${String(id).padStart(6, "0")} is now ${input.status.toLowerCase().replaceAll("_", " ")}.` }, transaction);
    return transaction.serviceRequest.findUniqueOrThrow({ where: { id }, include: detailInclude });
  });
}
