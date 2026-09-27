import { apiRequest } from "./api";
import type { MunicipalService, ServiceInput } from "@/types/service";
export interface PageMeta { page:number; limit:number; total:number; totalPages:number; }
const query = (p:Record<string,string|number|boolean|undefined>) => { const q=new URLSearchParams(); Object.entries(p).forEach(([k,v])=>{if(v!==undefined&&v!=="")q.set(k,String(v));}); return q.size?`?${q}`:""; };
export const getServices=(params:Record<string,string|number|undefined>={})=>apiRequest<{services:MunicipalService[];pagination:PageMeta}>(`/api/services${query(params)}`);
export const getService=(id:number)=>apiRequest<{service:MunicipalService}>(`/api/services/${id}`);
export const getManagedServices=(params:Record<string,number|undefined>={})=>apiRequest<{services:MunicipalService[];pagination:PageMeta}>(`/api/municipality/services${query(params)}`);
export const createService=(data:ServiceInput)=>apiRequest<{service:MunicipalService}>("/api/municipality/services",{method:"POST",body:data});
export const updateService=(id:number,data:Partial<ServiceInput>)=>apiRequest<{service:MunicipalService}>(`/api/municipality/services/${id}`,{method:"PATCH",body:data});
