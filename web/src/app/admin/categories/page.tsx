"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { AdminRoute } from "@/components/auth/ProtectedRoute";
import { ReportError, ReportLoading } from "@/components/reports/ReportStates";
import { useAuth } from "@/context/AuthContext";
import {
  createCategory,
  getAdminCategories,
  getAdminDepartments,
  updateCategory,
} from "@/lib/admin";
import { ApiError } from "@/lib/api";
import type { AdminCategory } from "@/types/admin";
import type { Department } from "@/types/department";

const emptyForm = { name: "", description: "", icon: "", departmentId: "" };

function CategoriesContent() {
  const router = useRouter();
  const { logout } = useAuth();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleError = useCallback(
    (caught: unknown, fallback = "Unable to load report categories.") => {
      if (caught instanceof ApiError && caught.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      setError(caught instanceof ApiError ? caught.message : fallback);
    },
    [logout, router],
  );

  const loadCategories = useCallback(async () => {
    await Promise.resolve();
    setIsLoading(true);
    setError("");
    try {
      setCategories((await getAdminCategories()).categories);
    } catch (caught) {
      handleError(caught);
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    let active = true;
    void Promise.all([getAdminCategories(), getAdminDepartments(true)])
      .then(([categoryResponse, departmentResponse]) => {
        if (active) {
          setCategories(categoryResponse.categories);
          setDepartments(departmentResponse.departments);
        }
      })
      .catch((caught: unknown) => {
        if (active) handleError(caught);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [handleError]);

  function startEditing(category: AdminCategory) {
    setEditing(category);
    setForm({
      name: category.name,
      description: category.description ?? "",
      icon: category.icon ?? "",
      departmentId: category.department ? String(category.department.id) : "",
    });
    setError("");
    setSuccess("");
  }

  function resetForm() {
    setEditing(null);
    setForm(emptyForm);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.departmentId) {
      setError("Category name and department are required.");
      return;
    }
    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const data = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        icon: form.icon.trim() || null,
        departmentId: Number(form.departmentId),
      };
      const response = editing
        ? await updateCategory(editing.id, data)
        : await createCategory(data);
      setCategories((current) =>
        editing
          ? current.map((item) =>
              item.id === response.category.id ? response.category : item,
            )
          : [...current, response.category].sort((a, b) =>
              a.name.localeCompare(b.name),
            ),
      );
      setSuccess(editing ? "Category updated." : "Category created.");
      resetForm();
    } catch (caught) {
      handleError(caught, "Unable to save the category.");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleCategory(category: AdminCategory) {
    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await updateCategory(category.id, {
        isActive: !category.isActive,
      });
      setCategories((current) =>
        current.map((item) =>
          item.id === category.id ? response.category : item,
        ),
      );
      setSuccess(
        `${category.name} ${response.category.isActive ? "activated" : "deactivated"}.`,
      );
    } catch (caught) {
      handleError(caught, "Unable to update the category.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 sm:py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
        Administration
      </p>
      <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">
        Report Categories
      </h1>
      <p className="mt-3 text-slate-600">
        Control which issue categories citizens can select for new reports.
      </p>

      {error && <Notice error>{error}</Notice>}
      {success && <Notice>{success}</Notice>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_0.8fr]">
        <section>
          {isLoading ? (
            <ReportLoading message="Loading categories..." />
          ) : error && categories.length === 0 ? (
            <ReportError
              message={error}
              onRetry={() => void loadCategories()}
            />
          ) : categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h2 className="font-bold text-slate-950">No report categories</h2>
              <p className="mt-2 text-sm text-slate-600">
                Create the first category for citizen reports.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {categories.map((category) => (
                <article
                  key={category.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        {category.icon && (
                          <span aria-hidden="true" className="text-xl">
                            {category.icon}
                          </span>
                        )}
                        <h2 className="font-bold text-slate-950">
                          {category.name}
                        </h2>
                        <StatusBadge active={category.isActive} />
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        {category.description || "No description"}
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-700">
                        Department:{" "}
                        {category.department?.name ?? "Not configured"}
                      </p>
                      <p className="mt-3 text-xs text-slate-500">
                        {category._count?.reports ?? 0} reports
                      </p>
                    </div>
                    <div className="flex gap-2 self-start">
                      <button
                        type="button"
                        onClick={() => startEditing(category)}
                        className={secondaryButton}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => void toggleCategory(category)}
                        className={secondaryButton}
                      >
                        {category.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">
            {editing ? "Edit Category" : "Create Category"}
          </h2>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <TextField
              id="category-name"
              label="Name"
              value={form.name}
              maxLength={100}
              required
              onChange={(value) =>
                setForm((current) => ({ ...current, name: value }))
              }
            />
            <TextField
              id="category-icon"
              label="Icon"
              value={form.icon}
              maxLength={100}
              placeholder="Optional symbol or icon name"
              onChange={(value) =>
                setForm((current) => ({ ...current, icon: value }))
              }
            />
            <div>
              <label htmlFor="category-department" className={labelStyle}>
                Department
              </label>
              <select
                id="category-department"
                required
                value={form.departmentId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    departmentId: event.target.value,
                  }))
                }
                className={inputStyle}
              >
                <option value="">Select a department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                New reports in this category are routed to this department.
              </p>
            </div>
            <div>
              <label htmlFor="category-description" className={labelStyle}>
                Description
              </label>
              <textarea
                id="category-description"
                rows={4}
                maxLength={180}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className={inputStyle}
              />
            </div>
            <button type="submit" disabled={isSaving} className={primaryButton}>
              {isSaving
                ? "Saving..."
                : editing
                  ? "Save Changes"
                  : "Create Category"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className={`${secondaryButton} w-full`}
              >
                Cancel Editing
              </button>
            )}
          </form>
        </aside>
      </div>
    </main>
  );
}

const labelStyle = "mb-1.5 block text-sm font-semibold text-slate-800";
const inputStyle =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100";
const primaryButton =
  "w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

function TextField({
  id,
  label,
  value,
  onChange,
  maxLength,
  required,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelStyle}>
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        required={required}
        placeholder={placeholder}
        className={inputStyle}
      />
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"}`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function Notice({
  children,
  error = false,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div
      role={error ? "alert" : "status"}
      className={`mt-6 rounded-lg border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
    >
      {children}
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <AdminRoute>
      <CategoriesContent />
    </AdminRoute>
  );
}
