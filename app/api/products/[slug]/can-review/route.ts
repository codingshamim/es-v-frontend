import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/connectDB";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import Review from "@/lib/models/Review";
import mongoose from "mongoose";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ success: true, canReview: false, alreadyReviewed: false });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId?.trim()) {
      return Response.json({ success: true, canReview: false, alreadyReviewed: false });
    }

    const { slug } = await params;
    if (!slug?.trim()) {
      return Response.json(
        { success: false, message: "Product slug is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const product = await Product.findOne({ slug: slug.trim() }).select("_id").lean();
    if (!product) {
      return Response.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const productObjectId = product._id as mongoose.Types.ObjectId;

    const [hasOrdered, existingReview] = await Promise.all([
      Order.findOne({
        user: userObjectId,
        "items.product": productObjectId,
        status: { $in: ["delivered", "confirmed", "shipped"] },
      })
        .select("_id")
        .lean(),
      Review.findOne({
        product: productObjectId,
        user: userObjectId,
      })
        .select("_id")
        .lean(),
    ]);

    const alreadyReviewed = !!existingReview;
    const canReview = !!hasOrdered && !alreadyReviewed;

    return Response.json({
      success: true,
      canReview,
      alreadyReviewed,
    });
  } catch (error) {
    console.error("[can-review] error:", error);
    return Response.json(
      { success: false, message: "Failed to check review eligibility" },
      { status: 500 },
    );
  }
}
