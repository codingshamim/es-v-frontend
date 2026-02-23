import { requireAdmin } from "@/lib/admin/auth-check";
import { connectDB } from "@/lib/db/connectDB";
import ChatConversation from "@/lib/models/ChatConversation";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { authorized, error } = await requireAdmin("chat_access");
    if (!authorized) return error;

    await connectDB();
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "all";

    const filter: Record<string, unknown> = {};
    if (status !== "all") filter.status = status;

    const conversations = await ChatConversation.find(filter)
      .sort({ lastMessageAt: -1 })
      .select("-messages")
      .lean();

    return Response.json({ success: true, data: conversations });
  } catch (err) {
    console.error("[admin/chat GET]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
