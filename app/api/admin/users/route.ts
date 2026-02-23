import { requireAdmin } from "@/lib/admin/auth-check";
import { connectDB } from "@/lib/db/connectDB";
import User from "@/lib/models/User";
import Order from "@/lib/models/Order";
import bcryptjs from "bcryptjs";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { authorized, error, user: currentAdmin } = await requireAdmin("user_management");
    if (!authorized) return error;

    await connectDB();

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(url.searchParams.get("limit") || "20"));
    const search = url.searchParams.get("search")?.trim();
    const role = url.searchParams.get("role");
    const status = url.searchParams.get("status");

    const filter: Record<string, unknown> = {};
    // Exclude current logged-in user from the list
    if (currentAdmin?.id) {
      filter._id = { $ne: currentAdmin.id };
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }
    if (role && role !== "all") filter.role = role;
    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password -emailVerificationToken -passwordResetToken -emailVerificationExpires -passwordResetExpires")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const userIds = users.map((u) => u._id);
    const orderCounts = await Order.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: "$user", count: { $sum: 1 }, totalSpent: { $sum: "$pricing.total" } } },
    ]);
    const orderMap = new Map(
      orderCounts.map((o) => [o._id.toString(), { count: o.count, totalSpent: o.totalSpent }]),
    );

    const enriched = users.map((u) => {
      const stats = orderMap.get(u._id.toString());
      const orderCount = stats?.count ?? 0;
      return {
        ...u,
        _id: u._id.toString(),
        orderCount,
        totalOrders: orderCount,
        totalSpent: stats?.totalSpent ?? 0,
      };
    });

    return Response.json({
      success: true,
      data: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[admin/users GET]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

const PHONE_REGEX = /^(\+88)?01[0-9]{9}$/;

/** Normalize phone to 01XXXXXXXXX (11 digits) for User schema. Returns null if invalid or empty. */
function normalizePhone(value: unknown): string | undefined {
  if (value == null || typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("01")) return digits;
  if (digits.length === 13 && digits.startsWith("880")) return "0" + digits.slice(2);
  if (digits.length === 10 && digits.startsWith("1")) return "0" + digits;
  // Allow 10-digit 01XXXXXXXX (missing one digit): normalize to 11 by appending 0
  if (digits.length === 10 && digits.startsWith("01")) return digits + "0";
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const { authorized, error } = await requireAdmin("user_management");
    if (!authorized) return error;

    await connectDB();
    const body = await req.json();
    const { name, email, phone, password, role, permissions } = body;

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return Response.json(
        { success: false, message: "Name, email and password are required" },
        { status: 400 },
      );
    }

    const normalizedPhone = normalizePhone(phone);
    if (phone != null && String(phone).trim() !== "" && !normalizedPhone) {
      return Response.json(
        {
          success: false,
          message:
            "Invalid phone. Use 11 digits (e.g. 01816628143) or +8801XXXXXXXXX.",
        },
        { status: 400 },
      );
    }

    const exists = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
      ],
    });
    if (exists) {
      return Response.json(
        { success: false, message: "User with this email or phone already exists" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcryptjs.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      ...(normalizedPhone && { phone: normalizedPhone }),
      password: hashedPassword,
      role: role || "user",
      permissions: permissions || [],
      isActive: true,
      isEmailVerified: true,
    });

    return Response.json({
      success: true,
      data: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        permissions: user.permissions,
      },
    }, { status: 201 });
  } catch (err) {
    console.error("[admin/users POST]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
