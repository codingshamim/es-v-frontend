import { requireAdmin } from "@/lib/admin/auth-check";
import { connectDB } from "@/lib/db/connectDB";
import ContactMessage from "@/lib/models/ContactMessage";
import { rateLimit, ADMIN_LIMIT } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { authorized, error, user } = await requireAdmin("contact_access");
    if (!authorized) return error;

    const rl = rateLimit(`admin:${user!.id}`, ADMIN_LIMIT);
    if (!rl.success) {
      return Response.json(
        { success: false, message: "Too many requests" },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }

    await connectDB();

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(url.searchParams.get("limit") || "30"));

    const [messages, total] = await Promise.all([
      ContactMessage.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ContactMessage.countDocuments(),
    ]);

    const data = messages.map((m) => ({
      id: m._id.toString(),
      name: m.name,
      phone: m.phone,
      email: m.email,
      topic: m.topic,
      message: m.message,
      createdAt: m.createdAt.toISOString(),
    }));

    return Response.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    logger.error("Admin contact-messages GET failed", { err });
    return Response.json(
      { success: false, message: "Failed to fetch contact messages" },
      { status: 500 },
    );
  }
}
