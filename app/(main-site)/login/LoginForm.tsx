"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AuthCard,
  AuthDivider,
  AuthFooterLink,
  FormInput,
  PasswordInput,
  SocialLogin,
} from "@/components/auth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { PhoneIcon, ArrowRightIcon } from "@/components/icons";

export function LoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid = phone.trim() !== "" && password.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!phone.trim() || !password.trim()) {
      setError("সব ফিল্ড পূরণ করুন");
      return;
    }
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        emailOrPhone: phone.trim(),
        password: password.trim(),
        redirect: false,
      });

      if (result?.error) {
        const msg = typeof result.error === "string" ? result.error : "";
        const friendlyMessage =
          msg === "Configuration" ||
          msg === "CredentialsSignin" ||
          msg === "Default" ||
          msg === "Callback" ||
          !msg
            ? "ভুল ফোন নম্বর বা পাসওয়ার্ড। আবার চেষ্টা করুন।"
            : msg;
        setError(friendlyMessage);
        return;
      }

      if (result?.ok) {
        router.push("/");
        router.refresh();
        return;
      }

      setError("লগইন ব্যর্থ। আবার চেষ্টা করুন।");
    } catch (err) {
      console.error("Login error:", err);
      setError("লগইন ব্যর্থ। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="লগিন"
      subtitle="এখনই যোগদান করুন এবং আমাদের এক্সক্লুসিভ ডিজাইন, বিশেষ অফার এবং নতুন আগতদের আবিষ্কারে প্রথম হন!"
    >
      <form
        id="loginForm"
        className={`space-y-6 transition-opacity duration-300 ${loading ? "opacity-60 pointer-events-none" : "opacity-100"}`}
        onSubmit={handleSubmit}
      >
        <FormInput
          id="login-phone"
          name="phone"
          type="tel"
          label="ফোন নম্বর"
          placeholder="+8801XXXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          icon={<PhoneIcon className="w-5 h-5" />}
          autoComplete="tel"
        />
        <PasswordInput
          id="login-password"
          name="password"
          label="পাসওয়ার্ড"
          placeholder="password123"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <AuthFooterLink
          text="কোন অ্যাকাউন্ট নেই?"
          linkText="রেজিস্টার করুন"
          href="/register"
        />
        {error && (
          <p
            className="text-sm text-red-400 text-center font-bengali"
            role="alert"
          >
            {error}
          </p>
        )}
        <Button
          type="submit"
          disabled={!isValid || loading}
          fullWidth
          size="md"
          variant="secondary"
          icon={
            loading ? (
              <Spinner size="md" className="text-white dark:text-black" />
            ) : (
              <ArrowRightIcon className="w-5 h-5" />
            )
          }
          className={loading ? "cursor-not-allowed opacity-90" : ""}
        >
          {loading ? "লগইন হচ্ছে..." : "লগিন করুন"}
        </Button>
        <AuthDivider />
        <SocialLogin />
      </form>
    </AuthCard>
  );
}
