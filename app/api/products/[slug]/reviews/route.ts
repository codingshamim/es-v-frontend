import { connectDB } from "@/lib/db/connectDB";
import Product from "@/lib/models/Product";
import Review from "@/lib/models/Review";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(url.searchParams.get("limit") || "10", 10)),
    );

    await connectDB();

    const product = await Product.findOne({ slug: slug.trim() })
      .select("_id")
      .lean();

    if (!product) {
      return Response.json(
        { success: false, message: "Product not found" },
        { status: 404 },
      );
    }

    const [reviews, total] = await Promise.all([
      Review.find({ product: product._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Review.countDocuments({ product: product._id }),
    ]);

    return Response.json({
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Reviews API error:", error);
    return Response.json(
      { success: false, message: "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}
