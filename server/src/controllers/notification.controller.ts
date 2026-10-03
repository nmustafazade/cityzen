import type { NextFunction, Request, Response } from "express";

import {
  getUnreadCount,
  getUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notification.service";
import { AppError } from "../utils/app-error";

function userId(request: Request) {
  if (!request.user) throw new AppError(401, "Authentication required");
  return request.user.userId;
}

function positiveInteger(value: unknown, field: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0)
    throw new AppError(400, `${field} must be a positive integer`);
  return parsed;
}

function booleanQuery(value: unknown) {
  if (value === undefined) return false;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new AppError(400, "unreadOnly must be true or false");
}

export async function index(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page =
      request.query.page === undefined
        ? 1
        : positiveInteger(request.query.page, "page");
    const limit =
      request.query.limit === undefined
        ? 20
        : positiveInteger(request.query.limit, "limit");
    if (limit > 100) throw new AppError(400, "limit cannot exceed 100");
    response.json(
      await getUserNotifications(userId(request), {
        page,
        limit,
        unreadOnly: booleanQuery(request.query.unreadOnly),
      }),
    );
  } catch (error) {
    next(error);
  }
}

export async function unreadCount(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    response.json({ count: await getUnreadCount(userId(request)) });
  } catch (error) {
    next(error);
  }
}

export async function markRead(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    response.json({
      notification: await markNotificationRead(
        positiveInteger(request.params.id, "notification id"),
        userId(request),
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function markAllRead(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    response.json({
      updatedCount: await markAllNotificationsRead(userId(request)),
    });
  } catch (error) {
    next(error);
  }
}
