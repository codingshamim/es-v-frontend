import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IAdminReply {
  text: string;
  repliedAt: Date;
  repliedBy: Types.ObjectId;
}

export interface IReview {
  product: Types.ObjectId;
  user?: Types.ObjectId;
  name: string;
  rating: number;
  comment: string;
  images: string[];
  isVerifiedPurchase: boolean;
  adminReply?: IAdminReply;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReviewDocument extends IReview, Document {}

export interface IReviewModel extends Model<IReviewDocument> {}

const ReviewSchema = new Schema<IReviewDocument, IReviewModel>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "পণ্য নির্বাচন করুন"],
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: {
      type: String,
      required: [true, "নাম প্রয়োজন"],
      trim: true,
      maxlength: [100, "নাম ১০০ অক্ষরের বেশি হতে পারবে না"],
    },
    rating: {
      type: Number,
      required: [true, "রেটিং প্রয়োজন"],
      min: [1, "রেটিং কমপক্ষে ১ হতে হবে"],
      max: [5, "রেটিং সর্বোচ্চ ৫ হতে পারবে"],
    },
    comment: {
      type: String,
      required: [true, "মতামত প্রয়োজন"],
      trim: true,
      maxlength: [2000, "মতামত ২০০০ অক্ষরের বেশি হতে পারবে না"],
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 5,
        message: "সর্বোচ্চ ৫টি ছবি আপলোড করা যাবে",
      },
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    adminReply: {
      type: new Schema(
        {
          text: { type: String, default: "", trim: true, maxlength: 2000 },
          repliedAt: { type: Date, default: null },
          repliedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
        },
        { _id: false },
      ),
      default: null,
    },
  },
  { timestamps: true },
);

ReviewSchema.index({ product: 1, createdAt: -1 });
ReviewSchema.index({ user: 1 });

const Review: IReviewModel =
  (mongoose.models.Review as IReviewModel) ||
  mongoose.model<IReviewDocument, IReviewModel>("Review", ReviewSchema);

export default Review;
