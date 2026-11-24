"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { CgSpinnerTwoAlt } from "react-icons/cg";
import LoadingSpinner from "@/components/LoadingSpinner";
import { apiFetch, uploadImage } from "@/lib/api-client";
import type { EventRecord } from "@/types/models";

interface AddSegmentValues {
  eventId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  image: FileList;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AddEventSegmentPage() {
  const [submitting, setSubmitting] = useState(false);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => apiFetch<EventRecord[]>("/api/events"),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AddSegmentValues>({
    defaultValues: {
      startDate: todayIsoDate(),
      endDate: todayIsoDate(),
    },
  });

  const onSubmit = async (values: AddSegmentValues) => {
    const file = values.image?.[0];
    if (!file) {
      toast.error("Please select an image");
      return;
    }

    setSubmitting(true);
    try {
      const imageUrl = await uploadImage(file);
      await apiFetch("/api/segments", {
        method: "POST",
        body: JSON.stringify({
          eventId: values.eventId,
          name: values.name,
          description: values.description,
          imageUrl,
          startDate: new Date(`${values.startDate}T00:00:00.000Z`).toISOString(),
          endDate: new Date(`${values.endDate}T23:59:59.000Z`).toISOString(),
        }),
      });
      toast.success("Event segment added successfully");
      reset({
        eventId: "",
        name: "",
        description: "",
        startDate: todayIsoDate(),
        endDate: todayIsoDate(),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add segment");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card bg-[#0b1514] border border-[#122e2a] shadow-2xl">
        <form className="card-body space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <h1 className="text-3xl font-bold text-center text-[#e8f5f3]">Add Event Segment</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-[#89aca8] font-semibold">Select Event*</span>
              </label>
              <select
                defaultValue=""
                className="select select-bordered w-full bg-[#0d1c1a] text-[#e8f5f3]"
                {...register("eventId", { required: "Select an event" })}
              >
                <option value="" disabled>
                  Select an event
                </option>
                {events.map((eve) => (
                  <option key={eve.id} value={eve.id}>
                    {eve.name}
                  </option>
                ))}
              </select>
              {errors.eventId && (
                <span className="text-red-500 text-xs">{errors.eventId.message}</span>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-[#89aca8] font-semibold">Segment Name*</span>
              </label>
              <input
                type="text"
                placeholder="Programming Contest"
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
              <span className="label-text text-[#89aca8] font-semibold">Segment Image*</span>
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="file-input file-input-bordered w-full bg-[#0d1c1a]"
              {...register("image", { required: "Image is required" })}
            />
            {errors.image && (
              <span className="text-red-500 text-xs">{errors.image.message}</span>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-[#89aca8] font-semibold">Description*</span>
            </label>
            <textarea
              rows={7}
              placeholder="Write segment rules and details..."
              className="textarea textarea-bordered w-full bg-[#0d1c1a] text-[#e8f5f3]"
              {...register("description", { required: "Description is required" })}
            />
            {errors.description && (
              <span className="text-red-500 text-xs">{errors.description.message}</span>
            )}
          </div>

          <div className="form-control pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn border-[#30c4b6] bg-[#30c4b6] text-[#080f0e] hover:bg-[#1c9e92]"
            >
              Add Segment {submitting && <CgSpinnerTwoAlt className="animate-spin" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
