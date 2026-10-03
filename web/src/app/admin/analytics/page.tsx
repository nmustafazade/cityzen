"use client";
import { AdminRoute } from "@/components/auth/ProtectedRoute";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
export default function Page() {
  return (
    <AdminRoute>
      <AnalyticsDashboard />
    </AdminRoute>
  );
}
