"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FormCardSkeleton } from "@/components/Skeletons";
import { apiFetch, uploadImage } from "@/lib/api-client";
import type { BlogRecord } from "@/types/models";

interface UpdateBlogValues {
  title: string;
  description: string;
  image?: FileList;
}

export default function UpdateBlogPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";
  const [saving, setSaving] = useState(false);

  const { data: blog, isLoading } = useQuery({
    queryKey: ["blog", id],
    enabled: Boolean(id),
    queryFn: () => apiFetch<BlogRecord>(`/api/blogs/${encodeURIComponent(id)}`),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateBlogValues>();

  useEffect(() => {
    if (blog) {
      reset({ title: blog.title, description: blog.description });
    }
  }, [blog, reset]);

  const onSubmit = async (values: UpdateBlogValues) => {
    if (!blog) return;
    setSaving(true);
    try {
      let imageUrl = blog.image_url;
      const newFile = values.image?.[0];
      if (newFile) {
        imageUrl = await uploadImage(newFile);
      }

      await apiFetch(`/api/blogs/${blog.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          imageUrl,
        }),
      });
      toast.success("Blog updated successfully");
      router.push("/dashboard/all-blogs");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update blog");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <FormCardSkeleton fields={4} />;
  if (!blog) return <p className="text-red-400">Blog not found.</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card bg-[#0b1514] border border-[#122e2a] shadow-2xl">
        <form className="card-body space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <h1 className="text-3xl font-bold text-center text-[#e8f5f3]">Update Blog</h1>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-[#89aca8] font-semibold">Blog Title</span>
            </label>
            <input
              type="text"
              className="input input-bordered bg-[#0d1c1a] text-[#e8f5f3]"
              {...register("title", { required: "Title is required" })}
            />
            {errors.title && <span className="text-red-500 text-xs">{errors.title.message}</span>}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-[#89aca8] font-semibold">Blog Description</span>
            </label>
            <textarea
              rows={7}
              className="textarea textarea-bordered bg-[#0d1c1a] text-[#e8f5f3]"
              {...register("description", { required: "Description is required" })}
            />
            {errors.description && (
              <span className="text-red-500 text-xs">{errors.description.message}</span>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-[#89aca8] font-semibold">
                Replace Image (optional)
              </span>
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="file-input file-input-bordered w-full bg-[#0d1c1a]"
              {...register("image")}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn mt-4 border-[#30c4b6] bg-[#30c4b6] text-[#080f0e] hover:bg-[#1c9e92]"
          >
            {saving ? "Updating Blog..." : "Update Blog"}
          </button>
        </form>
      </div>
    </div>
  );
}
