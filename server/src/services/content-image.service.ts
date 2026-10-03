import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { UserRole } from "@prisma/client";

import database from "../config/database";
import type { AuthenticatedUser } from "../types/auth.types";
import { AppError } from "../utils/app-error";

export type ContentKind = "services" | "announcements" | "events";
const uploadDirectory = path.resolve(__dirname, "../../uploads/content");
const extensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

function validSignature(file: Express.Multer.File) {
  const bytes = file.buffer;
  if (file.mimetype === "image/jpeg")
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  if (file.mimetype === "image/png")
    return (
      bytes.length >= 8 &&
      bytes
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    );
  return (
    file.mimetype === "image/webp" &&
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  );
}

async function ownerDepartment(user: AuthenticatedUser) {
  if (user.role === UserRole.ADMIN) return null;
  const account = await database.user.findUnique({
    where: { id: user.userId },
    select: { departmentId: true },
  });
  if (!account?.departmentId)
    throw new AppError(403, "Department assignment required");
  return account.departmentId;
}

export async function uploadContentImage(
  kind: ContentKind,
  id: number,
  user: AuthenticatedUser,
  file?: Express.Multer.File,
) {
  if (!file) throw new AppError(400, "Select an image to upload");
  if (!(file.mimetype in extensions) || !validSignature(file))
    throw new AppError(400, "The file is not a valid JPEG, PNG, or WebP image");
  const departmentId = await ownerDepartment(user);
  const where = {
    id,
    departmentId: user.role === UserRole.ADMIN ? undefined : departmentId!,
  };
  const current =
    kind === "services"
      ? await database.municipalService.findFirst({
          where,
          select: { imageUrl: true },
        })
      : kind === "announcements"
        ? await database.announcement.findFirst({
            where,
            select: { imageUrl: true },
          })
        : await database.cityEvent.findFirst({
            where,
            select: { imageUrl: true },
          });
  if (!current) throw new AppError(404, "Content not found");

  await mkdir(uploadDirectory, { recursive: true });
  const filename = `${randomUUID()}.${extensions[file.mimetype as keyof typeof extensions]}`;
  const diskPath = path.join(uploadDirectory, filename);
  const imageUrl = `/uploads/content/${filename}`;
  await writeFile(diskPath, file.buffer, { flag: "wx" });
  try {
    if (kind === "services")
      await database.municipalService.update({
        where: { id },
        data: { imageUrl },
      });
    else if (kind === "announcements")
      await database.announcement.update({ where: { id }, data: { imageUrl } });
    else await database.cityEvent.update({ where: { id }, data: { imageUrl } });
  } catch (error) {
    await unlink(diskPath).catch(() => undefined);
    throw error;
  }
  if (current.imageUrl?.startsWith("/uploads/content/")) {
    const oldPath = path.resolve(
      uploadDirectory,
      path.basename(current.imageUrl),
    );
    if (path.dirname(oldPath) === uploadDirectory)
      await unlink(oldPath).catch(() => undefined);
  }
  return { imageUrl };
}
