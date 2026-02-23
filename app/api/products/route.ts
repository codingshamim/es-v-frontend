import Product from "@/lib/models/Product";
import { connectDB } from "@/lib/db/connectDB";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(
      48,
      Math.max(1, parseInt(url.searchParams.get("limit") || "12", 10)),
    );
    const category = url.searchParams.get("category") || "";
    const search = url.searchParams.get("search") || "";
    const sort = url.searchParams.get("sort") || "newest";
    const minPrice = parseFloat(url.searchParams.get("minPrice") || "0");
    const maxPrice = parseFloat(url.searchParams.get("maxPrice") || "0");

    await connectDB();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { status: "Active" };

    if (category) {
      filter.category = category;
    }

    if (search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { shortDescription: { $regex: search.trim(), $options: "i" } },
        { tags: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (minPrice > 0) {
      filter["pricing.regularPrice"] = {
        ...filter["pricing.regularPrice"],
        $gte: minPrice,
      };
    }
    if (maxPrice > 0) {
      filter["pricing.regularPrice"] = {
        ...filter["pricing.regularPrice"],
        $lte: maxPrice,
      };
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      "price-low": { "pricing.regularPrice": 1 },
      "price-high": { "pricing.regularPrice": -1 },
      popular: { soldCount: -1 },
      rating: { "ratings.average": -1 },
    };

    const sortQuery = sortMap[sort] || sortMap.newest;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select(
          "name slug shortDescription pricing images colors sizes totalStock status ratings soldCount",
        )
        .sort(sortQuery)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    const categories = await Product.distinct("category", { status: "Active" });

    return Response.json(
      {
        success: true,
        data: products,
        categories,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("Products API error:", error);
    return Response.json(
      { success: false, message: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
