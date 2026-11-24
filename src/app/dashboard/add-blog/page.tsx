"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { CgSpinnerTwoAlt } from "react-icons/cg";
import { apiFetch, uploadImage } from "@/lib/api-client";

interface AddBlogValues {
  title: string;
  description: string;
  image: FileList;
}

export default function AddBlogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddBlogValues>();

  const onSubmit = async (values: AddBlogValues) => {
    const file = values.image?.[0];
    if (!file) {
      toast.error("Please select an image");
      return;
    }

    setLoading(true);
    try {
      const imageUrl = await uploadImage(file);
      await apiFetch("/api/blogs", {
        method: "POST",
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          imageUrl,
        }),
      });
      toast.success("Blog published successfully");
      reset();
      router.push("/dashboard/all-blogs");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish blog");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card bg-[#0b1514] border border-[#122e2a] shadow-2xl">
        <form className="card-body space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <h1 className="text-3xl font-bold text-center text-[#e8f5f3]">Add Blog</h1>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-[#89aca8] font-semibold">Blog Title</span>
            </label>
            <input
              type="text"
              placeholder="Title"
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
              placeholder="Write your post..."
              className="textarea textarea-bordered bg-[#0d1c1a] text-[#e8f5f3]"
              {...register("description", { required: "Description is required" })}
            />
            {errors.description && (
              <span className="text-red-500 text-xs">{errors.description.message}</span>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-[#89aca8] font-semibold">Image</span>
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="file-input file-input-bordered w-full bg-[#0d1c1a]"
              {...register("image", { required: "Image is required" })}
            />
            {errors.image && <span className="text-red-500 text-xs">{errors.image.message}</span>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn mt-4 border-[#30c4b6] bg-[#30c4b6] text-[#080f0e] hover:bg-[#1c9e92]"
          >
            Publish Blog {loading && <CgSpinnerTwoAlt className="animate-spin" />}
          </button>
        </form>
      </div>
    </div>
  );
}
