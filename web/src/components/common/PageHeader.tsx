import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
export function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-5 flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-500"
    >
      {items.map((item, index) => (
        <span
          key={`${item.label}-${index}`}
          className="flex items-center gap-1.5"
        >
          {index > 0 && <ChevronRight size={13} />}{" "}
          {item.href ? (
            <Link href={item.href} className="hover:text-teal-700">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-700">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  breadcrumbs,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
  breadcrumbs?: { label: string; href?: string }[];
  children?: ReactNode;
}) {
  return (
    <header className="city-page-header">
      {breadcrumbs && (
        <div className="absolute">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      )}
      <div className={breadcrumbs ? "pt-10" : ""}>
        {eyebrow && <p className="city-eyebrow">{eyebrow}</p>}
        <h1 className="city-title">{title}</h1>
        {subtitle && <p className="city-subtitle">{subtitle}</p>}
        {children}
      </div>
      {action && (
        <Link href={action.href} className="action-primary">
          {action.label}
          <span aria-hidden>→</span>
        </Link>
      )}
    </header>
  );
}
