"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { CgSpinnerTwoAlt } from "react-icons/cg";
import { apiFetch, uploadImage } from "@/lib/api-client";

interface AddEventValues {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  image: FileList;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AddEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AddEventValues>({
    defaultValues: {
      startDate: todayIsoDate(),
      endDate: todayIsoDate(),
    },
  });

  const onSubmit = async (values: AddEventValues) => {
    const file = values.image?.[0];
    if (!file) {
      toast.error("Please upload an event image");
      return;
    }

    setLoading(true);
    try {
      const imageUrl = await uploadImage(file);
      await apiFetch("/api/events", {
        method: "POST",
        body: JSON.stringify({
          name: values.name,
          description: values.description,
          imageUrl,
          startDate: new Date(`${values.startDate}T00:00:00.000Z`).toISOString(),
          endDate: new Date(`${values.endDate}T23:59:59.000Z`).toISOString(),
        }),
      });
      toast.success("Event added successfully");
      router.push("/dashboard/all-events");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="card bg-[#0b1514] border border-[#122e2a] shadow-2xl">
        <form className="card-body space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <h1 className="text-3xl font-bold text-center text-[#e8f5f3]">Add Event</h1>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-[#89aca8]">Event Name</span>
            </label>
            <input
              type="text"
              placeholder="CyberSprint"
              className="input input-bordered bg-[#0d1c1a] text-[#e8f5f3]"
              {...register("name", { required: "Event name is required" })}
            />
            {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-[#89aca8]">Event Description</span>
            </label>
            <textarea
              rows={4}
              placeholder="Short description for this event..."
              className="textarea textarea-bordered bg-[#0d1c1a] text-[#e8f5f3]"
              {...register("description", {
                required: "Description is required",
                minLength: { value: 10, message: "At least 10 characters" },
              })}
            />
            {errors.description && (
              <span className="text-red-500 text-xs">{errors.description.message}</span>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-[#89aca8]">Banner Image (JPG/PNG/WebP)</span>
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="file-input file-input-bordered w-full bg-[#0d1c1a]"
              {...register("image", { required: "Image is required" })}
            />
            {errors.image && <span className="text-red-500 text-xs">{errors.image.message}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-[#89aca8]">Start Date</span>
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
                <span className="label-text text-[#89aca8]">End Date</span>
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

          <div className="form-control pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn border-[#30c4b6] bg-[#30c4b6] text-[#080f0e] hover:bg-[#1c9e92]"
            >
              Add Event {loading && <CgSpinnerTwoAlt className="animate-spin" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
