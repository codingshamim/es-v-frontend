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

export interface ISettings {
  store: {
    storeName: string;
    storeEmail: string;
    storePhone: string;
    storeAddress: string;
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
  updatedAt?: Date;
}

export interface ISettingsDocument extends ISettings, Document {}

export interface ISettingsModel extends Model<ISettingsDocument> {}

const SettingsSchema = new Schema<ISettingsDocument, ISettingsModel>(
  {
    store: { type: storeSchema, default: () => ({}) },
    shipping: { type: shippingSchema, default: () => ({}) },
    payment: { type: paymentSchema, default: () => ({}) },
    notifications: { type: notificationsSchema, default: () => ({}) },
  },
  { timestamps: true },
);

const Settings: ISettingsModel =
  (mongoose.models.Settings as ISettingsModel) ||
  mongoose.model<ISettingsDocument, ISettingsModel>("Settings", SettingsSchema);

export default Settings;
