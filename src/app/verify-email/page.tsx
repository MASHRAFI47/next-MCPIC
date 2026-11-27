"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { FormCardSkeleton } from "@/components/Skeletons";
import { apiFetch } from "@/lib/api-client";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    apiFetch<{ message: string }>("/api/verify-email", {
      method: "PUT",
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        setStatus("success");
        setMessage(res.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Verification failed.");
      });
  }, [token]);

  return (
    <section className="min-h-screen hero-grid flex items-center justify-center p-4">
      <div className="card bg-[#0b1514] border border-[#122e2a] max-w-md w-full p-8 text-center space-y-4">
        <Image
          src="/mcpic-logo.png"
          width={56}
          height={56}
          alt="MCPIC"
          className="w-14 h-14 mx-auto object-contain"
        />
        <h1 className="text-3xl text-[#e8f5f3]">Email Verification</h1>
        <p className={status === "error" ? "text-red-400 text-sm" : "text-[#30c4b6] text-sm"}>
          {message}
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/dashboard/profile"
            className="btn btn-sm border-[#30c4b6] bg-[#30c4b6] text-[#080f0e]"
          >
            Go to Profile
          </Link>
          <Link href="/" className="btn btn-sm btn-ghost">
            Home
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen hero-grid flex items-center justify-center">
          <div className="w-full max-w-md">
            <FormCardSkeleton fields={1} />
          </div>
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
