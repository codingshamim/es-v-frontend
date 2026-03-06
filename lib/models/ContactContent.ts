import mongoose, { Document, Model, Schema } from "mongoose";

const quickContactSchema = new Schema(
  {
    phone: { type: String, default: "+880 1816628413", trim: true },
    phoneHours: { type: String, default: "প্রতিদিন সকাল ১০টা – রাত ১০টা", trim: true },
    trackOrderText: {
      type: String,
      default: "আপনার অর্ডার স্ট্যাটাস জানতে /track-order ব্যবহার করুন।",
      trim: true,
    },
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

const contactContentSchema = new Schema(
  {
    quickContact: { type: quickContactSchema, default: () => ({}) },
    faqs: { type: [faqItemSchema], default: () => [] },
  },
  { timestamps: true, collection: "contactcontents" },
);

export interface IContactContent {
  quickContact: {
    phone: string;
    phoneHours: string;
    trackOrderText: string;
    email: string;
    emailNote: string;
  };
  faqs: Array<{ question: string; answer: string }>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IContactContentDocument extends IContactContent, Document {}

export interface IContactContentModel extends Model<IContactContentDocument> {}

let ContactContent: IContactContentModel;

try {
  ContactContent = mongoose.model<IContactContentDocument, IContactContentModel>(
    "ContactContent",
  );
} catch {
  ContactContent = mongoose.model<IContactContentDocument, IContactContentModel>(
    "ContactContent",
    contactContentSchema,
  );
}

export default ContactContent;
