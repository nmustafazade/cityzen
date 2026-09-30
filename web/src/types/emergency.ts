import type{DepartmentSummary}from"./user";import type{InfrastructureDataSource}from"./infrastructure";
export type EmergencySeverity="ADVISORY"|"WATCH"|"WARNING"|"CRITICAL";
export type EmergencyType="SEVERE_WEATHER"|"FLOOD"|"FIRE"|"EARTHQUAKE"|"INFRASTRUCTURE_FAILURE"|"WATER_DISRUPTION"|"POWER_DISRUPTION"|"PUBLIC_SAFETY"|"ROAD_EMERGENCY"|"OTHER";
export interface EmergencyAlert{id:number;type:EmergencyType;severity:EmergencySeverity;title:string;message:string;latitude:string|number|null;longitude:string|number|null;radiusKm:string|number|null;startsAt:string;endsAt:string|null;createdAt?:string;isPublished:boolean;source:InfrastructureDataSource;sourceUrl:string|null;department:DepartmentSummary|null;publishedAt:string|null}
export const severityLabels:Record<EmergencySeverity,string>={ADVISORY:"Advisory",WATCH:"Watch",WARNING:"Warning",CRITICAL:"Critical"};
