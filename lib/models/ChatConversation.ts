import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IChatMessage {
  sender: "customer" | "admin";
  senderId?: Types.ObjectId;
  senderName: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface IChatConversation {
  customer?: Types.ObjectId | null;
  guestId?: Types.ObjectId | null;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  assignedAdmin?: Types.ObjectId;
  status: "active" | "pending" | "closed";
  messages: IChatMessage[];
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatConversationDocument
  extends IChatConversation,
    Document {}

export interface IChatConversationModel
  extends Model<IChatConversationDocument> {}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    sender: {
      type: String,
      enum: ["customer", "admin"],
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true },
);

const ChatConversationSchema = new Schema<
  IChatConversationDocument,
  IChatConversationModel
>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    guestId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    assignedAdmin: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "pending", "closed"],
      default: "pending",
    },
    messages: {
      type: [ChatMessageSchema],
      default: [],
    },
    lastMessage: {
      type: String,
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    unreadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

ChatConversationSchema.index({ customer: 1 });
ChatConversationSchema.index({ customerPhone: 1 });
ChatConversationSchema.index({ status: 1, lastMessageAt: -1 });
ChatConversationSchema.index({ assignedAdmin: 1, status: 1 });

const ChatConversation: IChatConversationModel =
  (mongoose.models.ChatConversation as IChatConversationModel) ||
  mongoose.model<IChatConversationDocument, IChatConversationModel>(
    "ChatConversation",
    ChatConversationSchema,
  );

export default ChatConversation;
