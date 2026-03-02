import { requireAdmin } from "@/lib/admin/auth-check";
import { connectDB } from "@/lib/db/connectDB";
import Order from "@/lib/models/Order";
import { createOrderInternal } from "@/lib/orders/create-order-internal";
import type { CreateOrderPayload } from "@/lib/orders/create-order-internal";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { authorized, error } = await requireAdmin("order_management");
    if (!authorized) return error;

    const body = await req.json();
    const payload: CreateOrderPayload = {
      items: body.items ?? [],
      shipping: body.shipping ?? {},
      paymentMethod: body.paymentMethod ?? "cod",
      couponCode: body.couponCode,
    };
    const userId = typeof body.userId === "string" && body.userId.trim() ? body.userId.trim() : null;

    const result = await createOrderInternal(payload, userId);

    if (!result.success) {
      return Response.json(
        { success: false, message: result.message, errors: result.errors },
        { status: 400 }
      );
    }

    return Response.json(
      {
        success: true,
        message: result.message,
        orderId: result.orderId,
        data: result.data,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[admin/orders POST]", err);
    return Response.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { authorized, error } = await requireAdmin("order_management");
    if (!authorized) return error;

    await connectDB();
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(url.searchParams.get("limit") || "20"));
    const search = url.searchParams.get("search")?.trim();
    const status = url.searchParams.get("status");
    const paymentStatus = url.searchParams.get("paymentStatus");

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { "shipping.name": { $regex: search, $options: "i" } },
        { "shipping.phone": { $regex: search, $options: "i" } },
      ];
    }
    if (status && status !== "all") filter.status = status;
    if (paymentStatus && paymentStatus !== "all") filter["payment.status"] = paymentStatus;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("user", "name email")
        .lean(),
      Order.countDocuments(filter),
    ]);

    return Response.json({
      success: true,
      data: orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[admin/orders GET]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
