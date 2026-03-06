"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black text-black dark:text-white px-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-3 font-bengali">
        কিছু একটা ভুল হয়েছে
      </h1>
      <p className="text-sm md:text-base text-black/60 dark:text-white/70 mb-6 text-center font-bengali max-w-md">
        আমরা এই মুহূর্তে পেজটি লোড করতে পারছি না। অনুগ্রহ করে আবার চেষ্টা করুন।
      </p>
      <Button onClick={reset} variant="secondary">
        আবার চেষ্টা করুন
      </Button>
    </div>
  );
}

