import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { Card, Screen, State, styles } from "@/components/ui";
import { colors } from "@/constants/theme";
import { useLoad } from "@/hooks/useLoad";
import { api } from "@/services/api";
import { useAuth } from "@/store/AuthContext";
import { greeting } from "@/utils/format";

const actions=[
  {label:"Report an issue",detail:"Help improve your neighborhood",icon:"camera-outline",href:"/reports/new",color:"#E2F3ED"},
  {label:"City services",detail:"Request help from your city",icon:"business-outline",href:"/(tabs)/services",color:"#E7EDF9"},
  {label:"Explore the map",detail:"Get to know your surroundings",icon:"map-outline",href:"/(tabs)/map",color:"#FFF2DB"},
  {label:"Find parking",detail:"Browse places to park",icon:"car-outline",href:"/parking",color:"#EEE9FA"},
] as const;
export default function Home(){
  const {user}=useAuth();
  const result=useLoad(async()=>{
    const [r,s,n,a]=await Promise.all([
      api<{pagination:{total:number}}>("/api/reports/my?limit=1"),
      api<{pagination:{total:number}}>("/api/service-requests/my?limit=1"),
      api<{count:number}>("/api/notifications/unread-count"),
      api<{alerts:unknown[]}>("/api/emergency-alerts"),
    ]);
    return {reports:r.pagination.total,services:s.pagination.total,unread:n.count,alerts:a.alerts.length};
  },[]);
  return <Screen scroll={false}>
    <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={result.refreshing} onRefresh={result.reload}/>} contentContainerStyle={{gap:22,paddingBottom:24}}>
      <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}>
        <View><Text style={{color:colors.primary,fontSize:23,fontWeight:"900",letterSpacing:-1}}>Cityzen<Text style={{color:colors.primary}}> .</Text></Text><Text style={styles.muted}>Your city. Connected.</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Open notifications" onPress={()=>router.push("/notifications")} style={{backgroundColor:"white",padding:13,borderRadius:16,borderWidth:1,borderColor:colors.border}}>
          <Ionicons name="notifications-outline" size={24} color={colors.navy}/>
          {!!result.data?.unread&&<View style={{position:"absolute",right:5,top:5,width:8,height:8,borderRadius:4,backgroundColor:colors.primary}}/>}
        </Pressable>
      </View>
      <View style={{backgroundColor:colors.navy,borderRadius:26,padding:24,gap:14,overflow:"hidden"}}>
        <Text style={{color:colors.accent,fontSize:11,fontWeight:"800",letterSpacing:2}}>YOUR CITY STARTS WITH YOU</Text>
        <Text style={{fontSize:29,lineHeight:36,fontWeight:"800",color:"white",letterSpacing:-.8}}>{greeting()},{'\n'}{user?.firstName||"neighbor"}.</Text>
        <Text style={{fontSize:15,lineHeight:23,color:"#BDD1D5"}}>A better neighborhood, one small action at a time. What can we help you with today?</Text>
        <Pressable accessibilityRole="button" onPress={()=>router.push("/reports/new")} style={{alignSelf:"flex-start",flexDirection:"row",gap:10,alignItems:"center",backgroundColor:colors.accent,padding:13,borderRadius:12}}>
          <Text style={{fontWeight:"800",color:colors.navy}}>Report an issue</Text><Ionicons name="arrow-forward" size={18} color={colors.navy}/>
        </Pressable>
      </View>
      <View style={{gap:12}}><Text style={styles.heading}>Your activity</Text>
        {result.error?<State message={result.error} action={result.reload}/>:<View style={{flexDirection:"row",gap:9}}>
          <Metric value={result.data?.reports??"—"} label="Reports" onPress={()=>router.push("/(tabs)/reports")}/>
          <Metric value={result.data?.services??"—"} label="Requests" onPress={()=>router.push("/service-requests")}/>
          <Metric value={result.data?.unread??"—"} label="Unread" onPress={()=>router.push("/notifications")}/>
        </View>}
      </View>
      <View style={{gap:4}}><Text style={styles.heading}>How can we help?</Text><Text style={styles.muted}>Everything you need, close at hand.</Text></View>
      <View style={{flexDirection:"row",flexWrap:"wrap",gap:12}}>
        {actions.map(a=><Pressable accessibilityRole="button" key={a.label} onPress={()=>router.push(a.href)} style={({pressed})=>({flexBasis:"46%",flexGrow:1,opacity:pressed?.7:1})}>
          <Card style={{flex:1,padding:18,gap:12}}>
            <View style={{alignSelf:"flex-start",padding:12,borderRadius:14,backgroundColor:a.color}}><Ionicons name={a.icon} size={25} color={colors.navy}/></View>
            <Text style={{fontSize:16,fontWeight:"800",color:colors.ink}}>{a.label}</Text><Text style={styles.muted}>{a.detail}</Text>
          </Card>
        </Pressable>)}
      </View>
      {(result.data?.alerts??0)>0&&<Pressable accessibilityRole="button" onPress={()=>router.push("/alerts")}><Card style={{backgroundColor:"#FFF5E6",borderColor:"#ECD6B5"}}><Text style={{fontWeight:"800",color:colors.warning}}>City alerts · Stay informed</Text><Text style={styles.muted}>Important information for your area. View updates →</Text></Card></Pressable>}
    </ScrollView>
  </Screen>;
}
function Metric({value,label,onPress}:{value:string|number;label:string;onPress:()=>void}){
  return <Pressable accessibilityRole="button" onPress={onPress} style={{flex:1}}><Card style={{alignItems:"center",paddingHorizontal:8}}><Text style={{fontSize:27,fontWeight:"800",color:colors.primary}}>{value}</Text><Text style={styles.muted}>{label}</Text></Card></Pressable>;
}
