import { requireAdmin } from "@/lib/admin/auth-check";
import { connectDB } from "@/lib/db/connectDB";
import Coupon from "@/lib/models/Coupon";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const { authorized, error } = await requireAdmin("coupon_management");
    if (!authorized) return error;
    await connectDB();
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    return Response.json({ success: true, data: coupons });
  } catch (err) {
    console.error("[admin/coupons GET]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { authorized, error } = await requireAdmin("coupon_management");
    if (!authorized) return error;
    await connectDB();
    const body = await req.json();
    const coupon = await Coupon.create(body);
    return Response.json({ success: true, data: coupon }, { status: 201 });
  } catch (err) {
    console.error("[admin/coupons POST]", err);
    const message = err instanceof Error ? err.message : "Server error";
    return Response.json({ success: false, message }, { status: 500 });
  }
}
