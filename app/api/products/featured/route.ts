import Product from "@/lib/models/Product";
import { connectDB } from "@/lib/db/connectDB";

const LIMIT = 8;
const SELECT =
  "name slug sku category shortDescription pricing images colors sizes totalStock status ratings soldCount features isFeatured";

export async function GET() {
  try {
    await connectDB();

    // 1) Featured + Active, newest first
    const featured = await Product.find({
      isFeatured: true,
      status: "Active",
    })
      .select(SELECT)
      .sort({ createdAt: -1 })
      .limit(LIMIT)
      .lean();

    const featuredList = featured ?? [];
    let data = featuredList;

    // 2) If fewer than LIMIT, fill with newest Active products (so new products show on home)
    if (data.length < LIMIT) {
      const excludeIds = featuredList.map((p) => p._id);
      const extra = await Product.find({
        status: "Active",
        _id: { $nin: excludeIds },
      })
        .select(SELECT)
        .sort({ createdAt: -1 })
        .limit(LIMIT - data.length)
        .lean();

      data = [...data, ...(extra ?? [])];
    }

    return Response.json(
      { success: true, data },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    console.error("Featured products API error:", error);
    return Response.json(
      { success: false, message: "Failed to fetch featured products" },
      { status: 500 },
    );
  }
}
