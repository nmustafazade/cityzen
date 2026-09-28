-- AlterTable
ALTER TABLE `Address` ADD COLUMN `wasteCollectionZoneId` INTEGER NULL;

-- AlterTable
ALTER TABLE `CityFacility` MODIFY `source` ENUM('MUNICIPALITY', 'OPENSTREETMAP', 'OPEN_DATA', 'HERE', 'DEMO', 'OPEN_METEO', 'EMERGENCY_AUTHORITY') NOT NULL DEFAULT 'MUNICIPALITY';

-- AlterTable
ALTER TABLE `Notification` ADD COLUMN `emergencyAlertId` INTEGER NULL,
    MODIFY `type` ENUM('REPORT_CREATED', 'REPORT_ASSIGNED', 'REPORT_STATUS_CHANGED', 'REPORT_COMMENT', 'REPORT_RESOLVED', 'SERVICE_REQUEST_CREATED', 'SERVICE_REQUEST_ASSIGNED', 'SERVICE_REQUEST_STATUS_CHANGED', 'SERVICE_REQUEST_COMPLETED', 'EMERGENCY_ALERT', 'WASTE_COLLECTION_REMINDER') NOT NULL;

-- AlterTable
ALTER TABLE `ParkingFacility` MODIFY `source` ENUM('MUNICIPALITY', 'OPENSTREETMAP', 'OPEN_DATA', 'HERE', 'DEMO', 'OPEN_METEO', 'EMERGENCY_AUTHORITY') NOT NULL DEFAULT 'MUNICIPALITY';

-- AlterTable
ALTER TABLE `RoadEvent` MODIFY `source` ENUM('MUNICIPALITY', 'OPENSTREETMAP', 'OPEN_DATA', 'HERE', 'DEMO', 'OPEN_METEO', 'EMERGENCY_AUTHORITY') NOT NULL DEFAULT 'MUNICIPALITY';

