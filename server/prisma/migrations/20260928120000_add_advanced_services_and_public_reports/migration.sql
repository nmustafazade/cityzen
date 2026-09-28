-- AlterTable
ALTER TABLE `ReportCategory` ADD COLUMN `allowsPublicSharing` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `Report` ADD COLUMN `isPublic` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `publicHiddenAt` DATETIME(3) NULL,
    ADD COLUMN `publicHiddenById` INTEGER NULL,
    ADD COLUMN `publicHiddenReason` VARCHAR(191) NULL;

CREATE INDEX `Report_isPublic_publicHiddenAt_createdAt_idx` ON `Report`(`isPublic`, `publicHiddenAt`, `createdAt`);
CREATE INDEX `Report_publicHiddenById_idx` ON `Report`(`publicHiddenById`);

-- AlterTable
ALTER TABLE `MunicipalService` ADD COLUMN `allowsDocuments` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `documentsRequired` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `maxDocuments` INTEGER NOT NULL DEFAULT 5,
    ADD COLUMN `supportsAppointments` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `appointmentRequired` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `ServiceRequest` ADD COLUMN `appointmentSlotId` INTEGER NULL;
CREATE INDEX `ServiceRequest_appointmentSlotId_idx` ON `ServiceRequest`(`appointmentSlotId`);

-- CreateTable
CREATE TABLE `MunicipalServiceField` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `serviceId` INTEGER NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `fieldKey` VARCHAR(191) NOT NULL,
    `type` ENUM('TEXT','TEXTAREA','NUMBER','DATE','DATETIME','SELECT','CHECKBOX','PHONE','EMAIL') NOT NULL,
    `description` VARCHAR(191) NULL,
    `placeholder` VARCHAR(191) NULL,
    `isRequired` BOOLEAN NOT NULL DEFAULT false,
    `options` JSON NULL,
    `minLength` INTEGER NULL,
    `maxLength` INTEGER NULL,
    `minValue` DECIMAL(14,2) NULL,
    `maxValue` DECIMAL(14,2) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `MunicipalServiceField_serviceId_isActive_sortOrder_idx`(`serviceId`,`isActive`,`sortOrder`),
    UNIQUE INDEX `MunicipalServiceField_serviceId_fieldKey_key`(`serviceId`,`fieldKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceAppointmentSlot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `serviceId` INTEGER NOT NULL,
    `departmentId` INTEGER NOT NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NOT NULL,
    `capacity` INTEGER NOT NULL DEFAULT 1,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `ServiceAppointmentSlot_serviceId_isActive_startsAt_idx`(`serviceId`,`isActive`,`startsAt`),
    INDEX `ServiceAppointmentSlot_departmentId_idx`(`departmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceRequestFieldValue` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `serviceRequestId` INTEGER NOT NULL,
    `serviceFieldId` INTEGER NOT NULL,
    `value` JSON NOT NULL,
    `fieldLabelSnapshot` VARCHAR(191) NOT NULL,
    `fieldTypeSnapshot` ENUM('TEXT','TEXTAREA','NUMBER','DATE','DATETIME','SELECT','CHECKBOX','PHONE','EMAIL') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `ServiceRequestFieldValue_serviceFieldId_idx`(`serviceFieldId`),
    UNIQUE INDEX `ServiceRequestFieldValue_serviceRequestId_serviceFieldId_key`(`serviceRequestId`,`serviceFieldId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceRequestDocument` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `serviceRequestId` INTEGER NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `originalFileName` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `uploadedById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `ServiceRequestDocument_serviceRequestId_idx`(`serviceRequestId`),
    INDEX `ServiceRequestDocument_uploadedById_idx`(`uploadedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_publicHiddenById_fkey` FOREIGN KEY (`publicHiddenById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `MunicipalServiceField` ADD CONSTRAINT `MunicipalServiceField_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `MunicipalService`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ServiceAppointmentSlot` ADD CONSTRAINT `ServiceAppointmentSlot_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `MunicipalService`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ServiceAppointmentSlot` ADD CONSTRAINT `ServiceAppointmentSlot_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ServiceRequest` ADD CONSTRAINT `ServiceRequest_appointmentSlotId_fkey` FOREIGN KEY (`appointmentSlotId`) REFERENCES `ServiceAppointmentSlot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `ServiceRequestFieldValue` ADD CONSTRAINT `ServiceRequestFieldValue_serviceRequestId_fkey` FOREIGN KEY (`serviceRequestId`) REFERENCES `ServiceRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ServiceRequestFieldValue` ADD CONSTRAINT `ServiceRequestFieldValue_serviceFieldId_fkey` FOREIGN KEY (`serviceFieldId`) REFERENCES `MunicipalServiceField`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ServiceRequestDocument` ADD CONSTRAINT `ServiceRequestDocument_serviceRequestId_fkey` FOREIGN KEY (`serviceRequestId`) REFERENCES `ServiceRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ServiceRequestDocument` ADD CONSTRAINT `ServiceRequestDocument_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
