import { requireAdmin } from "@/lib/admin/auth-check";
import { connectDB } from "@/lib/db/connectDB";
import Review from "@/lib/models/Review";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { authorized, error } = await requireAdmin("review_management");
    if (!authorized) return error;
    await connectDB();

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(url.searchParams.get("limit") || "20"));
    const rating = url.searchParams.get("rating");

    const filter: Record<string, unknown> = {};
    if (rating && rating !== "all") filter.rating = parseInt(rating);

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("product", "name slug images.main")
        .lean(),
      Review.countDocuments(filter),
    ]);

    const statsResult = await Review.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          positiveReviews: {
            $sum: { $cond: [{ $gte: ["$rating", 4] }, 1, 0] },
          },
        },
      },
    ]);

    const s = statsResult[0] || {};
    const totalReviews = Number(s.totalReviews) || 0;
    const positiveReviews = Number(s.positiveReviews) || 0;

    return Response.json({
      success: true,
      data: reviews,
      reviews,
      total,
      totalPages: Math.ceil(total / limit),
      stats: {
        averageRating: Number(s.avgRating) || 0,
        totalReviews,
        positiveReviews,
        negativeReviews: Math.max(0, totalReviews - positiveReviews),
      },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[admin/reviews GET]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
