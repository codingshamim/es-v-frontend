"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CloseIcon, PhoneIcon } from "@/components/icons";
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

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

type QuickLoginModalProps = {
  open: boolean;
  onClose: () => void;
  /** URL to redirect to after login (for OAuth). Defaults to current page. */
  callbackUrl?: string;
};

export function QuickLoginModal({ open, onClose, callbackUrl }: QuickLoginModalProps) {
  const router = useRouter();
  const [loadingProvider, setLoadingProvider] = useState<"google" | "facebook" | null>(null);

  const redirectUrl =
    callbackUrl && typeof window !== "undefined"
      ? callbackUrl
      : typeof window !== "undefined"
        ? window.location.href
        : "/";

  const handleGoogleSignIn = async () => {
    setLoadingProvider("google");
    try {
      await signIn("google", { callbackUrl: redirectUrl, redirect: true });
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleFacebookSignIn = async () => {
    setLoadingProvider("facebook");
    try {
      await signIn("facebook", { callbackUrl: redirectUrl, redirect: true });
    } finally {
      setLoadingProvider(null);
    }
  };

  const handlePhoneLogin = () => {
    onClose();
    const returnUrl = typeof window !== "undefined" ? window.location.href : "/";
    router.push(`/login?callbackUrl=${encodeURIComponent(returnUrl)}`);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-login-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-black rounded-2xl border border-gray-800 w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 id="quick-login-title" className="text-lg font-bold text-white font-bengali">
            লগিন
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
            aria-label="Close"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <p className="text-sm text-gray-400 font-bengali mb-6">
            এখনই যোগদান করুন এবং আমাদের এক্সক্লুসিভ ডিজাইন, বিশেষ অফার এবং নতুন আগতদের আবিষ্কারে প্রথম হন!
          </p>

          <div className="space-y-3">
            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={!!loadingProvider}
              className="w-full py-3 bg-white text-black rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors font-bengali disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loadingProvider === "google" ? (
                <Spinner size="md" className="text-gray-600" />
              ) : (
                <GoogleIcon className="w-5 h-5 shrink-0" />
              )}
              Google দিয়ে লগিন করুন
            </button>

            {/* Facebook */}
            <button
              type="button"
              onClick={handleFacebookSignIn}
              disabled={!!loadingProvider}
              className="w-full py-3 bg-[#1877F2] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#166FE5] transition-colors font-bengali disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loadingProvider === "facebook" ? (
                <Spinner size="md" className="text-white" />
              ) : (
                <FacebookIcon className="w-5 h-5 shrink-0" />
              )}
              Facebook দিয়ে লগিন করুন
            </button>

            {/* Phone */}
            <button
              type="button"
              onClick={handlePhoneLogin}
              disabled={!!loadingProvider}
              className="w-full py-3 bg-[#1a1a1a] border border-gray-800 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#222] transition-colors font-bengali disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <PhoneIcon className="w-5 h-5 shrink-0" />
              ফোন দিয়ে লগিন করুন
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 pt-0 text-center border-t border-gray-800">
          <p className="text-sm text-gray-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              onClick={onClose}
              className="text-accent-teal hover:underline font-medium"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
