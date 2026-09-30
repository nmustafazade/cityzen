import Link from "next/link";
import { Building2 } from "lucide-react";

export function Brand({ compact=false }: { compact?: boolean }) {
  return <Link href="/" className="group flex items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-500">
    <span className="grid size-10 place-items-center rounded-xl bg-teal-400 text-slate-950 shadow-[0_8px_24px_rgba(45,212,191,.22)] transition group-hover:-translate-y-0.5"><Building2 size={21} strokeWidth={2.2}/></span>
    {!compact&&<span><span className="block text-[17px] font-extrabold tracking-[.16em] text-white">CITYZEN</span><span className="block text-[9px] font-bold uppercase tracking-[.2em] text-slate-400">Smart City Platform</span></span>}
  </Link>;
}
