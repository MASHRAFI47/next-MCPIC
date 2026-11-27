"use client";

import { useState } from "react";
import Image from "next/image";
import { useMutation, useQuery } from "@tanstack/react-query";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { TablePageSkeleton } from "@/components/Skeletons";
import { apiFetch } from "@/lib/api-client";
import { DESIGNATIONS } from "@/lib/validators";
import type { ExecutiveApplicationRecord } from "@/types/models";

export default function RecruitPage() {
  const [viewing, setViewing] = useState<ExecutiveApplicationRecord | null>(null);
  const [recruiting, setRecruiting] = useState<ExecutiveApplicationRecord | null>(null);
  const [designation, setDesignation] = useState<string>("Executive");

  const { data: forms = [], isLoading, refetch } = useQuery({
    queryKey: ["executive-forms"],
    queryFn: () => apiFetch<ExecutiveApplicationRecord[]>("/api/executive-forms"),
  });

  const { data: recruitment, refetch: refetchSetting } = useQuery({
    queryKey: ["recruitment-status"],
    queryFn: () => apiFetch<{ enabled: boolean }>("/api/settings/recruitment"),
  });

  const toggleRecruitment = useMutation({
    mutationFn: (enabled: boolean) =>
      apiFetch<{ enabled: boolean }>("/api/settings/recruitment", {
        method: "PUT",
        body: JSON.stringify({ enabled }),
      }),
    onSuccess: (res) => {
      toast.success(`Recruitment turned ${res.enabled ? "ON" : "OFF"}`);
      refetchSetting();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update setting");
    },
  });

  const recruitMutation = useMutation({
    mutationFn: ({ id, desig }: { id: string; desig: string }) =>
      apiFetch(`/api/executive-forms/${id}/recruit`, {
        method: "POST",
        body: JSON.stringify({ designation: desig }),
      }),
    onSuccess: () => {
      toast.success("Applicant recruited and designation assigned!");
      setRecruiting(null);
      refetch();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to recruit applicant");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/executive-forms/${id}`, { method: "DELETE" }),
    onSuccess: () => refetch(),
  });

  const handleDelete = async (form: ExecutiveApplicationRecord) => {
    const confirm = await Swal.fire({
      title: `Delete application from ${form.full_name}?`,
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
    });

    if (!confirm.isConfirmed) return;

    try {
      await deleteMutation.mutateAsync(form.id);
      await Swal.fire("Deleted!", "Application removed.", "success");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete application");
    }
  };

  if (isLoading) return <TablePageSkeleton rows={5} cols={3} />;

  const isOpen = Boolean(recruitment?.enabled);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl text-[#e8f5f3]">Executive Recruitment</h1>
          <p className="text-sm">
            Current status:{" "}
            <span className={isOpen ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
              {isOpen ? "OPEN" : "CLOSED"}
            </span>
          </p>
        </div>

        <button
          type="button"
          disabled={toggleRecruitment.isPending}
          onClick={() => toggleRecruitment.mutate(!isOpen)}
          className={`btn btn-sm ${isOpen ? "btn-warning" : "btn-success text-white"}`}
        >
          {toggleRecruitment.isPending
            ? "Updating..."
            : isOpen
            ? "Close Recruitment"
            : "Open Recruitment"}
        </button>
      </div>

      <div className="overflow-x-auto bg-[#0b1514] border border-[#122e2a] rounded-xl">
        <table className="table">
          <thead>
            <tr className="text-[#30c4b6]">
              <th>Applicant</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {forms.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-8 text-[#89aca8]">
                  No pending recruitment applications.
                </td>
              </tr>
            ) : (
              forms.map((form) => (
                <tr key={form.id} className="border-[#122e2a]">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="mask mask-squircle h-11 w-11 relative">
                          <Image
                            src={form.image_url || "/images/blank.webp"}
                            alt={form.full_name || "Applicant"}
                            fill
                            sizes="44px"
                            unoptimized={(form.image_url || "").startsWith("/api/uploads/")}
                            className="object-cover"
                          />
                        </div>
                      </div>
                      <span className="font-bold text-[#e8f5f3]">{form.full_name}</span>
                    </div>
                  </td>
                  <td>{form.email}</td>
                  <td className="space-x-2">
                    <button
                      type="button"
                      onClick={() => setViewing(form)}
                      className="btn btn-primary btn-xs"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRecruiting(form);
                        setDesignation("Executive");
                      }}
                      className="btn btn-success text-white btn-xs"
                    >
                      Recruit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(form)}
                      className="btn btn-error text-white btn-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Application Modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#0b1514] border border-[#122e2a] rounded-xl p-6 max-w-xl w-full max-h-[85vh] overflow-y-auto relative space-y-3">
            <button
              type="button"
              onClick={() => setViewing(null)}
              className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
            >
              ✕
            </button>
            <h2 className="text-3xl text-[#e8f5f3]">Application — {viewing.full_name}</h2>
            <p className="text-xs text-[#30c4b6]">{viewing.email}</p>

            {[
              ["Why executive?", viewing.why_executive],
              ["Hours per week", viewing.hours_per_week],
              ["Technical skills", viewing.tech_skills],
              ["Prior club experience", viewing.experience],
              ["Leadership/teamwork rating (1–5)", viewing.leadership_rating],
              ["GitHub profile & repos", viewing.github_profile],
              ["Awards / certificates", viewing.awards],
            ].map(([label, val]) => (
              <div key={label} className="bg-[#0d1c1a] border border-[#122e2a] rounded-lg p-3">
                <span className="text-xs font-mono text-[#30c4b6] block mb-1">{label}</span>
                <p className="text-sm text-[#e8f5f3] whitespace-pre-wrap break-words">{val}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recruit Modal */}
      {recruiting && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#0b1514] border border-[#122e2a] rounded-xl p-6 max-w-md w-full relative space-y-4">
            <button
              type="button"
              onClick={() => setRecruiting(null)}
              className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
            >
              ✕
            </button>
            <h3 className="text-2xl text-[#e8f5f3]">
              Recruit {recruiting.full_name}
            </h3>
            <p className="text-xs">
              Assign a designation to atomically promote the applicant and clear their pending
              application.
            </p>
            <select
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="select select-bordered w-full bg-[#0d1c1a] text-[#e8f5f3]"
            >
              {DESIGNATIONS.filter((d) => d !== "member").map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={recruitMutation.isPending}
              onClick={() => recruitMutation.mutate({ id: recruiting.id, desig: designation })}
              className="btn w-full border-[#30c4b6] bg-[#30c4b6] text-[#080f0e]"
            >
              {recruitMutation.isPending ? "Recruiting..." : "Confirm Recruit"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
