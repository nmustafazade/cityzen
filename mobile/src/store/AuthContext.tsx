import { router } from "expo-router";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { api } from "@/services/api";
import { getToken, removeToken, saveToken } from "@/services/token";
import type { User } from "@/types";

type AuthValue = { user:User|null; loading:boolean; authenticated:boolean; login:(email:string,password:string)=>Promise<User>; register:(data:{firstName:string;lastName:string;email:string;password:string})=>Promise<User>; logout:()=>Promise<void>; refresh:()=>Promise<void> };
const Context = createContext<AuthValue|null>(null);
export function AuthProvider({children}:PropsWithChildren) {
  const [user,setUser]=useState<User|null>(null),[loading,setLoading]=useState(true);
  const refresh=useCallback(async()=>{const token=await getToken();if(!token){setUser(null);return;}const result=await api<{user:User}>("/api/auth/me",{token});setUser(result.user)},[]);
  useEffect(()=>{
    // Restore the persisted native session once when the provider mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh().catch(()=>removeToken()).finally(()=>setLoading(false));
  },[refresh]);
  const apply=useCallback(async(result:{user:User;token:string})=>{await saveToken(result.token);setUser(result.user);return result.user},[]);
  const value=useMemo<AuthValue>(()=>({user,loading,authenticated:!!user,login:async(email,password)=>apply(await api("/api/auth/login",{method:"POST",body:{email,password},token:null})),register:async(data)=>apply(await api("/api/auth/register",{method:"POST",body:data,token:null})),logout:async()=>{await removeToken();setUser(null);router.replace("/(auth)/login")},refresh}),[apply,loading,refresh,user]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAuth(){const value=useContext(Context);if(!value)throw new Error("useAuth requires AuthProvider");return value;}
