import { UserRole } from "@prisma/client";
import { Router } from "express";

import * as controller from "../controllers/infrastructure.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

export const infrastructureRouter = Router();
infrastructureRouter.get("/facility-categories", controller.categories);
infrastructureRouter.get("/traffic", controller.traffic);
infrastructureRouter.get("/road-events", controller.publicRoads);
infrastructureRouter.get("/road-events/:id", controller.publicRoad);
infrastructureRouter.get("/parking/nearby", controller.nearby("parking"));
infrastructureRouter.get("/parking", controller.publicParking);
infrastructureRouter.get("/parking/:id", controller.publicParkingDetail);
infrastructureRouter.get("/facilities/nearby", controller.nearby("facilities"));
infrastructureRouter.get("/facilities", controller.publicFacilities);
infrastructureRouter.get("/facilities/:id", controller.publicFacility);

export const municipalityInfrastructureRouter = Router();
municipalityInfrastructureRouter.use(authenticate, authorizeRoles(UserRole.DEPARTMENT_HEAD, UserRole.ADMIN));
municipalityInfrastructureRouter.get("/road-events", controller.managedRoads);
municipalityInfrastructureRouter.post("/road-events", controller.createRoad);
municipalityInfrastructureRouter.patch("/road-events/:id", controller.updateRoad);
municipalityInfrastructureRouter.get("/parking", controller.managedParking);
municipalityInfrastructureRouter.post("/parking", controller.createParking);
municipalityInfrastructureRouter.patch("/parking/:id", controller.updateParking);
municipalityInfrastructureRouter.get("/facilities", controller.managedFacilities);
municipalityInfrastructureRouter.post("/facilities", controller.createFacility);
municipalityInfrastructureRouter.patch("/facilities/:id", controller.updateFacility);

export const facilityCategoryAdminRouter = Router();
facilityCategoryAdminRouter.use(authenticate, authorizeRoles(UserRole.ADMIN));
facilityCategoryAdminRouter.get("/", controller.adminCategories);
facilityCategoryAdminRouter.post("/", controller.createCategory);
facilityCategoryAdminRouter.patch("/:id", controller.updateCategory);
