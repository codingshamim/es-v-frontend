"use server";

import mongoose from "mongoose";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/connectDB";
import Review from "@/lib/models/Review";
import Product from "@/lib/models/Product";
import Order from "@/lib/models/Order";

interface ReviewPayload {
  productId: string;
  rating: number;
  comment: string;
}

interface ReviewResult {
  success: boolean;
  message?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

function isValidObjectId(s: string): boolean {
  if (!s || typeof s !== "string") return false;
  const trimmed = s.trim();
  return trimmed.length === 24 && /^[a-f0-9A-F]{24}$/.test(trimmed);
}

export async function addReview(payload: ReviewPayload): Promise<ReviewResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "রিভিউ দিতে লগিন করুন" };
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId?.trim()) {
      console.error("[reviews] addReview: session.user.id missing");
      return { success: false, message: "লগইন সেশন অকার্যকর। আবার লগইন করুন।" };
    }

    const { productId: rawProductId, rating, comment } = payload;
    const productId = typeof rawProductId === "string" ? rawProductId.trim() : String(rawProductId ?? "").trim();

    if (!productId) return { success: false, message: "পণ্য নির্বাচন করুন" };
    if (!isValidObjectId(productId)) {
      console.error("[reviews] addReview: invalid productId", { productId: productId?.slice(0, 8) });
      return { success: false, message: "পণ্য আইডি অকার্যকর" };
    }
    if (!rating || rating < 1 || rating > 5)
      return { success: false, message: "১-৫ এর মধ্যে রেটিং দিন" };
    if (!comment?.trim())
      return { success: false, message: "মতামত লিখুন" };
    if (comment.trim().length > 2000)
      return { success: false, message: "মতামত ২০০০ অক্ষরের বেশি হতে পারবে না" };

    await connectDB();

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const productObjectId = new mongoose.Types.ObjectId(productId);

    const product = await Product.findById(productObjectId).select("_id").lean();
    if (!product) {
      return { success: false, message: "পণ্য খুঁজে পাওয়া যায়নি" };
    }

    const existingReview = await Review.findOne({
      product: productObjectId,
      user: userObjectId,
    }).lean();

    if (existingReview) {
      return { success: false, message: "আপনি এই পণ্যে ইতিমধ্যে রিভিউ দিয়েছেন" };
    }

    const hasOrdered = await Order.findOne({
      user: userObjectId,
      "items.product": productObjectId,
      status: { $in: ["delivered", "confirmed", "shipped"] },
    })
      .select("_id")
      .lean();

    const review = await Review.create({
      product: productObjectId,
      user: userObjectId,
      name: session.user.name || "Anonymous",
      rating,
      comment: comment.trim(),
      images: [],
      isVerifiedPurchase: !!hasOrdered,
    });

    const allReviews = await Review.find({ product: productObjectId })
      .select("rating")
      .lean();
    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await Product.findByIdAndUpdate(productObjectId, {
      "ratings.average": Math.round(avgRating * 10) / 10,
      "ratings.count": allReviews.length,
    });

    return {
      success: true,
      message: "রিভিউ সফলভাবে যোগ হয়েছে",
      data: JSON.parse(JSON.stringify(review)),
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[reviews] addReview error:", err.message, err);
    const isDev = process.env.NODE_ENV === "development";
    const hint = isDev ? ` (${err.message})` : "";
    return { success: false, message: `রিভিউ যোগ করতে ব্যর্থ। আবার চেষ্টা করুন।${hint}` };
  }
}
