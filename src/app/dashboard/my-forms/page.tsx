"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FormCardSkeleton } from "@/components/Skeletons";
import { apiFetch } from "@/lib/api-client";
import type { ExecutiveApplicationRecord } from "@/types/models";

interface EditFormValues {
  whyExecutive: string;
  hoursPerWeek: string;
  techSkills: string;
  experience: string;
  leadershipRating: string;
  githubProfile: string;
  awards: string;
}

export default function MyFormsPage() {
  const [saving, setSaving] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-executive-form"],
    queryFn: () => apiFetch<{ form: ExecutiveApplicationRecord | null }>("/api/executive-forms/me"),
  });

  const form = data?.form ?? null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditFormValues>();

  useEffect(() => {
    if (form) {
      reset({
        whyExecutive: form.why_executive,
        hoursPerWeek: form.hours_per_week,
        techSkills: form.tech_skills,
        experience: form.experience,
        leadershipRating: form.leadership_rating,
        githubProfile: form.github_profile,
        awards: form.awards,
      });
    }
  }, [form, reset]);

  const { mutateAsync } = useMutation({
    mutationFn: (values: EditFormValues) =>
      apiFetch(`/api/executive-forms/${form!.id}`, {
        method: "PUT",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      toast.success("Application updated successfully");
      refetch();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update application");
    },
  });

  const onSubmit = async (values: EditFormValues) => {
    if (!form) return;
    setSaving(true);
    try {
      await mutateAsync(values);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <FormCardSkeleton fields={7} />;

  if (!form) {
    return (
      <div className="max-w-xl mx-auto card bg-[#0b1514] border border-[#122e2a] p-8 text-center space-y-4">
        <h1 className="text-3xl text-[#e8f5f3]">No Application Submitted</h1>
        <p className="text-sm">
          You have not submitted an executive recruitment application yet.
        </p>
        <Link
          href="/apply-for-executive"
          className="btn btn-sm mx-auto border-[#30c4b6] bg-[#30c4b6] text-[#080f0e]"
        >
          Apply For Executive
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card bg-[#0b1514] border border-[#122e2a] shadow-2xl">
        <form className="card-body space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <h1 className="text-3xl font-bold text-center text-[#e8f5f3]">
            My Executive Application
          </h1>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-[#89aca8]">
                Why do you want to become an executive?
              </span>
            </label>
            <input
              type="text"
              className="input input-bordered bg-[#0d1c1a] text-[#e8f5f3]"
              {...register("whyExecutive", { required: "This field is required" })}
            />
            {errors.whyExecutive && (
              <span className="text-red-500 text-xs">{errors.whyExecutive.message}</span>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-[#89aca8]">
                Hours per week you can commit
              </span>
            </label>
            <input
              type="text"
              className="input input-bordered bg-[#0d1c1a] text-[#e8f5f3]"
              {...register("hoursPerWeek", { required: "This field is required" })}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-[#89aca8]">Technical skills</span>
            </label>
            <input
              type="text"
              className="input input-bordered bg-[#0d1c1a] text-[#e8f5f3]"
              {...register("techSkills", { required: "This field is required" })}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-[#89aca8]">
                Prior experience in clubs/organizations
              </span>
            </label>
            <textarea
              rows={3}
              className="textarea textarea-bordered bg-[#0d1c1a] text-[#e8f5f3]"
              {...register("experience", { required: "This field is required" })}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-[#89aca8]">
                Leadership, teamwork, and communication rating (1–5)
              </span>
            </label>
            <input
              type="text"
              className="input input-bordered bg-[#0d1c1a] text-[#e8f5f3]"
              {...register("leadershipRating", { required: "This field is required" })}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-[#89aca8]">
                GitHub profile &amp; repositories
              </span>
            </label>
            <textarea
              rows={2}
              className="textarea textarea-bordered bg-[#0d1c1a] text-[#e8f5f3]"
              {...register("githubProfile", { required: "This field is required" })}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-[#89aca8]">
                Awards or certificates
              </span>
            </label>
            <textarea
              rows={2}
              className="textarea textarea-bordered bg-[#0d1c1a] text-[#e8f5f3]"
              {...register("awards", { required: "This field is required" })}
            />
          </div>

          <div className="form-control pt-4">
            <button
              type="submit"
              disabled={saving}
              className="btn border-[#30c4b6] bg-[#30c4b6] text-[#080f0e] hover:bg-[#1c9e92]"
            >
              {saving ? "Updating..." : "Update Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
