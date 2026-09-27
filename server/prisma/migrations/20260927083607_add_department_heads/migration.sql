-- AlterTable
ALTER TABLE `Notification` MODIFY `type` ENUM('REPORT_CREATED', 'REPORT_ASSIGNED', 'REPORT_STATUS_CHANGED', 'REPORT_COMMENT', 'REPORT_RESOLVED') NOT NULL;

-- AlterTable
ALTER TABLE `ReportCategory` ADD COLUMN `departmentId` INTEGER NULL;

-- AlterTable
ALTER TABLE `User` MODIFY `role` ENUM('CITIZEN', 'EMPLOYEE', 'DEPARTMENT_HEAD', 'ADMIN') NOT NULL DEFAULT 'CITIZEN';

-- CreateIndex
CREATE INDEX `ReportCategory_departmentId_idx` ON `ReportCategory`(`departmentId`);

-- AddForeignKey
ALTER TABLE `ReportCategory` ADD CONSTRAINT `ReportCategory_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
