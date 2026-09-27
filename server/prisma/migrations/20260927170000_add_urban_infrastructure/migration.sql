-- CreateTable
CREATE TABLE `RoadEvent` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `departmentId` INTEGER NOT NULL,
  `createdById` INTEGER NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NOT NULL,
  `type` ENUM('ACCIDENT','ROAD_CLOSURE','CONSTRUCTION','MAINTENANCE','LANE_CLOSURE','FLOODING','CONGESTION','TEMPORARY_RESTRICTION','HAZARD','OTHER') NOT NULL,
  `severity` ENUM('LOW','MODERATE','HIGH','CRITICAL') NOT NULL,
  `status` ENUM('SCHEDULED','ACTIVE','RESOLVED','CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
  `address` VARCHAR(191) NULL,
  `latitude` DECIMAL(10,7) NOT NULL,
  `longitude` DECIMAL(10,7) NOT NULL,
  `startsAt` DATETIME(3) NOT NULL,
  `endsAt` DATETIME(3) NULL,
  `isPublic` BOOLEAN NOT NULL DEFAULT true,
  `resolvedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `RoadEvent_departmentId_status_idx`(`departmentId`, `status`),
  INDEX `RoadEvent_isPublic_status_startsAt_idx`(`isPublic`, `status`, `startsAt`),
  INDEX `RoadEvent_type_severity_idx`(`type`, `severity`),
  INDEX `RoadEvent_latitude_longitude_idx`(`latitude`, `longitude`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ParkingFacility` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `departmentId` INTEGER NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `type` ENUM('STREET','GARAGE','LOT','UNDERGROUND') NOT NULL,
  `address` VARCHAR(191) NOT NULL,
  `latitude` DECIMAL(10,7) NOT NULL,
  `longitude` DECIMAL(10,7) NOT NULL,
  `totalSpaces` INTEGER NOT NULL,
  `availableSpaces` INTEGER NOT NULL,
  `accessibleSpaces` INTEGER NOT NULL DEFAULT 0,
  `evChargingSpaces` INTEGER NOT NULL DEFAULT 0,
  `hourlyPrice` DECIMAL(10,2) NULL,
  `currency` VARCHAR(191) NULL,
  `openingHours` VARCHAR(191) NULL,
  `supportsReservation` BOOLEAN NOT NULL DEFAULT false,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `ParkingFacility_departmentId_isActive_idx`(`departmentId`, `isActive`),
  INDEX `ParkingFacility_type_isActive_idx`(`type`, `isActive`),
  INDEX `ParkingFacility_latitude_longitude_idx`(`latitude`, `longitude`),
  INDEX `ParkingFacility_name_idx`(`name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ParkingReservation` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `parkingFacilityId` INTEGER NOT NULL,
  `citizenId` INTEGER NOT NULL,
  `startsAt` DATETIME(3) NOT NULL,
  `endsAt` DATETIME(3) NOT NULL,
  `status` ENUM('RESERVED','ACTIVE','COMPLETED','CANCELLED','EXPIRED') NOT NULL DEFAULT 'RESERVED',
  `cancelledAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `ParkingReservation_citizenId_createdAt_idx`(`citizenId`, `createdAt`),
  INDEX `ParkingReservation_parkingFacilityId_startsAt_endsAt_idx`(`parkingFacilityId`, `startsAt`, `endsAt`),
  INDEX `ParkingReservation_status_idx`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CityFacilityCategory` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `icon` VARCHAR(191) NULL,
  `description` VARCHAR(191) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `CityFacilityCategory_name_key`(`name`),
  INDEX `CityFacilityCategory_isActive_name_idx`(`isActive`, `name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CityFacility` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `categoryId` INTEGER NOT NULL,
  `departmentId` INTEGER NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `address` VARCHAR(191) NOT NULL,
  `latitude` DECIMAL(10,7) NOT NULL,
  `longitude` DECIMAL(10,7) NOT NULL,
  `phone` VARCHAR(191) NULL,
  `email` VARCHAR(191) NULL,
  `website` VARCHAR(191) NULL,
  `openingHours` VARCHAR(191) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `CityFacility_categoryId_isActive_idx`(`categoryId`, `isActive`),
  INDEX `CityFacility_departmentId_isActive_idx`(`departmentId`, `isActive`),
  INDEX `CityFacility_latitude_longitude_idx`(`latitude`, `longitude`),
  INDEX `CityFacility_name_idx`(`name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `RoadEvent` ADD CONSTRAINT `RoadEvent_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `RoadEvent` ADD CONSTRAINT `RoadEvent_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ParkingFacility` ADD CONSTRAINT `ParkingFacility_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ParkingReservation` ADD CONSTRAINT `ParkingReservation_parkingFacilityId_fkey` FOREIGN KEY (`parkingFacilityId`) REFERENCES `ParkingFacility`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ParkingReservation` ADD CONSTRAINT `ParkingReservation_citizenId_fkey` FOREIGN KEY (`citizenId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CityFacility` ADD CONSTRAINT `CityFacility_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `CityFacilityCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CityFacility` ADD CONSTRAINT `CityFacility_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
