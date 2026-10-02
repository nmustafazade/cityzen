import type { Metadata } from "next";
import { Suspense } from "react";
import { Manrope } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cityzen",
  description: "Smart City Citizen & Municipality Platform",
};

const manrope=Manrope({subsets:["latin"],variable:"--font-manrope",display:"swap"});

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Suspense fallback={<p role="status" className="p-8">Loading Cityzen…</p>}>
          <AuthProvider>
            <NotificationProvider>
              <AppShell>{children}</AppShell>
            </NotificationProvider>
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
