"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { GoHorizontalRule } from "react-icons/go";
import Title from "@/components/Title";
import Reveal from "@/components/Reveal";
import { apiFetch } from "@/lib/api-client";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

interface ContactFormValues {
  name: string;
  email: string;
  message: string;
}

export default function ContactPage() {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>();

  useEffect(() => {
    fetch("/animations/contact.json")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setAnimationData(data))
      .catch(() => {});
  }, []);

  const onSubmit = async (values: ContactFormValues) => {
    setSubmitting(true);
    try {
      const res = await apiFetch<{ message: string }>("/api/contact", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success(res.message);
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="px-6 md:px-10 lg:px-4 py-20 hero-grid min-h-screen">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-12">
          <Reveal direction="right" immediate>
            <div className="flex flex-col gap-3">
              <p className="tags text-[11px] pt-2 flex items-center font-semibold tracking-widest gap-2">
                <GoHorizontalRule className="scale-x-150" /> GET IN TOUCH
              </p>
              <Title className="uppercase">
                QUESTIONS?
                <br />
                WE&apos;RE HERE
                <br />
                FOR YOU.
              </Title>
              <p className="text-[0.95rem] mt-3 max-w-md">
                Have questions, reports, or feedback? Reach out to the MCPIC team and we&apos;ll
                get back to you as soon as possible.
              </p>
            </div>
            {animationData && <Lottie animationData={animationData} loop className="w-72 mt-4" />}
          </Reveal>

          <Reveal direction="up" delay={140} immediate>
            <div className="card shrink-0 w-full max-w-xl shadow-2xl bg-[#0b1514] border border-[#102b28] hover:border-[#30c4b6]/40 transition-colors mx-auto">
              <form className="card-body" onSubmit={handleSubmit(onSubmit)}>
                <h3 className="text-[#e8f5f3] tracking-wider text-2xl">Send a Message</h3>
                <p className="text-sm mb-2">We typically respond within 24–48 hours.</p>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-[#4a6564]">Full Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    className="input input-bordered bg-[#0d1c1a] text-[#e8f5f3] placeholder:text-[#4a6564]"
                    {...register("name", { required: "Full name is required", minLength: 2 })}
                  />
                  {errors.name && (
                    <span className="text-red-500 text-xs mt-1">{errors.name.message}</span>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-[#4a6564]">Email</span>
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="input input-bordered bg-[#0d1c1a] text-[#e8f5f3] placeholder:text-[#4a6564]"
                    {...register("email", { required: "Email is required" })}
                  />
                  {errors.email && (
                    <span className="text-red-500 text-xs mt-1">{errors.email.message}</span>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-[#4a6564]">Message</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Write your message here..."
                    className="textarea textarea-bordered w-full bg-[#0d1c1a] text-[#e8f5f3] placeholder:text-[#4a6564]"
                    {...register("message", {
                      required: "Message is required",
                      minLength: { value: 10, message: "Please write at least 10 characters" },
                    })}
                  />
                  {errors.message && (
                    <span className="text-red-500 text-xs mt-1">{errors.message.message}</span>
                  )}
                </div>

                <div className="form-control mt-6">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="text-sm font-semibold py-3 rounded-2xl px-5 border border-[#30c4b6] bg-[#30c4b6] text-[#080f0e] hover:bg-[#1c9e92] transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Sending..." : "Send Message"}
                  </button>
                </div>
              </form>
            </div>
          </Reveal>
        </div>
      </section>
  );
}
