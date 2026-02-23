import mongoose, { Document, Model, Schema, Types } from "mongoose";
import bcryptjs from "bcryptjs";

// ─── Enum for User Roles ─────────────────────────────────────────────────────

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  MODERATOR = "moderator",
}

// ─── Address (embedded in User) ──────────────────────────────────────────────

export interface IAddress {
  _id?: Types.ObjectId;
  label: string;
  name: string;
  phone: string;
  address: string;
  district: string;
  city: string;
  isDefault: boolean;
}

// ─── Type Definitions ─────────────────────────────────────────────────────────

export interface IUser {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: UserRole;
  permissions?: string[];
  profileImage?: string;
  bio?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;

  /** Saved delivery addresses */
  addresses?: IAddress[];

  // Social Login Fields
  googleId?: string;
  facebookId?: string;

  // Authentication
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface IUserDocument extends IUser, Document {
  comparePassword: (password: string) => Promise<boolean>;
  hashPassword: () => Promise<void>;
}

export interface IUserModel extends Model<IUserDocument> {
  findByEmail: (email: string) => Promise<IUserDocument | null>;
  findByPhoneAndEmail: (
    phone: string,
    email: string,
  ) => Promise<IUserDocument | null>;
  findBySocialId: (
    provider: "google" | "facebook",
    id: string,
  ) => Promise<IUserDocument | null>;
}

// ─── User Schema ──────────────────────────────────────────────────────────────

const UserSchema = new Schema<IUserDocument, IUserModel>(
  {
    name: {
      type: String,
      required: [true, "নাম প্রয়োজন"],
      trim: true,
      minlength: [2, "নাম কমপক্ষে ২ অক্ষর হতে হবে"],
      maxlength: [50, "নাম ৫০ অক্ষরের বেশি হতে পারবে না"],
    },
    email: {
      type: String,
      required: [true, "ইমেইল প্রয়োজন"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "অনুগ্রহ করে একটি বৈধ ইমেইল ঠিকানা প্রদান করুন",
      ],
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      match: [
        /^(\+88)?01[0-9]{9}$/,
        "অনুগ্রহ করে একটি বৈধ বাংলাদেশের ফোন নম্বর প্রদান করুন (যেমন: +8801XXXXXXXXX বা 01XXXXXXXXX)",
      ],
    },
    password: {
      type: String,
      select: false,
      minlength: [8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে"],
    },
    role: {
      type: String,
      enum: [UserRole.USER, UserRole.ADMIN, UserRole.MODERATOR],
      default: UserRole.USER,
    },
    permissions: {
      type: [String],
      default: [],
    },
    profileImage: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: [500, "বায়ো ৫০০ অক্ষরের বেশি হতে পারবে না"],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    facebookId: {
      type: String,
      unique: true,
      sparse: true,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    addresses: {
      type: [
        {
          label: {
            type: String,
            required: true,
            trim: true,
            maxlength: [50, "লেবেল ৫০ অক্ষরের বেশি হতে পারবে না"],
          },
          name: {
            type: String,
            required: true,
            trim: true,
            maxlength: [50, "নাম ৫০ অক্ষরের বেশি হতে পারবে না"],
          },
          phone: {
            type: String,
            required: true,
            trim: true,
            match: [
              /^(\+88)?01[0-9]{9}$/,
              "বৈধ ফোন নম্বর লিখুন (01XXXXXXXXX বা +8801XXXXXXXXX)",
            ],
          },
          address: {
            type: String,
            required: true,
            trim: true,
            maxlength: [500, "ঠিকানা ৫০০ অক্ষরের বেশি হতে পারবে না"],
          },
          district: {
            type: String,
            trim: true,
            maxlength: [80, "জেলা ৮০ অক্ষরের বেশি হতে পারবে না"],
            default: "",
          },
          city: {
            type: String,
            trim: true,
            maxlength: [80, "শহর/উপজেলা ৮০ অক্ষরের বেশি হতে পারবে না"],
            default: "",
          },
          isDefault: {
            type: Boolean,
            default: false,
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ googleId: 1 });
UserSchema.index({ facebookId: 1 });
UserSchema.index({ createdAt: -1 });

// ─── Instance Methods ─────────────────────────────────────────────────────────

UserSchema.methods.comparePassword = async function (
  password: string,
): Promise<boolean> {
  if (!this.password) return false;
  return await bcryptjs.compare(password, this.password);
};

UserSchema.methods.hashPassword = async function (): Promise<void> {
  if (!this.password) return;
  this.password = await bcryptjs.hash(this.password, 12);
};

// ─── Static Methods ───────────────────────────────────────────────────────────

UserSchema.statics.findByEmail = async function (
  email: string,
): Promise<IUserDocument | null> {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findByPhoneAndEmail = async function (
  phone: string,
  email: string,
): Promise<IUserDocument | null> {
  return this.findOne({
    $or: [{ email: email.toLowerCase() }, { phone }],
  });
};

UserSchema.statics.findBySocialId = async function (
  provider: "google" | "facebook",
  id: string,
): Promise<IUserDocument | null> {
  const field = provider === "google" ? "googleId" : "facebookId";
  return this.findOne({ [field]: id });
};

// ─── Model Export ────────────────────────────────────────────────────────────

let User: IUserModel;

try {
  User = mongoose.model<IUserDocument, IUserModel>("User");
} catch {
  User = mongoose.model<IUserDocument, IUserModel>("User", UserSchema);
}

export default User;
