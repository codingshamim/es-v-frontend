import { requireAdmin } from "@/lib/admin/auth-check";
import { connectDB } from "@/lib/db/connectDB";
import ContactContent from "@/lib/models/ContactContent";
import { NextRequest } from "next/server";

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

export async function GET() {
  try {
    const { authorized, error } = await requireAdmin("contact_access");
    if (!authorized) return error;
    await connectDB();

    const doc = await ContactContent.findOne().lean();
    const d = (doc ?? {}) as unknown as Record<string, unknown>;
    const data = pickContact(d);
    return Response.json({ success: true, data });
  } catch (err) {
    console.error("[admin/contact-content GET]", err);
    return Response.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { authorized, error } = await requireAdmin("contact_access");
    if (!authorized) return error;
    await connectDB();

    const body = await req.json();
    if (!body || typeof body !== "object") {
      return Response.json(
        { success: false, message: "Invalid body" },
        { status: 400 },
      );
    }

    const contact: {
      quickContact: {
        phone: string;
        phoneHours: string;
        trackOrderText: string;
        email: string;
        emailNote: string;
      };
      faqs: Array<{ question: string; answer: string }>;
    } = {
      quickContact: {
        phone: "+880 1816628413",
        phoneHours: "প্রতিদিন সকাল ১০টা – রাত ১০টা",
        trackOrderText: "আপনার অর্ডার স্ট্যাটাস জানতে /track-order ব্যবহার করুন।",
        email: "contact@esfitt.com",
        emailNote: "২৪/৭ ইমেইলে মেসেজ করতে পারেন",
      },
      faqs: DEFAULT_FAQS.map((f) => ({ ...f })),
    };

    if (body.quickContact && typeof body.quickContact === "object") {
      const q = body.quickContact;
      contact.quickContact = {
        phone: String(q.phone ?? "").trim() || "+880 1816628413",
        phoneHours: String(q.phoneHours ?? "").trim(),
        trackOrderText: String(q.trackOrderText ?? "").trim(),
        email: String(q.email ?? "").trim() || "contact@esfitt.com",
        emailNote: String(q.emailNote ?? "").trim(),
      };
    }

    if (Array.isArray(body.faqs)) {
      contact.faqs = body.faqs
        .filter(
          (f: unknown) =>
            f && typeof f === "object" && "question" in f && "answer" in f,
        )
        .map((f: { question?: string; answer?: string }) => ({
          question: String(f.question ?? "").trim() || "প্রশ্ন",
          answer: String(f.answer ?? "").trim() || "",
        }));
    }

    let doc = await ContactContent.findOne();
    if (!doc) {
      doc = await ContactContent.create({
        quickContact: contact.quickContact,
        faqs: contact.faqs,
      });
    } else {
      doc.quickContact = contact.quickContact;
      doc.faqs = contact.faqs;
      doc.markModified("quickContact");
      doc.markModified("faqs");
      await doc.save();
    }

    const d = doc.toObject() as unknown as Record<string, unknown>;
    const data = pickContact(d);
    return Response.json({ success: true, data });
  } catch (err) {
    console.error("[admin/contact-content PUT]", err);
    return Response.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
