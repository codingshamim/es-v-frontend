import { requireAdmin } from "@/lib/admin/auth-check";
import { connectDB } from "@/lib/db/connectDB";
import Order from "@/lib/models/Order";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { authorized, error } = await requireAdmin("order_management");
    if (!authorized) return error;

    const { id } = await params;
    await connectDB();
    const order = await Order.findById(id).populate("user", "name email phone").lean();
    if (!order) {
      return Response.json({ success: false, message: "Order not found" }, { status: 404 });
    }
    return Response.json({ success: true, data: order });
  } catch (err) {
    console.error("[admin/orders GET id]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { authorized, error } = await requireAdmin("order_management");
    if (!authorized) return error;

    const { id } = await params;
    await connectDB();
    const body = await req.json();

    const order = await Order.findById(id);
    if (!order) {
      return Response.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    if (body.status) {
      order.status = body.status;
      order.statusHistory.push({
        status: body.status,
        timestamp: new Date(),
        note: body.note || `Status updated to ${body.status}`,
      });
    }

    if (body.paymentStatus) {
      order.payment.status = body.paymentStatus;
      if (body.paymentStatus === "verified") {
        order.payment.verifiedAt = new Date();
      }
    }
    if (body.transactionId !== undefined) {
      order.payment.transactionId = String(body.transactionId || "").trim() || undefined;
    }
    if (body.senderNumber !== undefined) {
      order.payment.senderNumber = String(body.senderNumber || "").trim() || undefined;
    }

    await order.save();
    const out = order.toObject ? order.toObject() : order;
    return Response.json({ success: true, data: out, order: out });
  } catch (err) {
    console.error("[admin/orders PUT]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
