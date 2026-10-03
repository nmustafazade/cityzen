import { ApiListScreen } from "@/components/ApiListScreen";
export default function Page() {
  return (
    <ApiListScreen
      title="Road Conditions"
      subtitle="Municipality and open road-condition data."
      path="/api/infrastructure/road-events?limit=30"
      keyName="roadEvents"
    />
  );
}
