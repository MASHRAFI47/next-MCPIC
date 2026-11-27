"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import ThemeToggle from "@/components/ThemeToggle";
import { FormCardSkeleton } from "@/components/Skeletons";
import { apiFetch } from "@/lib/api-client";

interface LoginValues {
  email: string;
  password: string;
  totpCode?: string;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSending, setResetSending] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>();

  const onSubmit = async (values: LoginValues) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: values.email.trim(),
        password: values.password,
        totpCode: values.totpCode || "",
      });

      if (!res) {
        const msg = "Sign in failed. Please try again.";
        setFormError(msg);
        toast.error(msg);
        return;
      }

      if (res.error === "MFA_REQUIRED") {
        setMfaRequired(true);
        toast("Enter your 6-digit authenticator code (or recovery code).");
        return;
      }

      if (res.error === "INVALID_MFA_CODE") {
        const msg = "Invalid authenticator or recovery code.";
        setFormError(msg);
        toast.error(msg);
        return;
      }

      if (res.error === "TOO_MANY_ATTEMPTS") {
        const msg = "Too many login attempts. Please wait before trying again.";
        setFormError(msg);
        toast.error(msg);
        return;
      }

      if (res.error || !res.ok) {
        const msg =
          res.error && res.error !== "CredentialsSignin"
            ? res.error
            : "Invalid email or password.";
        setFormError(msg);
        toast.error(msg);
        return;
      }

      toast.success("Sign in successful");
      // Guard against open redirects (allow only relative paths starting with single '/')
      const safeTarget =
        callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/";
      router.push(safeTarget);
      router.refresh();
    } catch (err) {
      const msg =
        err instanceof Error && err.message && !err.message.includes("Invalid URL")
          ? err.message
          : "Unable to sign in right now. Please check your credentials and try again.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetSending(true);
    setDevResetUrl(null);
    try {
      const res = await apiFetch<{ message: string; devResetUrl?: string }>(
        "/api/password-reset/request",
        {
          method: "POST",
          body: JSON.stringify({ email: resetEmail.trim() }),
        }
      );
      toast.success(res.message);
      if (res.devResetUrl) {
        setDevResetUrl(res.devResetUrl);
      } else {
        setForgotOpen(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reset link");
    } finally {
      setResetSending(false);
    }
  };

  return (
    <section className="min-h-screen flex flex-col items-center justify-center hero-grid p-4 relative">
      <div className="fixed top-4 right-4 z-40">
        <ThemeToggle />
      </div>
      <div className="card shrink-0 w-full max-w-sm shadow-2xl bg-[#0b1514] border border-[#122e2a] mx-auto">
        <form className="card-body" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex items-center justify-center gap-2">
            <Image
              src="/mcpic-logo.png"
              width={48}
              height={48}
              priority
              alt="MCPIC logo"
              className="w-12 h-12 object-contain"
            />
            <span className="font-heading text-2xl tracking-wider text-[#e8f5f3]">MCPIC</span>
          </div>

          <h1 className="text-3xl font-bold text-center text-[#e8f5f3] mt-2">WELCOME BACK</h1>
          <p className="text-center text-sm">Sign in to access your account</p>

          {formError && (
            <div
              role="alert"
              className="mt-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300"
            >
              {formError}
            </div>
          )}

          <div className="form-control mt-2">
            <label className="label">
              <span className="label-text text-[#4a6564]">Email</span>
            </label>
            <input
              type="email"
              autoComplete="email"
              placeholder="your@email.com"
              className="input input-bordered bg-[#0d1c1a] text-[#e8f5f3] placeholder:text-[#4a6564]"
              {...register("email", { required: "Email is required" })}
            />
            {errors.email && (
              <span className="text-red-500 text-xs mt-1">{errors.email.message}</span>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-[#4a6564]">Password</span>
            </label>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••"
              className="input input-bordered bg-[#0d1c1a] text-[#e8f5f3] placeholder:text-[#4a6564]"
              {...register("password", { required: "Password is required" })}
            />
            {errors.password && (
              <span className="text-red-500 text-xs mt-1">{errors.password.message}</span>
            )}
            <label className="label">
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="label-text-alt link link-hover text-[#89aca8]"
              >
                Forgot password?
              </button>
            </label>
          </div>

          {mfaRequired && (
            <div className="form-control bg-[#0d1c1a] p-3 rounded-lg border border-[#30c4b6]/50">
              <label className="label pt-0">
                <span className="label-text text-[#30c4b6] font-semibold">
                  2FA Authenticator / Recovery Code
                </span>
              </label>
              <input
                type="text"
                autoComplete="one-time-code"
                placeholder="123456 or ABCD-1234"
                className="input input-bordered bg-[#080f0e] text-[#e8f5f3]"
                {...register("totpCode", { required: "Authenticator code is required" })}
              />
              {errors.totpCode && (
                <span className="text-red-500 text-xs mt-1">{errors.totpCode.message}</span>
              )}
            </div>
          )}

          <div className="form-control mt-5">
            <button
              type="submit"
              disabled={submitting}
              className="text-sm font-semibold py-3 rounded-2xl px-5 border border-[#30c4b6] bg-[#30c4b6] text-[#080f0e] hover:bg-[#1c9e92] transition-colors disabled:opacity-50"
            >
              {submitting ? "Signing in..." : mfaRequired ? "Verify & Login" : "Login"}
            </button>
          </div>
        </form>

        <p className="text-center text-sm mb-3">
          New user?{" "}
          <Link href="/register" className="font-bold text-[#30c4b6] hover:text-[#a89ec9]">
            Register Now
          </Link>
        </p>

        <Link href="/" className="mb-8 text-center text-xs text-neutral-400 hover:text-[#30c4b6]">
          Back To Home
        </Link>
      </div>

      {forgotOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#0b1514] border border-[#122e2a] rounded-xl p-6 w-full max-w-md relative">
            <button
              type="button"
              onClick={() => {
                setForgotOpen(false);
                setDevResetUrl(null);
              }}
              className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
            >
              ✕
            </button>
            <h2 className="text-2xl text-[#e8f5f3] mb-2">Reset Your Password</h2>
            <p className="text-xs mb-4">
              Enter your registered email address and we will send a password reset link.
            </p>
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="your@email.com"
                className="input input-bordered w-full bg-[#0d1c1a] text-[#e8f5f3]"
              />
              <button
                type="submit"
                disabled={resetSending}
                className="btn w-full border-[#30c4b6] bg-[#30c4b6] text-[#080f0e] hover:bg-[#1c9e92]"
              >
                {resetSending ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
            {devResetUrl && (
              <div className="mt-4 p-3 rounded bg-[#102220] border border-[#30c4b6]/40 text-xs break-all">
                <p className="text-[#30c4b6] font-semibold mb-1">Dev mode (SMTP not configured):</p>
                <Link href={devResetUrl} className="underline text-[#e8f5f3]">
                  Open Password Reset Link
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen hero-grid flex items-center justify-center">
          <div className="w-full max-w-sm">
            <FormCardSkeleton fields={2} />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
