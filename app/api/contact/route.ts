import { connectDB } from "@/lib/db/connectDB";
import ContactMessage from "@/lib/models/ContactMessage";
import { logger } from "@/lib/logger";
import {
  rateLimit,
  getClientIp,
  CONTACT_LIMIT,
} from "@/lib/rate-limit";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { NextRequest } from "next/server";

const MAX_BODY_BYTES = 50 * 1024; // 50 KB

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`contact:${ip}`, CONTACT_LIMIT);
  if (!rl.success) {
    return Response.json(
      { success: false, message: "অনুগ্রহ করে একটু পর আবার চেষ্টা করুন" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return Response.json(
      { success: false, message: "রিকোয়েস্ট খুব বড়" },
      { status: 413 },
    );
  }

  try {
    const body = await req.json();

    // Honeypot: bot trap field should be empty
    if (body?.website) {
      return Response.json(
        { success: false, message: "মেসেজ পাঠাতে সমস্যা হয়েছে" },
        { status: 400 },
      );
    }

    const recaptchaToken = body?.recaptchaToken;
    const valid = await verifyRecaptcha(recaptchaToken);
    if (!valid) {
      return Response.json(
        { success: false, message: "যাচাইকরণ ব্যর্থ। আবার চেষ্টা করুন" },
        { status: 400 },
      );
    }

    const name = String(body?.name ?? "").trim();
    const phone = String(body?.phone ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const topic = String(body?.topic ?? "other").trim() || "other";
    const message = String(body?.message ?? "").trim();

    if (!name || !phone || !message) {
      return Response.json(
        { success: false, message: "নাম, ফোন ও মেসেজ প্রয়োজন" },
        { status: 400 },
      );
    }

    const validTopics = ["order", "size", "delivery", "return", "other"];
    const safeTopic = validTopics.includes(topic) ? topic : "other";

    await connectDB();

    const doc = await ContactMessage.create({
      name,
      phone,
      email: email || undefined,
      topic: safeTopic,
      message,
    });

    return Response.json({
      success: true,
      data: {
        id: doc._id.toString(),
        name: doc.name,
        phone: doc.phone,
        email: doc.email,
        topic: doc.topic,
        message: doc.message,
        createdAt: doc.createdAt.toISOString(),
      },
    });
  } catch (err) {
    logger.error("Contact form POST failed", { err, ip });
    return Response.json(
      { success: false, message: "মেসেজ পাঠাতে সমস্যা হয়েছে" },
      { status: 500 },
    );
  }
}
