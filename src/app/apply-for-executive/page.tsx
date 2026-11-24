"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { CgSpinnerTwoAlt } from "react-icons/cg";
import PublicShell from "@/components/PublicShell";
import LoadingSpinner from "@/components/LoadingSpinner";
import { apiFetch } from "@/lib/api-client";

interface ApplyFormValues {
  whyExecutive: string;
  hoursPerWeek: string;
  techSkills: string;
  experience: string;
  leadershipRating: string;
  githubProfile: string;
  awards: string;
}

export default function ApplyForExecutivePage() {
  const { data: session, status } = useSession();
  const [submitting, setSubmitting] = useState(false);

  const { data: recruitment, isLoading: loadingSwitch } = useQuery({
    queryKey: ["recruitment-status"],
    queryFn: () => apiFetch<{ enabled: boolean }>("/api/settings/recruitment"),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApplyFormValues>();

  const { mutateAsync } = useMutation({
    mutationFn: (payload: ApplyFormValues) =>
      apiFetch("/api/executive-forms", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast.success(
        "Application submitted successfully! You can edit it anytime in Dashboard -> My Forms.",
        { duration: 5000 }
      );
      reset();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to submit application", {
        duration: 5000,
      });
    },
  });

  const onSubmit = async (values: ApplyFormValues) => {
    setSubmitting(true);
    try {
      await mutateAsync(values);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loadingSwitch) {
    return (
      <PublicShell>
        <LoadingSpinner />
      </PublicShell>
    );
  }

  const user = session?.user;

  return (
    <PublicShell>
      <div className="hero-grid min-h-screen py-16 px-4">
        <div className="container mx-auto max-w-2xl">
          {!recruitment?.enabled ? (
            <div className="card bg-[#0b1514] border border-[#122e2a] p-8 text-center space-y-4">
              <h1 className="text-3xl text-[#e8f5f3]">Executive Recruitment Closed</h1>
              <p className="text-sm">
                Recruitment is currently closed. Follow our announcements for the next intake.
              </p>
              <Link
                href="/"
                className="btn btn-sm mx-auto border-[#30c4b6] bg-[#30c4b6] text-[#080f0e]"
              >
                Back to Home
              </Link>
            </div>
          ) : !user?.emailVerified ? (
            <div className="card bg-[#0b1514] border border-amber-500/40 p-8 text-center space-y-4">
              <h1 className="text-3xl text-[#e8f5f3]">Verify Your Email First</h1>
              <p className="text-sm">
                Please verify your email address from your dashboard profile before applying for an
                executive position.
              </p>
              <Link
                href="/dashboard/profile"
                className="btn btn-sm mx-auto border-[#30c4b6] bg-[#30c4b6] text-[#080f0e]"
              >
                Go to Profile
              </Link>
            </div>
          ) : (
            <>
              <p className="text-red-400 text-center text-sm mb-3">
                N.B: Only fill out this form if you intend to apply for an MCPIC executive post.
              </p>
              <div className="card shadow-2xl bg-[#0b1514] border border-[#122e2a]">
                <form className="card-body space-y-3" onSubmit={handleSubmit(onSubmit)}>
                  <h1 className="text-3xl font-bold text-center text-[#e8f5f3]">
                    Apply For Executive
                  </h1>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold text-[#89aca8]">
                        Why do you want to become an executive?
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="Write a reason"
                      className="input input-bordered bg-[#0d1c1a] text-[#e8f5f3]"
                      {...register("whyExecutive", { required: "This field is required" })}
                    />
                    {errors.whyExecutive && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.whyExecutive.message}
                      </span>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold text-[#89aca8]">
                        How many hours per week can you commit to club activities?
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="Type in hours"
                      className="input input-bordered bg-[#0d1c1a] text-[#e8f5f3]"
                      {...register("hoursPerWeek", { required: "This field is required" })}
                    />
                    {errors.hoursPerWeek && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.hoursPerWeek.message}
                      </span>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold text-[#89aca8]">
                        What technical skills do you have?
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Programming, Web Dev, Graphic Design"
                      className="input input-bordered bg-[#0d1c1a] text-[#e8f5f3]"
                      {...register("techSkills", { required: "This field is required" })}
                    />
                    {errors.techSkills && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.techSkills.message}
                      </span>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold text-[#89aca8]">
                        Do you have prior experience in clubs/organizations? Briefly describe your
                        role.
                      </span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Write here..."
                      className="textarea textarea-bordered bg-[#0d1c1a] text-[#e8f5f3]"
                      {...register("experience", { required: "This field is required" })}
                    />
                    {errors.experience && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.experience.message}
                      </span>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold text-[#89aca8]">
                        Rate your leadership, teamwork, and communication skills (1–5)
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="1 to 5"
                      className="input input-bordered bg-[#0d1c1a] text-[#e8f5f3]"
                      {...register("leadershipRating", { required: "This field is required" })}
                    />
                    {errors.leadershipRating && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.leadershipRating.message}
                      </span>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold text-[#89aca8]">
                        GitHub profile and best two repositories (or N/A)
                      </span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Share links..."
                      className="textarea textarea-bordered bg-[#0d1c1a] text-[#e8f5f3]"
                      {...register("githubProfile", { required: "This field is required" })}
                    />
                    {errors.githubProfile && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.githubProfile.message}
                      </span>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold text-[#89aca8]">
                        Awards or certificates (Google Drive link or N/A)
                      </span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Share link..."
                      className="textarea textarea-bordered bg-[#0d1c1a] text-[#e8f5f3]"
                      {...register("awards", { required: "This field is required" })}
                    />
                    {errors.awards && (
                      <span className="text-red-500 text-xs mt-1">{errors.awards.message}</span>
                    )}
                  </div>

                  <div className="form-control pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="text-sm font-semibold py-3 rounded-2xl px-5 border border-[#30c4b6] bg-[#30c4b6] text-[#080f0e] hover:bg-[#1c9e92] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      Apply {submitting && <CgSpinnerTwoAlt className="animate-spin" />}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </PublicShell>
  );
}
