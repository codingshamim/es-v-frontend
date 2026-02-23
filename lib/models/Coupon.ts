import mongoose, { Document, Model, Schema } from "mongoose";

export type CouponType = "percentage" | "fixed";

export interface ICoupon {
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  expiresAt: Date;
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICouponDocument extends ICoupon, Document {}

export interface ICouponModel extends Model<ICouponDocument> {}

const CouponSchema = new Schema<ICouponDocument, ICouponModel>(
  {
    code: {
      type: String,
      required: [true, "কুপন কোড প্রয়োজন"],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [30, "কোড ৩০ অক্ষরের বেশি হতে পারবে না"],
    },
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: [true, "কুপনের ধরন নির্বাচন করুন"],
    },
    value: {
      type: Number,
      required: [true, "মান প্রয়োজন"],
      min: [0, "মান ঋণাত্মক হতে পারবে না"],
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: [0, "ন্যূনতম অর্ডার ঋণাত্মক হতে পারবে না"],
    },
    maxDiscount: {
      type: Number,
      default: null,
    },
    usageLimit: {
      type: Number,
      default: 0,
      min: 0,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiresAt: {
      type: Date,
      required: [true, "মেয়াদ উত্তীর্ণের তারিখ প্রয়োজন"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, "বিবরণ ২০০ অক্ষরের বেশি হতে পারবে না"],
    },
  },
  { timestamps: true },
);

CouponSchema.index({ code: 1 });
CouponSchema.index({ isActive: 1, expiresAt: 1 });

const Coupon: ICouponModel =
  (mongoose.models.Coupon as ICouponModel) ||
  mongoose.model<ICouponDocument, ICouponModel>("Coupon", CouponSchema);

export default Coupon;
