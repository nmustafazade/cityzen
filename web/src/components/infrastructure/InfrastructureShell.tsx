import type { ReactNode } from "react";
import { PageHeader } from "@/components/common/PageHeader";

export function InfrastructureShell({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <main className="city-page">
      <PageHeader
        eyebrow="City infrastructure"
        title={title}
        subtitle={subtitle}
        action={action}
      />
      {children}
    </main>
  );
}
export function StateMessage({ children }: { children: ReactNode }) {
  return (
    <div className="surface-card mt-8 p-8 text-center text-sm text-slate-600">
      {children}
    </div>
  );
}
