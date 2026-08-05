import type { NextFunction, Request, Response } from "express";

import database from "../config/database";

export function getApiHealth(_request: Request, response: Response): void {
  response.json({
    status: "ok",
    service: "cityzen-api",
  });
}

export async function getDatabaseHealth(
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await database.$queryRaw`SELECT 1`;

    response.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    next(error);
  }
}
