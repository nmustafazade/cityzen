import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/theme";
const icons:Record<string,keyof typeof Ionicons.glyphMap>={index:"home-outline",reports:"document-text-outline",map:"map-outline",services:"grid-outline",more:"menu-outline"};
export default function Layout(){
  const insets=useSafeAreaInsets();
  return <Tabs screenOptions={({route})=>({
    headerShown:false,tabBarActiveTintColor:colors.primary,tabBarInactiveTintColor:colors.muted,
    tabBarStyle:{height:62+insets.bottom,paddingBottom:Math.max(insets.bottom,8),paddingTop:8,borderTopColor:colors.border,backgroundColor:"white"},
    tabBarLabelStyle:{fontSize:11,fontWeight:"700"},
    tabBarIcon:({color,size})=><Ionicons name={icons[route.name]??"ellipse"} size={size} color={color}/>,
  })}>
    <Tabs.Screen name="index" options={{title:"Home"}}/><Tabs.Screen name="reports" options={{title:"Reports"}}/>
    <Tabs.Screen name="map" options={{title:"Map"}}/><Tabs.Screen name="services" options={{title:"Services"}}/><Tabs.Screen name="more" options={{title:"More"}}/>
  </Tabs>;
}
