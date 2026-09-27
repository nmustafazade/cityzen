import { ParkingReservationStatus, Prisma } from "@prisma/client";

import database from "../config/database";
import { AppError } from "../utils/app-error";

const include = { parkingFacility: { include: { department: { select: { id: true, name: true } } } } } as const;
const terminal: ParkingReservationStatus[] = [ParkingReservationStatus.CANCELLED, ParkingReservationStatus.COMPLETED, ParkingReservationStatus.EXPIRED];

async function refreshReservationStatuses(citizenId: number) {
  const now = new Date();
  await database.parkingReservation.updateMany({ where: { citizenId, status: ParkingReservationStatus.RESERVED, endsAt: { lt: now } }, data: { status: ParkingReservationStatus.EXPIRED } });
  await database.parkingReservation.updateMany({ where: { citizenId, status: ParkingReservationStatus.RESERVED, startsAt: { lte: now }, endsAt: { gte: now } }, data: { status: ParkingReservationStatus.ACTIVE } });
  await database.parkingReservation.updateMany({ where: { citizenId, status: ParkingReservationStatus.ACTIVE, endsAt: { lt: now } }, data: { status: ParkingReservationStatus.COMPLETED } });
}

export async function createParkingReservation(citizenId: number, parkingFacilityId: number, startsAt: Date, endsAt: Date) {
  const now = new Date();
  if (startsAt < new Date(now.getTime() - 5 * 60_000)) throw new AppError(400, "Reservation start must be in the future");
  if (endsAt <= startsAt) throw new AppError(400, "Reservation end must be after its start");
  return database.$transaction(async (transaction) => {
    const facility = await transaction.parkingFacility.findUnique({ where: { id: parkingFacilityId } });
    if (!facility?.isActive) throw new AppError(404, "Parking facility not found");
    if (!facility.supportsReservation) throw new AppError(400, "This parking facility does not accept reservations");
    if (facility.availableSpaces === null) throw new AppError(400, "Reservations require municipality-provided availability");
    if (facility.availableSpaces < 1) throw new AppError(409, "No parking spaces are currently available");
    const overlapping = await transaction.parkingReservation.count({ where: { parkingFacilityId, status: { in: [ParkingReservationStatus.RESERVED, ParkingReservationStatus.ACTIVE] }, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } } });
    if (overlapping >= facility.availableSpaces) throw new AppError(409, "No reservable spaces are available for that time");
    return transaction.parkingReservation.create({ data: { parkingFacilityId, citizenId, startsAt, endsAt }, include });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function listMyParkingReservations(citizenId: number, status: ParkingReservationStatus | undefined, page: number, limit: number) { await refreshReservationStatuses(citizenId); const where = { citizenId, status }; const [reservations, total] = await database.$transaction([database.parkingReservation.findMany({ where, include, orderBy: { startsAt: "desc" }, skip: (page - 1) * limit, take: limit }), database.parkingReservation.count({ where })]); return { reservations, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }; }
export async function getParkingReservation(citizenId: number, id: number) { await refreshReservationStatuses(citizenId); const reservation = await database.parkingReservation.findFirst({ where: { id, citizenId }, include }); if (!reservation) throw new AppError(404, "Parking reservation not found"); return reservation; }
export async function cancelParkingReservation(citizenId: number, id: number) { const current = await database.parkingReservation.findFirst({ where: { id, citizenId } }); if (!current) throw new AppError(404, "Parking reservation not found"); if (terminal.includes(current.status) || current.startsAt <= new Date()) throw new AppError(400, "This reservation can no longer be cancelled"); return database.parkingReservation.update({ where: { id }, data: { status: ParkingReservationStatus.CANCELLED, cancelledAt: new Date() }, include }); }
