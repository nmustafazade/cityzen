import { Redirect } from "expo-router";
import { State } from "@/components/ui";
import { useAuth } from "@/store/AuthContext";
export default function Index() {
  const { loading, authenticated, user } = useAuth();
  if (loading) return <State loading message="Opening Cityzen…" />;
  if (authenticated && user?.role === "CITIZEN")
    return <Redirect href="/(tabs)" />;
  if (authenticated) return <Redirect href="/municipality-account" />;
  return <Redirect href="/(auth)/login" />;
}
