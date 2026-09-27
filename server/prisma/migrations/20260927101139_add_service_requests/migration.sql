-- AlterTable
ALTER TABLE `Notification` ADD COLUMN `serviceRequestId` INTEGER NULL,
    MODIFY `type` ENUM('REPORT_CREATED', 'REPORT_ASSIGNED', 'REPORT_STATUS_CHANGED', 'REPORT_COMMENT', 'REPORT_RESOLVED', 'SERVICE_REQUEST_CREATED', 'SERVICE_REQUEST_ASSIGNED', 'SERVICE_REQUEST_STATUS_CHANGED', 'SERVICE_REQUEST_COMPLETED') NOT NULL;

-- CreateTable
CREATE TABLE `ServiceRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `serviceId` INTEGER NOT NULL,
    `citizenId` INTEGER NOT NULL,
    `departmentId` INTEGER NOT NULL,
    `assignedEmployeeId` INTEGER NULL,
    `status` ENUM('SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'SUBMITTED',
    `description` TEXT NOT NULL,
    `address` VARCHAR(191) NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `preferredDate` DATETIME(3) NULL,
    `contactPhone` VARCHAR(191) NULL,
    `municipalityResponse` TEXT NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ServiceRequest_citizenId_createdAt_idx`(`citizenId`, `createdAt`),
    INDEX `ServiceRequest_departmentId_status_idx`(`departmentId`, `status`),
    INDEX `ServiceRequest_assignedEmployeeId_status_idx`(`assignedEmployeeId`, `status`),
    INDEX `ServiceRequest_serviceId_idx`(`serviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceRequestStatusHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `serviceRequestId` INTEGER NOT NULL,
    `oldStatus` ENUM('SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED') NULL,
    `newStatus` ENUM('SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED') NOT NULL,
    `changedById` INTEGER NOT NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ServiceRequestStatusHistory_serviceRequestId_createdAt_idx`(`serviceRequestId`, `createdAt`),
    INDEX `ServiceRequestStatusHistory_changedById_idx`(`changedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Notification_serviceRequestId_idx` ON `Notification`(`serviceRequestId`);

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_serviceRequestId_fkey` FOREIGN KEY (`serviceRequestId`) REFERENCES `ServiceRequest`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceRequest` ADD CONSTRAINT `ServiceRequest_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `MunicipalService`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceRequest` ADD CONSTRAINT `ServiceRequest_citizenId_fkey` FOREIGN KEY (`citizenId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceRequest` ADD CONSTRAINT `ServiceRequest_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceRequest` ADD CONSTRAINT `ServiceRequest_assignedEmployeeId_fkey` FOREIGN KEY (`assignedEmployeeId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceRequestStatusHistory` ADD CONSTRAINT `ServiceRequestStatusHistory_serviceRequestId_fkey` FOREIGN KEY (`serviceRequestId`) REFERENCES `ServiceRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceRequestStatusHistory` ADD CONSTRAINT `ServiceRequestStatusHistory_changedById_fkey` FOREIGN KEY (`changedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
