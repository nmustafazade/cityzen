import type { NextFunction, Request, Response } from "express";
import multer from "multer";

import { AppError } from "../utils/app-error";

export const MAX_REPORT_IMAGES = 5;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const REPORT_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const acceptedMimeTypes = new Set<string>(REPORT_IMAGE_MIME_TYPES);

const reportImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
    files: MAX_REPORT_IMAGES,
  },
  fileFilter: (_request, file, callback) => {
    if (!acceptedMimeTypes.has(file.mimetype)) {
      callback(new AppError(400, "Only JPEG, PNG, and WebP images are allowed"));
      return;
    }
    callback(null, true);
  },
});

export function parseReportImages(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  reportImageUpload.array("images", MAX_REPORT_IMAGES)(request, response, (error) => {
    if (!error || error instanceof multer.MulterError || error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError(400, "Malformed multipart request"));
  });
}
