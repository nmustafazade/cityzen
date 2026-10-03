import { ReportStatus } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import * as service from "../services/public-report.service";
import { AppError } from "../utils/app-error";
const positive = (v: unknown, n: string) => {
  const x = Number(v);
  if (!Number.isInteger(x) || x <= 0)
    throw new AppError(400, `${n} must be a positive integer`);
  return x;
};
const optionalPositive = (v: unknown, n: string) =>
  v === undefined || v === "" ? undefined : positive(v, n);
const number = (v: unknown, n: string, min: number, max: number) => {
  const x = Number(v);
  if (!Number.isFinite(x) || x < min || x > max)
    throw new AppError(400, `Invalid ${n}`);
  return x;
};
export async function list(r: Request, s: Response, n: NextFunction) {
  try {
    const page = r.query.page ? positive(r.query.page, "page") : 1,
      limit = r.query.limit ? positive(r.query.limit, "limit") : 12;
    if (limit > 100) throw new AppError(400, "limit cannot exceed 100");
    const status =
      typeof r.query.status === "string" &&
      Object.values(ReportStatus).includes(r.query.status as ReportStatus)
        ? (r.query.status as ReportStatus)
        : undefined;
    const sort = ["newest", "supported", "updated"].includes(
      String(r.query.sort),
    )
      ? (String(r.query.sort) as "newest" | "supported" | "updated")
      : "newest";
    const hasBounds = [
      r.query.north,
      r.query.south,
      r.query.east,
      r.query.west,
    ].some((v) => v !== undefined);
    const bounds = hasBounds
      ? {
          north: number(r.query.north, "north", -90, 90),
          south: number(r.query.south, "south", -90, 90),
          east: number(r.query.east, "east", -180, 180),
          west: number(r.query.west, "west", -180, 180),
        }
      : undefined;
    s.json(
      await service.publicReports({
        status,
        categoryId: optionalPositive(r.query.categoryId, "categoryId"),
        departmentId: optionalPositive(r.query.departmentId, "departmentId"),
        search:
          typeof r.query.search === "string"
            ? r.query.search.trim()
            : undefined,
        page,
        limit,
        sort,
        bounds,
      }),
    );
  } catch (e) {
    n(e);
  }
}
export async function detail(r: Request, s: Response, n: NextFunction) {
  try {
    s.json({
      report: await service.publicReport(positive(r.params.id, "report id")),
    });
  } catch (e) {
    n(e);
  }
}
export async function comments(r: Request, s: Response, n: NextFunction) {
  try {
    s.json({
      comments: await service.publicComments(
        positive(r.params.id, "report id"),
      ),
    });
  } catch (e) {
    n(e);
  }
}
