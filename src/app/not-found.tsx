"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Lottie from "lottie-react";

export default function NotFound() {
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    fetch("/animations/404error.json")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setAnimationData(data))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen hero-grid flex flex-col items-center justify-center p-6 text-center">
      {animationData ? (
        <Lottie animationData={animationData} loop className="w-72 md:w-96" />
      ) : (
        <h1 className="text-8xl text-[#30c4b6]">404</h1>
      )}
      <h2 className="text-3xl text-[#e8f5f3] mt-4">Page Not Found</h2>
      <p className="mt-2 max-w-md text-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="btn mt-6 border-[#30c4b6] bg-[#30c4b6] text-[#080f0e] hover:bg-[#1c9e92]"
      >
        Back to Home
      </Link>
    </div>
  );
}
