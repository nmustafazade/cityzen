import { PrismaClient, UserRole } from "@prisma/client";

const database = new PrismaClient();

const samples = [
  {
    department: "Public Works",
    service: [
      "Street and Lighting Maintenance",
      "Guidance for street, sidewalk, and public-lighting maintenance requests.",
    ],
    announcement: [
      "Seasonal Road Maintenance Schedule",
      "Road resurfacing and lighting inspections will take place throughout October. Temporary lane restrictions may apply.",
    ],
    event: [
      "Public Works Open Day",
      "Meet the infrastructure team and learn how streets and public lighting are maintained.",
      "2026-10-17T10:00:00+04:00",
      "Public Works Operations Center",
      "28 May Street 45",
      40.3794,
      49.8487,
    ],
  },
  {
    department: "Sanitation and Waste Management",
    service: [
      "Waste Collection and Recycling",
      "Collection schedules, recycling guidance, and instructions for bulky household waste.",
    ],
    announcement: [
      "Clean City Collection Update",
      "Weekend waste collection will begin one hour earlier during October. Please place bins outside before 7:00 AM.",
    ],
    event: [
      "Neighborhood Cleanup Day",
      "Join municipal teams and volunteers for a community cleanup.",
      "2026-10-10T09:00:00+04:00",
      "Central Community Square",
      "Fountain Square",
      40.3719,
      49.8372,
    ],
  },
  {
    department: "Transportation and Traffic",
    service: [
      "Public Transport Information",
      "Information about municipal routes, bus stops, traffic signals, and mobility access.",
    ],
    announcement: [
      "Weekend Transit Schedule",
      "Selected city bus routes will operate on an adjusted timetable during the upcoming public holiday.",
    ],
    event: [
      "Urban Mobility Workshop",
      "Share ideas for safer walking, cycling, and public transport.",
      "2026-10-24T14:00:00+04:00",
      "City Mobility Center",
      "Nizami Street 80",
      40.3748,
      49.8423,
    ],
  },
  {
    department: "Parks and Recreation",
    service: [
      "Park Facility Support",
      "Information about public parks, playgrounds, recreation facilities, and maintenance.",
    ],
    announcement: [
      "Park Maintenance Notice",
      "Several playground areas will close briefly for safety inspections and equipment maintenance.",
    ],
    event: [
      "Autumn Family Park Day",
      "Outdoor activities, games, and recreation programs for families.",
      "2026-10-31T11:00:00+04:00",
      "Dede Gorgud Park",
      "Dede Gorgud Park",
      40.3865,
      49.8325,
    ],
  },
  {
    department: "Water and Sewer Services",
    service: [
      "Water Service Assistance",
      "Information about municipal water supply, sewer maintenance, drainage, and planned works.",
    ],
    announcement: [
      "Planned Water Network Maintenance",
      "Scheduled maintenance may cause temporary low water pressure in selected neighborhoods.",
    ],
    event: [
      "Water Conservation Seminar",
      "Practical guidance for reducing household water use and identifying leaks.",
      "2026-11-07T12:00:00+04:00",
      "Municipal Conference Hall",
      "Khagani Street 20",
      40.3726,
      49.8456,
    ],
  },
  {
    department: "Environmental Services",
    service: [
      "Environmental Complaint Guidance",
      "Guidance for reporting pollution, hazardous waste, noise, and environmental concerns.",
    ],
    announcement: [
      "Autumn Environmental Cleanup",
      "Residents are invited to support the seasonal cleanup and urban greening campaign.",
    ],
    event: [
      "Green City Forum",
      "A public discussion about cleaner neighborhoods and sustainable city planning.",
      "2026-11-14T15:00:00+04:00",
      "Green City Center",
      "Neftchilar Avenue 60",
      40.3657,
      49.8511,
    ],
  },
  {
    department: "Public Safety",
    service: [
      "Community Safety Support",
      "Non-emergency guidance for public hazards, damaged barriers, and obstructed emergency access.",
    ],
    announcement: [
      "Community Safety Advisory",
      "Please keep emergency access routes and fire hydrants clear at all times.",
    ],
    event: [
      "Community Preparedness Workshop",
      "Learn basic emergency preparedness and neighborhood safety practices.",
      "2026-11-21T11:00:00+04:00",
      "Community Safety Center",
      "Tbilisi Avenue 35",
      40.3897,
      49.8198,
    ],
  },
  {
    department: "Building and Code Enforcement",
    service: [
      "Building Inspection Guidance",
      "Information about safety inspections, property standards, and construction-site concerns.",
    ],
    announcement: [
      "Building Inspection Hours",
      "Public consultation hours for building and property-code questions are available every Tuesday and Thursday.",
    ],
    event: [
      "Safe Buildings Information Session",
      "Meet inspectors and learn about building safety and municipal property standards.",
      "2026-11-28T14:00:00+04:00",
      "Municipal Planning Office",
      "Istiglaliyyat Street 10",
      40.3689,
      49.8317,
    ],
  },
] as const;

