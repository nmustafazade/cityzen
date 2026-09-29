import{apiRequest}from"./api";import{getStoredToken}from"./auth";import type{AnalyticsOverview,FeedbackAnalytics,ReportAnalytics,ServiceAnalytics,TrendPoint,WorkloadAnalytics}from"@/types/analytics";
export type AnalyticsParams={from:string;to:string;departmentId?:number};const query=(p:AnalyticsParams)=>new URLSearchParams(Object.entries(p).filter(([,v])=>v!==undefined).map(([k,v])=>[k,String(v)])).toString();
export const getAnalyticsOverview=(p:AnalyticsParams)=>apiRequest<AnalyticsOverview>(`/api/analytics/overview?${query(p)}`);
export const getReportAnalytics=(p:AnalyticsParams)=>apiRequest<ReportAnalytics>(`/api/analytics/reports?${query(p)}`);
export const getServiceAnalytics=(p:AnalyticsParams)=>apiRequest<ServiceAnalytics>(`/api/analytics/service-requests?${query(p)}`);
export const getFeedbackAnalytics=(p:AnalyticsParams)=>apiRequest<FeedbackAnalytics>(`/api/analytics/feedback?${query(p)}`);
export const getWorkloadAnalytics=(p:AnalyticsParams)=>apiRequest<WorkloadAnalytics>(`/api/analytics/workload?${query(p)}`);
export const getTrends=(p:AnalyticsParams)=>apiRequest<TrendPoint[]>(`/api/analytics/trends?${query(p)}`);
export async function downloadAnalyticsCsv(type:"reports"|"service-requests"|"feedback",p:AnalyticsParams){const base=process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/,"");if(!base)throw new Error("API URL is not configured");const response=await fetch(`${base}/api/analytics/export?type=${type}&${query(p)}`,{headers:{Authorization:`Bearer ${getStoredToken()??""}`}});if(!response.ok)throw new Error("Unable to export analytics");const blob=await response.blob(),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=`cityzen-${type}-analytics.csv`;link.click();URL.revokeObjectURL(url)}
