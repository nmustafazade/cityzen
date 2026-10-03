"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BellRing,
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleParking,
  FilePlus2,
  Map,
  MapPinned,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
const slides = [
  {
    kicker: "Act",
    title: "Report city issues",
    text: "Share a problem with the right municipal team, add its location and follow every update.",
    href: "/reports/new",
    cta: "Report an issue",
    icon: FilePlus2,
  },
  {
    kicker: "Access",
    title: "Municipal services, made simple",
    text: "Request city services online, manage appointments and track your request from one place.",
    href: "/services",
    cta: "Browse services",
    icon: Building2,
  },
  {
    kicker: "Explore",
    title: "Understand your city",
    text: "See parking, facilities, road conditions and public issues through one connected city map.",
    href: "/city-map",
    cta: "Open city map",
    icon: Map,
  },
  {
    kicker: "Connect",
    title: "Stay informed",
    text: "Follow official announcements, events, environmental conditions and critical city alerts.",
    href: "/announcements",
    cta: "See city updates",
    icon: BellRing,
  },
];
const actions = [
  {
    label: "Report an Issue",
    href: "/reports/new",
    icon: FilePlus2,
    tone: "bg-teal-400 text-slate-950",
  },
  {
    label: "Request a Service",
    href: "/services",
    icon: Building2,
    tone: "bg-white text-slate-900",
  },
  {
    label: "Find Parking",
    href: "/parking",
    icon: CircleParking,
    tone: "bg-white text-slate-900",
  },
  {
    label: "Explore Facilities",
    href: "/facilities",
    icon: MapPinned,
    tone: "bg-white text-slate-900",
  },
  {
    label: "Check City Alerts",
    href: "/alerts",
    icon: BellRing,
    tone: "bg-amber-300 text-slate-950",
  },
];
export default function Home() {
  const { isAuthenticated } = useAuth(),
    [slide, setSlide] = useState(0),
    current = slides[slide],
    Icon = current.icon;
  const move = (n: number) =>
    setSlide((v) => (v + n + slides.length) % slides.length);
  return (
    <main className="overflow-hidden bg-[#f3f6f5]">
      <section className="relative min-h-[760px] overflow-hidden bg-[#071d2b] text-white">
        <Image
          src="/images/cityzen-hero.png"
          alt="A connected waterfront city with public spaces, cycling and sustainable transport"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-70"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#071d2b_0%,rgba(7,29,43,.94)_35%,rgba(7,29,43,.28)_75%,rgba(7,29,43,.08)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,#071d2b_0%,transparent_35%)]" />
        <div className="relative mx-auto flex min-h-[760px] max-w-[1440px] items-center px-6 py-24 lg:px-12">
          <div className="max-w-3xl">
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.24em] text-teal-300">
              <Sparkles size={16} />
              One city. One connected experience.
            </p>
            <h1 className="mt-7 text-6xl font-extrabold leading-[.95] tracking-[-.065em] sm:text-7xl lg:text-[96px]">
              Your city.
              <br />
              <span className="text-teal-300">Connected.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
              Report issues, request municipal services, explore city
              infrastructure and stay informed—all through one trusted civic
              platform.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href={isAuthenticated ? "/dashboard" : "/register"}
                className="action-primary !bg-teal-400 !px-6 !py-3.5 !text-slate-950"
              >
                {isAuthenticated ? "Open my Cityzen" : "Explore Cityzen"}
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/reports/new"
                className="action-secondary !border-white/25 !bg-white/10 !px-6 !py-3.5 !text-white backdrop-blur hover:!bg-white/20"
              >
                <FilePlus2 size={18} />
                Report an Issue
              </Link>
            </div>
            <div className="mt-14 grid max-w-xl grid-cols-3 gap-6 border-t border-white/15 pt-7">
              <div>
                <strong className="block text-2xl font-extrabold">24/7</strong>
                <span className="text-xs text-slate-400">
                  Digital city access
                </span>
              </div>
              <div>
                <strong className="block text-2xl font-extrabold">
                  One place
                </strong>
                <span className="text-xs text-slate-400">
                  Services and updates
                </span>
              </div>
              <div>
                <strong className="block text-2xl font-extrabold">
                  Transparent
                </strong>
                <span className="text-xs text-slate-400">
                  Track every request
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="relative mx-auto -mt-16 max-w-[1320px] px-5">
          <div className="grid gap-2 rounded-2xl border border-white/80 bg-white/95 p-2 shadow-[0_30px_80px_rgba(7,29,43,.18)] backdrop-blur md:grid-cols-5">
            {actions.map(({ label, href, icon: ActionIcon, tone }) => (
              <Link
                key={href}
                href={href}
                className={`group flex min-h-20 items-center gap-3 rounded-xl px-4 py-3 font-extrabold transition hover:-translate-y-1 ${tone}`}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-900/8">
                  <ActionIcon size={20} />
                </span>
                <span className="text-sm">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-[1320px] gap-12 px-6 py-28 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
        <div>
          <p className="city-eyebrow">A platform for everyday city life</p>
          <h2 className="city-title">
            Four ways Cityzen puts your city within reach.
          </h2>
          <p className="city-subtitle">
            From a broken streetlight to an appointment with your municipality,
            Cityzen connects each action to the right place.
          </p>
          <div className="mt-8 flex gap-2">
            {slides.map((item, index) => (
              <button
                key={item.title}
                onClick={() => setSlide(index)}
                aria-label={`Show ${item.title}`}
                aria-current={slide === index}
                className={`h-2 rounded-full transition-all ${slide === index ? "w-10 bg-teal-600" : "w-2 bg-slate-300"}`}
              />
            ))}
          </div>
        </div>
        <article className="relative overflow-hidden rounded-[2rem] bg-[#0b2b38] p-8 text-white shadow-[0_30px_80px_rgba(7,29,43,.2)] sm:p-12">
          <div className="absolute -right-20 -top-20 size-72 rounded-full bg-teal-400/15 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="grid size-14 place-items-center rounded-2xl bg-teal-400 text-slate-950">
                <Icon size={26} />
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => move(-1)}
                  aria-label="Previous feature"
                  className="grid size-10 place-items-center rounded-xl border border-white/15 hover:bg-white/10"
                >
                  <ChevronLeft size={19} />
                </button>
                <button
                  onClick={() => move(1)}
                  aria-label="Next feature"
                  className="grid size-10 place-items-center rounded-xl border border-white/15 hover:bg-white/10"
                >
                  <ChevronRight size={19} />
                </button>
              </div>
            </div>
            <p className="mt-10 text-xs font-extrabold uppercase tracking-[.2em] text-teal-300">
              {current.kicker}
            </p>
            <h3 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {current.title}
            </h3>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
              {current.text}
            </p>
            <Link
              href={current.href}
              className="mt-8 inline-flex items-center gap-2 font-extrabold text-teal-300"
            >
              {current.cta}
              <ArrowRight size={17} />
            </Link>
          </div>
        </article>
      </section>
      <section className="bg-[#e7efec]">
        <div className="mx-auto max-w-[1320px] px-6 py-28">
          <div className="max-w-2xl">
            <p className="city-eyebrow">Built around people</p>
            <h2 className="city-title">
              A clearer path from question to action.
            </h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <article className="rounded-[2rem] bg-white p-8 shadow-sm md:col-span-2 sm:p-10">
              <div className="grid gap-10 md:grid-cols-2 md:items-center">
                <div>
                  <span className="grid size-12 place-items-center rounded-2xl bg-teal-100 text-teal-800">
                    <Users />
                  </span>
                  <h3 className="mt-6 text-2xl font-extrabold">
                    Community issues, visible and supported
                  </h3>
                  <p className="mt-3 leading-7 text-slate-600">
                    Discover public reports, avoid duplicates and support the
                    issues that matter in your area.
                  </p>
                  <Link
                    href="/community"
                    className="mt-6 inline-flex items-center gap-2 font-bold text-teal-700"
                  >
                    Explore community issues
                    <ArrowRight size={16} />
                  </Link>
                </div>
                <div className="rounded-2xl bg-[#edf7f4] p-5">
                  <div className="space-y-3">
                    {[
                      "Streetlight repair",
                      "Public park maintenance",
                      "Pedestrian crossing",
                    ].map((title, index) => (
                      <div
                        key={title}
                        className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm"
                      >
                        <span className="grid size-9 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-extrabold">{title}</p>
                          <p className="text-xs text-slate-500">
                            Tracked transparently
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
            <article className="rounded-[2rem] bg-amber-300 p-8 text-slate-950 sm:p-10">
              <ShieldCheck size={38} />
              <h3 className="mt-12 text-2xl font-extrabold">
                Trusted city information
              </h3>
              <p className="mt-3 leading-7 text-slate-800">
                Official announcements, safety alerts and service updates from
                municipality teams.
              </p>
              <Link
                href="/alerts"
                className="mt-8 inline-flex items-center gap-2 font-extrabold"
              >
                View city alerts
                <ArrowRight size={16} />
              </Link>
            </article>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1320px] px-6 py-28">
        <div className="overflow-hidden rounded-[2rem] bg-[#071d2b] text-white">
          <div className="grid lg:grid-cols-2">
            <div className="p-9 sm:p-14">
              <p className="text-xs font-extrabold uppercase tracking-[.2em] text-teal-300">
                City map
              </p>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight">
                See the city as one connected system.
              </h2>
              <p className="mt-5 leading-8 text-slate-300">
                Explore road conditions, available parking, public facilities,
                waste points, environment stations and community reports through
                organized map layers.
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {["Traffic", "Parking", "Facilities", "Public Issues"].map(
                  (x) => (
                    <span
                      key={x}
                      className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200"
                    >
                      {x}
                    </span>
                  ),
                )}
              </div>
              <Link
                href="/city-map"
                className="mt-9 inline-flex items-center gap-2 rounded-xl bg-teal-400 px-5 py-3 font-extrabold text-slate-950"
              >
                Open City Map
                <Map size={18} />
              </Link>
            </div>
            <div className="relative min-h-96 overflow-hidden bg-[#d9e9e4]">
              <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(#0f766e22_1px,transparent_1px),linear-gradient(90deg,#0f766e22_1px,transparent_1px)] [background-size:44px_44px]" />
              <div className="absolute left-[20%] top-[24%] size-5 rounded-full border-4 border-white bg-rose-500 shadow-xl" />
              <div className="absolute left-[55%] top-[38%] size-5 rounded-full border-4 border-white bg-teal-600 shadow-xl" />
              <div className="absolute left-[70%] top-[68%] size-5 rounded-full border-4 border-white bg-amber-500 shadow-xl" />
              <div className="absolute left-[32%] top-[67%] rounded-2xl bg-white p-4 text-slate-950 shadow-2xl">
                <p className="text-xs font-bold text-teal-700">CITY SNAPSHOT</p>
                <p className="mt-1 text-lg font-extrabold">Everything nearby</p>
                <p className="text-xs text-slate-500">
                  One map · seven city layers
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-teal-700 text-white">
        <div className="mx-auto flex max-w-[1320px] flex-col items-start justify-between gap-8 px-6 py-16 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              Make your next city task simpler.
            </h2>
            <p className="mt-2 text-teal-100">
              Create your Cityzen account and connect with municipal services.
            </p>
          </div>
          <Link
            href={isAuthenticated ? "/dashboard" : "/register"}
            className="rounded-xl bg-white px-6 py-3.5 font-extrabold text-teal-800"
          >
            {isAuthenticated ? "Go to dashboard" : "Get started free"}
          </Link>
        </div>
      </section>
    </main>
  );
}
