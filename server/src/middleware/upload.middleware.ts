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
      callback(
        new AppError(400, "Only JPEG, PNG, and WebP images are allowed"),
      );
      return;
    }
    callback(null, true);
  },
});

const contentImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!acceptedMimeTypes.has(file.mimetype)) {
      callback(
        new AppError(400, "Only JPEG, PNG, and WebP images are allowed"),
      );
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
  reportImageUpload.array("images", MAX_REPORT_IMAGES)(
    request,
    response,
    (error) => {
      if (
        !error ||
        error instanceof multer.MulterError ||
        error instanceof AppError
      ) {
        next(error);
        return;
      }
      next(new AppError(400, "Malformed multipart request"));
    },
  );
}

export function parseContentImage(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  contentImageUpload.single("image")(request, response, (error) => {
    if (
      !error ||
      error instanceof multer.MulterError ||
      error instanceof AppError
    )
      next(error);
    else next(new AppError(400, "Malformed multipart request"));
  });
}

const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (_request, file, callback) => {
    if (
      !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(
        file.mimetype,
      )
    )
      return callback(
        new AppError(
          400,
          "Only PDF, JPEG, PNG, and WebP documents are allowed",
        ),
      );
    callback(null, true);
  },
});
export function parseServiceDocuments(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  documentUpload.array("documents", 5)(request, response, (error) => {
    if (
      !error ||
      error instanceof multer.MulterError ||
      error instanceof AppError
    )
      next(error);
    else next(new AppError(400, "Malformed multipart request"));
  });
}
