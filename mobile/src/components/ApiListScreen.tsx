import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { FlatList, Image, Pressable, RefreshControl, Text, View } from "react-native";
import { Button, Card, PageHeading, Screen, State, styles } from "./ui";
import { contentKind } from "@/constants/cityContent";
import { colors } from "@/constants/theme";
import { useLoad } from "@/hooks/useLoad";
import { api, mediaUrl } from "@/services/api";
import type { CityContentItem } from "@/types/cityContent";
import type { PageMeta } from "@/types";

type Props={title:string;subtitle:string;path:string;keyName:string};
export function ApiListScreen(props:Props){
  const [page,setPage]=useState(1);
  return <ListPage key={props.path+page} {...props} page={page} setPage={setPage}/>;
}
function ListPage({title,subtitle,path,keyName,page,setPage}:Props&{page:number;setPage:(page:number)=>void}){
  const result=useLoad(()=>api<{[key:string]:CityContentItem[]|PageMeta}>(path+(path.includes("?")?"&":"?")+"page="+page),[]);
  const items=result.data?.[keyName];
  const pagination=result.data?.pagination as PageMeta|undefined;
  const kind=contentKind(path);
  return <Screen scroll={false}>
    <PageHeading title={title} subtitle={subtitle}/>
    {result.loading?<State loading message={`Loading ${title.toLowerCase()}…`}/>:result.error?<State message={result.error} action={result.reload}/>:<FlatList
      data={Array.isArray(items)?items:[]} keyExtractor={item=>String(item.id)}
      refreshControl={<RefreshControl refreshing={result.refreshing} onRefresh={result.reload}/>}
      contentContainerStyle={{gap:16,paddingBottom:20}}
      ListEmptyComponent={<State message={`No ${title.toLowerCase()} available.`}/>}
      renderItem={({item})=><Pressable accessibilityRole="button" disabled={!kind} accessibilityLabel={`View ${item.title||item.name||title}`} onPress={()=>kind&&router.push({pathname:"/city-info/[kind]/[id]",params:{kind,id:String(item.id)}})}>
        <Card style={{padding:0,overflow:"hidden"}}>
          {!!item.imageUrl&&<Image source={{uri:mediaUrl(item.imageUrl)}} accessibilityLabel={item.title||item.name||title} style={{height:155,width:"100%"}} resizeMode="cover"/>}
          <View style={{padding:18,gap:10}}>
            {!!item.department?.name&&<Text style={{color:colors.primary,fontSize:11,fontWeight:"800",letterSpacing:1}}>{item.department.name.toUpperCase()}</Text>}
            <Text style={styles.heading}>{item.title||item.name||title}</Text>
            {!!(item.content||item.description||item.message||item.address)&&<Text numberOfLines={3} style={styles.muted}>{item.content||item.description||item.message||item.address}</Text>}
            {kind&&<View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}><Text style={{color:colors.primary,fontWeight:"800"}}>View details</Text><Ionicons name="arrow-forward" size={20} color={colors.primary}/></View>}
          </View>
        </Card>
      </Pressable>}
      ListFooterComponent={pagination&&pagination.totalPages>1?<View style={{gap:10,paddingTop:12}}>
        <Text style={[styles.muted,{textAlign:"center"}]}>Page {page} of {pagination.totalPages}</Text>
        <View style={{flexDirection:"row",gap:12}}><View style={{flex:1}}><Button title="Previous" variant="outline" disabled={page<=1} onPress={()=>setPage(page-1)}/></View><View style={{flex:1}}><Button title="Next" variant="outline" disabled={page>=pagination.totalPages} onPress={()=>setPage(page+1)}/></View></View>
      </View>:null}
    />}
  </Screen>;
}