async function main() {
  const admin = await database.user.findFirst({
    where: { role: UserRole.ADMIN, isActive: true },
    select: { id: true },
  });
  if (!admin)
    throw new Error(
      "An active administrator is required for citywide sample content",
    );

  await database.$transaction(async (transaction) => {
    for (const sample of samples) {
      const department = await transaction.department.findUnique({
        where: { name: sample.department },
        select: {
          id: true,
          employees: {
            where: { role: UserRole.DEPARTMENT_HEAD, isActive: true },
            select: { id: true },
            take: 1,
          },
        },
      });
      if (!department?.employees[0])
        throw new Error(
          `Active department head missing for ${sample.department}`,
        );
      const createdById = department.employees[0].id;
      const [serviceTitle, serviceDescription] = sample.service;
      const service = await transaction.municipalService.findFirst({
        where: { title: serviceTitle, departmentId: department.id },
        select: { id: true },
      });
      const serviceData = {
        title: serviceTitle,
        description: serviceDescription,
        instructions:
          "Review the service information and contact the responsible department if additional help is needed.",
        requirements:
          "Provide the relevant address and a clear description when contacting the department.",
        contactPhone: "+994 12 555 0101",
        contactEmail: `services.${department.id}@cityzen.test`,
        externalUrl: "https://example.com/city-services",
        address: "City Municipal Service Center",
        isActive: true,
        departmentId: department.id,
      };
      if (service)
        await transaction.municipalService.update({
          where: { id: service.id },
          data: serviceData,
        });
      else await transaction.municipalService.create({ data: serviceData });

      const [announcementTitle, announcementContent] = sample.announcement;
      const announcement = await transaction.announcement.findFirst({
        where: { title: announcementTitle, departmentId: department.id },
        select: { id: true },
      });
      const announcementData = {
        title: announcementTitle,
        content: announcementContent,
        departmentId: department.id,
        createdById,
        isPublished: true,
        publishedAt: new Date("2026-09-27T09:00:00+04:00"),
        expiresAt: new Date("2026-12-31T23:59:59+04:00"),
      };
      if (announcement)
        await transaction.announcement.update({
          where: { id: announcement.id },
          data: announcementData,
        });
      else await transaction.announcement.create({ data: announcementData });

      const [
        eventTitle,
        eventDescription,
        startsAt,
        locationName,
        address,
        latitude,
        longitude,
      ] = sample.event;
      const event = await transaction.cityEvent.findFirst({
        where: { title: eventTitle, departmentId: department.id },
        select: { id: true },
      });
      const eventStart = new Date(startsAt);
      const eventData = {
        title: eventTitle,
        description: eventDescription,
        locationName,
        address,
        latitude,
        longitude,
        startsAt: eventStart,
        endsAt: new Date(eventStart.getTime() + 2 * 60 * 60 * 1000),
        externalUrl: "https://example.com/city-events",
        isPublished: true,
        publishedAt: new Date("2026-09-27T09:00:00+04:00"),
        departmentId: department.id,
        createdById,
      };
      if (event)
        await transaction.cityEvent.update({
          where: { id: event.id },
          data: eventData,
        });
      else await transaction.cityEvent.create({ data: eventData });
    }

    const citywideAnnouncement = await transaction.announcement.findFirst({
      where: {
        title: "Welcome to Cityzen Municipal Information",
        departmentId: null,
      },
      select: { id: true },
    });
    const citywideAnnouncementData = {
      title: "Welcome to Cityzen Municipal Information",
      content:
        "City services, official announcements, and upcoming public events are now available through the Cityzen platform.",
      departmentId: null,
      createdById: admin.id,
      isPublished: true,
      publishedAt: new Date("2026-09-27T09:00:00+04:00"),
      expiresAt: null,
    };
    if (citywideAnnouncement)
      await transaction.announcement.update({
        where: { id: citywideAnnouncement.id },
        data: citywideAnnouncementData,
      });
    else
      await transaction.announcement.create({ data: citywideAnnouncementData });

    const citywideEvent = await transaction.cityEvent.findFirst({
      where: { title: "Cityzen Community Information Day", departmentId: null },
      select: { id: true },
    });
    const citywideEventData = {
      title: "Cityzen Community Information Day",
      description:
        "Meet representatives from municipal departments and learn how to use Cityzen services.",
      locationName: "City Hall Plaza",
      address: "City Hall Plaza",
      latitude: 40.3777,
      longitude: 49.892,
      startsAt: new Date("2026-12-05T11:00:00+04:00"),
      endsAt: new Date("2026-12-05T15:00:00+04:00"),
      externalUrl: "https://example.com/cityzen-day",
      isPublished: true,
      publishedAt: new Date("2026-09-27T09:00:00+04:00"),
      departmentId: null,
      createdById: admin.id,
    };
    if (citywideEvent)
      await transaction.cityEvent.update({
        where: { id: citywideEvent.id },
        data: citywideEventData,
      });
    else await transaction.cityEvent.create({ data: citywideEventData });
  });

  const [services, announcements, events] = await Promise.all([
    database.municipalService.count(),
    database.announcement.count(),
    database.cityEvent.count(),
  ]);
  console.log({ services, announcements, events });
}

main().finally(() => database.$disconnect());
