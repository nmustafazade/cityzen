import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { Button, Card, Field, Screen, styles } from "./ui";
import { colors } from "@/constants/theme";
import { useAuth } from "@/store/AuthContext";

export function AuthForm({mode}:{mode:"login"|"register"}) {
  const creating=mode==="register";
  const {login,register}=useAuth();
  const [firstName,setFirst]=useState(""),[lastName,setLast]=useState("");
  const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[confirm,setConfirm]=useState("");
  const [visible,setVisible]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const submitting=useRef(false);
  async function submit(){
    if(submitting.current)return;
    setError("");
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))return setError("Enter a valid email address.");
    if(!password)return setError("Enter your password.");
    if(creating){
      if(!firstName.trim()||!lastName.trim())return setError("Enter your first and last name.");
      if(!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password))return setError("Use at least 8 characters with an uppercase letter, a lowercase letter and a number.");
      if(password!==confirm)return setError("Your passwords do not match.");
    }
    submitting.current=true;setBusy(true);
    try {
      const user=creating?await register({firstName:firstName.trim(),lastName:lastName.trim(),email:email.trim().toLowerCase(),password}):await login(email.trim().toLowerCase(),password);
      setPassword("");setConfirm("");
      router.replace(user.role==="CITIZEN"?"/(tabs)":"/municipality-account");
    } catch(e){setError(e instanceof Error?e.message:"Unable to complete your request. Please try again.");}
    finally{submitting.current=false;setBusy(false);}
  }
  return <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==="ios"?"padding":"height"}>
    <Screen>
      <View style={{flexDirection:"row",alignItems:"center",gap:10,paddingVertical:8}}>
        <View style={{padding:10,borderRadius:13,backgroundColor:colors.navy}}><Ionicons name="business-outline" size={24} color={colors.accent}/></View>
        <Text style={{fontSize:28,fontWeight:"900",letterSpacing:-1,color:colors.ink}}>Cityzen<Text style={{color:colors.primary}}> .</Text></Text>
      </View>
      <View style={{backgroundColor:colors.navy,borderRadius:24,padding:24,gap:12}}>
        <Text style={{color:colors.accent,letterSpacing:2,fontSize:10,fontWeight:"800"}}>YOUR CITY. CONNECTED.</Text>
        <Text style={{color:"white",fontSize:30,lineHeight:36,fontWeight:"800"}}>{creating?"A better city starts with you.":"Your neighborhood,\ncloser than ever."}</Text>
        <Text style={{color:"#BDD1D5",lineHeight:22,fontSize:14}}>Report issues, request services and keep up with what’s happening around you.</Text>
        <View style={{flexDirection:"row",alignItems:"center",gap:8}}><Ionicons name="leaf-outline" size={17} color={colors.accent}/><Text style={{color:"#BDD1D5",fontSize:12}}>Small actions. A stronger community.</Text></View>
      </View>
      <Card style={{padding:22,gap:18}}>
        <View style={{gap:6}}><Text style={styles.heading}>{creating?"Create your account":"Welcome back"}</Text><Text style={styles.muted}>{creating?"Join your community as a citizen.":"Sign in to your Cityzen account."}</Text></View>
        {creating&&<>
          <Field label="First name" value={firstName} onChangeText={setFirst} autoComplete="given-name" editable={!busy}/>
          <Field label="Last name" value={lastName} onChangeText={setLast} autoComplete="family-name" editable={!busy}/>
        </>}
        <Field label="Email address" placeholder="you@example.com" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" value={email} onChangeText={setEmail} editable={!busy}/>
        <View style={{gap:8}}>
          <Field label="Password" secureTextEntry={!visible} autoCapitalize="none" autoCorrect={false} autoComplete={creating?"new-password":"current-password"} value={password} onChangeText={setPassword} editable={!busy}/>
          <Pressable accessibilityRole="button" accessibilityLabel={visible?"Hide password":"Show password"} onPress={()=>setVisible(!visible)} style={{alignSelf:"flex-end",minHeight:44,flexDirection:"row",alignItems:"center",gap:6}}><Ionicons name={visible?"eye-off-outline":"eye-outline"} size={18} color={colors.primary}/><Text style={{color:colors.primary,fontWeight:"700"}}>{visible?"Hide":"Show"} password</Text></Pressable>
        </View>
        {creating&&<>
          <Text style={styles.muted}>At least 8 characters, including uppercase, lowercase and a number.</Text>
          <Field label="Confirm password" secureTextEntry={!visible} autoCapitalize="none" autoCorrect={false} autoComplete="new-password" value={confirm} onChangeText={setConfirm} editable={!busy}/>
        </>}
        {!!error&&<View style={{padding:12,borderRadius:12,backgroundColor:"#FFF1F2"}}><Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{color:colors.danger,lineHeight:21}}>{error}</Text></View>}
        <Button title={busy?(creating?"Creating account…":"Signing in…"):(creating?"Create account":"Sign in")} disabled={busy} onPress={()=>void submit()}/>
        <View style={{alignItems:"center",gap:4}}><Text style={styles.muted}>{creating?"Already part of Cityzen?":"New to your Cityzen community?"}</Text>
          <Pressable accessibilityRole="button" disabled={busy} onPress={()=>router.replace(creating?"/(auth)/login":"/(auth)/register")} style={{minHeight:44,justifyContent:"center"}}><Text style={{color:colors.primary,fontWeight:"800"}}>{creating?"Sign in":"Create an account"} →</Text></Pressable>
        </View>
      </Card>
      <Text style={[styles.muted,{textAlign:"center",fontSize:12,paddingBottom:12}]}>Smart City Citizen & Municipality Platform</Text>
    </Screen>
  </KeyboardAvoidingView>;
}
