import { requireAdmin } from "@/lib/admin/auth-check";
import { connectDB } from "@/lib/db/connectDB";
import Order from "@/lib/models/Order";
import User from "@/lib/models/User";
import Product from "@/lib/models/Product";
import Review from "@/lib/models/Review";

export async function GET() {
  try {
    const { authorized, error } = await requireAdmin();
    if (!authorized) return error;

    await connectDB();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalOrders,
      pendingOrders,
      totalCustomers,
      totalProducts,
      totalReviews,
      recentOrders,
      orderStats,
      topProducts,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      User.countDocuments({ role: "user" }),
      Product.countDocuments({ status: { $ne: "Archived" } }),
      Review.countDocuments(),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("user", "name email")
        .lean(),
      Order.aggregate([
        { $match: { status: { $in: ["confirmed", "delivered", "shipped"] } } },
        { $group: { _id: null, totalRevenue: { $sum: "$pricing.total" } } },
      ]),
      Product.find({ status: "Active" })
        .sort({ soldCount: -1 })
        .limit(5)
        .select("name images.main soldCount pricing.salePrice pricing.regularPrice")
        .lean(),
    ]);

    const totalRevenue = orderStats[0]?.totalRevenue ?? 0;

    const monthlyOrders = await Order.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    const salesByDay = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
          status: { $nin: ["cancelled"] },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          total: { $sum: "$pricing.total" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return Response.json({
      success: true,
      data: {
        stats: {
          totalRevenue,
          totalOrders,
          pendingOrders,
          totalCustomers,
          totalProducts,
          totalReviews,
          monthlyOrders,
        },
        recentOrders: recentOrders.map((o) => ({
          _id: o._id,
          orderId: o.orderId,
          customer: (o.user as { name?: string })?.name || o.shipping.name,
          items: o.items.map((i) => `${i.name} × ${i.quantity}`).join(", "),
          total: o.pricing.total,
          status: o.status,
          paymentMethod: o.payment.method,
          createdAt: o.createdAt,
        })),
        topProducts: topProducts.map((p) => ({
          _id: p._id,
          name: p.name,
          image: p.images.main,
          soldCount: p.soldCount,
          revenue: p.soldCount * (p.pricing.salePrice ?? p.pricing.regularPrice),
        })),
        salesByDay,
      },
    });
  } catch (err) {
    console.error("[admin/dashboard]", err);
    return Response.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
