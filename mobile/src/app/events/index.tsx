import { ApiListScreen } from "@/components/ApiListScreen";
export default function Page() {
  return (
    <ApiListScreen
      title="Events"
      subtitle="What is happening around your city."
      path="/api/events?limit=20"
      keyName="events"
    />
  );
}
