import { apiRequest } from "./api";
import type { MunicipalService, ServiceInput } from "@/types/service";
export interface PageMeta { page:number; limit:number; total:number; totalPages:number; }
const query = (p:Record<string,string|number|boolean|undefined>) => { const q=new URLSearchParams(); Object.entries(p).forEach(([k,v])=>{if(v!==undefined&&v!=="")q.set(k,String(v));}); return q.size?`?${q}`:""; };
export const getServices=(params:Record<string,string|number|undefined>={})=>apiRequest<{services:MunicipalService[];pagination:PageMeta}>(`/api/services${query(params)}`);
export const getService=(id:number)=>apiRequest<{service:MunicipalService}>(`/api/services/${id}`);
export const getManagedServices=(params:Record<string,number|undefined>={})=>apiRequest<{services:MunicipalService[];pagination:PageMeta}>(`/api/municipality/services${query(params)}`);
export const createService=(data:ServiceInput)=>apiRequest<{service:MunicipalService}>("/api/municipality/services",{method:"POST",body:data});
export const updateService=(id:number,data:Partial<ServiceInput>)=>apiRequest<{service:MunicipalService}>(`/api/municipality/services/${id}`,{method:"PATCH",body:data});
export interface AppointmentSlot{id:number;startsAt:string;endsAt:string;capacity:number;remainingCapacity:number;isActive:boolean}
export const getAppointmentSlots=(id:number)=>apiRequest<{slots:AppointmentSlot[]}>(`/api/services/${id}/appointment-slots`);
export const configureService=(id:number,data:object)=>apiRequest<{service:MunicipalService}>(`/api/municipality/services/${id}/configuration`,{method:"PATCH",body:data});
export const createServiceField=(id:number,data:object)=>apiRequest(`/api/municipality/services/${id}/fields`,{method:"POST",body:data});
export const updateServiceField=(serviceId:number,fieldId:number,data:object)=>apiRequest(`/api/municipality/services/${serviceId}/fields/${fieldId}`,{method:"PATCH",body:data});
export const getManagedAppointmentSlots=(id:number)=>apiRequest<{slots:Array<AppointmentSlot&{bookings:number}>}>(`/api/municipality/services/${id}/appointment-slots`);
export const createAppointmentSlot=(id:number,data:object)=>apiRequest(`/api/municipality/services/${id}/appointment-slots`,{method:"POST",body:data});
