"use client";

import { useState } from "react";
import Image from "next/image";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { TablePageSkeleton } from "@/components/Skeletons";
import { apiFetch, uploadImage } from "@/lib/api-client";
import type { AchievementRecord } from "@/types/models";

interface AchievementFormValues {
  title: string;
  tag: string;
  year: string;
  displayOrder: number;
  image?: FileList;
}

export default function ManageAchievementsPage() {
  const [editing, setEditing] = useState<AchievementRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ["achievements"],
    queryFn: () => apiFetch<AchievementRecord[]>("/api/achievements"),
  });

  const { register, handleSubmit, reset } = useForm<AchievementFormValues>({
    defaultValues: { year: String(new Date().getFullYear()), displayOrder: 1 },
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/achievements/${id}`, { method: "DELETE" }),
    onSuccess: () => refetch(),
  });

  const startEdit = (item: AchievementRecord) => {
    setEditing(item);
    reset({
      title: item.title,
      tag: item.tag,
      year: item.year || "",
      displayOrder: item.display_order,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditing(null);
    reset({ title: "", tag: "", year: String(new Date().getFullYear()), displayOrder: items.length + 1 });
  };

  const onSubmit = async (values: AchievementFormValues) => {
    const file = values.image?.[0];
    if (!editing && !file) {
      toast.error("Please select an achievement photo");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = editing?.image_url || "";
      if (file) {
        imageUrl = await uploadImage(file);
      }

      const payload = {
        title: values.title,
        tag: values.tag,
        year: values.year,
        displayOrder: Number(values.displayOrder) || 0,
        imageUrl,
      };

      if (editing) {
        await apiFetch(`/api/achievements/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Achievement updated");
      } else {
        await apiFetch("/api/achievements", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Achievement added");
      }

      cancelEdit();
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save achievement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: AchievementRecord) => {
    const confirm = await Swal.fire({
      title: `Delete "${item.title}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
    });
    if (!confirm.isConfirmed) return;

    try {
      await deleteItem.mutateAsync(item.id);
      toast.success("Achievement removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  if (isLoading) return <TablePageSkeleton rows={5} cols={4} />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl text-[#e8f5f3]">Manage Achievements Gallery</h1>
        <p className="text-sm">
          Upload and reorder trophies and highlights displayed in the homepage Achievements section.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="card bg-[#0b1514] border border-[#122e2a] p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl text-[#e8f5f3]">
            {editing ? `Edit: ${editing.title}` : "Add Achievement"}
          </h2>
          {editing && (
            <button type="button" onClick={cancelEdit} className="btn btn-xs btn-ghost">
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="form-control lg:col-span-2">
            <label className="label py-1">
              <span className="label-text text-xs text-[#89aca8]">Title*</span>
            </label>
            <input
              type="text"
              placeholder="Inter-College Olympiad Champion"
              className="input input-sm input-bordered bg-[#0d1c1a] text-[#e8f5f3]"
              {...register("title", { required: true })}
            />
          </div>

          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-xs text-[#89aca8]">Category Tag*</span>
            </label>
            <input
              type="text"
              placeholder="National Award"
              className="input input-sm input-bordered bg-[#0d1c1a] text-[#e8f5f3]"
              {...register("tag", { required: true })}
            />
          </div>

          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-xs text-[#89aca8]">Year &amp; Order</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="2025"
                className="input input-sm input-bordered bg-[#0d1c1a] text-[#e8f5f3] w-1/2"
                {...register("year")}
              />
              <input
                type="number"
                min={0}
                placeholder="#"
                className="input input-sm input-bordered bg-[#0d1c1a] text-[#e8f5f3] w-1/2"
                {...register("displayOrder")}
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-xs text-[#89aca8]">
                Photo {editing ? "(optional)" : "*"}
              </span>
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
          {saving ? "Saving..." : editing ? "Save Changes" : "Add Achievement"}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="card bg-[#0b1514] border border-[#122e2a] overflow-hidden"
          >
            <figure className="relative h-44 w-full">
              <Image
                src={item.image_url}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                unoptimized={item.image_url.startsWith("/api/uploads/")}
                className="object-cover"
              />
            </figure>
            <div className="card-body p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="badge badge-sm bg-[#102220] border-[#17403b] text-[#30c4b6] font-mono">
                  {item.tag}
                </span>
                <span className="text-xs font-mono text-[#89aca8]">
                  #{item.display_order} {item.year ? `· ${item.year}` : ""}
                </span>
              </div>
              <h3 className="text-xl text-[#e8f5f3]">{item.title}</h3>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="btn btn-xs btn-success text-white"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  className="btn btn-xs btn-error text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
