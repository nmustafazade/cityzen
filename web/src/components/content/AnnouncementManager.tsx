"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { MunicipalityRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import {
  createAnnouncement,
  getManagedAnnouncements,
  updateAnnouncement,
} from "@/lib/announcements";
import { uploadContentImage } from "@/lib/content-images";
import { formatDateTime } from "@/lib/format";
import { getManagementDepartments } from "@/lib/management";
import type { Announcement } from "@/types/announcement";
import type { Department } from "@/types/department";
import { ContentImagePicker } from "./ContentImagePicker";
import { Label, ManagementShell, field, panel } from "./ManagementShell";

const empty = {
  title: "",
  content: "",
  expiresAt: "",
  departmentId: "",
  isPublished: false,
};
const local = (value: string | null) =>
  value ? new Date(value).toISOString().slice(0, 16) : "";

export function AnnouncementManager() {
  const { user } = useAuth();
  const [items, setItems] = useState<Announcement[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState(empty);
  const [photo, setPhoto] = useState<File | null>(null);
  const [pickerKey, setPickerKey] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const load = useCallback(
    () =>
      getManagedAnnouncements({ limit: 20 })
        .then((response) => setItems(response.announcements))
        .catch(() => setError("Unable to load announcements.")),
    [],
  );

  useEffect(() => {
    void load();
    if (user?.role === "ADMIN")
      void getManagementDepartments().then((response) =>
        setDepartments(response.departments),
      );
  }, [load, user?.role]);

  function reset() {
    setEditing(null);
    setForm(empty);
    setPhoto(null);
    setPickerKey((key) => key + 1);
  }
  function edit(item: Announcement) {
    setEditing(item);
    setPhoto(null);
    setPickerKey((key) => key + 1);
    setForm({
      title: item.title,
      content: item.content,
      expiresAt: local(item.expiresAt),
      departmentId: item.department ? String(item.department.id) : "",
      isPublished: item.isPublished,
    });
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const data = {
      title: form.title,
      content: form.content,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      isPublished: form.isPublished,
      departmentId:
        user?.role === "ADMIN"
          ? form.departmentId
            ? Number(form.departmentId)
            : null
          : undefined,
    };
    try {
      const result = editing
        ? await updateAnnouncement(editing.id, data)
        : await createAnnouncement(data);
      if (photo) {
        try {
          await uploadContentImage(
            "announcements",
            result.announcement.id,
            photo,
          );
        } catch {
          setError(
            "The announcement was saved, but its photo could not be uploaded.",
          );
        }
      }
      reset();
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save announcement.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <MunicipalityRoute>
      <ManagementShell title="Announcements">
        <p className="mt-3 text-slate-600">
          Publish citywide or department updates.
        </p>
        {error && (
          <p role="alert" className="mt-5 text-red-700">
            {error}
          </p>
        )}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_.8fr]">
          <div className="space-y-4">
            {items.length ? (
              items.map((item) => (
                <article key={item.id} className={panel}>
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase text-emerald-700">
                        {item.department?.name ?? "Citywide"}
                      </p>
                      <h2 className="mt-1 font-bold">{item.title}</h2>
                      <p className="mt-2 text-sm text-slate-600">
                        {item.isPublished ? "Published" : "Draft"}
                        {item.publishedAt
                          ? ` · ${formatDateTime(item.publishedAt)}`
                          : ""}
                      </p>
                      {item.expiresAt && (
                        <p className="mt-1 text-xs text-slate-500">
                          Expires {formatDateTime(item.expiresAt)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => edit(item)}
                        className="font-semibold text-emerald-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          void updateAnnouncement(item.id, {
                            isPublished: !item.isPublished,
                          }).then(load)
                        }
                        className="font-semibold"
                      >
                        {item.isPublished ? "Unpublish" : "Publish"}
                      </button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <p className={panel}>No announcements have been created.</p>
            )}
          </div>
          <form onSubmit={submit} className={`${panel} h-fit space-y-4`}>
            <h2 className="text-lg font-bold">
              {editing ? "Edit Announcement" : "Create Announcement"}
            </h2>
            {user?.role === "ADMIN" && (
              <Label text="Scope">
                <select
                  value={form.departmentId}
                  onChange={(event) =>
                    setForm({ ...form, departmentId: event.target.value })
                  }
                  className={field}
                >
                  <option value="">Citywide</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </Label>
            )}
            <Label text="Title">
              <input
                required
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                className={field}
              />
            </Label>
            <Label text="Content">
              <textarea
                required
                rows={6}
                value={form.content}
                onChange={(event) =>
                  setForm({ ...form, content: event.target.value })
                }
                className={field}
              />
            </Label>
            <Label text="Expiration (optional)">
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(event) =>
                  setForm({ ...form, expiresAt: event.target.value })
                }
                className={field}
              />
            </Label>
            <ContentImagePicker
              disabled={saving}
              resetKey={pickerKey}
              onFileChange={setPhoto}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(event) =>
                  setForm({ ...form, isPublished: event.target.checked })
                }
              />{" "}
              Publish now
            </label>
            <button
              disabled={saving}
              className="w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-white"
            >
              {saving ? "Saving..." : "Save Announcement"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={reset}
                className="w-full font-semibold"
              >
                Cancel
              </button>
            )}
          </form>
        </div>
      </ManagementShell>
    </MunicipalityRoute>
  );
}
