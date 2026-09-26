import type { NextFunction, Request, Response } from "express";

import {
  createReportComment,
  deleteReportComment,
  getReportFeedback,
  listReportComments,
  saveReportFeedback,
  toggleReportUpvote,
} from "../services/report-interaction.service";
import { AppError } from "../utils/app-error";

function authenticatedUser(request: Request) {
  if (!request.user) throw new AppError(401, "Authentication required");
  return request.user;
}

function positiveInteger(value: unknown, field: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(400, `${field} must be a positive integer`);
  }
  return parsed;
}

function optionalPositiveInteger(value: unknown, field: string): number | undefined {
  return value === undefined || value === null ? undefined : positiveInteger(value, field);
}

function bodyRecord(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object") throw new AppError(400, "Invalid request body");
  return body as Record<string, unknown>;
}

function commentContent(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) throw new AppError(400, "Comment content is required");
  const content = value.trim();
  if (content.length > 1000) throw new AppError(400, "Comment content must be 1000 characters or fewer");
  return content;
}

export async function comments(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    response.json({ comments: await listReportComments(positiveInteger(request.params.id, "report id"), authenticatedUser(request)) });
  } catch (error) { next(error); }
}

export async function createComment(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const body = bodyRecord(request.body);
    response.status(201).json({
      comment: await createReportComment(
        positiveInteger(request.params.id, "report id"),
        authenticatedUser(request),
        commentContent(body.content),
        optionalPositiveInteger(body.parentCommentId, "parentCommentId"),
      ),
    });
  } catch (error) { next(error); }
}

export async function deleteComment(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    await deleteReportComment(
      positiveInteger(request.params.reportId, "report id"),
      positiveInteger(request.params.commentId, "comment id"),
      authenticatedUser(request),
    );
    response.json({ status: "ok", message: "Comment deleted" });
  } catch (error) { next(error); }
}

export async function toggleUpvote(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    response.json(await toggleReportUpvote(
      positiveInteger(request.params.id, "report id"),
      authenticatedUser(request).userId,
    ));
  } catch (error) { next(error); }
}

export async function feedback(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    response.json({ feedback: await getReportFeedback(positiveInteger(request.params.id, "report id"), authenticatedUser(request)) });
  } catch (error) { next(error); }
}

export async function saveFeedback(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const body = bodyRecord(request.body);
    if (typeof body.confirmed !== "boolean") throw new AppError(400, "confirmed must be a boolean");
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new AppError(400, "rating must be an integer from 1 to 5");
    }
    let comment: string | null | undefined;
    if (body.comment === null || body.comment === "") comment = null;
    if (body.comment !== undefined && body.comment !== null && body.comment !== "") {
      if (typeof body.comment !== "string") throw new AppError(400, "comment must be a string");
      comment = body.comment.trim();
      if (comment.length > 1000) throw new AppError(400, "comment must be 1000 characters or fewer");
      if (!comment) comment = null;
    }
    response.json({
      feedback: await saveReportFeedback(
        positiveInteger(request.params.id, "report id"),
        authenticatedUser(request).userId,
        { confirmed: body.confirmed, rating, comment },
      ),
    });
  } catch (error) { next(error); }
}
