import { NotificationType, Prisma } from "@prisma/client";

import database from "../config/database";
import { AppError } from "../utils/app-error";

type NotificationClient = Prisma.TransactionClient | typeof database;

interface CreateNotificationInput {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  reportId?: number;
  serviceRequestId?: number;
  emergencyAlertId?: number;
  actorId?: number;
}

const notificationSelect = {
  id: true,
  type: true,
  title: true,
  message: true,
  isRead: true,
  readAt: true,
  createdAt: true,
  report: { select: { id: true, title: true, status: true } },
  serviceRequest: {
    select: { id: true, status: true, service: { select: { title: true } } },
  },
  emergencyAlert: { select: { id: true, title: true, severity: true } },
  actor: { select: { id: true, firstName: true, lastName: true, role: true } },
} as const;

export function createNotification(
  input: CreateNotificationInput,
  client: NotificationClient = database,
) {
  if (input.actorId === input.userId) return Promise.resolve(null);
  return client.notification.create({
    data: {
      ...input,
      title: input.title.slice(0, 191),
      message: input.message.slice(0, 191),
    },
  });
}

export async function getUserNotifications(
  userId: number,
  filters: { page: number; limit: number; unreadOnly: boolean },
) {
  const where: Prisma.NotificationWhereInput = {
    userId,
    isRead: filters.unreadOnly ? false : undefined,
  };
  const [notifications, total] = await database.$transaction([
    database.notification.findMany({
      where,
      select: notificationSelect,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    database.notification.count({ where }),
  ]);
  return {
    notifications,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

export function getUnreadCount(userId: number) {
  return database.notification.count({ where: { userId, isRead: false } });
}

export async function markNotificationRead(id: number, userId: number) {
  const notification = await database.notification.findFirst({
    where: { id, userId },
    select: { id: true, isRead: true },
  });
  if (!notification) throw new AppError(404, "Notification not found");
  if (notification.isRead) {
    return database.notification.findUniqueOrThrow({
      where: { id },
      select: notificationSelect,
    });
  }
  return database.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
    select: notificationSelect,
  });
}

export async function markAllNotificationsRead(userId: number) {
  const result = await database.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  return result.count;
}
