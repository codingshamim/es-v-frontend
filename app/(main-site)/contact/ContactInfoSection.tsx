"use client";

import { useEffect, useState } from "react";

interface QuickContact {
  phone: string;
  phoneHours: string;
  trackOrderText: string;
  email: string;
  emailNote: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface ContactContent {
  quickContact: QuickContact;
  faqs: FaqItem[];
}

const DEFAULT: ContactContent = {
  quickContact: {
    phone: "+880 1816628413",
    phoneHours: "প্রতিদিন সকাল ১০টা – রাত ১০টা",
    trackOrderText: "আপনার অর্ডার স্ট্যাটাস জানতে /track-order ব্যবহার করুন।",
    email: "contact@esfitt.com",
    emailNote: "২৪/৭ ইমেইলে মেসেজ করতে পারেন",
  },
  faqs: [
    {
      question: "ডেলিভারি কত দিনে পাবো?",
      answer:
        "ঢাকার ভেতরে সাধারণত ২-৩ কার্যদিবস, ঢাকার বাইরে ৩-৫ কার্যদিবসের মধ্যে ডেলিভারি দেওয়া হয়।",
    },
    {
      question: "রিটার্ন / এক্সচেঞ্জ কি সম্ভব?",
      answer:
        "প্রোডাক্ট ডেলিভারির ৭ দিনের মধ্যে সাইজ বা ডিফেক্ট সংক্রান্ত ইস্যু থাকলে এক্সচেঞ্জ করা যায় (শর্ত প্রযোজ্য)।",
    },
    {
      question: "কিভাবে পেমেন্ট করতে পারবো?",
      answer:
        "ক্যাশ অন ডেলিভারি, বিকাশ, নগদ এবং অনলাইন কার্ড পেমেন্ট সাপোর্ট করি।",
    },
  ],
};

export function ContactInfoSection() {
  const [content, setContent] = useState<ContactContent>(DEFAULT);

  useEffect(() => {
    fetch("/api/contact-content")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) setContent(json.data);
      })
      .catch(() => {});
  }, []);

  const q = content.quickContact;
  const faqs = content.faqs;

  return (
    <aside className="space-y-4 lg:space-y-5">
      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-black px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
        <h2 className="text-sm font-semibold text-black dark:text-white mb-3 font-bengali">
          দ্রুত যোগাযোগ
        </h2>
        <ul className="space-y-3 text-sm">
          <li className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/10">
              <svg
                className="h-4 w-4 text-black dark:text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.6"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.684l1.5 4.493a1 1 0 01-.51 1.21l-2.26 1.13a11.042 11.042 0 005.52 5.516l1.13-2.258a1 1 0 011.21-.502l4.5 1.5A1 1 0 0121 19v1a2 2 0 01-2 2h-1C9.716 22 3 15.284 3 7V5z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-black dark:text-white font-bengali">
                ফোন সাপোর্ট
              </p>
              <p className="text-black/60 dark:text-white/70 font-bengali">
                {q.phone}
              </p>
              <p className="text-[11px] text-black/45 dark:text-white/50 font-bengali">
                {q.phoneHours}
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/10">
              <svg
                className="h-4 w-4 text-black dark:text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.6"
                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.6"
                  d="M12 2a10 10 0 00-7.938 16.032c.33.414.496.621.54.668A2 2 0 006.17 19h11.66a2 2 0 001.568-.3c.044-.047.21-.254.54-.668A10 10 0 0012 2z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-black dark:text-white font-bengali">
                অর্ডার ট্র্যাক করুন
              </p>
              <p className="text-black/60 dark:text-white/70 font-bengali">
                {q.trackOrderText}
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/10">
              <svg
                className="h-4 w-4 text-black dark:text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.6"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-3 9H6a2 2 0 01-2-2V7a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-black dark:text-white font-bengali">
                ইমেইল
              </p>
              <p className="text-black/60 dark:text-white/70">{q.email}</p>
              <p className="text-[11px] text-black/45 dark:text-white/50 font-bengali">
                {q.emailNote}
              </p>
            </div>
          </li>
        </ul>
      </div>

      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-black px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
        <h2 className="text-sm font-semibold text-black dark:text-white mb-3 font-bengali">
          সাধারণ প্রশ্ন
        </h2>
        <ul className="space-y-3 text-sm font-bengali">
          {faqs.map((faq, i) => (
            <li key={i}>
              <p className="font-medium text-black dark:text-white">
                {faq.question}
              </p>
              <p className="text-black/60 dark:text-white/70 text-[13px]">
                {faq.answer}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
