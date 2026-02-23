"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}


const CALLBACK_URL = "/";

export function SocialLogin() {
  const searchParams = useSearchParams();
  const [loadingProvider, setLoadingProvider] = useState<"google" | "facebook" | null>(null);
  const [error, setError] = useState("");

  const errorFromUrl = searchParams.get("error");
  const showError =
    error ||
    (errorFromUrl === "OAuthAccountNotLinked"
      ? "এই ইমেইল অন্য পদ্ধতিতে নিবন্ধিত। একই পদ্ধতি দিয়ে লগইন করুন।"
      : errorFromUrl === "OAuthCallback" || errorFromUrl === "OAuthCreateAccount"
        ? "সামাজিক লগইনে ত্রুটি হয়েছে। আবার চেষ্টা করুন।"
        : "");

  const handleSocialSignIn = async (provider: "google" | "facebook") => {
    setError("");
    setLoadingProvider(provider);
    try {
      await signIn(provider, { callbackUrl: CALLBACK_URL, redirect: true });
      setLoadingProvider(null);
    } catch (err) {
      console.error("Social sign-in error:", err);
      setError("সামাজিক লগইনে ত্রুটি হয়েছে। আবার চেষ্টা করুন।");
      setLoadingProvider(null);
    }
  };

  const googleLoading = loadingProvider === "google";

  return (
    <div className="space-y-3">
      {showError && (
        <p
          className="text-sm text-amber-500 dark:text-amber-400 text-center font-bengali bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/30 dark:border-amber-500/30 rounded-lg px-3 py-2"
          role="alert"
        >
          {showError}
        </p>
      )}
      <button
        type="button"
        onClick={() => handleSocialSignIn("google")}
        disabled={!!loadingProvider}
        className="w-full py-3 bg-white cursor-pointer text-black rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors font-bengali disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-white"
      >
        {googleLoading ? (
          <Spinner size="md" className="text-gray-600" />
        ) : (
          <GoogleIcon className="w-5 h-5 shrink-0" />
        )}
        {googleLoading ? "লগইন হচ্ছে..." : "গুগল দিয়ে লগিন করুন"}
      </button>

    </div>
  );
}
