"use server";

import mongoose from "mongoose";
import { emitToAdmin } from "@/lib/socket-server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/connectDB";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import type { IOrderItem, IShipping, IPayment, OrderStatus } from "@/lib/models/Order";

// ─── Type Definitions ─────────────────────────────────────────────────────────

export interface CreateOrderPayload {
  items: {
    product: string;
    name: string;
    image: string;
    size: string;
    color: string;
    colorName: string;
    quantity: number;
    unitPrice: number;
    originalPrice: number;
  }[];
  shipping: {
    name: string;
    phone: string;
    email?: string;
    district: string;
    city: string;
    address: string;
    notes?: string;
  };
  paymentMethod: "cod" | "bkash" | "nagad" | "rocket";
  couponCode?: string;
}

export interface OrderResult {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
  orderId?: string;
  errors?: Record<string, string>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PHONE_REGEX = /^(\+88)?01[0-9]{9}$/;
const DELIVERY_CHARGE_DHAKA = 120;
const DELIVERY_CHARGE_OUTSIDE = 150;

// ─── createOrder ──────────────────────────────────────────────────────────────

export async function createOrder(
  data: CreateOrderPayload,
): Promise<OrderResult> {
  try {
    // --- Validation ---
    const errors: Record<string, string> = {};

    if (!data.items || data.items.length === 0) {
      errors.items = "অর্ডারে কমপক্ষে একটি পণ্য থাকতে হবে";
    } else {
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        if (!item.product) errors[`items.${i}.product`] = "পণ্য নির্বাচন করুন";
        if (!item.name) errors[`items.${i}.name`] = "পণ্যের নাম প্রয়োজন";
        if (!item.size) errors[`items.${i}.size`] = "সাইজ নির্বাচন করুন";
        if (!item.color) errors[`items.${i}.color`] = "রঙ নির্বাচন করুন";
        if (!item.quantity || item.quantity < 1)
          errors[`items.${i}.quantity`] = "পরিমাণ কমপক্ষে ১ হতে হবে";
        if (item.unitPrice == null || item.unitPrice < 0)
          errors[`items.${i}.unitPrice`] = "একক মূল্য প্রয়োজন";
      }
    }

    if (!data.shipping?.name?.trim()) {
      errors["shipping.name"] = "নাম প্রয়োজন";
    }
    if (!data.shipping?.phone?.trim()) {
      errors["shipping.phone"] = "ফোন নম্বর প্রয়োজন";
    } else if (!PHONE_REGEX.test(data.shipping.phone.trim().replace(/\s/g, ""))) {
      errors["shipping.phone"] =
        "বৈধ ফোন নম্বর লিখুন (01XXXXXXXXX বা +8801XXXXXXXXX)";
    }
    if (!data.shipping?.district?.trim()) {
      errors["shipping.district"] = "জেলা নির্বাচন করুন";
    }
    if (!data.shipping?.city?.trim()) {
      errors["shipping.city"] = "শহর/উপজেলা নির্বাচন করুন";
    }
    if (!data.shipping?.address?.trim()) {
      errors["shipping.address"] = "ঠিকানা প্রয়োজন";
    }

    const validPaymentMethods = ["cod", "bkash", "nagad", "rocket"];
    if (!data.paymentMethod || !validPaymentMethods.includes(data.paymentMethod)) {
      errors["paymentMethod"] = "বৈধ পেমেন্ট পদ্ধতি নির্বাচন করুন";
    }

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: "ফর্ম যাচাইকরণ ব্যর্থ",
        errors,
      };
    }

    // --- Auth (optional for guest checkout) ---
    const session = await auth();
    const userId = session?.user?.id ?? null;

    await connectDB();

    // --- Calculate pricing ---
    const subtotal = data.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const isDhaka =
      data.shipping.district.trim().toLowerCase() === "dhaka" ||
      data.shipping.district.trim().toLowerCase() === "ঢাকা";
    const deliveryCharge = isDhaka ? DELIVERY_CHARGE_DHAKA : DELIVERY_CHARGE_OUTSIDE;
    const discount = 0;
    const total = subtotal - discount + deliveryCharge;

    // --- Build order data ---
    const items: IOrderItem[] = data.items.map((item) => ({
      product: new mongoose.Types.ObjectId(item.product),
      name: item.name,
      image: item.image,
      size: item.size,
      color: item.color,
      colorName: item.colorName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      originalPrice: item.originalPrice,
    }));

    const shipping: IShipping = {
      name: data.shipping.name.trim(),
      phone: data.shipping.phone.trim().replace(/\s/g, ""),
      email: data.shipping.email?.trim() || undefined,
      district: data.shipping.district.trim(),
      city: data.shipping.city.trim(),
      address: data.shipping.address.trim(),
      notes: data.shipping.notes?.trim() || undefined,
    };

    const payment: IPayment = {
      method: data.paymentMethod,
      status: "pending",
    };

    const initialStatus: OrderStatus = "pending";

    // --- Use transaction for atomicity ---
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
      // Decrement stock for each item's size
      for (const item of data.items) {
        const result = await Product.findOneAndUpdate(
          {
            _id: item.product,
            "sizes.label": item.size.toUpperCase(),
            "sizes.stock": { $gte: item.quantity },
          },
          {
            $inc: {
              "sizes.$.stock": -item.quantity,
              totalStock: -item.quantity,
              soldCount: item.quantity,
            },
          },
          { session: dbSession, returnDocument: "after" },
        );

        if (!result) {
          await dbSession.abortTransaction();
          dbSession.endSession();
          return {
            success: false,
            message: `"${item.name}" (${item.size}) পর্যাপ্ত স্টক নেই`,
          };
        }
      }

      const orderDoc: Record<string, unknown> = {
        items,
        shipping,
        payment,
        pricing: {
          subtotal,
          discount,
          deliveryCharge,
          total,
        },
        couponCode: data.couponCode?.trim().toUpperCase() || undefined,
        status: initialStatus,
        statusHistory: [
          {
            status: initialStatus,
            timestamp: new Date(),
            note: "অর্ডার তৈরি হয়েছে",
          },
        ],
      };

      if (userId) {
        (orderDoc as { user?: mongoose.Types.ObjectId }).user =
          new mongoose.Types.ObjectId(userId);
      }

      const order = await Order.create([orderDoc], {
        session: dbSession,
      });

      await dbSession.commitTransaction();
      dbSession.endSession();

      const created = order[0];
      emitToAdmin("notification", { type: "order", orderId: created.orderId });
      return {
        success: true,
        message: "অর্ডার সফলভাবে তৈরি হয়েছে",
        orderId: created.orderId,
        data: {
          _id: created._id?.toString(),
          orderId: created.orderId,
          status: created.status,
          total: created.pricing.total,
        },
      };
    } catch (txError) {
      await dbSession.abortTransaction();
      dbSession.endSession();
      throw txError;
    }
  } catch (error) {
    console.error("[orders] createOrder error:", error);
    return {
      success: false,
      message: "অর্ডার তৈরি করতে ব্যর্থ। আবার চেষ্টা করুন।",
    };
  }
}