-- CreateTable
CREATE TABLE `WasteCollectionZone` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `departmentId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `district` VARCHAR(191) NULL,
    `neighborhood` VARCHAR(191) NULL,
    `postalCode` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WasteCollectionZone_isActive_city_district_idx`(`isActive`, `city`, `district`),
    UNIQUE INDEX `WasteCollectionZone_departmentId_name_key`(`departmentId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WasteCollectionSchedule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `zoneId` INTEGER NOT NULL,
    `wasteType` ENUM('GENERAL', 'RECYCLING', 'ORGANIC', 'GLASS', 'PAPER', 'PLASTIC', 'METAL', 'ELECTRONIC', 'HAZARDOUS', 'BULKY') NOT NULL,
    `dayOfWeek` ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY') NOT NULL,
    `collectionTime` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WasteCollectionSchedule_zoneId_isActive_idx`(`zoneId`, `isActive`),
    UNIQUE INDEX `WasteCollectionSchedule_zoneId_wasteType_dayOfWeek_key`(`zoneId`, `wasteType`, `dayOfWeek`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WasteScheduleException` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `zoneId` INTEGER NOT NULL,
    `wasteType` ENUM('GENERAL', 'RECYCLING', 'ORGANIC', 'GLASS', 'PAPER', 'PLASTIC', 'METAL', 'ELECTRONIC', 'HAZARDOUS', 'BULKY') NULL,
    `date` DATE NOT NULL,
    `type` ENUM('CANCELLED', 'RESCHEDULED', 'EXTRA_COLLECTION') NOT NULL,
    `replacementDate` DATE NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WasteScheduleException_zoneId_date_idx`(`zoneId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WasteFacility` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `departmentId` INTEGER NULL,
    `type` ENUM('PUBLIC_BIN', 'RECYCLING_BIN', 'RECYCLING_CENTER', 'E_WASTE_POINT', 'HAZARDOUS_WASTE_POINT', 'COMPOST_POINT') NOT NULL,
    `name` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `address` VARCHAR(191) NULL,
    `latitude` DECIMAL(10, 7) NOT NULL,
    `longitude` DECIMAL(10, 7) NOT NULL,
    `openingHours` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `source` ENUM('MUNICIPALITY', 'OPENSTREETMAP', 'OPEN_DATA', 'HERE', 'DEMO', 'OPEN_METEO', 'EMERGENCY_AUTHORITY') NOT NULL DEFAULT 'MUNICIPALITY',
    `externalSourceId` VARCHAR(191) NULL,
    `sourceUrl` VARCHAR(191) NULL,
    `lastSyncedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WasteFacility_type_isActive_idx`(`type`, `isActive`),
    INDEX `WasteFacility_departmentId_isActive_idx`(`departmentId`, `isActive`),
    INDEX `WasteFacility_latitude_longitude_idx`(`latitude`, `longitude`),
    UNIQUE INDEX `WasteFacility_source_externalSourceId_key`(`source`, `externalSourceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WasteFacilityAcceptedType` (
    `facilityId` INTEGER NOT NULL,
    `wasteType` ENUM('GENERAL', 'RECYCLING', 'ORGANIC', 'GLASS', 'PAPER', 'PLASTIC', 'METAL', 'ELECTRONIC', 'HAZARDOUS', 'BULKY') NOT NULL,

    INDEX `WasteFacilityAcceptedType_wasteType_idx`(`wasteType`),
    PRIMARY KEY (`facilityId`, `wasteType`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WasteReminderPreference` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `addressId` INTEGER NOT NULL,
    `wasteType` ENUM('GENERAL', 'RECYCLING', 'ORGANIC', 'GLASS', 'PAPER', 'PLASTIC', 'METAL', 'ELECTRONIC', 'HAZARDOUS', 'BULKY') NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `reminderHoursBefore` INTEGER NOT NULL DEFAULT 12,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WasteReminderPreference_enabled_idx`(`enabled`),
    UNIQUE INDEX `WasteReminderPreference_userId_addressId_wasteType_key`(`userId`, `addressId`, `wasteType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WasteReminderDelivery` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `addressId` INTEGER NOT NULL,
    `wasteType` ENUM('GENERAL', 'RECYCLING', 'ORGANIC', 'GLASS', 'PAPER', 'PLASTIC', 'METAL', 'ELECTRONIC', 'HAZARDOUS', 'BULKY') NOT NULL,
    `collectionDate` DATE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WasteReminderDelivery_collectionDate_idx`(`collectionDate`),
    UNIQUE INDEX `WasteReminderDelivery_userId_addressId_wasteType_collectionD_key`(`userId`, `addressId`, `wasteType`, `collectionDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EnvironmentalStation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `departmentId` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `latitude` DECIMAL(10, 7) NOT NULL,
    `longitude` DECIMAL(10, 7) NOT NULL,
    `address` VARCHAR(191) NULL,
    `source` ENUM('MUNICIPALITY', 'OPENSTREETMAP', 'OPEN_DATA', 'HERE', 'DEMO', 'OPEN_METEO', 'EMERGENCY_AUTHORITY') NOT NULL DEFAULT 'MUNICIPALITY',
    `externalSourceId` VARCHAR(191) NULL,
    `sourceUrl` VARCHAR(191) NULL,
    `lastSyncedAt` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EnvironmentalStation_departmentId_isActive_idx`(`departmentId`, `isActive`),
    INDEX `EnvironmentalStation_latitude_longitude_idx`(`latitude`, `longitude`),
    UNIQUE INDEX `EnvironmentalStation_source_externalSourceId_key`(`source`, `externalSourceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EnvironmentalMeasurement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `stationId` INTEGER NOT NULL,
    `metric` ENUM('PM25', 'PM10', 'AQI', 'TEMPERATURE', 'HUMIDITY', 'NO2', 'O3', 'CO', 'SO2', 'NOISE_DB') NOT NULL,
    `value` DECIMAL(14, 4) NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `measuredAt` DATETIME(3) NOT NULL,
    `source` ENUM('MUNICIPALITY', 'OPENSTREETMAP', 'OPEN_DATA', 'HERE', 'DEMO', 'OPEN_METEO', 'EMERGENCY_AUTHORITY') NOT NULL DEFAULT 'MUNICIPALITY',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EnvironmentalMeasurement_stationId_measuredAt_idx`(`stationId`, `measuredAt`),
    INDEX `EnvironmentalMeasurement_metric_measuredAt_idx`(`metric`, `measuredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmergencyAlert` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `departmentId` INTEGER NULL,
    `createdById` INTEGER NOT NULL,
    `type` ENUM('SEVERE_WEATHER', 'FLOOD', 'FIRE', 'EARTHQUAKE', 'INFRASTRUCTURE_FAILURE', 'WATER_DISRUPTION', 'POWER_DISRUPTION', 'PUBLIC_SAFETY', 'ROAD_EMERGENCY', 'OTHER') NOT NULL,
    `severity` ENUM('ADVISORY', 'WATCH', 'WARNING', 'CRITICAL') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `radiusKm` DECIMAL(10, 2) NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `publishedAt` DATETIME(3) NULL,
    `source` ENUM('MUNICIPALITY', 'OPENSTREETMAP', 'OPEN_DATA', 'HERE', 'DEMO', 'OPEN_METEO', 'EMERGENCY_AUTHORITY') NOT NULL DEFAULT 'MUNICIPALITY',
    `externalSourceId` VARCHAR(191) NULL,
    `sourceUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EmergencyAlert_isPublished_startsAt_endsAt_idx`(`isPublished`, `startsAt`, `endsAt`),
    INDEX `EmergencyAlert_departmentId_idx`(`departmentId`),
    INDEX `EmergencyAlert_severity_idx`(`severity`),
    UNIQUE INDEX `EmergencyAlert_source_externalSourceId_key`(`source`, `externalSourceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Address_wasteCollectionZoneId_idx` ON `Address`(`wasteCollectionZoneId`);

-- CreateIndex
CREATE INDEX `Notification_emergencyAlertId_idx` ON `Notification`(`emergencyAlertId`);

-- AddForeignKey
ALTER TABLE `Address` ADD CONSTRAINT `Address_wasteCollectionZoneId_fkey` FOREIGN KEY (`wasteCollectionZoneId`) REFERENCES `WasteCollectionZone`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_emergencyAlertId_fkey` FOREIGN KEY (`emergencyAlertId`) REFERENCES `EmergencyAlert`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WasteCollectionZone` ADD CONSTRAINT `WasteCollectionZone_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WasteCollectionSchedule` ADD CONSTRAINT `WasteCollectionSchedule_zoneId_fkey` FOREIGN KEY (`zoneId`) REFERENCES `WasteCollectionZone`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WasteScheduleException` ADD CONSTRAINT `WasteScheduleException_zoneId_fkey` FOREIGN KEY (`zoneId`) REFERENCES `WasteCollectionZone`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WasteFacility` ADD CONSTRAINT `WasteFacility_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WasteFacilityAcceptedType` ADD CONSTRAINT `WasteFacilityAcceptedType_facilityId_fkey` FOREIGN KEY (`facilityId`) REFERENCES `WasteFacility`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WasteReminderPreference` ADD CONSTRAINT `WasteReminderPreference_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WasteReminderPreference` ADD CONSTRAINT `WasteReminderPreference_addressId_fkey` FOREIGN KEY (`addressId`) REFERENCES `Address`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WasteReminderDelivery` ADD CONSTRAINT `WasteReminderDelivery_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EnvironmentalStation` ADD CONSTRAINT `EnvironmentalStation_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EnvironmentalMeasurement` ADD CONSTRAINT `EnvironmentalMeasurement_stationId_fkey` FOREIGN KEY (`stationId`) REFERENCES `EnvironmentalStation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmergencyAlert` ADD CONSTRAINT `EmergencyAlert_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmergencyAlert` ADD CONSTRAINT `EmergencyAlert_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
