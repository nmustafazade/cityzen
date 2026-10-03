"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { AuthCard, FormError, SubmitButton, TextField } from "./LoginForm";
import { GuestRoute } from "./ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update(field: keyof typeof form) {
    return (value: string) =>
      setForm((current) => ({ ...current, [field]: value }));
  }

  function validate(): string | null {
    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.confirmPassword
    )
      return "All fields are required.";
    if (!emailPattern.test(form.email.trim()))
      return "Enter a valid email address.";
    if (!passwordPattern.test(form.password))
      return "Password must be at least 8 characters and include uppercase, lowercase, and a number.";
    if (form.password !== form.confirmPassword)
      return "Passwords do not match.";
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      });
      router.replace("/dashboard");
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to create your account. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <GuestRoute>
      <AuthCard
        title="Create your account"
        description="Join Cityzen to connect with your city and municipal services."
      >
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {error && <FormError message={error} />}
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="First Name"
              name="firstName"
              type="text"
              autoComplete="given-name"
              value={form.firstName}
              onChange={update("firstName")}
            />
            <TextField
              label="Last Name"
              name="lastName"
              type="text"
              autoComplete="family-name"
              value={form.lastName}
              onChange={update("lastName")}
            />
          </div>
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={update("email")}
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={update("password")}
          />
          <TextField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={update("confirmPassword")}
          />
          <SubmitButton
            isSubmitting={isSubmitting}
            idleText="Create account"
            loadingText="Creating account..."
          />
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Sign in
          </Link>
        </p>
      </AuthCard>
    </GuestRoute>
  );
}
