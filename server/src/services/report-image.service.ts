import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { ReportStatus } from "@prisma/client";

import database from "../config/database";
import { MAX_REPORT_IMAGES } from "../middleware/upload.middleware";
import { AppError } from "../utils/app-error";

const uploadDirectory = path.resolve(__dirname, "../../uploads/reports");
const uploadableStatuses: ReportStatus[] = [
  ReportStatus.SUBMITTED,
  ReportStatus.UNDER_REVIEW,
];

const extensionByMimeType = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

type AcceptedMimeType = keyof typeof extensionByMimeType;

function hasExpectedSignature(file: Express.Multer.File): boolean {
  const bytes = file.buffer;
  if (file.mimetype === "image/jpeg") {
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  }
  if (file.mimetype === "image/png") {
    return (
      bytes.length >= 8 &&
      bytes
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    );
  }
  if (file.mimetype === "image/webp") {
    return (
      bytes.length >= 12 &&
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP"
    );
  }
  return false;
}

async function removeFiles(paths: string[]) {
  await Promise.allSettled(paths.map((filePath) => unlink(filePath)));
}

export async function addReportImages(
  reportId: number,
  citizenId: number,
  files: Express.Multer.File[],
) {
  if (files.length === 0) {
    throw new AppError(400, "Select at least one image to upload");
  }

  const report = await database.report.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      citizenId: true,
      status: true,
      _count: { select: { images: true } },
    },
  });

  if (!report) throw new AppError(404, "Report not found");
  if (report.citizenId !== citizenId) {
    throw new AppError(
      403,
      "You do not have permission to add images to this report",
    );
  }
  if (!uploadableStatuses.includes(report.status)) {
    throw new AppError(409, "Images can no longer be added to this report");
  }
  if (report._count.images + files.length > MAX_REPORT_IMAGES) {
    throw new AppError(
      400,
      `A report can have at most ${MAX_REPORT_IMAGES} images`,
    );
  }

  for (const file of files) {
    if (
      !(file.mimetype in extensionByMimeType) ||
      !hasExpectedSignature(file)
    ) {
      throw new AppError(
        400,
        "One or more files are not valid JPEG, PNG, or WebP images",
      );
    }
  }

  await mkdir(uploadDirectory, { recursive: true });
  const storedFiles = files.map((file) => {
    const extension = extensionByMimeType[file.mimetype as AcceptedMimeType];
    const filename = `${randomUUID()}.${extension}`;
    return {
      diskPath: path.join(uploadDirectory, filename),
      imageUrl: `/uploads/reports/${filename}`,
      buffer: file.buffer,
    };
  });

  const writeResults = await Promise.allSettled(
    storedFiles.map((file) =>
      writeFile(file.diskPath, file.buffer, { flag: "wx" }),
    ),
  );
  if (writeResults.some((result) => result.status === "rejected")) {
    await removeFiles(storedFiles.map((file) => file.diskPath));
    throw new AppError(500, "Unable to store report images");
  }

  try {
    return await database.$transaction(
      storedFiles.map((file) =>
        database.reportImage.create({
          data: { reportId, imageUrl: file.imageUrl },
        }),
      ),
    );
  } catch (error) {
    await removeFiles(storedFiles.map((file) => file.diskPath));
    throw error;
  }
}
