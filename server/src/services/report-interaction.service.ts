import { ReportStatus, UserRole } from "@prisma/client";

import database from "../config/database";
import type { AuthenticatedUser } from "../types/auth.types";
import type { FeedbackInput } from "../types/report-interaction.types";
import { AppError } from "../utils/app-error";

const commentUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  role: true,
  profileImageUrl: true,
} as const;

const commentSelect = {
  id: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  user: { select: commentUserSelect },
  parentComment: {
    select: {
      id: true,
      content: true,
      user: { select: commentUserSelect },
    },
  },
} as const;

async function visibleReport(reportId: number, authenticatedUser: AuthenticatedUser) {
  const report = await database.report.findUnique({
    where: { id: reportId },
    select: { id: true, citizenId: true, status: true },
  });
  if (!report) throw new AppError(404, "Report not found");
  if (
    authenticatedUser.role === UserRole.CITIZEN &&
    report.citizenId !== authenticatedUser.userId
  ) {
    throw new AppError(403, "You do not have permission to access this report");
  }
  return report;
}

export async function listReportComments(reportId: number, authenticatedUser: AuthenticatedUser) {
  await visibleReport(reportId, authenticatedUser);
  return database.reportComment.findMany({
    where: { reportId },
    select: commentSelect,
    orderBy: { createdAt: "asc" },
  });
}

export async function createReportComment(
  reportId: number,
  authenticatedUser: AuthenticatedUser,
  content: string,
  parentCommentId?: number,
) {
  await visibleReport(reportId, authenticatedUser);
  if (parentCommentId) {
    const parentComment = await database.reportComment.findFirst({
      where: { id: parentCommentId, reportId },
      select: { id: true },
    });
    if (!parentComment) throw new AppError(400, "Reply target does not belong to this report");
  }
  return database.reportComment.create({
    data: { reportId, userId: authenticatedUser.userId, content: content.trim(), parentCommentId },
    select: commentSelect,
  });
}

export async function deleteReportComment(
  reportId: number,
  commentId: number,
  authenticatedUser: AuthenticatedUser,
) {
  await visibleReport(reportId, authenticatedUser);
  const comment = await database.reportComment.findFirst({
    where: { id: commentId, reportId },
    select: { id: true, userId: true },
  });
  if (!comment) throw new AppError(404, "Comment not found");
  if (comment.userId !== authenticatedUser.userId && authenticatedUser.role !== UserRole.ADMIN) {
    throw new AppError(403, "You do not have permission to delete this comment");
  }
  await database.reportComment.delete({ where: { id: comment.id } });
}

export async function toggleReportUpvote(reportId: number, citizenId: number) {
  await visibleReport(reportId, { userId: citizenId, role: UserRole.CITIZEN });
  return database.$transaction(async (transaction) => {
    const existing = await transaction.reportUpvote.findUnique({
      where: { reportId_userId: { reportId, userId: citizenId } },
      select: { id: true },
    });
    if (existing) {
      await transaction.reportUpvote.delete({ where: { id: existing.id } });
    } else {
      await transaction.reportUpvote.create({ data: { reportId, userId: citizenId } });
    }
    const upvoteCount = await transaction.reportUpvote.count({ where: { reportId } });
    return { upvoted: !existing, upvoteCount };
  });
}

export async function getReportFeedback(reportId: number, authenticatedUser: AuthenticatedUser) {
  await visibleReport(reportId, authenticatedUser);
  return database.reportFeedback.findUnique({ where: { reportId } });
}

export async function saveReportFeedback(
  reportId: number,
  citizenId: number,
  input: FeedbackInput,
) {
  const report = await visibleReport(reportId, { userId: citizenId, role: UserRole.CITIZEN });
  if (report.status !== ReportStatus.RESOLVED) {
    throw new AppError(409, "Feedback is available only after a report is resolved");
  }
  return database.reportFeedback.upsert({
    where: { reportId },
    create: { reportId, citizenId, ...input },
    update: input,
  });
}
