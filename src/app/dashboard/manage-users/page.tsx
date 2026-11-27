"use client";

import { useState } from "react";
import Image from "next/image";
import { useMutation, useQuery } from "@tanstack/react-query";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { TablePageSkeleton } from "@/components/Skeletons";
import { apiFetch } from "@/lib/api-client";
import { DESIGNATIONS } from "@/lib/validators";
import type { UserRecord } from "@/types/models";

export default function ManageUsersPage() {
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [designation, setDesignation] = useState<string>("member");

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => apiFetch<UserRecord[]>("/api/users"),
  });

  const updateUser = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { role?: string; designation?: string } }) =>
      apiFetch(`/api/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      refetch();
    },
  });

  const handleMakeAdmin = async (user: UserRecord) => {
    const confirm = await Swal.fire({
      title: `Promote ${user.name} to Admin?`,
      text: "Admins have full control over users, events, blogs, and recruitment.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, make admin",
    });

    if (!confirm.isConfirmed) return;

    try {
      await updateUser.mutateAsync({ id: user.id, payload: { role: "admin" } });
      await Swal.fire("Updated!", `${user.name} is now an admin.`, "success");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  const handleSaveDesignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await updateUser.mutateAsync({ id: selectedUser.id, payload: { designation } });
      toast.success("Designation updated successfully");
      setSelectedUser(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update designation");
    }
  };

  if (isLoading) return <TablePageSkeleton rows={6} cols={6} />;

  return (
    <div className="space-y-6">
      <h1 className="text-4xl text-[#e8f5f3]">Manage Users</h1>

      <div className="overflow-x-auto bg-[#0b1514] border border-[#122e2a] rounded-xl">
        <table className="table">
          <thead>
            <tr className="text-[#30c4b6]">
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>2FA</th>
              <th>Designation</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-[#122e2a]">
                <td>
                  <div className="flex items-center gap-3">
                    <div className="avatar">
                      <div className="mask mask-squircle w-10 h-10 relative">
                        <Image
                          src={u.image_url || "/images/blank.webp"}
                          alt={u.name}
                          fill
                          sizes="40px"
                          unoptimized={(u.image_url || "").startsWith("/api/uploads/")}
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <span className="font-semibold text-[#e8f5f3]">{u.name}</span>
                  </div>
                </td>
                <td className="text-sm">{u.email}</td>
                <td>
                  <span
                    className={`badge badge-sm uppercase ${
                      u.role === "admin" ? "badge-success" : "badge-ghost"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="text-xs">{u.mfa_enabled ? "Enabled" : "Off"}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-primary btn-xs"
                    onClick={() => {
                      setSelectedUser(u);
                      setDesignation(u.designation || "member");
                    }}
                  >
                    {u.designation || "member"}
                  </button>
                </td>
                <td>
                  <button
                    type="button"
                    disabled={u.role === "admin" || updateUser.isPending}
                    onClick={() => handleMakeAdmin(u)}
                    className="btn btn-xs bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                  >
                    Make Admin
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#0b1514] border border-[#122e2a] rounded-xl p-6 max-w-md w-full relative space-y-4">
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
            >
              ✕
            </button>
            <h3 className="text-2xl text-[#e8f5f3]">
              Set Designation — {selectedUser.name}
            </h3>
            <form onSubmit={handleSaveDesignation} className="space-y-4">
              <select
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="select select-bordered w-full bg-[#0d1c1a] text-[#e8f5f3]"
              >
                {DESIGNATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={updateUser.isPending}
                className="btn w-full border-[#30c4b6] bg-[#30c4b6] text-[#080f0e]"
              >
                {updateUser.isPending ? "Saving..." : "Save Designation"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
