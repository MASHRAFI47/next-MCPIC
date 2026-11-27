"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { format, isValid } from "date-fns";
import toast from "react-hot-toast";
import { GoHorizontalRule } from "react-icons/go";
import Title from "@/components/Title";
import { SegmentDetailsSkeleton } from "@/components/Skeletons";
import { apiFetch } from "@/lib/api-client";
import type { SegmentRecord } from "@/types/models";

interface RegistrationFormValues {
  participantName: string;
  email: string;
  phone: string;
  institution: string;
  classGrade: string;
  teamName?: string;
  teamMembers?: string;
}

interface TicketResponse {
  id: string;
  ticket_code: string;
  participant_name: string;
  email: string;
  team_name: string | null;
}

function safeFormat(dateStr?: string | null): string {
  if (!dateStr) return "TBA";
  const d = new Date(dateStr);
  return isValid(d) ? format(d, "MMM d, yyyy") : "TBA";
}

export default function SegmentDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const { data: session } = useSession();
  const [ticket, setTicket] = useState<TicketResponse | null>(null);

  const { data: segment, isLoading, error, refetch } = useQuery({
    queryKey: ["segment", id],
    enabled: Boolean(id),
    queryFn: () => apiFetch<SegmentRecord>(`/api/segments/${encodeURIComponent(id)}`),
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RegistrationFormValues>();

  useEffect(() => {
    if (session?.user) {
      setValue("participantName", session.user.name || "");
      setValue("email", session.user.email || "");
    }
  }, [session?.user, setValue]);

  const registerMutation = useMutation({
    mutationFn: (payload: RegistrationFormValues) =>
      apiFetch<TicketResponse>(`/api/segments/${encodeURIComponent(id)}/registrations`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      setTicket(data);
      toast.success(`Registered! Ticket: ${data.ticket_code}`);
      reset();
      refetch();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    },
  });

  const deadlinePassed = Boolean(
    segment?.registration_deadline && new Date() > new Date(segment.registration_deadline)
  );
  const seatsLeft =
    segment?.max_participants != null
      ? Math.max(0, segment.max_participants - (segment.confirmed_count ?? 0))
      : null;
  const isFull = seatsLeft !== null && seatsLeft <= 0;
  const canRegister = Boolean(segment?.registration_open && !deadlinePassed && !isFull);

  return (
    <section className="min-h-screen hero-grid py-12 px-6 md:px-10 lg:px-4">
      <div className="container mx-auto">
        {isLoading ? (
          <SegmentDetailsSkeleton />
        ) : error || !segment ? (
          <div className="py-20 text-center">
            <h2 className="text-3xl text-[#e8f5f3]">Segment Not Found</h2>
            <Link
              href="/events"
              className="btn mt-4 border-[#30c4b6] bg-[#30c4b6] text-[#080f0e]"
            >
              Back to Events
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 mb-10">
              <p className="tags text-[11px] pt-2 flex items-center font-semibold tracking-widest gap-2">
                <GoHorizontalRule className="scale-x-150" /> EVENT
              </p>
              <Title className="uppercase">{segment.event_name || "Event"}</Title>
              <p className="text-[0.95rem]">
                {segment.event_name} — {segment.name} Details
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Main Segment Info + Registration Form */}
              <div className="lg:col-span-8 space-y-8">
                <div>
                  <h2 className="text-3xl mb-4">
                    <span className="text-[#e8f5f3]">Segment Name: </span>
                    <span className="text-[#30c4b6]">{segment.name}</span>
                  </h2>
                  <div className="relative w-full h-[340px] rounded-xl overflow-hidden border border-[#122e2a]">
                    <Image
                      src={segment.image_url}
                      fill
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      unoptimized={segment.image_url.startsWith("/api/uploads/")}
                      className="object-cover"
                      alt={segment.name}
                    />
                  </div>
                  <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-[#c5dbd8]">
                    <span className="font-bold text-[#e8f5f3] block mb-2">Description:</span>
                    {segment.description}
                  </div>
                </div>

                {/* Online Registration Card */}
                <div className="card bg-[#0b1514] border border-[#122e2a] rounded-2xl p-6 md:p-8 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="font-mono text-[11px] uppercase tracking-widest text-[#30c4b6]">
                        Online Registration
                      </span>
                      <h3 className="text-3xl text-[#e8f5f3]">Register for {segment.name}</h3>
                    </div>
                    <span
                      className={`badge font-mono text-xs ${
                        canRegister
                          ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                          : "bg-red-950 text-red-300 border-red-800"
                      }`}
                    >
                      {canRegister
                        ? seatsLeft !== null
                          ? `${seatsLeft} seats left`
                          : "Open"
                        : isFull
                        ? "Full"
                        : deadlinePassed
                        ? "Deadline Passed"
                        : "Closed"}
                    </span>
                  </div>

                  {ticket ? (
                    <div className="rounded-xl bg-[#0d1c1a] border border-[#30c4b6] p-6 space-y-3">
                      <span className="font-mono text-xs uppercase tracking-widest text-[#30c4b6]">
                        Registration Confirmed
                      </span>
                      <h4 className="text-3xl text-[#e8f5f3] font-mono tracking-wider">
                        {ticket.ticket_code}
                      </h4>
                      <p className="text-sm text-[#c5dbd8]">
                        Participant: <strong className="text-white">{ticket.participant_name}</strong>{" "}
                        ({ticket.email})
                        {ticket.team_name ? ` · Team: ${ticket.team_name}` : ""}
                      </p>
                      <p className="text-xs text-[#89aca8]">
                        Save this ticket code for event check-in. Signed-in members can view all
                        tickets anytime under{" "}
                        <Link href="/dashboard/my-registrations" className="text-[#30c4b6] underline">
                          Dashboard → My Registrations
                        </Link>
                        .
                      </p>
                      <button
                        type="button"
                        onClick={() => setTicket(null)}
                        className="btn btn-xs btn-ghost text-[#30c4b6]"
                      >
                        Register another participant
                      </button>
                    </div>
                  ) : !canRegister ? (
                    <p className="text-sm text-[#89aca8]">
                      {isFull
                        ? "All seats for this segment have been filled."
                        : deadlinePassed
                        ? "The registration deadline for this segment has passed."
                        : "Online registration is currently closed for this segment."}
                    </p>
                  ) : (
                    <form
                      onSubmit={handleSubmit((vals) => registerMutation.mutate(vals))}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text text-[#89aca8]">Full Name*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Your full name"
                            className="input input-bordered bg-[#0d1c1a] text-[#e8f5f3]"
                            {...register("participantName", { required: "Full name is required" })}
                          />
                          {errors.participantName && (
                            <span className="text-red-500 text-xs mt-1">
                              {errors.participantName.message}
                            </span>
                          )}
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text text-[#89aca8]">Email*</span>
                          </label>
                          <input
                            type="email"
                            placeholder="your@email.com"
                            className="input input-bordered bg-[#0d1c1a] text-[#e8f5f3]"
                            {...register("email", { required: "Email is required" })}
                          />
                          {errors.email && (
                            <span className="text-red-500 text-xs mt-1">
                              {errors.email.message}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text text-[#89aca8]">Phone Number*</span>
                          </label>
                          <input
                            type="tel"
                            placeholder="+8801XXXXXXXXX"
                            className="input input-bordered bg-[#0d1c1a] text-[#e8f5f3]"
                            {...register("phone", { required: "Phone is required" })}
                          />
                          {errors.phone && (
                            <span className="text-red-500 text-xs mt-1">
                              {errors.phone.message}
                            </span>
                          )}
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text text-[#89aca8]">Institution*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="School / College"
                            className="input input-bordered bg-[#0d1c1a] text-[#e8f5f3]"
                            {...register("institution", { required: "Institution is required" })}
                          />
                          {errors.institution && (
                            <span className="text-red-500 text-xs mt-1">
                              {errors.institution.message}
                            </span>
                          )}
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text text-[#89aca8]">Class / Grade*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Class 11 (Sec A)"
                            className="input input-bordered bg-[#0d1c1a] text-[#e8f5f3]"
                            {...register("classGrade", { required: "Class/Grade is required" })}
                          />
                          {errors.classGrade && (
                            <span className="text-red-500 text-xs mt-1">
                              {errors.classGrade.message}
                            </span>
                          )}
                        </div>
                      </div>

                      {segment.is_team_based && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                          <div className="form-control">
                            <label className="label">
                              <span className="label-text text-[#89aca8]">
                                Team Name* (max {segment.max_team_size ?? 3} members)
                              </span>
                            </label>
                            <input
                              type="text"
                              placeholder="Team CyberWolves"
                              className="input input-bordered bg-[#0d1c1a] text-[#e8f5f3]"
                              {...register("teamName", { required: "Team name is required" })}
                            />
                            {errors.teamName && (
                              <span className="text-red-500 text-xs mt-1">
                                {errors.teamName.message}
                              </span>
                            )}
                          </div>

                          <div className="form-control">
                            <label className="label">
                              <span className="label-text text-[#89aca8]">
                                Other Team Members (names)
                              </span>
                            </label>
                            <input
                              type="text"
                              placeholder="Member 2, Member 3"
                              className="input input-bordered bg-[#0d1c1a] text-[#e8f5f3]"
                              {...register("teamMembers")}
                            />
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={registerMutation.isPending}
                        className="btn w-full sm:w-auto px-8 border-[#30c4b6] bg-[#30c4b6] text-[#080f0e] hover:bg-[#1c9e92] rounded-xl"
                      >
                        {registerMutation.isPending ? "Submitting..." : "Confirm Registration"}
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Sticky Details Sidebar */}
              <aside className="lg:col-span-4">
                <div className="border border-[#122e2a] bg-[#0b1514] rounded-2xl p-6 sticky top-24 space-y-1">
                  <h5 className="text-[#30c4b6] font-mono text-xs tracking-widest uppercase pb-3">
                    Event Details
                  </h5>
                  <div className="border-b border-[#102b28] py-3">
                    <h6 className="text-[#dee8f6] tracking-widest text-sm">FROM</h6>
                    <p className="text-sm">{safeFormat(segment.start_date)}</p>
                  </div>
                  <div className="border-b border-[#102b28] py-3">
                    <h6 className="text-[#dee8f6] tracking-widest text-sm">TO</h6>
                    <p className="text-sm">{safeFormat(segment.end_date)}</p>
                  </div>
                  <div className="border-b border-[#102b28] py-3">
                    <h6 className="text-[#dee8f6] tracking-widest text-sm">FORMAT</h6>
                    <p className="text-sm">
                      {segment.is_team_based
                        ? `Team (up to ${segment.max_team_size ?? 3} members)`
                        : "Individual (Solo)"}
                    </p>
                  </div>
                  {segment.registration_deadline && (
                    <div className="border-b border-[#102b28] py-3">
                      <h6 className="text-[#dee8f6] tracking-widest text-sm">
                        REGISTRATION DEADLINE
                      </h6>
                      <p className="text-sm">{safeFormat(segment.registration_deadline)}</p>
                    </div>
                  )}
                  <div className="border-b border-[#102b28] py-3">
                    <h6 className="text-[#dee8f6] tracking-widest text-sm">REGISTERED</h6>
                    <p className="text-sm">
                      {segment.confirmed_count ?? 0}
                      {segment.max_participants ? ` / ${segment.max_participants}` : " participants"}
                    </p>
                  </div>
                  <div className="py-3">
                    <h6 className="text-[#dee8f6] tracking-widest text-sm">VENUE</h6>
                    <p className="text-sm">MCPSC Premises</p>
                  </div>
                  {segment.event_slug && (
                    <Link
                      href={`/events/${encodeURIComponent(segment.event_slug)}`}
                      className="btn btn-sm w-full mt-3 border-[#30c4b6] bg-transparent text-[#30c4b6] hover:bg-[#30c4b6] hover:text-[#080f0e]"
                    >
                      All Segments
                    </Link>
                  )}
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
