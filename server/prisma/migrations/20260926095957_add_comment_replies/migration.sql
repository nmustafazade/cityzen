-- AlterTable
ALTER TABLE `ReportComment` ADD COLUMN `parentCommentId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `ReportComment_parentCommentId_idx` ON `ReportComment`(`parentCommentId`);

-- AddForeignKey
ALTER TABLE `ReportComment` ADD CONSTRAINT `ReportComment_parentCommentId_fkey` FOREIGN KEY (`parentCommentId`) REFERENCES `ReportComment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
