import type { DepartmentSummary } from "./user";
export type WasteType="GENERAL"|"RECYCLING"|"ORGANIC"|"GLASS"|"PAPER"|"PLASTIC"|"METAL"|"ELECTRONIC"|"HAZARDOUS"|"BULKY";
export type Weekday="MONDAY"|"TUESDAY"|"WEDNESDAY"|"THURSDAY"|"FRIDAY"|"SATURDAY"|"SUNDAY";
export type WasteFacilityType="PUBLIC_BIN"|"RECYCLING_BIN"|"RECYCLING_CENTER"|"E_WASTE_POINT"|"HAZARDOUS_WASTE_POINT"|"COMPOST_POINT";
export interface WasteZone{id:number;name:string;description:string|null;city:string|null;district:string|null;neighborhood:string|null;postalCode:string|null;isActive:boolean;department:DepartmentSummary}
export interface WasteSchedule{id:number;zoneId:number;wasteType:WasteType;dayOfWeek:Weekday;collectionTime:string|null;notes:string|null;isActive:boolean;zone:WasteZone}
export interface WasteException{id:number;zoneId:number;wasteType:WasteType|null;date:string;type:"CANCELLED"|"RESCHEDULED"|"EXTRA_COLLECTION";replacementDate:string|null;note:string|null}
export interface WasteFacility{id:number;type:WasteFacilityType;name:string|null;description:string|null;address:string|null;latitude:string|number;longitude:string|number;openingHours:string|null;source:import("./infrastructure").InfrastructureDataSource;sourceUrl:string|null;lastSyncedAt:string|null;department:DepartmentSummary|null;acceptedTypes:{wasteType:WasteType}[]}
export const wasteLabels:Record<WasteType,string>={GENERAL:"General Waste",RECYCLING:"Recycling",ORGANIC:"Organic",GLASS:"Glass",PAPER:"Paper",PLASTIC:"Plastic",METAL:"Metal",ELECTRONIC:"Electronic",HAZARDOUS:"Hazardous",BULKY:"Bulky Waste"};
export const wasteFacilityLabels:Record<WasteFacilityType,string>={PUBLIC_BIN:"Public Bin",RECYCLING_BIN:"Recycling Bin",RECYCLING_CENTER:"Recycling Center",E_WASTE_POINT:"E-Waste Point",HAZARDOUS_WASTE_POINT:"Hazardous Waste Point",COMPOST_POINT:"Compost Point"};
