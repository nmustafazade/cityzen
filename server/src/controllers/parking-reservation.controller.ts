import { ParkingReservationStatus } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import { cancelParkingReservation, createParkingReservation, getParkingReservation, listMyParkingReservations } from "../services/parking-reservation.service";
import { AppError } from "../utils/app-error";

const statuses = Object.values(ParkingReservationStatus);
const userId = (r: Request) => { if (!r.user) throw new AppError(401, "Authentication required"); return r.user.userId; };
const positive = (v: unknown, name: string) => { const n = Number(v); if (!Number.isInteger(n) || n <= 0) throw new AppError(400, `${name} must be a positive integer`); return n; };
const parsedDate = (v: unknown, name: string) => { if (typeof v !== "string") throw new AppError(400, `${name} is required`); const date = new Date(v); if (Number.isNaN(date.getTime())) throw new AppError(400, `${name} must be a valid date`); return date; };

export async function create(request: Request, response: Response, next: NextFunction) { try { const body = request.body as Record<string, unknown>; response.status(201).json({ reservation: await createParkingReservation(userId(request), positive(body.parkingFacilityId, "parkingFacilityId"), parsedDate(body.startsAt, "startsAt"), parsedDate(body.endsAt, "endsAt")) }); } catch (error) { next(error); } }
export async function mine(request: Request, response: Response, next: NextFunction) { try { const page = request.query.page === undefined ? 1 : positive(request.query.page, "page"), limit = request.query.limit === undefined ? 10 : positive(request.query.limit, "limit"); if (limit > 100) throw new AppError(400, "limit cannot exceed 100"); const raw = request.query.status; const status = raw === undefined || raw === "" ? undefined : typeof raw === "string" && statuses.includes(raw as ParkingReservationStatus) ? raw as ParkingReservationStatus : (() => { throw new AppError(400, "Invalid reservation status"); })(); response.json(await listMyParkingReservations(userId(request), status, page, limit)); } catch (error) { next(error); } }
export async function detail(request: Request, response: Response, next: NextFunction) { try { response.json({ reservation: await getParkingReservation(userId(request), positive(request.params.id, "reservation id")) }); } catch (error) { next(error); } }
export async function cancel(request: Request, response: Response, next: NextFunction) { try { response.json({ reservation: await cancelParkingReservation(userId(request), positive(request.params.id, "reservation id")) }); } catch (error) { next(error); } }
