import{apiRequest}from"./api";import type{PublicComment,PublicReport}from"@/types/community";import type{ReportStatus}from"@/types/report";
export interface CommunityParams{search?:string;categoryId?:number;departmentId?:number;status?:ReportStatus;sort?:"newest"|"supported"|"updated";page?:number;limit?:number;north?:number;south?:number;east?:number;west?:number}
const query=(values:CommunityParams)=>{const q=new URLSearchParams();Object.entries(values).forEach(([key,value])=>value!==undefined&&value!==""&&q.set(key,String(value)));return q.size?`?${q}`:""};
export const getPublicReports=(params:CommunityParams={})=>apiRequest<{reports:PublicReport[];pagination:{page:number;limit:number;total:number;totalPages:number}}>(`/api/public/reports${query(params)}`);
export const getPublicReport=(id:number)=>apiRequest<{report:PublicReport}>(`/api/public/reports/${id}`);
export const getPublicComments=(id:number)=>apiRequest<{comments:PublicComment[]}>(`/api/public/reports/${id}/comments`);
export const getSimilarReports=(params:{categoryId:number;latitude:number;longitude:number;title?:string})=>apiRequest<{reports:Array<Pick<PublicReport,"id"|"title"|"status"|"createdAt">&{distanceMeters:number;supportCount:number}>}>(`/api/reports/similar${query(params)}`);
