"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export function ContactFormSection() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const topic = String(formData.get("topic") ?? "").trim() || "other";
    const message = String(formData.get("message") ?? "").trim();

    if (!name || !phone || !message) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, topic, message }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json?.message ?? "মেসেজ পাঠাতে সমস্যা হয়েছে");
        setLoading(false);
        return;
      }

      const payload = json.data;

      // Push into live chat widget (same tab) as a synthetic customer message
      try {
        if (typeof window !== "undefined") {
          const event = new CustomEvent("esfitt-contact-message", {
            detail: payload,
          });
          window.dispatchEvent(event);
        }
      } catch {
        // ignore
      }

      setSubmitted(true);
    } catch {
      setError("মেসেজ পাঠাতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-black px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 shadow-[0_18px_60px_rgba(0,0,0,0.08)] dark:shadow-[0_18px_60px_rgba(0,0,0,0.65)]">
      {submitted ? (
        <div className="flex flex-col items-center text-center py-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-green/10 text-accent-green">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-lg lg:text-xl font-bold text-black dark:text-white font-bengali mb-1">
            মেসেজ পাঠানো হয়েছে
          </h2>
          <p className="text-sm text-black/60 dark:text-white/70 font-bengali max-w-sm">
            আমাদের সাপোর্ট টিম খুব দ্রুতই আপনার সাথে যোগাযোগ করবে। দয়া করে আপনার
            ফোন ও ইমেইল চেক করুন।
          </p>
          <Button
            className="mt-6"
            variant="secondary"
            size="md"
            onClick={() => setSubmitted(false)}
          >
            আরেকটি মেসেজ পাঠান
          </Button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 sm:space-y-5"
          noValidate
        >
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-black/60 dark:text-white/70 font-bengali"
              >
                আপনার নাম
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-black px-3.5 py-2.5 text-sm text-black dark:text-white outline-none placeholder:text-black/35 dark:placeholder:text-white/40 focus:border-accent-teal"
                placeholder="আপনার পূর্ণ নাম"
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-black/60 dark:text-white/70 font-bengali"
              >
                ফোন নম্বর
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="w-full rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-black px-3.5 py-2.5 text-sm text-black dark:text-white outline-none placeholder:text-black/35 dark:placeholder:text-white/40 focus:border-accent-teal"
                placeholder="+8801XXXXXXXXX"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-black/60 dark:text-white/70 font-bengali"
            >
              ইমেইল (ঐচ্ছিক)
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="w-full rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-black px-3.5 py-2.5 text-sm text-black dark:text-white outline-none placeholder:text-black/35 dark:placeholder:text-white/40 focus:border-accent-teal"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="topic"
              className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-black/60 dark:text-white/70 font-bengali"
            >
              বিষয়
            </label>
            <select
              id="topic"
              name="topic"
              className="w-full rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-black px-3.5 py-2.5 text-sm text-black dark:text-white outline-none focus:border-accent-teal font-bengali cursor-pointer"
              defaultValue="order"
            >
              <option value="order">অর্ডার সংক্রান্ত প্রশ্ন</option>
              <option value="size">সাইজ ও ফিটিং</option>
              <option value="delivery">ডেলিভারি ও শিপিং</option>
              <option value="return">রিটার্ন / রিফান্ড</option>
              <option value="other">অন্যান্য</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="message"
              className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-black/60 dark:text-white/70 font-bengali"
            >
              আপনার মেসেজ
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={4}
              className="w-full rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-black px-3.5 py-2.5 text-sm text-black dark:text-white outline-none placeholder:text-black/35 dark:placeholder:text-white/40 focus:border-accent-teal resize-none font-bengali"
              placeholder="আপনার সমস্যাটি বিস্তারিত লিখুন, যেমন অর্ডার আইডি, প্রোডাক্ট নাম ইত্যাদি।"
            />
          </div>

          <p className="text-[11px] text-black/45 dark:text-white/50 font-bengali">
            আমরা সাধারণত{" "}
            <span className="font-semibold text-black dark:text-white">
              ১-৩ ঘণ্টার মধ্যে
            </span>{" "}
            উত্তর দিই (কাজের সময়ের মধ্যে)।
          </p>

          <div className="pt-1">
            <Button
              type="submit"
              variant="secondary"
              size="md"
              disabled={loading}
              fullWidth
              className={loading ? "cursor-wait opacity-90" : ""}
              icon={
                loading ? (
                  <Spinner
                    size="sm"
                    className="text-white dark:text-black"
                  />
                ) : undefined
              }
            >
              {loading ? "মেসেজ পাঠানো হচ্ছে..." : "মেসেজ পাঠান"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

