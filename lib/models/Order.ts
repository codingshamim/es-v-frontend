import mongoose, { Document, Model, Schema, Types } from "mongoose";

// ─── Type Definitions ─────────────────────────────────────────────────────────

export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  image: string;
  size: string;
  color: string;
  colorName: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
}

export interface IShipping {
  name: string;
  phone: string;
  email?: string;
  district: string;
  city: string;
  address: string;
  notes?: string;
}

export interface IPayment {
  method: "cod" | "bkash" | "nagad" | "rocket";
  status: "pending" | "verified" | "failed";
  transactionId?: string;
  senderNumber?: string;
  verifiedAt?: Date;
}

export interface IOrderPricing {
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  total: number;
}

export interface IStatusHistory {
  status: string;
  timestamp: Date;
  note?: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface IOrder {
  orderId: string;
  user?: Types.ObjectId;
  items: IOrderItem[];
  shipping: IShipping;
  payment: IPayment;
  pricing: IOrderPricing;
  couponCode?: string;
  status: OrderStatus;
  statusHistory: IStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderDocument extends IOrder, Document {}

export interface IOrderModel extends Model<IOrderDocument> {}

// ─── Helper ──────────────────────────────────────────────────────────────────

function generateOrderId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "ES";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "পণ্য নির্বাচন করুন"],
    },
    name: {
      type: String,
      required: [true, "পণ্যের নাম প্রয়োজন"],
      trim: true,
    },
    image: {
      type: String,
      required: [true, "পণ্যের ছবি প্রয়োজন"],
      trim: true,
    },
    size: {
      type: String,
      required: [true, "সাইজ নির্বাচন করুন"],
      trim: true,
    },
    color: {
      type: String,
      required: [true, "রঙ নির্বাচন করুন"],
      trim: true,
    },
    colorName: {
      type: String,
      required: [true, "রঙের নাম প্রয়োজন"],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "পরিমাণ প্রয়োজন"],
      min: [1, "পরিমাণ কমপক্ষে ১ হতে হবে"],
    },
    unitPrice: {
      type: Number,
      required: [true, "একক মূল্য প্রয়োজন"],
      min: [0, "মূল্য ঋণাত্মক হতে পারবে না"],
    },
    originalPrice: {
      type: Number,
      required: [true, "মূল মূল্য প্রয়োজন"],
      min: [0, "মূল্য ঋণাত্মক হতে পারবে না"],
    },
  },
  { _id: false },
);

const ShippingSchema = new Schema<IShipping>(
  {
    name: {
      type: String,
      required: [true, "নাম প্রয়োজন"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "ফোন নম্বর প্রয়োজন"],
      trim: true,
      match: [
        /^(\+88)?01[0-9]{9}$/,
        "বৈধ ফোন নম্বর লিখুন (01XXXXXXXXX বা +8801XXXXXXXXX)",
      ],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    district: {
      type: String,
      required: [true, "জেলা নির্বাচন করুন"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "শহর/উপজেলা নির্বাচন করুন"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "ঠিকানা প্রয়োজন"],
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

const PaymentSchema = new Schema<IPayment>(
  {
    method: {
      type: String,
      required: [true, "পেমেন্ট পদ্ধতি নির্বাচন করুন"],
      enum: {
        values: ["cod", "bkash", "nagad", "rocket"],
        message: "{VALUE} বৈধ পেমেন্ট পদ্ধতি নয়",
      },
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "verified", "failed"],
        message: "{VALUE} বৈধ পেমেন্ট স্ট্যাটাস নয়",
      },
      default: "pending",
    },
    transactionId: {
      type: String,
      trim: true,
    },
    senderNumber: {
      type: String,
      trim: true,
    },
    verifiedAt: {
      type: Date,
    },
  },
  { _id: false },
);

const OrderPricingSchema = new Schema<IOrderPricing>(
  {
    subtotal: {
      type: Number,
      required: [true, "সাবটোটাল প্রয়োজন"],
      min: [0, "সাবটোটাল ঋণাত্মক হতে পারবে না"],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "ডিসকাউন্ট ঋণাত্মক হতে পারবে না"],
    },
    deliveryCharge: {
      type: Number,
      required: [true, "ডেলিভারি চার্জ প্রয়োজন"],
      min: [0, "ডেলিভারি চার্জ ঋণাত্মক হতে পারবে না"],
    },
    total: {
      type: Number,
      required: [true, "মোট মূল্য প্রয়োজন"],
      min: [0, "মোট মূল্য ঋণাত্মক হতে পারবে না"],
    },
  },
  { _id: false },
);

const StatusHistorySchema = new Schema<IStatusHistory>(
  {
    status: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

// ─── Main Order Schema ───────────────────────────────────────────────────────

const OrderSchema = new Schema<IOrderDocument, IOrderModel>(
  {
    orderId: {
      type: String,
      unique: true,
      default: generateOrderId,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    items: {
      type: [OrderItemSchema],
      required: [true, "অর্ডারে কমপক্ষে একটি পণ্য থাকতে হবে"],
      validate: {
        validator: (v: IOrderItem[]) => v.length > 0,
        message: "অর্ডারে কমপক্ষে একটি পণ্য থাকতে হবে",
      },
    },
    shipping: {
      type: ShippingSchema,
      required: [true, "শিপিং তথ্য প্রয়োজন"],
    },
    payment: {
      type: PaymentSchema,
      required: [true, "পেমেন্ট তথ্য প্রয়োজন"],
    },
    pricing: {
      type: OrderPricingSchema,
      required: [true, "মূল্য তথ্য প্রয়োজন"],
    },
    couponCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: {
        values: [
          "pending",
          "confirmed",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
        ],
        message: "{VALUE} বৈধ অর্ডার স্ট্যাটাস নয়",
      },
      default: "pending",
    },
    statusHistory: {
      type: [StatusHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

OrderSchema.index({ user: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ "payment.status": 1 });

// ─── Export ───────────────────────────────────────────────────────────────────

const Order: IOrderModel =
  (mongoose.models.Order as IOrderModel) ||
  mongoose.model<IOrderDocument, IOrderModel>("Order", OrderSchema);

export default Order;
