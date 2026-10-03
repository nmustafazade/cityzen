import { ApiListScreen } from "@/components/ApiListScreen";
export default function Page() {
  return (
    <ApiListScreen
      title="Parking"
      subtitle="Parking facilities and availability where provided."
      path="/api/infrastructure/parking?limit=30"
      keyName="parking"
    />
  );
}
