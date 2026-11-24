"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { CgSpinnerTwoAlt } from "react-icons/cg";
import { apiFetch, uploadImage } from "@/lib/api-client";

interface RegisterValues {
  fullName: string;
  email: string;
  password: string;
  image?: FileList;
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>();

  const onSubmit = async (values: RegisterValues) => {
    setLoading(true);
    try {
      let imageUrl = "/images/blank.webp";
      const file = values.image?.[0];
      if (file) {
        imageUrl = await uploadImage(file);
      }

      const regRes = await apiFetch<{ message: string; devVerifyUrl?: string }>("/api/register", {
        method: "POST",
        body: JSON.stringify({
          fullName: values.fullName,
          email: values.email,
          password: values.password,
          imageUrl,
        }),
      });

      // Immediately sign in with NextAuth so the httpOnly session cookie is issued!
      const signInRes = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      toast.success(regRes.message);

      if (regRes.devVerifyUrl) {
        setDevVerifyUrl(regRes.devVerifyUrl);
        return;
      }

      if (signInRes?.ok) {
        router.push("/dashboard/profile");
        router.refresh();
      } else {
        router.push("/login");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center hero-grid py-10 px-4">
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

          <h1 className="text-3xl font-bold text-center text-[#e8f5f3] mt-1">SIGN UP</h1>
          <p className="text-center text-sm">Welcome to MCPIC</p>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-[#4a6564]">Full Name</span>
            </label>
            <input
              type="text"
              placeholder="Your full name"
              className="input input-bordered bg-[#0d1c1a] text-[#e8f5f3] placeholder:text-[#4a6564]"
              {...register("fullName", { required: "Full name is required", minLength: 2 })}
            />
            {errors.fullName && (
              <span className="text-red-500 text-xs mt-1">{errors.fullName.message}</span>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-[#4a6564]">Profile Image (JPG/PNG/WebP, max 2MB)</span>
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="file-input file-input-bordered w-full bg-[#0d1c1a] text-[#e8f5f3]"
              {...register("image")}
            />
          </div>

          <div className="form-control">
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
              autoComplete="new-password"
              placeholder="Min 10 chars, Aa1!"
              className="input input-bordered bg-[#0d1c1a] text-[#e8f5f3] placeholder:text-[#4a6564]"
              {...register("password", {
                required: "Password is required",
                minLength: { value: 10, message: "Minimum 10 characters" },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/,
                  message: "Must include upper, lower, number, and symbol",
                },
              })}
            />
            {errors.password && (
              <span className="text-red-500 text-xs mt-1">{errors.password.message}</span>
            )}
          </div>

          <div className="form-control mt-6">
            <button
              type="submit"
              disabled={loading}
              className="text-sm font-semibold py-3 rounded-2xl px-5 border border-[#30c4b6] bg-[#30c4b6] text-[#080f0e] hover:bg-[#1c9e92] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Register {loading && <CgSpinnerTwoAlt className="animate-spin" />}
            </button>
          </div>

          {devVerifyUrl && (
            <div className="mt-4 p-3 rounded-lg bg-[#102220] border border-[#30c4b6]/50 text-xs space-y-2">
              <p className="text-[#30c4b6] font-semibold">
                Account created! (Dev mode — SMTP not configured):
              </p>
              <Link href={devVerifyUrl} className="underline text-[#e8f5f3] block">
                Click here to verify your email
              </Link>
              <Link href="/dashboard" className="btn btn-xs w-full mt-2">
                Continue to Dashboard
              </Link>
            </div>
          )}

          <p className="text-center text-sm mb-2 mt-4">
            Already a user?{" "}
            <Link href="/login" className="font-bold text-[#30c4b6] hover:text-[#a89ec9]">
              Login Now
            </Link>
          </p>

          <Link href="/" className="text-center text-xs text-neutral-400 hover:text-[#30c4b6]">
            Back To Home
          </Link>
        </form>
      </div>
    </div>
  );
}
