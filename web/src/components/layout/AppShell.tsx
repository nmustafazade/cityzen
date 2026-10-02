"use client";
/* Mobile drawer state intentionally follows route changes. */
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Bell, Building2, CalendarDays, ChevronDown, CircleParking, ClipboardList, CloudSun, FileText, FolderCog, Gauge, Home, LayoutDashboard, LogOut, Map, MapPinned, Menu, Megaphone, Recycle, Search, Settings2, ShieldAlert, Sparkles, Trees, Users, Wrench, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { getNotifications, markNotificationRead } from "@/lib/notifications";
import { formatDateTime, roleLabels } from "@/lib/format";
import type { Notification } from "@/types/notification";
import { Brand } from "./Brand";
import { EmergencyBanner } from "./EmergencyBanner";

type NavItem={label:string;href:string;icon:typeof Home};
const citizenGroups:{label:string;roles?:string[];items:NavItem[]}[]=[
  {label:"My Cityzen",items:[{label:"Dashboard",href:"/dashboard",icon:LayoutDashboard},{label:"My Reports",href:"/reports",icon:FileText},{label:"Service Requests",href:"/my-services",icon:ClipboardList},{label:"My Parking",href:"/my-parking",icon:CircleParking},{label:"Notifications",href:"/notifications",icon:Bell}]},
  {label:"Explore",items:[{label:"City Map",href:"/city-map",icon:Map},{label:"Community",href:"/community",icon:Users},{label:"City Services",href:"/services",icon:Building2},{label:"Parking",href:"/parking",icon:CircleParking},{label:"Facilities",href:"/facilities",icon:MapPinned}]},
  {label:"City Information",items:[{label:"Road Conditions",href:"/roads",icon:AlertTriangle},{label:"Waste & Recycling",href:"/waste",icon:Recycle},{label:"Environment",href:"/environment",icon:CloudSun},{label:"Announcements",href:"/announcements",icon:Megaphone},{label:"Events",href:"/events",icon:CalendarDays},{label:"City Alerts",href:"/alerts",icon:ShieldAlert}]},
];
const staffGroups:{label:string;roles?:string[];items:NavItem[]}[]=[
  {label:"Overview",items:[{label:"Dashboard",href:"/dashboard",icon:LayoutDashboard}]},
  {label:"Insights",roles:["DEPARTMENT_HEAD","ADMIN"],items:[{label:"Analytics",href:"/municipality/analytics",icon:Gauge}]},
  {label:"Work Management",items:[{label:"Reports",href:"/employee/reports",icon:FileText},{label:"Service Requests",href:"/municipality/service-requests",icon:ClipboardList}]},
  {label:"City Content",roles:["DEPARTMENT_HEAD","ADMIN"],items:[{label:"Services",href:"/municipality/services",icon:Building2},{label:"Announcements",href:"/municipality/announcements",icon:Megaphone},{label:"Events",href:"/municipality/events",icon:CalendarDays}]},
  {label:"Infrastructure",roles:["DEPARTMENT_HEAD","ADMIN"],items:[{label:"Operations Hub",href:"/municipality/infrastructure",icon:Wrench},{label:"Road Conditions",href:"/municipality/infrastructure/roads",icon:AlertTriangle},{label:"Parking",href:"/municipality/infrastructure/parking",icon:CircleParking},{label:"Facilities",href:"/municipality/infrastructure/facilities",icon:MapPinned}]},
  {label:"City Operations",roles:["DEPARTMENT_HEAD","ADMIN"],items:[{label:"Waste",href:"/municipality/waste/zones",icon:Recycle},{label:"Environment",href:"/municipality/environment",icon:CloudSun},{label:"Emergency Alerts",href:"/municipality/emergency-alerts",icon:ShieldAlert}]},
  {label:"Administration",roles:["ADMIN"],items:[{label:"Admin Overview",href:"/admin",icon:Sparkles},{label:"Users",href:"/admin/users",icon:Users},{label:"Departments",href:"/admin/departments",icon:Building2},{label:"Categories",href:"/admin/categories",icon:FolderCog},{label:"System Management",href:"/admin/facility-categories",icon:Settings2}]},
];
const publicLinks=[{label:"Explore",href:"/city-map"},{label:"Services",href:"/services"},{label:"Community",href:"/community"}];
const moreLinks=[...citizenGroups[2].items,{label:"Parking",href:"/parking",icon:CircleParking},{label:"Facilities",href:"/facilities",icon:Trees}];
function navigationGroups(citizen: boolean, role = "") {
  return (citizen ? citizenGroups : staffGroups)
    .filter(group => !group.roles || group.roles.includes(role))
    .map(group => ({ ...group, items: group.items.map(item => role === "ADMIN" && item.href === "/municipality/analytics" ? { ...item, href: "/admin/analytics" } : item) }));
}
function active(pathname: string, href: string, links: {href:string}[]) {
  const best = links.filter(link => pathname === link.href || pathname.startsWith(`${link.href}/`)).sort((a,b) => b.href.length-a.href.length)[0];
  return best?.href === href;
}

function useMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const search = useSearchParams().toString();
  useEffect(() => setOpen(false), [pathname, search]);
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); }
    function escape(event: KeyboardEvent) { if (event.key === "Escape") { setOpen(false); ref.current?.querySelector("button")?.focus(); } }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  return {open, setOpen, ref};
}

function NotificationMenu() {
  const {unreadCount,refreshUnreadCount}=useNotifications(), {user}=useAuth(), {open,setOpen,ref}=useMenu();
  const [items,setItems]=useState<Notification[]>([]);
  useEffect(()=>{if(open)void getNotifications({page:1,limit:5}).then(r=>setItems(r.notifications)).catch(()=>undefined)},[open]);
  const destination=(item:Notification)=>item.report?user?.role==="CITIZEN"?`/reports/${item.report.id}`:`/employee/reports/${item.report.id}`:item.serviceRequest?user?.role==="CITIZEN"?`/my-services/${item.serviceRequest.id}`:`/municipality/service-requests/${item.serviceRequest.id}`:"/notifications";
  return <div ref={ref} className="relative"><button type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-label={unreadCount?`Notifications, ${unreadCount} unread`:"Notifications"} className="shell-icon-button"><Bell size={19}/>{unreadCount>0&&<span className="notification-count">{unreadCount>9?"9+":unreadCount}</span>}</button>{open&&<div className="notification-popover"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><p className="font-bold text-slate-950">Notifications</p><Link onClick={()=>setOpen(false)} href="/notifications" className="text-xs font-bold text-teal-700">View all</Link></div><div className="max-h-96 overflow-auto">{items.length?items.map(item=><Link key={item.id} href={destination(item)} onClick={()=>{setOpen(false);if(!item.isRead)void markNotificationRead(item.id).then(()=>refreshUnreadCount()).catch(()=>undefined)}} className={`block border-b border-slate-100 px-5 py-4 hover:bg-slate-50 ${item.isRead?"":"bg-teal-50/60"}`}><p className="text-sm font-bold text-slate-900">{item.title}</p><p className="mt-1 text-xs text-slate-600">{item.message}</p><p className="mt-2 text-[11px] text-slate-500">{formatDateTime(item.createdAt)}</p></Link>):<p className="px-5 py-10 text-center text-sm text-slate-500">No notifications yet.</p>}</div></div>}</div>;
}

