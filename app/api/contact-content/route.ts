import { connectDB } from "@/lib/db/connectDB";
import ContactContent from "@/lib/models/ContactContent";

const DEFAULT_QUICK = {
  phone: "+880 1816628413",
  phoneHours: "প্রতিদিন সকাল ১০টা – রাত ১০টা",
  trackOrderText: "আপনার অর্ডার স্ট্যাটাস জানতে /track-order ব্যবহার করুন।",
  email: "contact@esfitt.com",
  emailNote: "২৪/৭ ইমেইলে মেসেজ করতে পারেন",
};

const DEFAULT_FAQS = [
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
];

function pickContact(doc: Record<string, unknown>) {
  const q = doc.quickContact as Record<string, unknown> | undefined;
  const faqs = (doc.faqs as Array<{ question?: string; answer?: string }>) ?? [];
  return {
    quickContact: {
      phone: String(q?.phone ?? DEFAULT_QUICK.phone),
      phoneHours: String(q?.phoneHours ?? DEFAULT_QUICK.phoneHours),
      trackOrderText: String(q?.trackOrderText ?? DEFAULT_QUICK.trackOrderText),
      email: String(q?.email ?? DEFAULT_QUICK.email),
      emailNote: String(q?.emailNote ?? DEFAULT_QUICK.emailNote),
    },
    faqs:
      faqs.length > 0
        ? faqs.map((f) => ({
            question: String(f?.question ?? "").trim() || "প্রশ্ন",
            answer: String(f?.answer ?? "").trim() || "",
          }))
        : DEFAULT_FAQS,
  };
}

/**
 * Public API: returns contact page content (quick contact + FAQ) for the main site.
 */
export async function GET() {
  try {
    await connectDB();
    const doc = await ContactContent.findOne().lean();
    const d = (doc ?? {}) as unknown as Record<string, unknown>;
    const data = pickContact(d);
    return Response.json({ success: true, data });
  } catch (err) {
    console.error("[api/contact-content GET]", err);
    return Response.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
