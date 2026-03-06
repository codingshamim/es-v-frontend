import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connectDB";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import type { IOrderItem, IShipping, IPayment, OrderStatus } from "@/lib/models/Order";

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

export interface CreateOrderResult {
  success: boolean;
  message?: string;
  orderId?: string;
  data?: Record<string, unknown>;
  errors?: Record<string, string>;
}

const PHONE_REGEX = /^(\+88)?01[0-9]{9}$/;
const DELIVERY_CHARGE_DHAKA = 120;
const DELIVERY_CHARGE_OUTSIDE = 150;

export async function createOrderInternal(
  data: CreateOrderPayload,
  userId: string | null = null
): Promise<CreateOrderResult> {
  const errors: Record<string, string> = {};

  if (!data.items || data.items.length === 0) {
    errors.items = "At least one product is required";
  } else {
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (!item.product) errors[`items.${i}.product`] = "Product required";
      if (!item.name) errors[`items.${i}.name`] = "Product name required";
      if (!item.size) errors[`items.${i}.size`] = "Size required";
      if (!item.color) errors[`items.${i}.color`] = "Color required";
      if (item.quantity == null || item.quantity < 1)
        errors[`items.${i}.quantity`] = "Quantity must be at least 1";
      if (item.unitPrice == null || item.unitPrice < 0)
        errors[`items.${i}.unitPrice`] = "Unit price required";
    }
  }

  if (!data.shipping?.name?.trim()) errors["shipping.name"] = "Name required";
  if (!data.shipping?.phone?.trim()) {
    errors["shipping.phone"] = "Phone required";
  } else if (!PHONE_REGEX.test(data.shipping.phone.trim().replace(/\s/g, ""))) {
    errors["shipping.phone"] = "Valid phone required (01XXXXXXXXX)";
  }
  if (!data.shipping?.district?.trim()) errors["shipping.district"] = "District required";
  if (!data.shipping?.city?.trim()) errors["shipping.city"] = "City/Upazila required";
  if (!data.shipping?.address?.trim()) errors["shipping.address"] = "Address required";

  const validPaymentMethods = ["cod", "bkash", "nagad", "rocket"];
  if (!data.paymentMethod || !validPaymentMethods.includes(data.paymentMethod)) {
    errors["paymentMethod"] = "Valid payment method required";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, message: "Validation failed", errors };
  }

  await connectDB();

  const subtotal = data.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const district = data.shipping.district.trim().toLowerCase();
  const isDhaka = district === "dhaka" || district === "ঢাকা";
  const deliveryCharge = isDhaka ? DELIVERY_CHARGE_DHAKA : DELIVERY_CHARGE_OUTSIDE;
  const discount = 0;
  const total = subtotal - discount + deliveryCharge;

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

  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
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
        { session: dbSession, returnDocument: "after" }
      );

      if (!result) {
        await dbSession.abortTransaction();
        dbSession.endSession();
        return {
          success: false,
          message: `Insufficient stock for "${item.name}" (${item.size})`,
        };
      }
    }

    const orderDoc: Record<string, unknown> = {
      items,
      shipping,
      payment,
      pricing: { subtotal, discount, deliveryCharge, total },
      couponCode: data.couponCode?.trim().toUpperCase() || undefined,
      status: initialStatus,
      statusHistory: [
        {
          status: initialStatus,
          timestamp: new Date(),
          note: "Order created",
        },
      ],
    };

    if (userId) {
      (orderDoc as { user?: mongoose.Types.ObjectId }).user =
        new mongoose.Types.ObjectId(userId);
    }

    const order = await Order.create([orderDoc], { session: dbSession });

    await dbSession.commitTransaction();
    dbSession.endSession();

    const created = order[0];
    return {
      success: true,
      message: "Order created successfully",
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
}
