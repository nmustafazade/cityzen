"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { GuestRoute } from "./ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password });
      router.replace("/dashboard");
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <GuestRoute>
      <AuthCard title="Welcome back" description="Sign in to continue to your Cityzen dashboard.">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {error && <FormError message={error} />}
          <TextField label="Email" name="email" type="email" autoComplete="email" value={email} onChange={setEmail} />
          <TextField label="Password" name="password" type="password" autoComplete="current-password" value={password} onChange={setPassword} />
          <SubmitButton isSubmitting={isSubmitting} idleText="Sign in" loadingText="Signing in..." />
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-emerald-700 hover:text-emerald-800">Register</Link>
        </p>
      </AuthCard>
    </GuestRoute>
  );
}

export function AuthCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-[calc(100vh-65px)] items-center justify-center bg-slate-50 px-6 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <div className="mb-7">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Cityzen account</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        {children}
      </section>
    </main>
  );
}

export function TextField({ label, name, type, autoComplete, value, onChange }: { label: string; name: string; type: string; autoComplete: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold text-slate-800">{label}</label>
      <input id={name} name={name} type={type} autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100" />
    </div>
  );
}

export function FormError({ message }: { message: string }) {
  return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>;
}

export function SubmitButton({ isSubmitting, idleText, loadingText }: { isSubmitting: boolean; idleText: string; loadingText: string }) {
  return <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-400">{isSubmitting ? loadingText : idleText}</button>;
}
