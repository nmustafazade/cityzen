import { EmployeeReportDetail } from "@/components/reports/EmployeeReportDetail";

export default async function EmployeeReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EmployeeReportDetail reportId={id} />;
}
