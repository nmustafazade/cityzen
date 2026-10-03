import { apiRequest } from "./api";
import type { EmergencyAlert, EmergencySeverity } from "@/types/emergency";
export const getAlerts = (severity?: EmergencySeverity) =>
  apiRequest<{ alerts: EmergencyAlert[] }>(
    `/api/emergency-alerts${severity ? `?severity=${severity}` : ""}`,
  );
export const getAlert = (id: number) =>
  apiRequest<{ alert: EmergencyAlert }>(`/api/emergency-alerts/${id}`);
export const getManagedAlerts = () =>
  apiRequest<{ alerts: EmergencyAlert[] }>(
    "/api/municipality/emergency-alerts",
  );
export const saveAlert = (data: object, id?: number) =>
  apiRequest<{ alert: EmergencyAlert }>(
    `/api/municipality/emergency-alerts${id ? `/${id}` : ""}`,
    { method: id ? "PATCH" : "POST", body: data },
  );
