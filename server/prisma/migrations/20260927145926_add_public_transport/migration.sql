-- CreateTable
CREATE TABLE `TransitLine` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `departmentId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `mode` ENUM('BUS', 'METRO', 'TRAM', 'FERRY', 'TRAIN', 'MINIBUS') NOT NULL,
    `description` TEXT NULL,
    `color` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TransitLine_code_key`(`code`),
    INDEX `TransitLine_departmentId_isActive_idx`(`departmentId`, `isActive`),
    INDEX `TransitLine_mode_idx`(`mode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TransitRoute` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lineId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `directionName` VARCHAR(191) NULL,
    `originName` VARCHAR(191) NOT NULL,
    `destinationName` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TransitRoute_lineId_isActive_idx`(`lineId`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TransitStop` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `address` VARCHAR(191) NULL,
    `latitude` DECIMAL(10, 7) NOT NULL,
    `longitude` DECIMAL(10, 7) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TransitStop_code_key`(`code`),
    INDEX `TransitStop_name_idx`(`name`),
    INDEX `TransitStop_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TransitRouteStop` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `routeId` INTEGER NOT NULL,
    `stopId` INTEGER NOT NULL,
    `stopSequence` INTEGER NOT NULL,
    `arrivalOffsetMinutes` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TransitRouteStop_stopId_idx`(`stopId`),
    UNIQUE INDEX `TransitRouteStop_routeId_stopSequence_key`(`routeId`, `stopSequence`),
    UNIQUE INDEX `TransitRouteStop_routeId_stopId_key`(`routeId`, `stopId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TransitSchedule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `routeId` INTEGER NOT NULL,
    `dayOfWeek` ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY') NOT NULL,
    `departureTime` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TransitSchedule_routeId_dayOfWeek_isActive_idx`(`routeId`, `dayOfWeek`, `isActive`),
    UNIQUE INDEX `TransitSchedule_routeId_dayOfWeek_departureTime_key`(`routeId`, `dayOfWeek`, `departureTime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TransitServiceAlert` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lineId` INTEGER NULL,
    `routeId` INTEGER NULL,
    `departmentId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `severity` ENUM('INFO', 'MINOR', 'MAJOR') NOT NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TransitServiceAlert_departmentId_isActive_idx`(`departmentId`, `isActive`),
    INDEX `TransitServiceAlert_lineId_idx`(`lineId`),
    INDEX `TransitServiceAlert_routeId_idx`(`routeId`),
    INDEX `TransitServiceAlert_startsAt_endsAt_idx`(`startsAt`, `endsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FavoriteTransitLine` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `lineId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FavoriteTransitLine_lineId_idx`(`lineId`),
    UNIQUE INDEX `FavoriteTransitLine_userId_lineId_key`(`userId`, `lineId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FavoriteTransitStop` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `stopId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FavoriteTransitStop_stopId_idx`(`stopId`),
    UNIQUE INDEX `FavoriteTransitStop_userId_stopId_key`(`userId`, `stopId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TransitLine` ADD CONSTRAINT `TransitLine_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransitRoute` ADD CONSTRAINT `TransitRoute_lineId_fkey` FOREIGN KEY (`lineId`) REFERENCES `TransitLine`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransitRouteStop` ADD CONSTRAINT `TransitRouteStop_routeId_fkey` FOREIGN KEY (`routeId`) REFERENCES `TransitRoute`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransitRouteStop` ADD CONSTRAINT `TransitRouteStop_stopId_fkey` FOREIGN KEY (`stopId`) REFERENCES `TransitStop`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransitSchedule` ADD CONSTRAINT `TransitSchedule_routeId_fkey` FOREIGN KEY (`routeId`) REFERENCES `TransitRoute`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransitServiceAlert` ADD CONSTRAINT `TransitServiceAlert_lineId_fkey` FOREIGN KEY (`lineId`) REFERENCES `TransitLine`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransitServiceAlert` ADD CONSTRAINT `TransitServiceAlert_routeId_fkey` FOREIGN KEY (`routeId`) REFERENCES `TransitRoute`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransitServiceAlert` ADD CONSTRAINT `TransitServiceAlert_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransitServiceAlert` ADD CONSTRAINT `TransitServiceAlert_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FavoriteTransitLine` ADD CONSTRAINT `FavoriteTransitLine_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FavoriteTransitLine` ADD CONSTRAINT `FavoriteTransitLine_lineId_fkey` FOREIGN KEY (`lineId`) REFERENCES `TransitLine`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FavoriteTransitStop` ADD CONSTRAINT `FavoriteTransitStop_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FavoriteTransitStop` ADD CONSTRAINT `FavoriteTransitStop_stopId_fkey` FOREIGN KEY (`stopId`) REFERENCES `TransitStop`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
