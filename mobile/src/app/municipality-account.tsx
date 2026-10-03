import { Text } from "react-native";
import { Button, Card, Screen, styles } from "@/components/ui";
import { useAuth } from "@/store/AuthContext";
export default function Page() {
  const { user, logout } = useAuth();
  return (
    <Screen>
      <Text style={styles.title}>Cityzen</Text>
      <Card>
        <Text style={styles.heading}>Municipality account</Text>
        <Text style={styles.muted}>
          Hello {user?.firstName}. Municipality accounts are currently supported
          through the Cityzen web workspace.
        </Text>
        <Button
          title="Logout"
          variant="outline"
          onPress={() => void logout()}
        />
      </Card>
    </Screen>
  );
}
