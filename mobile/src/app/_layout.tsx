import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/store/AuthContext";
import { colors } from "@/constants/theme";
const titles: Record<string,string> = {
  "city-info/[kind]/[id]":"City Details",
  "services/[id]":"Service Details", "services/[id]/request":"Request Service",
  "reports/[id]":"Report Details", "reports/new":"Report an Issue",
  "service-requests/index":"My Service Requests", "service-requests/[id]":"Request Details",
  "notifications/index":"Notifications", "parking/index":"Parking", "facilities/index":"City Facilities",
  "roads/index":"Road Conditions", "waste/index":"Waste & Recycling", "environment/index":"Environment",
  "community/index":"Community", "events/index":"Events", "announcements/index":"Announcements",
  "alerts/index":"City Alerts", "municipality-account":"Municipality Account",
};
export default function RootLayout(){
  return <AuthProvider><StatusBar style="dark"/><Stack screenOptions={{
    headerBackTitle:"Back",headerTintColor:colors.primary,headerShadowVisible:false,
    headerTitleStyle:{fontWeight:"800",color:colors.ink},contentStyle:{backgroundColor:colors.background},
  }}>
    <Stack.Screen name="index" options={{headerShown:false}}/>
    <Stack.Screen name="(auth)" options={{headerShown:false}}/>
    <Stack.Screen name="(tabs)" options={{headerShown:false}}/>
    {Object.entries(titles).map(([name,title])=><Stack.Screen key={name} name={name} options={{title}}/>)}
  </Stack></AuthProvider>;
}
