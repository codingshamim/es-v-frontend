import { requireAdmin } from "@/lib/admin/auth-check";
import { connectDB } from "@/lib/db/connectDB";
import ChatConversation from "@/lib/models/ChatConversation";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { authorized, error } = await requireAdmin("chat_access");
    if (!authorized) return error;

    const { id } = await params;
    await connectDB();
    const conversation = await ChatConversation.findById(id).lean();
    if (!conversation) {
      return Response.json({ success: false, message: "Conversation not found" }, { status: 404 });
    }
    return Response.json({ success: true, data: conversation });
  } catch (err) {
    console.error("[admin/chat GET id]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { authorized, error, user } = await requireAdmin("chat_access");
    if (!authorized) return error;

    const { id } = await params;
    await connectDB();
    const body = await req.json();

    const conversation = await ChatConversation.findById(id);
    if (!conversation) {
      return Response.json({ success: false, message: "Conversation not found" }, { status: 404 });
    }

    const message = {
      sender: "admin" as const,
      senderId: user!.id,
      senderName: user!.name,
      message: body.message,
      timestamp: new Date(),
      read: true,
    };

    conversation.messages.push(message);
    conversation.lastMessage = body.message;
    conversation.lastMessageAt = new Date();
    conversation.status = "active";
    conversation.unreadCount = 0;
    if (!conversation.assignedAdmin) {
      conversation.assignedAdmin = user!.id as unknown as typeof conversation.assignedAdmin;
    }

    await conversation.save();
    return Response.json({ success: true, data: message });
  } catch (err) {
    console.error("[admin/chat POST message]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { authorized, error } = await requireAdmin("chat_access");
    if (!authorized) return error;

    const { id } = await params;
    await connectDB();
    const body = await req.json();

    const conversation = await ChatConversation.findByIdAndUpdate(
      id,
      { status: body.status },
      { returnDocument: "after" },
    ).select("-messages");

    if (!conversation) {
      return Response.json({ success: false, message: "Conversation not found" }, { status: 404 });
    }
    return Response.json({ success: true, data: conversation });
  } catch (err) {
    console.error("[admin/chat PUT]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { authorized, error } = await requireAdmin("chat_access");
    if (!authorized) return error;

    const { id } = await params;
    await connectDB();
    const conversation = await ChatConversation.findByIdAndDelete(id);
    if (!conversation) {
      return Response.json({ success: false, message: "Conversation not found" }, { status: 404 });
    }
    return Response.json({ success: true, message: "Conversation deleted" });
  } catch (err) {
    console.error("[admin/chat DELETE]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
