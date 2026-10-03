import { NotificationType, Weekday } from "@prisma/client";
import database from "../config/database";
const weekdayIndex: Record<Weekday, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};
function nextDate(day: Weekday, time: string | null) {
  const now = new Date(),
    candidate = new Date(now);
  const offset = (weekdayIndex[day] - now.getDay() + 7) % 7;
  candidate.setDate(now.getDate() + offset);
  const match = time?.match(/^(\d{2}):(\d{2})$/);
  if (match) candidate.setHours(Number(match[1]), Number(match[2]), 0, 0);
  else candidate.setHours(8, 0, 0, 0);
  if (candidate <= now) candidate.setDate(candidate.getDate() + 7);
  return candidate;
}
export async function deliverWasteReminders() {
  const preferences = await database.wasteReminderPreference.findMany({
    where: { enabled: true, address: { wasteCollectionZoneId: { not: null } } },
    include: { address: { select: { wasteCollectionZoneId: true } } },
  });
  let delivered = 0;
  for (const preference of preferences) {
    const schedules = await database.wasteCollectionSchedule.findMany({
      where: {
        zoneId: preference.address.wasteCollectionZoneId!,
        wasteType: preference.wasteType,
        isActive: true,
      },
    });
    for (const schedule of schedules) {
      const collection = nextDate(schedule.dayOfWeek, schedule.collectionTime),
        hours = (collection.getTime() - Date.now()) / 3600000;
      if (hours < 0 || hours > preference.reminderHoursBefore) continue;
      try {
        await database.$transaction(async (transaction) => {
          await transaction.wasteReminderDelivery.create({
            data: {
              userId: preference.userId,
              addressId: preference.addressId,
              wasteType: preference.wasteType,
              collectionDate: new Date(
                Date.UTC(
                  collection.getFullYear(),
                  collection.getMonth(),
                  collection.getDate(),
                ),
              ),
            },
          });
          await transaction.notification.create({
            data: {
              userId: preference.userId,
              type: NotificationType.WASTE_COLLECTION_REMINDER,
              title: "Waste collection reminder",
              message: `${preference.wasteType.replaceAll("_", " ")} collection is coming up. Open Waste & Recycling for details.`,
            },
          });
        });
        delivered++;
      } catch (error) {
        if (!(
          error &&
          typeof error === "object" &&
          "code" in error &&
          (error as { code?: string }).code === "P2002"
        ))
          console.warn("Waste reminder delivery failed");
      }
    }
  }
  return delivered;
}
export function startWasteReminderScheduler() {
  const run = () =>
    void deliverWasteReminders().catch(() =>
      console.warn("Waste reminder scheduler failed"),
    );
  const initial = setTimeout(run, 15_000);
  const interval = setInterval(run, 60 * 60_000);
  return () => {
    clearTimeout(initial);
    clearInterval(interval);
  };
}
