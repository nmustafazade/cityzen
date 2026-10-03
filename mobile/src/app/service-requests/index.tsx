import { ApiListScreen } from "@/components/ApiListScreen";
export default function Page() {
  return (
    <ApiListScreen
      title="My Service Requests"
      subtitle="Track municipal services you requested."
      path="/api/service-requests/my?limit=20"
      keyName="requests"
    />
  );
}