// ─── getOrder ─────────────────────────────────────────────────────────────────

export async function getOrder(orderId: string): Promise<OrderResult> {
  try {
    if (!orderId?.trim()) {
      return { success: false, message: "অর্ডার আইডি প্রয়োজন" };
    }

    await connectDB();

    const order = await Order.findOne({ orderId: orderId.trim() })
      .populate("items.product", "slug images.main")
      .lean();

    if (!order) {
      return { success: false, message: "অর্ডার খুঁজে পাওয়া যায়নি" };
    }

    const session = await auth();
    if (session?.user?.id) {
      const isOwner = order.user?.toString() === session.user.id;
      const isAdmin = (session.user as { role?: string }).role === "admin";
      if (order.user && !isOwner && !isAdmin) {
        return { success: false, message: "এই অর্ডার দেখার অনুমতি নেই" };
      }
    }

    return {
      success: true,
      data: JSON.parse(JSON.stringify(order)),
    };
  } catch (error) {
    console.error("[orders] getOrder error:", error);
    return {
      success: false,
      message: "অর্ডার লোড করতে ব্যর্থ। আবার চেষ্টা করুন।",
    };
  }
}

// ─── verifyPayment ────────────────────────────────────────────────────────────

export async function verifyPayment(
  orderId: string,
  senderNumber: string,
  transactionId: string,
): Promise<OrderResult> {
  try {
    if (!orderId?.trim()) {
      return { success: false, message: "অর্ডার আইডি প্রয়োজন" };
    }
    if (!senderNumber?.trim()) {
      return { success: false, message: "প্রেরকের নম্বর প্রয়োজন" };
    }
    if (!PHONE_REGEX.test(senderNumber.trim().replace(/\s/g, ""))) {
      return {
        success: false,
        message: "বৈধ ফোন নম্বর লিখুন (01XXXXXXXXX বা +8801XXXXXXXXX)",
      };
    }
    if (!transactionId?.trim()) {
      return { success: false, message: "ট্রানজেকশন আইডি প্রয়োজন" };
    }

    await connectDB();

    const order = await Order.findOne({ orderId: orderId.trim() });
    if (!order) {
      return { success: false, message: "অর্ডার খুঁজে পাওয়া যায়নি" };
    }

    if (order.payment.status === "verified") {
      return { success: false, message: "পেমেন্ট ইতিমধ্যে ভেরিফাই করা হয়েছে" };
    }

    // Only save transaction details — admin will manually verify
    order.payment.senderNumber = senderNumber.trim().replace(/\s/g, "");
    order.payment.transactionId = transactionId.trim();
    // Do NOT set payment.status = "verified" — manual verification by admin

    const note =
      order.payment.method === "cod"
        ? "কাস্টমার ডেলিভারি চার্জের ট্রানজেকশন আইডি জমা দিয়েছে (অ্যাডমিন যাচাই করবেন)"
        : `কাস্টমার পেমেন্ট তথ্য জমা দিয়েছে (অ্যাডমিন যাচাই করবেন) — TrxID: ${transactionId.trim()}`;
    order.statusHistory.push({
      status: order.status,
      timestamp: new Date(),
      note,
    });

    await order.save();

    return {
      success: true,
      message: "পেমেন্ট তথ্য জমা হয়েছে। অ্যাডমিন যাচাই করবেন।",
      data: {
        orderId: order.orderId,
        status: order.status,
        paymentStatus: order.payment.status,
      },
    };
  } catch (error) {
    console.error("[orders] verifyPayment error:", error);
    return {
      success: false,
      message: "পেমেন্ট ভেরিফাই করতে ব্যর্থ। আবার চেষ্টা করুন।",
    };
  }
}

