import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Button, Card, PageHeading, Screen, styles } from "@/components/ui";
import { colors } from "@/constants/theme";
import { useAuth } from "@/store/AuthContext";
const groups=[
  {title:"MY CITYZEN",items:[["My Service Requests","/service-requests","clipboard-outline"],["My Parking","/parking","car-outline"],["Notifications","/notifications","notifications-outline"]]},
  {title:"EXPLORE YOUR CITY",items:[["Community","/community","people-outline"],["Facilities","/facilities","business-outline"],["Road Conditions","/roads","trail-sign-outline"],["Waste & Recycling","/waste","leaf-outline"],["Environment","/environment","earth-outline"]]},
  {title:"STAY CONNECTED",items:[["Announcements","/announcements","megaphone-outline"],["Events","/events","calendar-outline"],["City Alerts","/alerts","warning-outline"]]},
] as const;
export default function More(){
  const {user,logout}=useAuth();
  const role=user?.role.toLowerCase().replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase())||"Account";
  return <Screen>
    <PageHeading title="Your Cityzen" subtitle="Stay connected to your neighborhood." eyebrow="EXPLORE & ACCOUNT"/>
    <View style={{backgroundColor:colors.navy,borderRadius:22,padding:20,flexDirection:"row",alignItems:"center",gap:14}}>
      <View style={{width:52,height:52,borderRadius:18,backgroundColor:"#16473F",alignItems:"center",justifyContent:"center"}}><Text style={{color:colors.accent,fontSize:22,fontWeight:"800"}}>{user?.firstName?.[0]}{user?.lastName?.[0]}</Text></View>
      <View style={{flex:1,gap:5}}><Text style={{color:"white",fontSize:18,fontWeight:"800"}}>{user?.firstName} {user?.lastName}</Text><Text style={{color:"#B7C8CF"}}>{role}</Text></View>
    </View>
    {groups.map(group=><View key={group.title} style={{gap:10}}>
      <Text style={{fontSize:11,fontWeight:"800",letterSpacing:1.5,color:colors.muted,marginTop:8}}>{group.title}</Text>
      <Card style={{padding:4,gap:0}}>
        {group.items.map(([label,href,icon])=><Pressable accessibilityRole="button" key={label} onPress={()=>router.push(href)} style={({pressed})=>({minHeight:60,padding:12,borderRadius:12,flexDirection:"row",alignItems:"center",gap:12,backgroundColor:pressed?"#EAF0EE":"transparent"})}>
          <Ionicons name={icon} color={colors.primary} size={22}/>
          <Text style={{flex:1,fontWeight:"700",color:colors.ink}}>{label}</Text>
          <Ionicons name="chevron-forward" color={colors.muted} size={17}/>
        </Pressable>)}
      </Card>
    </View>)}
    <Button title="Log out" variant="outline" onPress={()=>void logout()}/>
    <Text style={[styles.muted,{textAlign:"center",fontSize:12}]}>Cityzen · Your city. Connected.</Text>
  </Screen>;
}
