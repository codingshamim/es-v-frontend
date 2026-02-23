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
import {
  UserIcon,
  MailIcon,
  PhoneIcon,
  ArrowRightIcon,
} from "@/components/icons";
import { registerUser } from "@/app/actions/register";

interface FieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
}

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const isValid =
    name.trim() !== "" &&
    email.trim() !== "" &&
    phone.trim() !== "" &&
    password.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    setFieldErrors({});

    if (!isValid) {
      setGeneralError("সব ফিল্ড পূরণ করুন");
      return;
    }

    setLoading(true);
    try {
      const result = await registerUser({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: password.trim(),
      });

      if (!result.success) {
        if (result.errors) {
          setFieldErrors(result.errors);
        }
        setGeneralError(result.message);
        return;
      }

      // Auto login after successful registration (use email for reliable match with DB)
      const loginResult = await signIn("credentials", {
        emailOrPhone: email.trim().toLowerCase(),
        password: password.trim(),
        redirect: false,
      });
      console.log(loginResult);

      if (loginResult?.ok) {
        router.push("/");
        router.refresh();
      } else {
        // Registration succeeded but auto-login failed - redirect to login so user can sign in
        router.push("/login?registered=1");
        router.refresh();
      }
    } catch (err) {
      console.error("Registration error:", err);
      setGeneralError("একটি ত্রুটি ঘটেছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="রেজিস্টার"
      subtitle="একটি অ্যাকাউন্ট তৈরি করুন এবং এক্সক্লুসিভ অফার ও অর্ডার ট্র্যাকিং উপভোগ করুন।"
    >
      <form
        id="registerForm"
        className={`space-y-6 transition-opacity duration-300 ${loading ? "opacity-60 pointer-events-none" : "opacity-100"}`}
        onSubmit={handleSubmit}
      >
        <FormInput
          id="register-name"
          name="name"
          type="text"
          label="নাম"
          placeholder="আপনার নাম লিখুন"
          value={name}
          onChange={(e) => setName(e.target.value)}
          icon={<UserIcon className="w-5 h-5" />}
          autoComplete="name"
          error={fieldErrors.name}
        />
        <FormInput
          id="register-email"
          name="email"
          type="email"
          label="ইমেইল"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<MailIcon className="w-5 h-5" />}
          autoComplete="email"
          error={fieldErrors.email}
        />
        <FormInput
          id="register-phone"
          name="phone"
          type="tel"
          label="ফোন নম্বর"
          placeholder="+8801XXXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          icon={<PhoneIcon className="w-5 h-5" />}
          autoComplete="tel"
          error={fieldErrors.phone}
        />
        <PasswordInput
          id="register-password"
          name="password"
          label="পাসওয়ার্ড"
          placeholder="পাসওয়ার্ড তৈরি করুন"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          error={fieldErrors.password}
        />
        <AuthFooterLink
          text="ইতিমধ্যে অ্যাকাউন্ট আছে?"
          linkText="লগিন করুন"
          href="/login"
        />
        {generalError && (
          <p
            className="text-sm text-red-400 text-center font-bengali bg-red-500/10 border border-red-500/30 rounded-lg p-3"
            role="alert"
          >
            {generalError}
          </p>
        )}
        <Button
          type="submit"
          disabled={!isValid || loading}
          fullWidth
          variant="secondary"
          size="md"
          icon={
            loading ? (
              <Spinner size="md" className="text-white dark:text-black" />
            ) : (
              <ArrowRightIcon className="w-5 h-5" />
            )
          }
          className={loading ? "cursor-not-allowed opacity-90" : ""}
        >
          {loading ? "রেজিস্টার হচ্ছে..." : "রেজিস্টার করুন"}
        </Button>
        <AuthDivider />
        <SocialLogin />
      </form>
    </AuthCard>
  );
}