// ─── confirmCodOrder ──────────────────────────────────────────────────────────

export async function confirmCodOrder(orderId: string): Promise<OrderResult> {
  try {
    if (!orderId?.trim()) {
      return { success: false, message: "অর্ডার আইডি প্রয়োজন" };
    }

    await connectDB();

    const order = await Order.findOne({ orderId: orderId.trim() });
    if (!order) {
      return { success: false, message: "অর্ডার খুঁজে পাওয়া যায়নি" };
    }

    if (order.payment.method !== "cod") {
      return {
        success: false,
        message: "এটি ক্যাশ অন ডেলিভারি অর্ডার নয়",
      };
    }

    if (order.status !== "pending") {
      return {
        success: false,
        message: "শুধুমাত্র পেন্ডিং অর্ডার কনফার্ম করা যাবে",
      };
    }

    order.status = "confirmed";
    order.statusHistory.push({
      status: "confirmed",
      timestamp: new Date(),
      note: "ক্যাশ অন ডেলিভারি অর্ডার কনফার্ম হয়েছে",
    });

    await order.save();

    return {
      success: true,
      message: "অর্ডার সফলভাবে কনফার্ম হয়েছে",
      data: {
        orderId: order.orderId,
        status: order.status,
      },
    };
  } catch (error) {
    console.error("[orders] confirmCodOrder error:", error);
    return {
      success: false,
      message: "অর্ডার কনফার্ম করতে ব্যর্থ। আবার চেষ্টা করুন।",
    };
  }
}

// ─── getMyOrderCounts ─────────────────────────────────────────────────────────

export async function getMyOrderCounts(): Promise<{
  success: boolean;
  total?: number;
  completed?: number;
  pending?: number;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: true, total: 0, completed: 0, pending: 0 };
    }

    await connectDB();
    const userId = session.user.id;

    const [total, deliveredCount, pendingCount] = await Promise.all([
      Order.countDocuments({ user: userId }),
      Order.countDocuments({ user: userId, status: "delivered" }),
      Order.countDocuments({
        user: userId,
        status: { $in: ["pending", "confirmed", "processing", "shipped"] },
      }),
    ]);

    return {
      success: true,
      total: total ?? 0,
      completed: deliveredCount ?? 0,
      pending: pendingCount ?? 0,
    };
  } catch (error) {
    console.error("[orders] getMyOrderCounts error:", error);
    return { success: false };
  }
}

// ─── getMyOrders ─────────────────────────────────────────────────────────────

export async function getMyOrders(): Promise<{
  success: boolean;
  data?: Array<{
    _id: string;
    orderId: string;
    status: string;
    createdAt: string;
    items: Array<{
      name: string;
      image: string;
      size: string;
      colorName: string;
      quantity: number;
      unitPrice: number;
    }>;
    pricing: { total: number };
  }>;
  message?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: true, data: [] };
    }

    await connectDB();
    const userId = session.user.id;

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const data = orders.map((o) => ({
      _id: o._id?.toString(),
      orderId: o.orderId,
      status: o.status as string,
      createdAt: o.createdAt?.toISOString?.() ?? String(o.createdAt ?? ""),
      items: (o.items ?? []).map((it: IOrderItem) => ({
        name: it.name,
        image: it.image,
        size: it.size,
        colorName: it.colorName ?? it.color ?? "",
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      })),
      pricing: { total: o.pricing?.total ?? 0 },
    }));

    return { success: true, data };
  } catch (error) {
    console.error("[orders] getMyOrders error:", error);
    return {
      success: false,
      message: "অর্ডার তালিকা লোড করতে ব্যর্থ।",
    };
  }
}
