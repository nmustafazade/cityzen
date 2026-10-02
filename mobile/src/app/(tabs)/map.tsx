import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRef, useState } from "react";
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, UrlTile } from "react-native-maps";
import { PageHeading, Screen, styles } from "@/components/ui";
import { colors } from "@/constants/theme";

const initialRegion={latitude:40.4093,longitude:49.8671,latitudeDelta:.18,longitudeDelta:.18};
export default function CityMap() {
  const map=useRef<MapView>(null);
  const [position,setPosition]=useState<{latitude:number;longitude:number}|null>(null);
  const [message,setMessage]=useState("");
  const [locating,setLocating]=useState(false);
  const busy=useRef(false);
  async function locate() {
    if(busy.current)return;
    busy.current=true; setLocating(true); setMessage("");
    let timeout: ReturnType<typeof setTimeout>|undefined;
    try {
      const permission=await Location.requestForegroundPermissionsAsync();
      if(!permission.granted){setMessage("Location permission was denied. You can still browse the map manually.");return;}
      const current=await Promise.race([
        Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced}),
        new Promise<never>((_,reject)=>{timeout=setTimeout(()=>reject(new Error("timeout")),12000);}),
      ]);
      const next={latitude:current.coords.latitude,longitude:current.coords.longitude};
      setPosition(next); map.current?.animateToRegion({...next,latitudeDelta:.025,longitudeDelta:.025},600);
    } catch {setMessage("We couldn't get your location. Check location services or explore the map manually.");}
    finally {if(timeout)clearTimeout(timeout);busy.current=false;setLocating(false);}
  }
  return <Screen scroll={false}>
    <PageHeading title="Explore your city" subtitle="Pan and zoom to explore your surroundings." eyebrow="CITY MAP"/>
    <View style={{flex:1,minHeight:280,borderRadius:24,overflow:"hidden",borderWidth:1,borderColor:colors.border}}>
      <MapView ref={map} style={StyleSheet.absoluteFill} initialRegion={initialRegion} mapType={Platform.OS==="android"?"none":"standard"}>
        <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} tileSize={256}/>
        {position&&<Marker coordinate={position} title="Your current location" pinColor={colors.primary}/>}
      </MapView>
      <Pressable accessibilityRole="button" accessibilityLabel="Use my current location" disabled={locating} onPress={()=>void locate()} style={{position:"absolute",right:16,bottom:48,width:52,height:52,borderRadius:18,backgroundColor:colors.navy,alignItems:"center",justifyContent:"center"}}>
        {locating?<ActivityIndicator color="white"/>:<Ionicons name="locate-outline" size={25} color={colors.accent}/>}
      </Pressable>
      <Pressable accessibilityRole="link" onPress={()=>void Linking.openURL("https://www.openstreetmap.org/copyright")} style={{position:"absolute",bottom:8,left:8,padding:8,backgroundColor:"white",borderRadius:8}}><Text style={{fontSize:11,color:colors.ink}}>© OpenStreetMap contributors</Text></Pressable>
    </View>
    {locating&&<Text accessibilityLiveRegion="polite" style={styles.muted}>Getting your location…</Text>}
    {!!message&&<Text accessibilityRole="alert" style={{color:colors.warning}}>{message}</Text>}
    <Text style={styles.muted}>Location is requested only when you tap the button. Map tiles need an internet connection.</Text>
  </Screen>;
}
