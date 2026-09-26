"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AdminRoute } from "@/components/auth/ProtectedRoute";
import { ReportError, ReportLoading } from "@/components/reports/ReportStates";
import { useAuth } from "@/context/AuthContext";
import { getAdminUser, updateUserDepartment, updateUserRole, updateUserStatus } from "@/lib/admin";
import { ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { getManagementDepartments } from "@/lib/management";
import type { AdminUser } from "@/types/admin";
import type { Department } from "@/types/department";
import type { UserRole } from "@/types/user";

const roleLabels: Record<UserRole, string> = { CITIZEN: "Citizen", EMPLOYEE: "Employee", ADMIN: "Admin" };

function Content({ userId }: { userId: string }) {
  const id = Number(userId); const router = useRouter(); const { user: currentUser, logout } = useAuth();
  const [managedUser, setManagedUser] = useState<AdminUser | null>(null); const [departments, setDepartments] = useState<Department[]>([]);
  const [role, setRole] = useState<UserRole | "">(""); const [departmentId, setDepartmentId] = useState("");
  const [isLoading, setIsLoading] = useState(true); const [isSaving, setIsSaving] = useState(false); const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  const handleError = useCallback((caught: unknown) => { if (caught instanceof ApiError && caught.status === 401) { logout(); router.replace("/login"); return; } setError(caught instanceof ApiError ? caught.message : "Unable to manage this user."); }, [logout, router]);
  const apply = useCallback((value: AdminUser) => { setManagedUser(value); setRole(value.role); setDepartmentId(value.department ? String(value.department.id) : ""); }, []);
  const load = useCallback(async () => { await Promise.resolve(); if (!Number.isInteger(id) || id <= 0) { setError("User not found."); setIsLoading(false); return; } setIsLoading(true); setError(""); try { const [userResponse, departmentResponse] = await Promise.all([getAdminUser(id), getManagementDepartments()]); apply(userResponse.user); setDepartments(departmentResponse.departments); } catch (caught) { handleError(caught); } finally { setIsLoading(false); } }, [apply, handleError, id]);
  useEffect(() => { let active = true; if (!Number.isInteger(id) || id <= 0) { Promise.resolve().then(() => { if (active) { setError("User not found."); setIsLoading(false); } }); } else { void Promise.all([getAdminUser(id), getManagementDepartments()]).then(([u, d]) => { if (active) { apply(u.user); setDepartments(d.departments); } }).catch((caught: unknown) => { if (active) handleError(caught); }).finally(() => { if (active) setIsLoading(false); }); } return () => { active = false; }; }, [apply, handleError, id]);
  async function save(action: () => Promise<{ user: AdminUser }>, message: string) { setIsSaving(true); setError(""); setSuccess(""); try { const result = await action(); apply(result.user); setSuccess(message); } catch (caught) { handleError(caught); } finally { setIsSaving(false); } }
  if (isLoading) return <Shell><ReportLoading message="Loading user..." /></Shell>;
  if (error && !managedUser) return <Shell><ReportError message={error} onRetry={() => void load()} /></Shell>;
  if (!managedUser) return <Shell><ReportError message="User not found." onRetry={() => void load()} /></Shell>;
  const isSelf = currentUser?.id === managedUser.id;
  return <Shell><Link href="/admin/users" className="text-sm font-semibold text-emerald-700">← Back to Users</Link><div className="mt-6"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">User #{managedUser.id}</p><h1 className="mt-2 text-3xl font-bold text-slate-950">{managedUser.firstName} {managedUser.lastName}</h1><p className="mt-2 text-slate-600">{managedUser.email}</p></div>
    {error && <Message error>{error}</Message>}{success && <Message>{success}</Message>}
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]"><section className={card}><h2 className="text-lg font-bold">Account Details</h2><dl className="mt-5 grid gap-5 sm:grid-cols-2"><Item label="Role" value={roleLabels[managedUser.role]} /><Item label="Status" value={managedUser.isActive ? "Active" : "Inactive"} /><Item label="Email verification" value={managedUser.isEmailVerified ? "Verified" : "Not verified"} /><Item label="Department" value={managedUser.department?.name ?? "None"} /><Item label="Created" value={formatDateTime(managedUser.createdAt)} /><Item label="Updated" value={formatDateTime(managedUser.updatedAt)} /></dl></section>
      <div className="space-y-6"><section className={card}><h2 className="text-lg font-bold">Change Role</h2><label htmlFor="role" className={label}>Role</label><select id="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)} disabled={isSaving || isSelf} className={input}><option value="CITIZEN">Citizen</option><option value="EMPLOYEE">Employee</option><option value="ADMIN">Admin</option></select>{isSelf && <p className="mt-2 text-xs text-slate-500">You cannot change your own administrator role.</p>}<button disabled={isSaving || isSelf || role === managedUser.role} onClick={() => void save(() => updateUserRole(id, role as UserRole), "User role updated.")} className={button}>Save Role</button></section>
      <section className={card}><h2 className="text-lg font-bold">Department</h2><label htmlFor="department" className={label}>Department</label><select id="department" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} disabled={isSaving || managedUser.role === "CITIZEN"} className={input}><option value="">No department</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>{managedUser.role === "CITIZEN" && <p className="mt-2 text-xs text-slate-500">Citizens cannot belong to municipality departments.</p>}<button disabled={isSaving || managedUser.role === "CITIZEN" || departmentId === (managedUser.department ? String(managedUser.department.id) : "")} onClick={() => void save(() => updateUserDepartment(id, departmentId ? Number(departmentId) : null), "Department updated.")} className={button}>Save Department</button></section>
      <section className={card}><h2 className="text-lg font-bold">Account Status</h2><p className="mt-2 text-sm text-slate-600">{managedUser.isActive ? "Deactivate this account to prevent future logins." : "Reactivate this account to restore login access."}</p>{confirmDeactivate && managedUser.isActive ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3"><p className="text-sm text-red-700">Are you sure you want to deactivate this user?</p><div className="mt-3 flex gap-2"><button disabled={isSaving} onClick={() => void save(() => updateUserStatus(id, false), "User deactivated.").then(() => setConfirmDeactivate(false))} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white">Confirm</button><button onClick={() => setConfirmDeactivate(false)} className="rounded-lg border bg-white px-3 py-2 text-sm">Cancel</button></div></div> : <button disabled={isSaving || isSelf} onClick={() => managedUser.isActive ? setConfirmDeactivate(true) : void save(() => updateUserStatus(id, true), "User activated.")} className={`${button} ${managedUser.isActive ? "bg-red-600 hover:bg-red-700" : ""}`}>{managedUser.isActive ? "Deactivate User" : "Activate User"}</button>}{isSelf && <p className="mt-2 text-xs text-slate-500">You cannot deactivate your own account.</p>}</section></div>
    </div></Shell>;
}
const card = "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"; const label = "mb-1.5 mt-5 block text-sm font-semibold text-slate-800"; const input = "w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm disabled:bg-slate-100"; const button = "mt-4 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40";
function Shell({ children }: { children: React.ReactNode }) { return <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:py-14">{children}</main>; }
function Item({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt><dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd></div>; }
function Message({ children, error = false }: { children: React.ReactNode; error?: boolean }) { return <div role={error ? "alert" : "status"} className={`mt-6 rounded-lg border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{children}</div>; }
export function AdminUserDetail({ userId }: { userId: string }) { return <AdminRoute><Content userId={userId} /></AdminRoute>; }
