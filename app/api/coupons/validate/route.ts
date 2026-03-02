import { connectDB } from "@/lib/db/connectDB";
import Coupon from "@/lib/models/Coupon";
import { NextRequest } from "next/server";

/**
 * POST body: { code: string, subtotal: number }
 * Returns: { success: true, valid: true, discount: number } or { success: true, valid: false, message: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    const subtotal = Number(body.subtotal);
    if (!code) {
      return Response.json({
        success: true,
        valid: false,
        message: "কুপন কোড লিখুন",
      });
    }
    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return Response.json({
        success: true,
        valid: false,
        message: "অবৈধ অর্ডার মূল্য",
      });
    }

    await connectDB();
    const coupon = await Coupon.findOne({ code }).lean();
    if (!coupon) {
      return Response.json({
        success: true,
        valid: false,
        message: "কুপন কোড খুঁজে পাওয়া যায়নি",
      });
    }
    if (!coupon.isActive) {
      return Response.json({
        success: true,
        valid: false,
        message: "এই কুপনটি সক্রিয় নয়",
      });
    }
    if (new Date(coupon.expiresAt) < new Date()) {
      return Response.json({
        success: true,
        valid: false,
        message: "কুপনটির মেয়াদ উত্তীর্ণ",
      });
    }
    if (coupon.usageLimit > 0 && (coupon.usedCount ?? 0) >= coupon.usageLimit) {
      return Response.json({
        success: true,
        valid: false,
        message: "কুপনটি ব্যবহারের সীমা শেষ",
      });
    }
    if (subtotal < (coupon.minOrderAmount ?? 0)) {
      return Response.json({
        success: true,
        valid: false,
        message: `ন্যূনতম অর্ডার ৳${(coupon.minOrderAmount ?? 0).toLocaleString("bn-BD")}`,
      });
    }

    let discount: number;
    if (coupon.type === "percentage") {
      discount = Math.round((subtotal * coupon.value) / 100);
      if (coupon.maxDiscount != null && coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = Math.min(coupon.value, subtotal);
    }
    if (discount < 0) discount = 0;

    return Response.json({
      success: true,
      valid: true,
      discount,
      code: coupon.code,
    });
  } catch (err) {
    console.error("[coupons/validate]", err);
    return Response.json(
      { success: false, message: "সার্ভার ত্রুটি" },
      { status: 500 },
    );
  }
}
