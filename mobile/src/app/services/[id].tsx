import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Image, Text, View } from "react-native";
import { Button, Card, Screen, State, styles } from "@/components/ui";
import { colors } from "@/constants/theme";
import { useLoad } from "@/hooks/useLoad";
import { api, mediaUrl } from "@/services/api";
import type { Service } from "@/types";
export default function Page(){
  const {id}=useLocalSearchParams<{id:string}>();
  return <ServiceDetail key={id} id={id}/>;
}
function ServiceDetail({id}:{id:string}){
  const r=useLoad(()=>api<{service:Service}>(`/api/services/${id}`),[id]);
  if(r.loading)return <Screen><State loading message="Loading service…"/></Screen>;
  if(!r.data)return <Screen><State message={r.error||"Service not found"} action={r.reload}/></Screen>;
  const s=r.data.service;
  return <Screen>
    <Stack.Screen options={{title:s.title}}/>
    {s.imageUrl&&<Image source={{uri:mediaUrl(s.imageUrl)}} accessibilityLabel={s.title} style={{height:210,width:"100%",borderRadius:22}} resizeMode="cover"/>}
    <View style={{backgroundColor:colors.navy,borderRadius:22,padding:22,gap:12}}>
      <Ionicons name="business-outline" size={28} color={colors.accent}/>
      <Text style={{color:colors.accent,fontWeight:"700"}}>{s.department.name}</Text>
      <Text style={[styles.title,{color:"white",fontSize:27}]}>{s.title}</Text>
    </View>
    <Card><Text style={styles.heading}>About this service</Text><Text style={[styles.muted,{fontSize:16,lineHeight:25}]}>{s.description}</Text></Card>
    {s.requirements&&<Card><Text style={styles.heading}>What you’ll need</Text><Text style={styles.muted}>{s.requirements}</Text></Card>}
    {s.instructions&&<Card><Text style={styles.heading}>How it works</Text><Text style={styles.muted}>{s.instructions}</Text></Card>}
    <Button title={s.isActive?"Request this service":"Currently unavailable"} disabled={!s.isActive} onPress={()=>router.push(`/services/${id}/request`)}/>
  </Screen>;
}
