import { ApiListScreen } from "@/components/ApiListScreen";
export default function Page() {
  return (
    <ApiListScreen
      title="Facilities"
      subtitle="Useful public facilities near you."
      path="/api/infrastructure/facilities?limit=30"
      keyName="facilities"
    />
  );
}
