import { ApiListScreen } from "@/components/ApiListScreen";
export default function Page() {
  return (
    <ApiListScreen
      title="Community"
      subtitle="Public city issues supported by residents."
      path="/api/public/reports?limit=20"
      keyName="reports"
    />
  );
}
