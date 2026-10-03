import { ApiListScreen } from "@/components/ApiListScreen";
export default function Page() {
  return (
    <ApiListScreen
      title="City Alerts"
      subtitle="Active safety and emergency information."
      path="/api/emergency-alerts"
      keyName="alerts"
    />
  );
}
