import { requireAdmin } from "@/lib/admin/auth-check";
import { connectDB } from "@/lib/db/connectDB";
import Order from "@/lib/models/Order";
import Review from "@/lib/models/Review";
import ChatConversation from "@/lib/models/ChatConversation";

export async function GET() {
  try {
    const { authorized, error } = await requireAdmin();
    if (!authorized) return error;
    await connectDB();

    const [pendingOrders, chatUnread, newReviews] = await Promise.all([
      Order.countDocuments({ status: "pending" }),
      ChatConversation.aggregate([
          { $match: { unreadCount: { $gt: 0 } } },
          { $group: { _id: null, total: { $sum: "$unreadCount" } } },
        ])
        .then((r) => r[0]?.total ?? 0),
      Review.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
    ]);

    const total = Number(pendingOrders) + Number(chatUnread) + Number(newReviews);

    return Response.json({
      success: true,
      data: {
        orders: Number(pendingOrders),
        chat: Number(chatUnread),
        reviews: Number(newReviews),
        total,
      },
    });
  } catch (err) {
    console.error("[admin/notifications GET]", err);
    return Response.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
