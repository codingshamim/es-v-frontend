import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/connectDB";
import ChatConversation from "@/lib/models/ChatConversation";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    await connectDB();
    const conversation = await ChatConversation.findOne({
      customer: session.user.id,
      status: { $ne: "closed" },
    })
      .sort({ updatedAt: -1 })
      .lean();
    return Response.json({ success: true, data: conversation });
  } catch (err) {
    console.error("[chat/my-conversation]", err);
    return Response.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
