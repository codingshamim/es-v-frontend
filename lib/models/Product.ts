import mongoose, { Document, Model, Schema, Types } from "mongoose";

// ─── Type Definitions ─────────────────────────────────────────────────────────

export interface IPricing {
  regularPrice: number;
  salePrice: number | null;
  discount: number;
  currency: string;
}

export interface IImages {
  main: string;
  gallery: string[];
}

export interface IColor {
  _id?: Types.ObjectId;
  name: string;
  hex: string;
  image?: string | null;
}

export interface ISize {
  _id?: Types.ObjectId;
  label: string;
  measurement?: string | null;
  stock: number;
  lowStockAlert: number;
}

export interface IRatings {
  average: number;
  count: number;
}

export interface IProduct {
  name: string;
  slug: string;
  sku: string;
  category:
    | "T-Shirts"
    | "Polo Shirts"
    | "Hoodies"
    | "Tank Tops"
    | "Long Sleeves";
  shortDescription: string;
  fullDescription: string;
  pricing: IPricing;
  images: IImages;
  colors: IColor[];
  sizes: ISize[];
  features: string[];
  totalStock: number;
  status: "Active" | "Draft" | "Out of Stock" | "Archived";
  isFeatured: boolean;
  ratings: IRatings;
  soldCount: number;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductDocument extends IProduct, Document {}

export interface IProductModel extends Model<IProductDocument> {
  getFeatured(): Promise<IProductDocument[]>;
  getByCategory(
    category: string,
    options?: { page?: number; limit?: number; sort?: string },
  ): Promise<IProductDocument[]>;
  search(
    query: string,
    options?: { page?: number; limit?: number },
  ): Promise<IProductDocument[]>;
  getByPriceRange(
    minPrice: number,
    maxPrice: number,
    options?: { page?: number; limit?: number },
  ): Promise<IProductDocument[]>;
  generateSlug(name: string): string;
  calculateDiscount(regularPrice: number, salePrice: number | null): number;
  calculateTotalStock(sizes: ISize[]): number;
}

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const PricingSchema = new Schema<IPricing>(
  {
    regularPrice: {
      type: Number,
      required: [true, "Regular price is required"],
      min: [0, "Price cannot be negative"],
    },
    salePrice: {
      type: Number,
      default: null,
      min: [0, "Sale price cannot be negative"],
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    currency: {
      type: String,
      default: "BDT",
      uppercase: true,
      trim: true,
    },
  },
  { _id: false },
);

const ImagesSchema = new Schema<IImages>(
  {
    main: {
      type: String,
      required: [true, "Main product image is required"],
      trim: true,
    },
    gallery: {
      type: [String],
      default: [],
    },
  },
  { _id: false },
);

const ColorSchema = new Schema<IColor>(
  {
    name: {
      type: String,
      required: [true, "Color name is required"],
      trim: true,
    },
    hex: {
      type: String,
      required: [true, "Color hex code is required"],
      trim: true,
      uppercase: true,
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color code"],
    },
    image: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { _id: true },
);

const SizeSchema = new Schema<ISize>(
  {
    label: {
      type: String,
      required: [true, "Size label is required"],
      trim: true,
      uppercase: true,
    },
    measurement: {
      type: String,
      default: null,
      trim: true,
    },
    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    lowStockAlert: {
      type: Number,
      default: 10,
      min: [0, "Low stock alert cannot be negative"],
    },
  },
  { _id: true },
);

// ─── Main Product Schema ──────────────────────────────────────────────────────

const ProductSchema = new Schema<IProductDocument, IProductModel>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },

    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: [
          "T-Shirts",
          "Polo Shirts",
          "Hoodies",
          "Tank Tops",
          "Long Sleeves",
        ],
        message: "{VALUE} is not a valid category",
      },
      index: true,
    },

    shortDescription: {
      type: String,
      required: [true, "Short description is required"],
      trim: true,
      maxlength: [300, "Short description cannot exceed 300 characters"],
    },

    fullDescription: {
      type: String,
      required: [true, "Full description is required"],
      trim: true,
    },

    pricing: {
      type: PricingSchema,
      required: [true, "Pricing details are required"],
    },

    images: {
      type: ImagesSchema,
      required: [true, "Product images are required"],
    },

    colors: {
      type: [ColorSchema],
      default: [],
    },

    sizes: {
      type: [SizeSchema],
      default: [],
    },

    features: {
      type: [String],
      default: [],
    },

    totalStock: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: {
        values: ["Active", "Draft", "Out of Stock", "Archived"],
        message: "{VALUE} is not a valid status",
      },
      default: "Draft",
      index: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },

    soldCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    tags: {
      type: [String],
      default: [],
    },

    metaTitle: {
      type: String,
      trim: true,
      maxlength: [70, "Meta title cannot exceed 70 characters"],
    },

    metaDescription: {
      type: String,
      trim: true,
      maxlength: [160, "Meta description cannot exceed 160 characters"],
    },
  },
  {
    timestamps: true,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

ProductSchema.index({ name: "text", shortDescription: "text", tags: "text" });
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ "pricing.regularPrice": 1 });
ProductSchema.index({ isFeatured: 1, status: 1 });
ProductSchema.index({ createdAt: -1 });

// ─── Static Methods ────────────────────────────────────────────────────────────

ProductSchema.statics.getFeatured = function (): Promise<IProductDocument[]> {
  return this.find({ isFeatured: true, status: "Active" }).sort({
    createdAt: -1,
  });
};

ProductSchema.statics.getByCategory = function (
  category: string,
  options: { page?: number; limit?: number; sort?: string } = {},
): Promise<IProductDocument[]> {
  const { page = 1, limit = 12, sort = "-createdAt" } = options;
  return this.find({ category, status: "Active" })
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);
};

ProductSchema.statics.search = function (
  query: string,
  options: { page?: number; limit?: number } = {},
): Promise<IProductDocument[]> {
  const { page = 1, limit = 12 } = options;
  return this.find(
    { $text: { $search: query }, status: "Active" },
    { score: { $meta: "textScore" } },
  )
    .sort({ score: { $meta: "textScore" } })
    .skip((page - 1) * limit)
    .limit(limit);
};

ProductSchema.statics.getByPriceRange = function (
  minPrice: number,
  maxPrice: number,
  options: { page?: number; limit?: number } = {},
): Promise<IProductDocument[]> {
  const { page = 1, limit = 12 } = options;
  return this.find({
    "pricing.regularPrice": { $gte: minPrice, $lte: maxPrice },
    status: "Active",
  })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Helper method to generate slug
ProductSchema.statics.generateSlug = function (name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

// Helper method to calculate discount
ProductSchema.statics.calculateDiscount = function (
  regularPrice: number,
  salePrice: number | null,
): number {
  if (!salePrice || regularPrice <= 0) return 0;
  return Math.round(((regularPrice - salePrice) / regularPrice) * 100);
};

// Helper method to calculate total stock
ProductSchema.statics.calculateTotalStock = function (sizes: ISize[]): number {
  return sizes.reduce((sum, size) => sum + (size.stock || 0), 0);
};

// ─── Export ───────────────────────────────────────────────────────────────────

const Product: IProductModel =
  (mongoose.models.Product as IProductModel) ||
  mongoose.model<IProductDocument, IProductModel>("Product", ProductSchema);

export default Product;
