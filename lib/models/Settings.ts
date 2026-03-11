import mongoose, { Document, Model, Schema } from "mongoose";

const storeSchema = new Schema(
  {
    storeName: { type: String, default: "", trim: true },
    storeEmail: { type: String, default: "", trim: true, lowercase: true },
    storePhone: { type: String, default: "", trim: true },
    storeAddress: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const shippingSchema = new Schema(
  {
    dhakaCharge: { type: Number, default: 60, min: 0 },
    outsideDhakaCharge: { type: Number, default: 120, min: 0 },
    freeShippingMin: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const paymentSchema = new Schema(
  {
    codEnabled: { type: Boolean, default: true },
    bkashEnabled: { type: Boolean, default: false },
    bkashNumber: { type: String, default: "", trim: true },
    nagadEnabled: { type: Boolean, default: false },
    nagadNumber: { type: String, default: "", trim: true },
    rocketEnabled: { type: Boolean, default: false },
    rocketNumber: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const notificationsSchema = new Schema(
  {
    orderNotification: { type: Boolean, default: true },
    lowStockNotification: { type: Boolean, default: true },
    newReviewNotification: { type: Boolean, default: false },
  },
  { _id: false },
);

const socialSchema = new Schema(
  {
    facebook: { type: String, default: "", trim: true },
    instagram: { type: String, default: "", trim: true },
    linkedin: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const contactQuickSchema = new Schema(
  {
    phone: { type: String, default: "+880 1816628413", trim: true },
    phoneHours: { type: String, default: "প্রতিদিন সকাল ১০টা – রাত ১০টা", trim: true },
    trackOrderText: { type: String, default: "আপনার অর্ডার স্ট্যাটাস জানতে /track-order ব্যবহার করুন।", trim: true },
    email: { type: String, default: "contact@esfitt.com", trim: true },
    emailNote: { type: String, default: "২৪/৭ ইমেইলে মেসেজ করতে পারেন", trim: true },
  },
  { _id: false },
);

const faqItemSchema = new Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const contactSchema = new Schema(
  {
    quickContact: { type: contactQuickSchema, default: () => ({}) },
    faqs: { type: [faqItemSchema], default: () => [] },
  },
  { _id: false },
);

export interface ISettings {
  store: {
    storeName: string;
    storeEmail: string;
    storePhone: string;
    storeAddress: string;
  };
  social?: {
    facebook: string;
    instagram: string;
    linkedin: string;
  };
  shipping: {
    dhakaCharge: number;
    outsideDhakaCharge: number;
    freeShippingMin: number;
  };
  payment: {
    codEnabled: boolean;
    bkashEnabled: boolean;
    bkashNumber: string;
    nagadEnabled: boolean;
    nagadNumber: string;
    rocketEnabled: boolean;
    rocketNumber: string;
  };
  notifications: {
    orderNotification: boolean;
    lowStockNotification: boolean;
    newReviewNotification: boolean;
  };
  contact?: {
    quickContact: {
      phone: string;
      phoneHours: string;
      trackOrderText: string;
      email: string;
      emailNote: string;
    };
    faqs: Array<{ question: string; answer: string }>;
  };
  updatedAt?: Date;
}

export interface ISettingsDocument extends ISettings, Document {}

export type ISettingsModel = Model<ISettingsDocument>;

const SettingsSchema = new Schema<ISettingsDocument, ISettingsModel>(
  {
    store: { type: storeSchema, default: () => ({}) },
    social: { type: socialSchema, default: () => ({}) },
    shipping: { type: shippingSchema, default: () => ({}) },
    payment: { type: paymentSchema, default: () => ({}) },
    notifications: { type: notificationsSchema, default: () => ({}) },
    contact: { type: contactSchema, default: () => ({ quickContact: {}, faqs: [] }) },
  },
  { timestamps: true },
);

const Settings: ISettingsModel =
  (mongoose.models.Settings as ISettingsModel) ||
  mongoose.model<ISettingsDocument, ISettingsModel>("Settings", SettingsSchema);

export default Settings;
