import { ReportPriority, ReportStatus } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import {
  assignReport,
  cancelReport,
  changeReportStatus,
  createReport,
  getReportById,
  listActiveReportCategories,
  listMyReports,
  listReports,
} from "../services/report.service";
import type {
  AssignReportInput,
  ChangeReportStatusInput,
  CreateReportInput,
  ManageReportFilters,
  MyReportFilters,
} from "../types/report.types";
import { AppError } from "../utils/app-error";
import{moderate,setVisibility,similarReports}from"../services/public-report.service";

const reportStatuses = Object.values(ReportStatus);
const reportPriorities = Object.values(ReportPriority);

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new AppError(400, `${field} is required`);
  }
  return value;
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new AppError(400, `${field} must be a string`);
  return value;
}

function positiveInteger(value: unknown, field: string): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(400, `${field} must be a positive integer`);
  }
  return parsed;
}

function optionalPositiveInteger(value: unknown, field: string): number | undefined {
  return value === undefined ? undefined : positiveInteger(value, field);
}

function coordinate(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) {
    throw new AppError(400, `${field} must be between ${minimum} and ${maximum}`);
  }
  return parsed;
}

function requiredCoordinate(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
): number {
  const parsed = coordinate(value, field, minimum, maximum);
  if (parsed === undefined) throw new AppError(400, `${field} is required`);
  return parsed;
}

function validImageUrls(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new AppError(400, "imageUrls must be an array");

  return value.map((item) => {
    if (typeof item !== "string") throw new AppError(400, "Each image URL must be valid");
    try {
      const url = new URL(item);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      return item;
    } catch {
      throw new AppError(400, "Each image URL must be a valid HTTP or HTTPS URL");
    }
  });
}

function pagination(query: Request["query"]) {
  const page = query.page === undefined ? 1 : positiveInteger(query.page, "page");
  const limit = query.limit === undefined ? 10 : positiveInteger(query.limit, "limit");
  if (limit > 100) throw new AppError(400, "limit cannot exceed 100");
  return { page, limit };
}

function parseStatus(value: unknown): ReportStatus | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !reportStatuses.includes(value as ReportStatus)) {
    throw new AppError(400, "Invalid report status");
  }
  return value as ReportStatus;
}

function parsePriority(value: unknown): ReportPriority | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !reportPriorities.includes(value as ReportPriority)) {
    throw new AppError(400, "Invalid report priority");
  }
  return value as ReportPriority;
}

function authenticatedUser(request: Request) {
  if (!request.user) throw new AppError(401, "Authentication required");
  return request.user;
}

function parseCreateBody(body: unknown): CreateReportInput {
  if (!body || typeof body !== "object") throw new AppError(400, "Invalid request body");
  const input = body as Record<string, unknown>;
  const addressText = requiredString(input.addressText, "address").trim();
  if (addressText.length > 180) throw new AppError(400, "address must be 180 characters or fewer");
  return {
    title: requiredString(input.title, "title"),
    description: requiredString(input.description, "description"),
    categoryId: positiveInteger(input.categoryId, "categoryId"),
    addressText,
    latitude: requiredCoordinate(input.latitude, "latitude", -90, 90),
    longitude: requiredCoordinate(input.longitude, "longitude", -180, 180),
    imageUrls: validImageUrls(input.imageUrls),
    isPublic: input.isPublic === undefined ? false : input.isPublic === true,
  };
}

export async function create(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = authenticatedUser(request);
    response.status(201).json({ report: await createReport(user.userId, parseCreateBody(request.body)) });
  } catch (error) { next(error); }
}