function UserMenu() {
  const {user,logout}=useAuth(), router=useRouter(), {open,setOpen,ref}=useMenu();
  if(!user)return null;
  return <div ref={ref} className="relative"><button type="button" onClick={()=>setOpen(v=>!v)} aria-label="Account menu" aria-expanded={open} className="flex items-center gap-3 rounded-xl p-1.5 text-left hover:bg-slate-100"><span className="grid size-9 place-items-center rounded-xl bg-slate-900 text-xs font-extrabold text-white">{user.firstName[0]}{user.lastName[0]}</span><span className="hidden sm:block"><span className="block max-w-32 truncate text-sm font-bold text-slate-900">{user.firstName} {user.lastName}</span><span className="block text-[11px] font-semibold text-slate-600">{roleLabels[user.role]}</span></span><ChevronDown size={15} className="text-slate-500"/></button>{open&&<div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"><Link href="/dashboard" onClick={()=>setOpen(false)} className="menu-link"><LayoutDashboard size={16}/>Dashboard</Link><Link href="/notifications" onClick={()=>setOpen(false)} className="menu-link"><Bell size={16}/>Notifications</Link><button type="button" onClick={()=>{logout();setOpen(false);router.push("/")}} className="menu-link w-full text-rose-700"><LogOut size={16}/>Log out</button></div>}</div>;
}

function PublicHeader({openMenu}:{openMenu:()=>void}) {
  const pathname=usePathname(), {open,setOpen,ref}=useMenu(), links=[...publicLinks,...moreLinks];
  return <header className="public-header"><div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-2 px-4 lg:px-8"><div className="flex items-center gap-10"><Brand/><nav aria-label="Public navigation" className="hidden items-center gap-1 lg:flex">{publicLinks.map(x=><Link key={x.href} href={x.href} aria-current={active(pathname,x.href,links)?"page":undefined} className="public-nav-link">{x.label}</Link>)}<div ref={ref} className="relative"><button type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open} className={`public-nav-link flex items-center gap-1 ${moreLinks.some(x=>active(pathname,x.href,links))?"public-nav-active":""}`}>More<ChevronDown size={14}/></button>{open&&<div className="absolute left-0 top-11 grid w-[440px] grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-slate-950 p-3 shadow-2xl">{moreLinks.map(({label,href,icon:Icon})=><Link onClick={()=>setOpen(false)} aria-current={active(pathname,href,links)?"page":undefined} key={href} href={href} className="public-nav-link flex items-center gap-3"><Icon size={17}/>{label}</Link>)}</div>}</div></nav></div><div className="flex items-center gap-1"><Link href="/login" className="rounded-xl px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/10">Log in</Link><Link href="/register" className="rounded-xl bg-teal-400 px-3 py-2.5 text-sm font-extrabold text-slate-950 hover:bg-teal-300">Get started</Link><span className="lg:hidden"><button type="button" onClick={openMenu} className="shell-icon-button-dark" aria-label="Open navigation"><Menu size={20}/></button></span></div></div></header>;
}

function SideNavigation({citizen=false,guest=false,close}:{citizen?:boolean;guest?:boolean;close?:()=>void}) {
  const {user}=useAuth(), pathname=usePathname();
  const groups=guest?[{label:"Explore Cityzen",items:[{label:"Home",href:"/",icon:Home},...publicLinks.map(x=>({...x,icon:Map})),...moreLinks]},{label:"Account",items:[{label:"Log in",href:"/login",icon:Users},{label:"Create account",href:"/register",icon:Users}]}]:navigationGroups(citizen,user?.role);
  const links=groups.flatMap(group=>group.items);
  return <aside className="app-sidebar"><div className="px-5 pb-6 pt-5"><Brand/></div><div className="sidebar-scroll">{groups.map(group=><section key={group.label} className="mb-6"><p className="sidebar-label">{group.label}</p><nav aria-label={group.label}>{group.items.map(({label,href,icon:Icon})=><Link onClick={close} key={href} href={href} aria-current={active(pathname,href,links)?"page":undefined} className={`sidebar-link ${active(pathname,href,links)?"sidebar-link-active":""}`}><Icon size={18}/><span>{label}</span></Link>)}</nav></section>)}</div></aside>;
}

function WorkspaceTopbar({openMenu,citizen}:{openMenu:()=>void;citizen:boolean}) {
  const pathname=usePathname(), {user}=useAuth(), {open,setOpen,ref}=useMenu(), [search,setSearch]=useState("");
  const links=navigationGroups(citizen,user?.role).flatMap(g=>g.items);
  const current=links.find(x=>active(pathname,x.href,links));
  return <header className="workspace-topbar"><span className="lg:hidden"><button type="button" onClick={openMenu} className="shell-icon-button" aria-label="Open workspace navigation"><Menu size={20}/></button></span><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-bold uppercase tracking-[.16em] text-teal-700">{citizen?"My Cityzen":"Cityzen workspace"}</p><p className="truncate font-extrabold text-slate-950">{current?.label??"Cityzen"}</p></div><div className="ml-auto flex items-center gap-2"><div ref={ref} className="relative lg:hidden"><button type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open} className="shell-icon-button" aria-label="Search workspace"><Search size={19}/></button>{open&&<div className="fixed inset-x-4 top-20 z-50 max-h-[65vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl"><label className="text-sm font-bold text-slate-900">Find a page<input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search workspace pages" className="mt-2 w-full rounded-lg border p-3"/></label><nav aria-label="Workspace search results" className="mt-3">{links.filter(x=>x.label.toLowerCase().includes(search.toLowerCase())).map(x=><Link key={x.href} href={x.href} onClick={()=>setOpen(false)} className="menu-link">{x.label}</Link>)}{!links.some(x=>x.label.toLowerCase().includes(search.toLowerCase()))&&<p className="p-3 text-sm text-slate-600">No matching pages.</p>}</nav></div>}</div><NotificationMenu/><UserMenu/></div></header>;
}

export function AppShell({children}:{children:ReactNode}) {
  const {user,isAuthenticated,isLoading}=useAuth(), pathname=usePathname(), [drawer,setDrawer]=useState(false);
  const search=useSearchParams().toString();
  useEffect(()=>setDrawer(false),[pathname,search,isAuthenticated]);
  useEffect(()=>{if(!drawer)return;const old=document.body.style.overflow;document.body.style.overflow="hidden";const escape=(e:KeyboardEvent)=>{if(e.key==="Escape")setDrawer(false)};document.addEventListener("keydown",escape);return()=>{document.body.style.overflow=old;document.removeEventListener("keydown",escape)}},[drawer]);
  const signedIn=!!(isAuthenticated&&user),citizen=user?.role==="CITIZEN";
  return <div className="min-h-screen">{signedIn?<><div className="hidden lg:block"><SideNavigation citizen={citizen}/></div><div className="lg:pl-[272px]"><WorkspaceTopbar citizen={citizen} openMenu={()=>setDrawer(true)}/><EmergencyBanner/><div className="app-content">{children}</div></div></>:<><PublicHeader openMenu={()=>setDrawer(true)}/><EmergencyBanner/><div className="app-content">{children}</div></>}{drawer&&<div className="fixed inset-0 z-[100] lg:hidden"><button aria-label="Close navigation" className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={()=>setDrawer(false)}/><div className="relative h-full w-[min(88vw,320px)]"><SideNavigation citizen={citizen} guest={!signedIn} close={()=>setDrawer(false)}/><button type="button" onClick={()=>setDrawer(false)} aria-label="Close navigation" className="absolute right-4 top-4 z-[90] grid size-9 place-items-center rounded-xl bg-white/10 text-white"><X size={20}/></button></div></div>}{isLoading&&<span className="sr-only">Loading account</span>}</div>;
}
