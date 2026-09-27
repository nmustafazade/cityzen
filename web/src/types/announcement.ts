import type { Department } from "./department";
export interface Announcement { id:number; title:string; content:string; imageUrl:string|null; isPublished:boolean; publishedAt:string|null; expiresAt:string|null; createdAt:string; updatedAt:string; department:Pick<Department,"id"|"name">|null; }
export interface AnnouncementInput { departmentId?:number|null; title:string; content:string; expiresAt?:string|null; isPublished?:boolean; }
