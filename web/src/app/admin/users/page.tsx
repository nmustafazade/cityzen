"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { AdminRoute } from "@/components/auth/ProtectedRoute";
import { ReportError, ReportLoading } from "@/components/reports/ReportStates";
import { useAuth } from "@/context/AuthContext";
import { getAdminDepartments, getAdminUsers } from "@/lib/admin";
import { ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { AdminPagination, AdminUser } from "@/types/admin";
import type { Department } from "@/types/department";
import type { UserRole } from "@/types/user";

const defaultPagination: AdminPagination = { page: 1, limit: 10, total: 0, totalPages: 0 };
const roleLabels: Record<UserRole, string> = { CITIZEN: "Citizen", EMPLOYEE: "Employee", DEPARTMENT_HEAD: "Department Head", ADMIN: "Admin" };

function AdminUsersContent() {
  const router = useRouter(); const { logout } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]); const [departments, setDepartments] = useState<Department[]>([]);
  const [pagination, setPagination] = useState(defaultPagination); const [role, setRole] = useState<UserRole | "">("");
  const [status, setStatus] = useState(""); const [departmentId, setDepartmentId] = useState("");
  const [searchInput, setSearchInput] = useState(""); const [search, setSearch] = useState(""); const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true); const [error, setError] = useState("");

  const handleError = useCallback((caught: unknown) => {
    if (caught instanceof ApiError && caught.status === 401) { logout(); router.replace("/login"); return; }
    setError(caught instanceof ApiError ? caught.message : "Unable to load users.");
  }, [logout, router]);
  const params = useCallback(() => ({ role: role || undefined, departmentId: departmentId ? Number(departmentId) : undefined, isActive: status === "active" ? true : status === "inactive" ? false : undefined, search: search || undefined, page, limit: 10 }), [departmentId, page, role, search, status]);
  const load = useCallback(async () => { await Promise.resolve(); setIsLoading(true); setError(""); try { const value = await getAdminUsers(params()); setUsers(value.users); setPagination(value.pagination); } catch (caught) { handleError(caught); } finally { setIsLoading(false); } }, [handleError, params]);

  useEffect(() => { let active = true; void getAdminDepartments().then((value) => { if (active) setDepartments(value.departments); }).catch((caught: unknown) => { if (active) handleError(caught); }); return () => { active = false; }; }, [handleError]);
  useEffect(() => { let active = true; void getAdminUsers(params()).then((value) => { if (!active) return; setUsers(value.users); setPagination(value.pagination); }).catch((caught: unknown) => { if (active) handleError(caught); }).finally(() => { if (active) setIsLoading(false); }); return () => { active = false; }; }, [handleError, params]);
  function filter(update: () => void) { setIsLoading(true); setError(""); setPage(1); update(); }
  function submitSearch(event: FormEvent) { event.preventDefault(); filter(() => setSearch(searchInput.trim())); }

  return <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 sm:py-14"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Administration</p><h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">Users</h1><p className="mt-3 text-slate-600">Manage citizen and municipality accounts.</p></div>
    <section className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
      <Select label="Role" value={role} onChange={(value) => filter(() => setRole(value as UserRole | ""))}><option value="">All Roles</option><option value="CITIZEN">Citizen</option><option value="EMPLOYEE">Employee</option><option value="DEPARTMENT_HEAD">Department Head</option><option value="ADMIN">Admin</option></Select>
      <Select label="Status" value={status} onChange={(value) => filter(() => setStatus(value))}><option value="">All Statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></Select>
      <Select label="Department" value={departmentId} onChange={(value) => filter(() => setDepartmentId(value))}><option value="">All Departments</option>{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
      <form onSubmit={submitSearch}><label htmlFor="user-search" className="mb-1.5 block text-sm font-semibold text-slate-800">Search</label><div className="flex"><input id="user-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Name or email" className="min-w-0 flex-1 rounded-l-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"/><button className="rounded-r-lg bg-emerald-600 px-3 text-sm font-semibold text-white">Search</button></div></form>
    </section>
    <section className="mt-6">{isLoading ? <ReportLoading message="Loading users..." /> : error ? <ReportError message={error} onRetry={() => void load()} /> : users.length === 0 ? <Empty /> : <><UserTable users={users} /><UserCards users={users} /><Pagination pagination={pagination} previous={() => { setIsLoading(true); setPage((p) => Math.max(1, p - 1)); }} next={() => { setIsLoading(true); setPage((p) => p + 1); }} /></>}</section>
  </main>;
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) { const id = `users-${label.toLowerCase()}`; return <div><label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-800">{label}</label><select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100">{children}</select></div>; }
function UserTable({ users }: { users: AdminUser[] }) { return <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500"><tr>{["Name", "Email", "Role", "Department", "Status", "Created", "Action"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{users.map((user) => <tr key={user.id}><td className="px-4 py-4 font-semibold text-slate-950">{user.firstName} {user.lastName}</td><td className="px-4 py-4 text-slate-600">{user.email}</td><td className="px-4 py-4">{roleLabels[user.role]}</td><td className="px-4 py-4">{user.department?.name ?? "None"}</td><td className="px-4 py-4"><Status active={user.isActive} /></td><td className="px-4 py-4 whitespace-nowrap">{formatDateTime(user.createdAt)}</td><td className="px-4 py-4"><Link href={`/admin/users/${user.id}`} className="font-semibold text-emerald-700">View / Manage</Link></td></tr>)}</tbody></table></div>; }
function UserCards({ users }: { users: AdminUser[] }) { return <div className="grid gap-4 md:hidden">{users.map((user) => <article key={user.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex justify-between gap-3"><h2 className="font-bold text-slate-950">{user.firstName} {user.lastName}</h2><Status active={user.isActive} /></div><p className="mt-1 break-all text-sm text-slate-600">{user.email}</p><p className="mt-4 text-sm text-slate-700">{roleLabels[user.role]} · {user.department?.name ?? "No department"}</p><Link href={`/admin/users/${user.id}`} className="mt-5 inline-flex font-semibold text-emerald-700">View / Manage →</Link></article>)}</div>; }
function Status({ active }: { active: boolean }) { return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"}`}>{active ? "Active" : "Inactive"}</span>; }
function Empty() { return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><h2 className="text-xl font-bold">No users found</h2><p className="mt-2 text-sm text-slate-600">Try changing your filters.</p></div>; }
function Pagination({ pagination, previous, next }: { pagination: AdminPagination; previous: () => void; next: () => void }) { const pages = Math.max(1, pagination.totalPages); return <nav className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3" aria-label="Users pagination"><button onClick={previous} disabled={pagination.page <= 1} className="rounded-lg border px-3 py-2 disabled:opacity-40">Previous</button><span className="text-sm">Page {pagination.page} of {pages}</span><button onClick={next} disabled={pagination.page >= pages} className="rounded-lg border px-3 py-2 disabled:opacity-40">Next</button></nav>; }
export default function AdminUsersPage() { return <AdminRoute><AdminUsersContent /></AdminRoute>; }
