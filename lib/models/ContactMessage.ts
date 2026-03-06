import mongoose, { Document, Model, Schema } from "mongoose";

// ─── Type Definitions ─────────────────────────────────────────────────────────

export type ContactTopic =
  | "order"
  | "size"
  | "delivery"
  | "return"
  | "other";

export interface IContactMessage {
  name: string;
  phone: string;
  email?: string;
  topic: ContactTopic;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IContactMessageDocument extends IContactMessage, Document {}

export interface IContactMessageModel extends Model<IContactMessageDocument> {}

// ─── Schema ───────────────────────────────────────────────────────────────────

const ContactMessageSchema = new Schema<
  IContactMessageDocument,
  IContactMessageModel
>(
  {
    name: {
      type: String,
      required: [true, "নাম প্রয়োজন"],
      trim: true,
      maxlength: [100, "নাম ১০০ অক্ষরের বেশি হতে পারবে না"],
    },
    phone: {
      type: String,
      required: [true, "ফোন নম্বর প্রয়োজন"],
      trim: true,
      maxlength: [20, "ফোন নম্বর ২০ অক্ষরের বেশি হতে পারবে না"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [120, "ইমেইল ১২০ অক্ষরের বেশি হতে পারবে না"],
    },
    topic: {
      type: String,
      enum: ["order", "size", "delivery", "return", "other"],
      default: "other",
    },
    message: {
      type: String,
      required: [true, "মেসেজ প্রয়োজন"],
      trim: true,
      maxlength: [2000, "মেসেজ ২০০০ অক্ষরের বেশি হতে পারবে না"],
    },
  },
  { timestamps: true },
);

ContactMessageSchema.index({ createdAt: -1 });

// ─── Model Export ────────────────────────────────────────────────────────────

let ContactMessage: IContactMessageModel;

try {
  ContactMessage = mongoose.model<IContactMessageDocument, IContactMessageModel>(
    "ContactMessage",
  );
} catch {
  ContactMessage = mongoose.model<IContactMessageDocument, IContactMessageModel>(
    "ContactMessage",
    ContactMessageSchema,
  );
}

export default ContactMessage;
