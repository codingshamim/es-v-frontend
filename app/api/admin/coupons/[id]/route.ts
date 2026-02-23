import { requireAdmin } from "@/lib/admin/auth-check";
import { connectDB } from "@/lib/db/connectDB";
import Coupon from "@/lib/models/Coupon";
import { NextRequest } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { authorized, error } = await requireAdmin("coupon_management");
    if (!authorized) return error;
    const { id } = await params;
    await connectDB();
    const body = await req.json();
    const coupon = await Coupon.findByIdAndUpdate(id, body, { returnDocument: "after", runValidators: true });
    if (!coupon) return Response.json({ success: false, message: "Coupon not found" }, { status: 404 });
    return Response.json({ success: true, data: coupon });
  } catch (err) {
    console.error("[admin/coupons PUT]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { authorized, error } = await requireAdmin("coupon_management");
    if (!authorized) return error;
    const { id } = await params;
    await connectDB();
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) return Response.json({ success: false, message: "Coupon not found" }, { status: 404 });
    return Response.json({ success: true, message: "Coupon deleted" });
  } catch (err) {
    console.error("[admin/coupons DELETE]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
