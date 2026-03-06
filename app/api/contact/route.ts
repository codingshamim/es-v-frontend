import { connectDB } from "@/lib/db/connectDB";
import ContactMessage from "@/lib/models/ContactMessage";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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
    console.error("[api/contact POST]", err);
    return Response.json(
      { success: false, message: "মেসেজ পাঠাতে সমস্যা হয়েছে" },
      { status: 500 },
    );
  }
}
