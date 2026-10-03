"use client";
import { MunicipalityRoute } from "@/components/auth/ProtectedRoute";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
export default function Page() {
  return (
    <MunicipalityRoute>
      <AnalyticsDashboard />
    </MunicipalityRoute>
  );
}
