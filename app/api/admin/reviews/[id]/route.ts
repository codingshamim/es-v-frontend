import { requireAdmin } from "@/lib/admin/auth-check";
import { connectDB } from "@/lib/db/connectDB";
import Review from "@/lib/models/Review";
import Product from "@/lib/models/Product";
import { NextRequest } from "next/server";

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
        "ratings.average": Math.round(avg * 10) / 10,
        "ratings.count": allReviews.length,
      });
    } else {
      await Product.findByIdAndUpdate(review.product, {
        "ratings.average": 0,
        "ratings.count": 0,
      });
    }

    return Response.json({ success: true, message: "Review deleted" });
  } catch (err) {
    console.error("[admin/reviews DELETE]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
