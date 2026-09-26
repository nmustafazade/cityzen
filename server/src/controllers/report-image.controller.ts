import type { NextFunction, Request, Response } from "express";

import { addReportImages } from "../services/report-image.service";
import { AppError } from "../utils/app-error";

function positiveInteger(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(400, "report id must be a positive integer");
  }
  return parsed;
}

export async function uploadImages(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!request.user) throw new AppError(401, "Authentication required");
    const files = Array.isArray(request.files) ? request.files : [];
    const images = await addReportImages(
      positiveInteger(request.params.id),
      request.user.userId,
      files,
    );
    response.status(201).json({ images });
  } catch (error) {
    next(error);
  }
}
