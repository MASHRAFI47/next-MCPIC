"use client";

import Link from "next/link";
import Image from "next/image";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format, isValid } from "date-fns";
import { FaRegEdit } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { TablePageSkeleton } from "@/components/Skeletons";
import { apiFetch } from "@/lib/api-client";
import type { BlogRecord } from "@/types/models";

function fmt(value: string): string {
  const d = new Date(value);
  return isValid(d) ? format(d, "PPp") : "—";
}

export default function AllBlogsPage() {
  const { data: blogs = [], isLoading, refetch } = useQuery({
    queryKey: ["blogs"],
    queryFn: () => apiFetch<BlogRecord[]>("/api/blogs"),
  });

  const deleteBlog = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/blogs/${id}`, { method: "DELETE" }),
    onSuccess: () => refetch(),
  });

  const handleDelete = async (blog: BlogRecord) => {
    const confirm = await Swal.fire({
      title: `Delete "${blog.title}"?`,
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
    });

    if (!confirm.isConfirmed) return;

    try {
      await deleteBlog.mutateAsync(blog.id);
      await Swal.fire("Deleted!", "Blog post has been removed.", "success");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete blog");
    }
  };

  if (isLoading) return <TablePageSkeleton rows={5} cols={4} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl text-[#e8f5f3]">All Blogs</h1>
        <Link
          href="/dashboard/add-blog"
          className="btn btn-sm border-[#30c4b6] bg-[#30c4b6] text-[#080f0e]"
        >
          + Add Blog
        </Link>
      </div>

      <div className="overflow-x-auto bg-[#0b1514] border border-[#122e2a] rounded-xl">
        <table className="table">
          <thead>
            <tr className="text-[#30c4b6]">
              <th>Title</th>
              <th>Publisher</th>
              <th>Published Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {blogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-[#89aca8]">
                  No blogs published yet.
                </td>
              </tr>
            ) : (
              blogs.map((blog) => (
                <tr key={blog.id} className="border-[#122e2a]">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="mask mask-squircle w-12 h-12 relative">
                          <Image
                            src={blog.image_url}
                            alt={blog.title}
                            fill
                            sizes="48px"
                            unoptimized={blog.image_url.startsWith("/api/uploads/")}
                            className="object-cover"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-[#e8f5f3]">{blog.title}</div>
                        <div className="text-xs opacity-60">Updated: {fmt(blog.updated_at)}</div>
                      </div>
                    </div>
                  </td>
                  <td>{blog.publisher_name}</td>
                  <td className="text-sm">{fmt(blog.created_at)}</td>
                  <td className="flex items-center gap-1">
                    <Link
                      href={`/dashboard/update-blog/${blog.id}`}
                      className="btn btn-ghost btn-sm text-emerald-400 text-lg"
                      aria-label="Edit blog"
                    >
                      <FaRegEdit />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(blog)}
                      className="btn btn-ghost btn-sm text-red-400 text-lg"
                      aria-label="Delete blog"
                    >
                      <FaRegTrashCan />
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
