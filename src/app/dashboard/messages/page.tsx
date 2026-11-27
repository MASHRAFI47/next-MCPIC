"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format, isValid } from "date-fns";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { TablePageSkeleton } from "@/components/Skeletons";
import { apiFetch } from "@/lib/api-client";
import type { ContactMessageRecord } from "@/types/models";

const STATUS_TABS = ["all", "unread", "read", "resolved"] as const;
type FilterTab = (typeof STATUS_TABS)[number];

function fmtDate(val: string): string {
  const d = new Date(val);
  return isValid(d) ? format(d, "MMM d, yyyy · h:mm a") : "—";
}

export default function MessagesInboxPage() {
  const [tab, setTab] = useState<FilterTab>("all");
  const [selected, setSelected] = useState<ContactMessageRecord | null>(null);

  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-messages", tab],
    queryFn: () =>
      apiFetch<ContactMessageRecord[]>(
        tab === "all" ? "/api/admin/messages" : `/api/admin/messages?status=${tab}`
      ),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "unread" | "read" | "resolved" }) =>
      apiFetch<ContactMessageRecord>(`/api/admin/messages/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: (updated) => {
      toast.success(`Marked as ${updated.status}`);
      if (selected?.id === updated.id) setSelected(updated);
      refetch();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update message");
    },
  });

  const deleteMessage = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/admin/messages/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      setSelected(null);
      refetch();
    },
  });

  const handleOpen = (msg: ContactMessageRecord) => {
    setSelected(msg);
    if (msg.status === "unread") {
      updateStatus.mutate({ id: msg.id, status: "read" });
    }
  };

  const handleDelete = async (msg: ContactMessageRecord) => {
    const confirm = await Swal.fire({
      title: `Delete message from ${msg.name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
    });
    if (!confirm.isConfirmed) return;

    try {
      await deleteMessage.mutateAsync(msg.id);
      toast.success("Message deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  if (isLoading) return <TablePageSkeleton rows={5} cols={4} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl text-[#e8f5f3]">Contact Messages Inbox</h1>
          <p className="text-sm">Review and resolve messages submitted through the Contact page.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`btn btn-xs uppercase font-mono ${
                tab === t
                  ? "border-[#30c4b6] bg-[#30c4b6] text-[#080f0e]"
                  : "bg-[#0b1514] border-[#122e2a] text-[#89aca8]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto bg-[#0b1514] border border-[#122e2a] rounded-xl">
        <table className="table">
          <thead>
            <tr className="text-[#30c4b6]">
              <th>Sender</th>
              <th>Preview</th>
              <th>Status</th>
              <th>Received</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-[#89aca8]">
                  No messages found in this view.
                </td>
              </tr>
            ) : (
              messages.map((msg) => (
                <tr key={msg.id} className="border-[#122e2a]">
                  <td>
                    <div className="font-semibold text-[#e8f5f3]">{msg.name}</div>
                    <div className="text-xs text-[#89aca8]">{msg.email}</div>
                  </td>
                  <td className="max-w-md">
                    <p className="text-sm line-clamp-2">{msg.message}</p>
                  </td>
                  <td>
                    <span
                      className={`badge badge-sm uppercase font-mono ${
                        msg.status === "unread"
                          ? "badge-warning"
                          : msg.status === "resolved"
                          ? "badge-success"
                          : "badge-ghost"
                      }`}
                    >
                      {msg.status}
                    </span>
                  </td>
                  <td className="text-xs whitespace-nowrap">{fmtDate(msg.created_at)}</td>
                  <td className="space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleOpen(msg)}
                      className="btn btn-xs btn-primary"
                    >
                      Read
                    </button>
                    {msg.status !== "resolved" && (
                      <button
                        type="button"
                        onClick={() => updateStatus.mutate({ id: msg.id, status: "resolved" })}
                        className="btn btn-xs btn-success text-white"
                      >
                        Resolve
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(msg)}
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

      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-[#0b1514] border border-[#17403b] rounded-2xl max-w-xl w-full p-6 space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
            >
              ✕
            </button>
            <div>
              <span className="font-mono text-xs uppercase text-[#30c4b6]">{selected.status}</span>
              <h2 className="text-3xl text-[#e8f5f3]">{selected.name}</h2>
              <p className="text-xs text-[#89aca8]">
                {selected.email} · {fmtDate(selected.created_at)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#0d1c1a] border border-[#122e2a] text-sm text-[#e8f5f3] whitespace-pre-wrap break-words">
              {selected.message}
            </div>
            <div className="flex flex-wrap gap-2 justify-end pt-2">
              <a
                href={`mailto:${encodeURIComponent(selected.email)}?subject=${encodeURIComponent("Re: MCPIC Inquiry")}`}
                className="btn btn-sm bg-[#0d1c1a] border-[#17403b] text-[#e8f5f3]"
              >
                Reply via Email
              </a>
              {selected.status !== "resolved" && (
                <button
                  type="button"
                  onClick={() => updateStatus.mutate({ id: selected.id, status: "resolved" })}
                  className="btn btn-sm btn-success text-white"
                >
                  Mark Resolved
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDelete(selected)}
                className="btn btn-sm btn-error text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
