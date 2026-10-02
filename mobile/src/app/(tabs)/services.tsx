import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { FlatList, Image, Pressable, RefreshControl, Text, View } from "react-native";
import { Card, PageHeading, Screen, State, styles } from "@/components/ui";
import { colors } from "@/constants/theme";
import { useLoad } from "@/hooks/useLoad";
import { api, mediaUrl } from "@/services/api";
import type { PageMeta, Service } from "@/types";
export default function Services(){
  const result=useLoad(()=>api<{services:Service[];pagination:PageMeta}>("/api/services?limit=30"),[]);
  return <Screen scroll={false}>
    <PageHeading title="City services" eyebrow="HERE TO HELP" subtitle="Practical help from your municipality, all in one place."/>
    {result.loading?<State loading message="Loading services…"/>:result.error?<State message={result.error} action={result.reload}/>:<FlatList
      data={result.data?.services??[]} keyExtractor={item=>String(item.id)} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={result.refreshing} onRefresh={result.reload}/>}
      contentContainerStyle={{gap:16,paddingBottom:24}}
      ListEmptyComponent={<State message="No services are available yet."/>}
      renderItem={({item})=><Pressable accessibilityRole="button" accessibilityLabel={item.title} onPress={()=>router.push(`/services/${item.id}`)}>
        <Card style={{padding:0,overflow:"hidden"}}>
          {item.imageUrl?<Image source={{uri:mediaUrl(item.imageUrl)}} style={{width:"100%",height:160}} resizeMode="cover" accessibilityLabel={item.title}/>:<View style={{height:90,backgroundColor:colors.navy,padding:20,justifyContent:"center"}}><Ionicons name="business-outline" size={36} color={colors.accent}/></View>}
          <View style={{padding:18,gap:10}}>
            <Text style={{color:colors.primary,fontSize:11,letterSpacing:1,fontWeight:"800"}}>{item.department.name.toUpperCase()}</Text>
            <Text style={styles.heading}>{item.title}</Text>
            <Text numberOfLines={2} style={styles.muted}>{item.description}</Text>
            <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingTop:6}}><Text style={{fontWeight:"800",color:colors.primary}}>Explore service</Text><Ionicons name="arrow-forward" size={20} color={colors.primary}/></View>
          </View>
        </Card>
      </Pressable>}
    />}
  </Screen>;
}
