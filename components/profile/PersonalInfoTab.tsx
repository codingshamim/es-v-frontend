"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { getProfile, updateProfile } from "@/app/actions/profile";

interface PersonalInfoTabProps {
  name: string;
  email: string;
  phone?: string | null;
}

export function PersonalInfoTab({ name, email, phone = "" }: PersonalInfoTabProps) {
  const { update: updateSession } = useSession();
  const [fullName, setFullName] = useState(name);
  const [emailVal, setEmailVal] = useState(email);
  const [phoneVal, setPhoneVal] = useState(phone ?? "");

  const [loadStatus, setLoadStatus] = useState<"idle" | "loading" | "success" | "error">("loading");
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  // Fetch profile on mount so we have phone and latest data
  useEffect(() => {
    let cancelled = false;
    setLoadStatus("loading");
    setLoadError("");
    getProfile()
      .then((res) => {
        if (cancelled) return;
        if (!res.success) {
          setLoadStatus("error");
          setLoadError(res.message ?? "প্রোফাইল লোড করতে ব্যর্থ");
          return;
        }
        if (res.data) {
          setFullName(res.data.name);
          setEmailVal(res.data.email);
          setPhoneVal(res.data.phone ?? "");
        }
        setLoadStatus("success");
      })
      .catch(() => {
        if (!cancelled) {
          setLoadStatus("error");
          setLoadError("প্রোফাইল লোড করতে ব্যর্থ। আবার চেষ্টা করুন।");
        }
      });
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");
    setFieldErrors({});
    setSubmitting(true);
    try {
      const result = await updateProfile({
        name: fullName.trim(),
        email: emailVal.trim(),
        phone: phoneVal.trim(),
      });
      if (!result.success) {
        setSubmitError(result.message ?? "সংরক্ষণ ব্যর্থ");
        if (result.errors) setFieldErrors(result.errors);
        return;
      }
      setSubmitSuccess(result.message ?? "সংরক্ষণ হয়েছে।");
      if (result.data) {
        setFullName(result.data.name);
        setEmailVal(result.data.email);
        setPhoneVal(result.data.phone ?? "");
      }
      await updateSession();
    } catch {
      setSubmitError("একটি ত্রুটি ঘটেছে। আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-xl text-sm text-black dark:text-white focus:outline-none focus:border-accent-teal transition-colors";

  const isLoading = loadStatus === "loading";
  const isError = loadStatus === "error";

  return (
    <div
      className={`bg-gray-50 dark:bg-[#0a0a0a] rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-[#1a1a1a] transition-opacity duration-300 ${isLoading || submitting ? "opacity-60 pointer-events-none" : "opacity-100"
        }`}
    >
      <h3 className="text-lg font-bold text-black dark:text-white mb-6 font-bengali">
        ব্যক্তিগত তথ্য
      </h3>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" className="text-accent-teal" />
        </div>
      )}

      {isError && (
        <div
          className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bengali"
          role="alert"
        >
          {loadError}
        </div>
      )}

      {loadStatus === "success" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError && (
            <div
              className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bengali"
              role="alert"
            >
              {submitError}
            </div>
          )}
          {submitSuccess && (
            <div
              className="p-4 rounded-xl bg-accent-green/10 border border-accent-green/30 text-accent-green text-sm font-bengali"
              role="status"
            >
              {submitSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-black dark:text-white mb-2 font-bengali">
                পুরো নাম
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
                disabled={submitting}
                aria-invalid={!!fieldErrors.name}
                aria-describedby={fieldErrors.name ? "name-err" : undefined}
              />
              {fieldErrors.name && (
                <p id="name-err" className="mt-1 text-sm text-red-400 font-bengali">
                  {fieldErrors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2 font-bengali">
                ইমেইল
              </label>
              <input
                type="email"
                value={emailVal}
                onChange={(e) => setEmailVal(e.target.value)}
                className={inputClass}
                disabled={submitting}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? "email-err" : undefined}
              />
              {fieldErrors.email && (
                <p id="email-err" className="mt-1 text-sm text-red-400 font-bengali">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2 font-bengali">
                ফোন নম্বর
              </label>
              <input
                type="tel"
                value={phoneVal}
                onChange={(e) => setPhoneVal(e.target.value)}
                className={inputClass}
                placeholder="01XXXXXXXXX বা +8801XXXXXXXXX"
                disabled={submitting}
                aria-invalid={!!fieldErrors.phone}
                aria-describedby={fieldErrors.phone ? "phone-err" : undefined}
              />
              {fieldErrors.phone && (
                <p id="phone-err" className="mt-1 text-sm text-red-400 font-bengali">
                  {fieldErrors.phone}
                </p>
              )}
            </div>



          </div>

          <Button
            type="submit"
            variant="secondary"
            size="md"
            disabled={submitting}
            icon={
              submitting ? (
                <Spinner size="md" className="text-white dark:text-black" />
              ) : undefined
            }
            className="mt-6 font-bengali"
          >
            {submitting ? "সংরক্ষণ হচ্ছে..." : "পরিবর্তন সংরক্ষণ করুন"}
          </Button>
        </form>
      )}
    </div>
  );
}
