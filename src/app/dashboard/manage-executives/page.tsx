"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { TablePageSkeleton } from "@/components/Skeletons";
import { apiFetch, uploadImage } from "@/lib/api-client";
import type { ExecutiveMemberRecord } from "@/types/models";

interface ExecutiveFormValues {
  panelYear: string;
  name: string;
  post: string;
  displayOrder: number;
  image?: FileList;
}

export default function ManageExecutivesPage() {
  const [filterYear, setFilterYear] = useState("all");
  const [editing, setEditing] = useState<ExecutiveMemberRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: members = [], isLoading, refetch } = useQuery({
    queryKey: ["executives"],
    queryFn: () => apiFetch<ExecutiveMemberRecord[]>("/api/executives"),
  });

  const years = useMemo(() => {
    const set = new Set(members.map((m) => m.panel_year));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [members]);

  const visibleMembers = useMemo(
    () => (filterYear === "all" ? members : members.filter((m) => m.panel_year === filterYear)),
    [members, filterYear]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExecutiveFormValues>({
    defaultValues: {
      panelYear: "2025-2026",
      displayOrder: 1,
    },
  });

  const deleteMember = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/executives/${id}`, { method: "DELETE" }),
    onSuccess: () => refetch(),
  });

  const startEdit = (member: ExecutiveMemberRecord) => {
    setEditing(member);
    reset({
      panelYear: member.panel_year,
      name: member.name,
      post: member.post,
      displayOrder: member.display_order,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditing(null);
    reset({ panelYear: years[0] || "2025-2026", name: "", post: "", displayOrder: 1 });
  };

  const onSubmit = async (values: ExecutiveFormValues) => {
    setSaving(true);
    try {
      let imageUrl = editing?.image_url || "/images/blank.webp";
      const file = values.image?.[0];
      if (file) {
        imageUrl = await uploadImage(file);
      }

      const payload = {
        panelYear: values.panelYear,
        name: values.name,
        post: values.post,
        displayOrder: Number(values.displayOrder) || 0,
        imageUrl,
      };

      if (editing) {
        await apiFetch(`/api/executives/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Executive member updated");
      } else {
        await apiFetch("/api/executives", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Executive member added");
      }

      cancelEdit();
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save member");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (member: ExecutiveMemberRecord) => {
    const confirm = await Swal.fire({
      title: `Remove ${member.name}?`,
      text: `${member.post} (${member.panel_year})`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
    });
    if (!confirm.isConfirmed) return;

    try {
      await deleteMember.mutateAsync(member.id);
      toast.success("Member removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  if (isLoading) return <TablePageSkeleton rows={6} cols={5} />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl text-[#e8f5f3]">Manage Executive Panels</h1>
        <p className="text-sm">
          Add future panels (e.g., 2026-2027) or update existing committee members directly in PostgreSQL.
        </p>
      </div>

      {/* Add / Edit Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="card bg-[#0b1514] border border-[#122e2a] p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl text-[#e8f5f3]">
            {editing ? `Edit: ${editing.name}` : "Add Executive Member"}
          </h2>
          {editing && (
            <button type="button" onClick={cancelEdit} className="btn btn-xs btn-ghost">
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-xs text-[#89aca8]">Panel Year*</span>
            </label>
            <input
              type="text"
              placeholder="2026-2027"
              className="input input-sm input-bordered bg-[#0d1c1a] text-[#e8f5f3]"
              {...register("panelYear", {
                required: "Required",
                pattern: { value: /^\d{4}-\d{4}$/, message: "Use YYYY-YYYY" },
              })}
            />
            {errors.panelYear && (
              <span className="text-red-500 text-xs mt-1">{errors.panelYear.message}</span>
            )}
          </div>

          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-xs text-[#89aca8]">Full Name*</span>
            </label>
            <input
              type="text"
              placeholder="Member name"
              className="input input-sm input-bordered bg-[#0d1c1a] text-[#e8f5f3]"
              {...register("name", { required: "Required" })}
            />
          </div>

          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-xs text-[#89aca8]">Post / Position*</span>
            </label>
            <input
              type="text"
              placeholder="President"
              className="input input-sm input-bordered bg-[#0d1c1a] text-[#e8f5f3]"
              {...register("post", { required: "Required" })}
            />
          </div>

          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-xs text-[#89aca8]">Order</span>
            </label>
            <input
              type="number"
              min={0}
              className="input input-sm input-bordered bg-[#0d1c1a] text-[#e8f5f3]"
              {...register("displayOrder")}
            />
          </div>

          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-xs text-[#89aca8]">Photo (optional)</span>
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="file-input file-input-sm file-input-bordered bg-[#0d1c1a]"
              {...register("image")}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn btn-sm w-fit border-[#30c4b6] bg-[#30c4b6] text-[#080f0e] hover:bg-[#1c9e92]"
        >
          {saving ? "Saving..." : editing ? "Save Changes" : "Add Member"}
        </button>
      </form>

      {/* Year Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilterYear("all")}
          className={`btn btn-xs font-mono ${
            filterYear === "all"
              ? "border-[#30c4b6] bg-[#30c4b6] text-[#080f0e]"
              : "bg-[#0b1514] border-[#122e2a] text-[#89aca8]"
          }`}
        >
          All ({members.length})
        </button>
        {years.map((yr) => (
          <button
            key={yr}
            type="button"
            onClick={() => setFilterYear(yr)}
            className={`btn btn-xs font-mono ${
              filterYear === yr
                ? "border-[#30c4b6] bg-[#30c4b6] text-[#080f0e]"
                : "bg-[#0b1514] border-[#122e2a] text-[#89aca8]"
            }`}
          >
            {yr}
          </button>
        ))}
      </div>

      {/* Members Table */}
      <div className="overflow-x-auto bg-[#0b1514] border border-[#122e2a] rounded-xl">
        <table className="table table-sm">
          <thead>
            <tr className="text-[#30c4b6]">
              <th>Member</th>
              <th>Post</th>
              <th>Panel Year</th>
              <th>Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleMembers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-[#89aca8]">
                  No executive members yet. Run <code>npm run db:seed</code> or add one above.
                </td>
              </tr>
            ) : (
              visibleMembers.map((m) => (
                <tr key={m.id} className="border-[#122e2a]">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="mask mask-squircle w-10 h-10 relative">
                          <Image
                            src={m.image_url || "/images/blank.webp"}
                            alt={m.name}
                            fill
                            sizes="40px"
                            unoptimized={(m.image_url || "").startsWith("/api/uploads/")}
                            className="object-cover"
                          />
                        </div>
                      </div>
                      <span className="font-semibold text-[#e8f5f3]">{m.name}</span>
                    </div>
                  </td>
                  <td>{m.post}</td>
                  <td className="font-mono text-xs text-[#30c4b6]">{m.panel_year}</td>
                  <td className="font-mono text-xs">{m.display_order}</td>
                  <td className="space-x-2">
                    <button
                      type="button"
                      onClick={() => startEdit(m)}
                      className="btn btn-xs btn-success text-white"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(m)}
                      className="btn btn-xs btn-error text-white"
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
    </div>
  );
}
