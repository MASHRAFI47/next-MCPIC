"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { CgSpinnerTwoAlt } from "react-icons/cg";
import LoadingSpinner from "@/components/LoadingSpinner";
import { apiFetch, uploadImage } from "@/lib/api-client";
import type { EventRecord, SegmentRecord } from "@/types/models";

interface UpdateSegmentValues {
  eventId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  image?: FileList;
}

function toIsoDateInput(value?: string): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
}

export default function UpdateEventSegmentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";

  const [saving, setSaving] = useState(false);

  const { data: segment, isLoading: loadingSegment } = useQuery({
    queryKey: ["segment", id],
    enabled: Boolean(id),
    queryFn: () => apiFetch<SegmentRecord>(`/api/segments/${encodeURIComponent(id)}`),
  });

  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ["events"],
    queryFn: () => apiFetch<EventRecord[]>("/api/events"),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UpdateSegmentValues>();

  useEffect(() => {
    if (segment) {
      reset({
        eventId: segment.event_id,
        name: segment.name,
        description: segment.description,
        startDate: toIsoDateInput(segment.start_date),
        endDate: toIsoDateInput(segment.end_date),
      });
    }
  }, [segment, reset]);

  const onSubmit = async (values: UpdateSegmentValues) => {
    if (!segment) return;
    setSaving(true);
    try {
      let imageUrl = segment.image_url;
      const newFile = values.image?.[0];
      if (newFile) {
        imageUrl = await uploadImage(newFile);
      }

      await apiFetch(`/api/segments/${segment.id}`, {
        method: "PUT",
        body: JSON.stringify({
          eventId: values.eventId,
          name: values.name,
          description: values.description,
          imageUrl,
          startDate: new Date(`${values.startDate}T00:00:00.000Z`).toISOString(),
          endDate: new Date(`${values.endDate}T23:59:59.000Z`).toISOString(),
        }),
      });
      toast.success("Segment updated successfully");
      router.push(`/dashboard/all-event-segments/${values.eventId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update segment");
    } finally {
      setSaving(false);
    }
  };

  if (loadingSegment || loadingEvents) return <LoadingSpinner />;
  if (!segment) return <p className="text-red-400">Segment not found.</p>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card bg-[#0b1514] border border-[#122e2a] shadow-2xl">
        <form className="card-body space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <h1 className="text-3xl font-bold text-center text-[#e8f5f3]">Update Event Segment</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-[#89aca8] font-semibold">Event*</span>
              </label>
              <select
                className="select select-bordered w-full bg-[#0d1c1a] text-[#e8f5f3]"
                {...register("eventId", { required: "Select an event" })}
              >
                {events.map((eve) => (
                  <option key={eve.id} value={eve.id}>
                    {eve.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-[#89aca8] font-semibold">Segment Name*</span>
              </label>
              <input
                type="text"
                className="input input-bordered bg-[#0d1c1a] text-[#e8f5f3]"
                {...register("name", { required: "Segment name is required" })}
              />
              {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-[#89aca8] font-semibold">Start Date*</span>
              </label>
              <input
                type="date"
                className="input input-bordered bg-[#0d1c1a] text-[#e8f5f3]"
                {...register("startDate", { required: "Start date is required" })}
              />
              {errors.startDate && (
                <span className="text-red-500 text-xs">{errors.startDate.message}</span>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-[#89aca8] font-semibold">End Date*</span>
              </label>
              <input
                type="date"
                className="input input-bordered bg-[#0d1c1a] text-[#e8f5f3]"
                {...register("endDate", {
                  required: "End date is required",
                  validate: (val) =>
                    !watch("startDate") ||
                    val >= watch("startDate") ||
                    "End date must be on or after start date",
                })}
              />
              {errors.endDate && (
                <span className="text-red-500 text-xs">{errors.endDate.message}</span>
              )}
            </div>
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

          <div className="form-control">
            <label className="label">
              <span className="label-text text-[#89aca8] font-semibold">Description*</span>
            </label>
            <textarea
              rows={7}
              className="textarea textarea-bordered w-full bg-[#0d1c1a] text-[#e8f5f3]"
              {...register("description", { required: "Description is required" })}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn border-[#30c4b6] bg-[#30c4b6] text-[#080f0e] hover:bg-[#1c9e92]"
          >
            Update Segment {saving && <CgSpinnerTwoAlt className="animate-spin" />}
          </button>
        </form>
      </div>
    </div>
  );
}
