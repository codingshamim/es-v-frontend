"use client";

import { useEffect, useState, useCallback } from "react";
import { Spinner } from "@/components/ui/Spinner";
import AdminGuard from "@/components/admin/AdminGuard";
import { EditableField } from "@/components/admin/EditableField";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email?: string;
  topic: string;
  message: string;
  createdAt: string;
}

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

const TOPIC_LABELS: Record<string, string> = {
  order: "অর্ডার সংক্রান্ত প্রশ্ন",
  size: "সাইজ ও ফিটিং",
  delivery: "ডেলিভারি ও শিপিং",
  return: "রিটার্ন / রিফান্ড",
  other: "অন্যান্য",
};

const DEFAULT_CONTENT: ContactContent = {
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
      answer: "ক্যাশ অন ডেলিভারি, বিকাশ, নগদ এবং অনলাইন কার্ড পেমেন্ট সাপোর্ট করি।",
    },
  ],
};

export default function AdminContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<ContactContent>(DEFAULT_CONTENT);
  const [contentLoading, setContentLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch("/api/admin/contact-messages");
        const json = await res.json();
        if (!res.ok) {
          setError(json?.message ?? "Failed to load messages");
          return;
        }
        setMessages(json.data ?? []);
      } catch {
        setError("Failed to load messages");
      } finally {
        setLoading(false);
      }
    }
    fetchMessages();
  }, []);

  useEffect(() => {
    async function fetchContent() {
      try {
        const res = await fetch("/api/admin/contact-content");
        const json = await res.json();
        if (res.ok && json.data) {
          setContent(json.data);
        }
      } catch {
        // keep defaults
      } finally {
        setContentLoading(false);
      }
    }
    fetchContent();
  }, []);

  const saveContent = useCallback(async (payload: ContactContent) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/contact-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setContent(json.data);
      }
    } finally {
      setSaving(false);
    }
  }, []);

  const updateQuickContact = useCallback(
    (key: keyof QuickContact, value: string) => {
      const next = {
        ...content,
        quickContact: { ...content.quickContact, [key]: value },
      };
      setContent(next);
      saveContent(next);
    },
    [content, saveContent],
  );

  const updateFaq = useCallback(
    (index: number, field: "question" | "answer", value: string) => {
      const nextFaqs = [...content.faqs];
      if (!nextFaqs[index]) return;
      nextFaqs[index] = { ...nextFaqs[index], [field]: value };
      const next = { ...content, faqs: nextFaqs };
      setContent(next);
      saveContent(next);
    },
    [content, saveContent],
  );

  const addFaq = useCallback(() => {
    const next = {
      ...content,
      faqs: [...content.faqs, { question: "নতুন প্রশ্ন", answer: "উত্তর লিখুন" }],
    };
    setContent(next);
    saveContent(next);
  }, [content, saveContent]);

  const removeFaq = useCallback(
    (index: number) => {
      const nextFaqs = content.faqs.filter((_, i) => i !== index);
      const next = { ...content, faqs: nextFaqs };
      setContent(next);
      saveContent(next);
    },
    [content, saveContent],
  );

  return (
    <AdminGuard requiredPermission="contact_access">
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-8 lg:space-y-10">
        <header>
          <h1 className="text-2xl lg:text-3xl font-bold mb-1">
            Contact messages
          </h1>
          <p className="text-sm text-black/60 dark:text-white/70">
            কাস্টমার কনট্যাক্ট পেজ থেকে পাঠানো মেসেজগুলো এখানে শুধু দেখা যাবে। এই
            ইন্টারফেস থেকে রিপ্লাই দেওয়া যাবে না।
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)] gap-6 lg:gap-8 items-start">
          <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-black p-4 sm:p-5 lg:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">Messages</h2>
              <span className="text-xs text-black/50 dark:text-white/60">
                মোট {messages.length}টি মেসেজ
              </span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="md" />
              </div>
            ) : error ? (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-black/50 dark:text-white/60">
                এখনো কোনো কনট্যাক্ট মেসেজ নেই।
              </p>
            ) : (
              <div className="divide-y divide-black/5 dark:divide-white/10">
                {messages.map((m) => (
                  <article key={m.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{m.name}</p>
                        <span className="text-xs rounded-full border border-black/15 dark:border-white/20 px-2 py-0.5 text-black/70 dark:text-white/70">
                          {TOPIC_LABELS[m.topic] ?? TOPIC_LABELS.other}
                        </span>
                      </div>
                      <span className="text-[11px] text-black/50 dark:text-white/60">
                        {new Date(m.createdAt).toLocaleString("bn-BD", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="text-xs text-black/60 dark:text-white/70 mb-1.5">
                      <span className="mr-3">📞 {m.phone}</span>
                      {m.email && <span>✉️ {m.email}</span>}
                    </div>
                    <p className="text-sm text-black/80 dark:text-white/80 whitespace-pre-line font-bengali">
                      {m.message}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-4 lg:space-y-5">
            <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-black p-4 sm:p-5 lg:p-6">
              <h2 className="text-sm font-semibold mb-2 font-bengali">
                দ্রুত যোগাযোগ সেকশন (ফ্রন্টএন্ড)
              </h2>
              <p className="text-xs text-black/60 dark:text-white/65 mb-3 font-bengali">
                এই তথ্যগুলো কাস্টমার কনট্যাক্ট পেজে দেখানো হয়। এডিট করতে ডাবল-ক্লিক করুন।
              </p>
              {contentLoading ? (
                <div className="flex justify-center py-4">
                  <Spinner size="sm" />
                </div>
              ) : (
                <div className="space-y-3 text-sm font-bengali">
                  <div>
                    <p className="font-semibold">দ্রুত যোগাযোগ</p>
                    <p className="mt-1 text-black/70 dark:text-white/75">
                      ফোন সাপোর্ট:{" "}
                      <EditableField
                        value={content.quickContact.phone}
                        onSave={(v) => updateQuickContact("phone", v)}
                      />
                      <br />
                      <EditableField
                        value={content.quickContact.phoneHours}
                        onSave={(v) => updateQuickContact("phoneHours", v)}
                      />
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">অর্ডার ট্র্যাক করুন</p>
                    <p className="mt-1 text-black/70 dark:text-white/75">
                      <EditableField
                        value={content.quickContact.trackOrderText}
                        onSave={(v) => updateQuickContact("trackOrderText", v)}
                      />
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">ইমেইল</p>
                    <p className="mt-1 text-black/70 dark:text-white/75">
                      <EditableField
                        value={content.quickContact.email}
                        onSave={(v) => updateQuickContact("email", v)}
                      />
                      <br />
                      <EditableField
                        value={content.quickContact.emailNote}
                        onSave={(v) => updateQuickContact("emailNote", v)}
                      />
                    </p>
                  </div>
                </div>
              )}
              {saving && (
                <p className="text-[11px] text-black/50 dark:text-white/50 mt-2">
                  সংরক্ষণ হচ্ছে...
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-black p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="text-sm font-semibold font-bengali">
                  সাধারণ প্রশ্ন (FAQ) সেকশন
                </h2>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addFaq();
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-black/15 dark:border-white/20 px-3 py-1.5 text-xs font-medium text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  নতুন প্রশ্ন
                </button>
              </div>
              {contentLoading ? (
                <div className="flex justify-center py-4">
                  <Spinner size="sm" />
                </div>
              ) : (
                <ul className="space-y-4 text-sm font-bengali">
                  {content.faqs.map((faq, index) => (
                    <li
                      key={index}
                      className="flex gap-2 items-start group"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="font-semibold">
                          <EditableField
                            value={faq.question}
                            onSave={(v) => updateFaq(index, "question", v)}
                            placeholder="প্রশ্ন লিখুন"
                          />
                        </p>
                        <p className="text-black/70 dark:text-white/75 text-[13px]">
                          <EditableField
                            value={faq.answer}
                            onSave={(v) => updateFaq(index, "answer", v)}
                            multiline
                            placeholder="উত্তর লিখুন"
                          />
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeFaq(index);
                        }}
                        className="shrink-0 p-1.5 rounded text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="প্রশ্ন মুছুন"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {saving && (
                <p className="text-[11px] text-black/50 dark:text-white/50 mt-2">
                  সংরক্ষণ হচ্ছে...
                </p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
    </AdminGuard>
  );
}

