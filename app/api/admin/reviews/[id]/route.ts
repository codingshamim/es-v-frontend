import { requireAdmin } from "@/lib/admin/auth-check";
import { connectDB } from "@/lib/db/connectDB";
import Review from "@/lib/models/Review";
import Product from "@/lib/models/Product";
import { NextRequest } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { authorized, error, user } = await requireAdmin("review_management");
    if (!authorized) return error;

    const { id } = await params;
    await connectDB();
    const body = await req.json();
    const adminReplyText = typeof body.adminReply === "string" ? body.adminReply.trim() : "";

    const update: Record<string, unknown> = {
      adminReply: adminReplyText
        ? {
            text: adminReplyText,
            repliedAt: new Date(),
            repliedBy: user!.id,
          }
        : null,
    };

    const review = await Review.findByIdAndUpdate(
      id,
      { $set: update },
      { returnDocument: "after" },
    )
      .populate("product", "name slug")
      .lean();

    if (!review) {
      return Response.json({ success: false, message: "Review not found" }, { status: 404 });
    }
    return Response.json({ success: true, data: review });
  } catch (err) {
    console.error("[admin/reviews PATCH]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { authorized, error } = await requireAdmin("review_management");
    if (!authorized) return error;

    const { id } = await params;
    await connectDB();
    const review = await Review.findByIdAndDelete(id);
    if (!review) {
      return Response.json({ success: false, message: "Review not found" }, { status: 404 });
    }

    const allReviews = await Review.find({ product: review.product }).select("rating").lean();
    if (allReviews.length > 0) {
      const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
      await Product.findByIdAndUpdate(review.product, {
        $set: {
          ratings: {
            average: Math.round(avg * 10) / 10,
            count: allReviews.length,
          },
        },
      });
    } else {
      await Product.findByIdAndUpdate(review.product, {
        $set: { ratings: { average: 0, count: 0 } },
      });
    }

    return Response.json({ success: true, message: "Review deleted" });
  } catch (err) {
    console.error("[admin/reviews DELETE]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
