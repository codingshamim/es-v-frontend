import { requireAdmin } from "@/lib/admin/auth-check";
import { connectDB } from "@/lib/db/connectDB";
import Product from "@/lib/models/Product";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { authorized, error } = await requireAdmin("product_management");
    if (!authorized) return error;

    await connectDB();
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(url.searchParams.get("limit") || "20"));
    const search = url.searchParams.get("search")?.trim();
    const category = url.searchParams.get("category");
    const status = url.searchParams.get("status");

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }
    if (category && category !== "all") filter.category = category;
    if (status && status !== "all") filter.status = status;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return Response.json({
      success: true,
      data: products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[admin/products GET]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

/** Normalize status from form (e.g. "active") to schema enum ("Active") */
function normalizeStatus(value: unknown): "Active" | "Draft" | "Out of Stock" | "Archived" {
  const s = String(value ?? "").toLowerCase();
  if (s === "active") return "Active";
  if (s === "draft") return "Draft";
  if (s === "out of stock" || s === "outofstock") return "Out of Stock";
  if (s === "archived") return "Archived";
  return "Draft";
}

/** Build images shape { main, gallery } from frontend array [{ url, alt }, ...] */
function normalizeImages(payload: unknown): { main: string; gallery: string[] } {
  const arr = Array.isArray(payload) ? payload : [];
  const urls = arr
    .map((item: { url?: string }) => (item && typeof item.url === "string" ? item.url.trim() : ""))
    .filter(Boolean);
  const main = urls[0] ?? "";
  const gallery = urls.slice(1);
  return { main, gallery };
}

export async function POST(req: NextRequest) {
  try {
    const { authorized, error } = await requireAdmin("product_management");
    if (!authorized) return error;

    await connectDB();
    const body = await req.json();

    const slug = Product.generateSlug(body.name ?? "");
    const regularPrice = Number(body.pricing?.regularPrice ?? body.price ?? 0);
    const salePrice =
      body.pricing?.salePrice !== undefined
        ? (body.pricing.salePrice === null ? null : Number(body.pricing.salePrice))
        : body.salePrice !== undefined && body.salePrice !== ""
          ? Number(body.salePrice)
          : null;
    const discount = Product.calculateDiscount(regularPrice, salePrice);
    const totalStock = Product.calculateTotalStock(body.sizes || []);

    const images = normalizeImages(body.images);
    const status = normalizeStatus(body.status);

    const product = await Product.create({
      name: body.name,
      sku: body.sku,
      category: body.category,
      shortDescription: (body.shortDescription ?? "").trim() || "—",
      fullDescription: (body.fullDescription ?? "").trim() || "—",
      slug,
      pricing: {
        regularPrice,
        salePrice,
        discount,
        currency: body.pricing?.currency ?? "BDT",
      },
      images,
      colors: Array.isArray(body.colors) ? body.colors : [],
      sizes: Array.isArray(body.sizes) ? body.sizes : [],
      features: Array.isArray(body.features) ? body.features : [],
      totalStock,
      status,
      isFeatured: Boolean(body.featured),
      ratings: { average: 0, count: 0 },
      soldCount: 0,
      tags: Array.isArray(body.tags) ? body.tags : [],
    });

    return Response.json({ success: true, data: product }, { status: 201 });
  } catch (err) {
    console.error("[admin/products POST]", err);
    const message = err instanceof Error ? err.message : "Server error";
    return Response.json({ success: false, message }, { status: 500 });
  }
}
