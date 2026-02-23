import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICategory {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  productCount: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategoryDocument extends ICategory, Document {}

export interface ICategoryModel extends Model<ICategoryDocument> {}

const CategorySchema = new Schema<ICategoryDocument, ICategoryModel>(
  {
    name: {
      type: String,
      required: [true, "ক্যাটাগরির নাম প্রয়োজন"],
      trim: true,
      unique: true,
      maxlength: [100, "নাম ১০০ অক্ষরের বেশি হতে পারবে না"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "বিবরণ ৫০০ অক্ষরের বেশি হতে পারবে না"],
    },
    image: {
      type: String,
      default: null,
    },
    productCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

CategorySchema.index({ slug: 1 });
CategorySchema.index({ isActive: 1, sortOrder: 1 });

const Category: ICategoryModel =
  (mongoose.models.Category as ICategoryModel) ||
  mongoose.model<ICategoryDocument, ICategoryModel>("Category", CategorySchema);

export default Category;
