import { ReportStatus } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import * as analytics from "../services/analytics.service";
import { AppError } from "../utils/app-error";
const auth = (r: Request) => {
  if (!r.user) throw new AppError(401, "Authentication required");
  return r.user;
};
const id = (v: unknown) => {
  if (v === undefined || v === "") return undefined;
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0)
    throw new AppError(400, "ID must be a positive integer");
  return n;
};
function range(r: Request): analytics.AnalyticsRange {
  const to = r.query.to ? new Date(String(r.query.to)) : new Date(),
    from = r.query.from
      ? new Date(String(r.query.from))
      : new Date(to.getTime() - 30 * 86400000);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()))
    throw new AppError(400, "from and to must be valid dates");
  to.setHours(23, 59, 59, 999);
  if (from > to) throw new AppError(400, "from must not be after to");
  return { from, to, departmentId: id(r.query.departmentId) };
}
const handler =
  (
    fn: (
      user: ReturnType<typeof auth>,
      range: analytics.AnalyticsRange,
    ) => Promise<unknown>,
  ) =>
  async (r: Request, s: Response, n: NextFunction) => {
    try {
      s.json(await fn(auth(r), range(r)));
    } catch (e) {
      n(e);
    }
  };
export const overview = handler(analytics.overview),
  reports = handler(analytics.reportAnalytics),
  serviceRequests = handler(analytics.serviceAnalytics),
  feedback = handler(analytics.feedbackAnalytics),
  workload = handler(analytics.workloadAnalytics),
  trends = handler(analytics.trends),
  infrastructure = handler(analytics.infrastructure);
export async function geography(r: Request, s: Response, n: NextFunction) {
  try {
    const status =
      typeof r.query.status === "string" &&
      Object.values(ReportStatus).includes(r.query.status as ReportStatus)
        ? (r.query.status as ReportStatus)
        : undefined;
    s.json({
      cells: await analytics.geography(
        auth(r),
        range(r),
        id(r.query.categoryId),
        status,
      ),
    });
  } catch (e) {
    n(e);
  }
}
export async function csv(r: Request, s: Response, n: NextFunction) {
  try {
    const type = String(r.query.type ?? "");
    const content = await analytics.exportCsv(auth(r), range(r), type);
    s.type("text/csv")
      .setHeader(
        "Content-Disposition",
        `attachment; filename="cityzen-${type}-analytics.csv"`,
      )
      .send(content);
  } catch (e) {
    n(e);
  }
}
