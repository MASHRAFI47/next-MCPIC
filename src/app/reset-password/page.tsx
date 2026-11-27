"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FormCardSkeleton } from "@/components/Skeletons";
import { apiFetch } from "@/lib/api-client";

interface ResetValues {
  newPassword: string;
  confirmPassword: string;
}

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetValues>();

  const onSubmit = async (values: ResetValues) => {
    if (!token) {
      toast.error("Invalid or missing reset token.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch<{ message: string }>("/api/password-reset/confirm", {
        method: "POST",
        body: JSON.stringify({ token, newPassword: values.newPassword }),
      });
      toast.success(res.message);
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="min-h-screen hero-grid flex items-center justify-center p-4">
      <div className="card bg-[#0b1514] border border-[#122e2a] max-w-sm w-full">
        <form className="card-body" onSubmit={handleSubmit(onSubmit)}>
          <h1 className="text-3xl text-center text-[#e8f5f3]">Set New Password</h1>
          <div className="form-control">
            <label className="label">
              <span className="label-text text-[#4a6564]">New Password</span>
            </label>
            <input
              type="password"
              placeholder="Min 10 chars, Aa1!"
              className="input input-bordered bg-[#0d1c1a] text-[#e8f5f3]"
              {...register("newPassword", {
                required: "Required",
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/,
                  message: "Min 10 chars with upper, lower, number, and symbol",
                },
              })}
            />
            {errors.newPassword && (
              <span className="text-red-500 text-xs mt-1">{errors.newPassword.message}</span>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-[#4a6564]">Confirm Password</span>
            </label>
            <input
              type="password"
              placeholder="Re-enter password"
              className="input input-bordered bg-[#0d1c1a] text-[#e8f5f3]"
              {...register("confirmPassword", {
                required: "Required",
                validate: (val) => val === watch("newPassword") || "Passwords do not match",
              })}
            />
            {errors.confirmPassword && (
              <span className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || !token}
            className="btn mt-4 border-[#30c4b6] bg-[#30c4b6] text-[#080f0e] hover:bg-[#1c9e92]"
          >
            {submitting ? "Updating..." : "Update Password"}
          </button>

          <Link href="/login" className="text-center text-xs text-neutral-400 mt-3">
            Back to Login
          </Link>
        </form>
      </div>
    </section>
  );
}

export default function ResetPasswordPage() {
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
      <ResetPasswordInner />
    </Suspense>
  );
}