export async function similar(request:Request,response:Response,next:NextFunction){try{response.json({reports:await similarReports(positiveInteger(request.query.categoryId,"categoryId"),requiredCoordinate(request.query.latitude,"latitude",-90,90),requiredCoordinate(request.query.longitude,"longitude",-180,180),typeof request.query.title==="string"?request.query.title:undefined)})}catch(error){next(error)}}
export async function visibility(request:Request,response:Response,next:NextFunction){try{if(typeof(request.body as Record<string,unknown>).isPublic!=="boolean")throw new AppError(400,"isPublic must be a boolean");response.json({report:await setVisibility(positiveInteger(request.params.id,"report id"),authenticatedUser(request),(request.body as Record<string,unknown>).isPublic as boolean)})}catch(error){next(error)}}
export async function moderation(request:Request,response:Response,next:NextFunction){try{const body=request.body as Record<string,unknown>;if(typeof body.hidden!=="boolean")throw new AppError(400,"hidden must be a boolean");response.json({report:await moderate(positiveInteger(request.params.id,"report id"),authenticatedUser(request),body.hidden,optionalString(body.reason,"reason"))})}catch(error){next(error)}}

export async function myReports(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = authenticatedUser(request);
    const filters: MyReportFilters = {
      ...pagination(request.query),
      status: parseStatus(request.query.status),
      categoryId: optionalPositiveInteger(request.query.categoryId, "categoryId"),
    };
    response.json(await listMyReports(user.userId, filters));
  } catch (error) { next(error); }
}

export async function byId(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    response.json({
      report: await getReportById(
        positiveInteger(request.params.id, "report id"),
        authenticatedUser(request),
      ),
    });
  } catch (error) { next(error); }
}

export async function cancel(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = authenticatedUser(request);
    response.json({
      report: await cancelReport(positiveInteger(request.params.id, "report id"), user.userId),
    });
  } catch (error) { next(error); }
}

export async function index(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const sortBy = request.query.sortBy ?? "createdAt";
    const sortOrder = request.query.sortOrder ?? "desc";
    if (!["createdAt", "updatedAt", "priority"].includes(String(sortBy))) {
      throw new AppError(400, "sortBy must be createdAt, updatedAt, or priority");
    }
    if (!["asc", "desc"].includes(String(sortOrder))) {
      throw new AppError(400, "sortOrder must be asc or desc");
    }
    const filters: ManageReportFilters = {
      ...pagination(request.query),
      status: parseStatus(request.query.status),
      priority: parsePriority(request.query.priority),
      categoryId: optionalPositiveInteger(request.query.categoryId, "categoryId"),
      departmentId: optionalPositiveInteger(request.query.departmentId, "departmentId"),
      assignedEmployeeId: optionalPositiveInteger(request.query.assignedEmployeeId, "assignedEmployeeId"),
      citizenId: optionalPositiveInteger(request.query.citizenId, "citizenId"),
      sortBy: sortBy as ManageReportFilters["sortBy"],
      sortOrder: sortOrder as ManageReportFilters["sortOrder"],
    };
    response.json(await listReports(authenticatedUser(request), filters));
  } catch (error) { next(error); }
}

export async function changeStatus(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!request.body || typeof request.body !== "object") throw new AppError(400, "Invalid request body");
    const status = parseStatus(request.body.status);
    if (!status) throw new AppError(400, "status is required");
    const input: ChangeReportStatusInput = {
      status,
      note: optionalString(request.body.note, "note"),
    };
    response.json({
      report: await changeReportStatus(
        positiveInteger(request.params.id, "report id"),
        authenticatedUser(request),
        input,
      ),
    });
  } catch (error) { next(error); }
}

export async function assign(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!request.body || typeof request.body !== "object") throw new AppError(400, "Invalid request body");
    const input: AssignReportInput = {
      departmentId: optionalPositiveInteger(request.body.departmentId, "departmentId"),
      employeeId: optionalPositiveInteger(request.body.employeeId, "employeeId"),
    };
    if (!input.departmentId && !input.employeeId) {
      throw new AppError(400, "departmentId or employeeId is required");
    }
    response.json({
      report: await assignReport(
        positiveInteger(request.params.id, "report id"),
        authenticatedUser(request),
        input,
      ),
    });
  } catch (error) { next(error); }
}

export async function categories(
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    response.json({ categories: await listActiveReportCategories() });
  } catch (error) { next(error); }
}
