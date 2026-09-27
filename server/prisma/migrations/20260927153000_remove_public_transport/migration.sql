-- DropForeignKey
ALTER TABLE `FavoriteTransitLine` DROP FOREIGN KEY `FavoriteTransitLine_lineId_fkey`;
ALTER TABLE `FavoriteTransitLine` DROP FOREIGN KEY `FavoriteTransitLine_userId_fkey`;
ALTER TABLE `FavoriteTransitStop` DROP FOREIGN KEY `FavoriteTransitStop_stopId_fkey`;
ALTER TABLE `FavoriteTransitStop` DROP FOREIGN KEY `FavoriteTransitStop_userId_fkey`;
ALTER TABLE `TransitLine` DROP FOREIGN KEY `TransitLine_departmentId_fkey`;
ALTER TABLE `TransitRoute` DROP FOREIGN KEY `TransitRoute_lineId_fkey`;
ALTER TABLE `TransitRouteStop` DROP FOREIGN KEY `TransitRouteStop_routeId_fkey`;
ALTER TABLE `TransitRouteStop` DROP FOREIGN KEY `TransitRouteStop_stopId_fkey`;
ALTER TABLE `TransitSchedule` DROP FOREIGN KEY `TransitSchedule_routeId_fkey`;
ALTER TABLE `TransitServiceAlert` DROP FOREIGN KEY `TransitServiceAlert_createdById_fkey`;
ALTER TABLE `TransitServiceAlert` DROP FOREIGN KEY `TransitServiceAlert_departmentId_fkey`;
ALTER TABLE `TransitServiceAlert` DROP FOREIGN KEY `TransitServiceAlert_lineId_fkey`;
ALTER TABLE `TransitServiceAlert` DROP FOREIGN KEY `TransitServiceAlert_routeId_fkey`;

-- DropTable
DROP TABLE `FavoriteTransitLine`;
DROP TABLE `FavoriteTransitStop`;
DROP TABLE `TransitLine`;
DROP TABLE `TransitRoute`;
DROP TABLE `TransitRouteStop`;
DROP TABLE `TransitSchedule`;
DROP TABLE `TransitServiceAlert`;
DROP TABLE `TransitStop`;
