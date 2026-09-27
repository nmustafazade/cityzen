ALTER TABLE `RoadEvent`
  ADD COLUMN `source` ENUM('MUNICIPALITY','OPENSTREETMAP','OPEN_DATA','HERE','DEMO') NOT NULL DEFAULT 'MUNICIPALITY',
  ADD COLUMN `externalSourceId` VARCHAR(191) NULL,
  ADD COLUMN `sourceUrl` VARCHAR(191) NULL,
  ADD COLUMN `lastSyncedAt` DATETIME(3) NULL;

ALTER TABLE `ParkingFacility`
  MODIFY `availableSpaces` INTEGER NULL,
  ADD COLUMN `source` ENUM('MUNICIPALITY','OPENSTREETMAP','OPEN_DATA','HERE','DEMO') NOT NULL DEFAULT 'MUNICIPALITY',
  ADD COLUMN `externalSourceId` VARCHAR(191) NULL,
  ADD COLUMN `sourceUrl` VARCHAR(191) NULL,
  ADD COLUMN `lastSyncedAt` DATETIME(3) NULL;

ALTER TABLE `CityFacility`
  ADD COLUMN `source` ENUM('MUNICIPALITY','OPENSTREETMAP','OPEN_DATA','HERE','DEMO') NOT NULL DEFAULT 'MUNICIPALITY',
  ADD COLUMN `externalSourceId` VARCHAR(191) NULL,
  ADD COLUMN `sourceUrl` VARCHAR(191) NULL,
  ADD COLUMN `lastSyncedAt` DATETIME(3) NULL;

CREATE UNIQUE INDEX `RoadEvent_source_externalSourceId_key` ON `RoadEvent`(`source`, `externalSourceId`);
CREATE INDEX `RoadEvent_source_lastSyncedAt_idx` ON `RoadEvent`(`source`, `lastSyncedAt`);
CREATE UNIQUE INDEX `ParkingFacility_source_externalSourceId_key` ON `ParkingFacility`(`source`, `externalSourceId`);
CREATE INDEX `ParkingFacility_source_lastSyncedAt_idx` ON `ParkingFacility`(`source`, `lastSyncedAt`);
CREATE UNIQUE INDEX `CityFacility_source_externalSourceId_key` ON `CityFacility`(`source`, `externalSourceId`);
CREATE INDEX `CityFacility_source_lastSyncedAt_idx` ON `CityFacility`(`source`, `lastSyncedAt`);
