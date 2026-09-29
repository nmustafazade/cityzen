-- CreateTable
CREATE TABLE `AiAssistanceLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `feature` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `targetType` VARCHAR(191) NOT NULL,
    `targetId` INTEGER NULL,
    `inputSummary` VARCHAR(191) NULL,
    `outputSummary` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AiAssistanceLog_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `AiAssistanceLog_feature_createdAt_idx`(`feature`, `createdAt`),
    INDEX `AiAssistanceLog_targetType_targetId_idx`(`targetType`, `targetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Report_departmentId_createdAt_idx` ON `Report`(`departmentId`, `createdAt`);

-- CreateIndex
CREATE INDEX `Report_departmentId_status_createdAt_idx` ON `Report`(`departmentId`, `status`, `createdAt`);

-- CreateIndex
CREATE INDEX `Report_categoryId_status_createdAt_idx` ON `Report`(`categoryId`, `status`, `createdAt`);

-- CreateIndex
CREATE INDEX `Report_resolvedAt_idx` ON `Report`(`resolvedAt`);

-- CreateIndex
CREATE INDEX `ReportFeedback_rating_createdAt_idx` ON `ReportFeedback`(`rating`, `createdAt`);

-- CreateIndex
CREATE INDEX `ServiceRequest_departmentId_createdAt_idx` ON `ServiceRequest`(`departmentId`, `createdAt`);

-- CreateIndex
CREATE INDEX `ServiceRequest_serviceId_status_createdAt_idx` ON `ServiceRequest`(`serviceId`, `status`, `createdAt`);

-- CreateIndex
CREATE INDEX `ServiceRequest_completedAt_idx` ON `ServiceRequest`(`completedAt`);

-- AddForeignKey
ALTER TABLE `AiAssistanceLog` ADD CONSTRAINT `AiAssistanceLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
