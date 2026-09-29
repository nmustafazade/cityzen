import{apiRequest}from"./api";
export type AiTextResponse={summary?:string;draft?:string;provider:string;advisory:true};
export const suggestReportCategory=(title:string,description:string)=>apiRequest<{categoryId:number|null;categoryName:string|null;confidence:number;reason:string;provider:string;advisory:true}>("/api/ai/reports/category-suggestion",{method:"POST",body:{title,description}});
export const suggestReportPriority=(id:number)=>apiRequest<{priority:string;confidence:number;reasons:string[];provider:string;advisory:true}>(`/api/ai/reports/${id}/priority-suggestion`,{method:"POST"});
export const summarizeReport=(id:number)=>apiRequest<AiTextResponse>(`/api/ai/reports/${id}/summary`,{method:"POST"});
export const draftReportResponse=(id:number)=>apiRequest<AiTextResponse>(`/api/ai/reports/${id}/response-draft`,{method:"POST"});
export const summarizeAnalytics=(body:{from:string;to:string;departmentId?:number})=>apiRequest<AiTextResponse>("/api/ai/analytics/summary",{method:"POST",body});
