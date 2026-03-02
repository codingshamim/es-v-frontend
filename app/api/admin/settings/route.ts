import { requireAdmin } from "@/lib/admin/auth-check";
import { connectDB } from "@/lib/db/connectDB";
import Settings from "@/lib/models/Settings";
import { NextRequest } from "next/server";

const LEGACY_KEYS = [
  "storeName",
  "storeEmail",
  "storePhone",
  "storeAddress",
  "shippingDhakaCharge",
  "shippingOutsideCharge",
  "freeShippingMinimum",
  "codEnabled",
  "bkashEnabled",
  "nagadEnabled",
  "rocketEnabled",
  "bkashNumber",
  "nagadNumber",
  "rocketNumber",
  "orderNotification",
  "stockNotification",
  "reviewNotification",
];

function pickStore(doc: Record<string, unknown>) {
  const s = doc.store as Record<string, unknown> | undefined;
  const flat = doc;
  return {
    storeName: String(s?.storeName ?? flat.storeName ?? ""),
    storeEmail: String(s?.storeEmail ?? flat.storeEmail ?? ""),
    storePhone: String(s?.storePhone ?? flat.storePhone ?? ""),
    storeAddress: String(s?.storeAddress ?? flat.storeAddress ?? ""),
  };
}

function pickShipping(doc: Record<string, unknown>) {
  const s = doc.shipping as Record<string, unknown> | undefined;
  const flat = doc;
  const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  return {
    dhakaCharge: num(s?.dhakaCharge ?? flat.shippingDhakaCharge ?? 60),
    outsideDhakaCharge: num(s?.outsideDhakaCharge ?? flat.shippingOutsideCharge ?? 120),
    freeShippingMin: num(s?.freeShippingMin ?? flat.freeShippingMinimum ?? 0),
  };
}

function pickPayment(doc: Record<string, unknown>) {
  const p = doc.payment as Record<string, unknown> | undefined;
  const flat = doc;
  return {
    codEnabled: Boolean(p?.codEnabled ?? flat.codEnabled ?? true),
    bkashEnabled: Boolean(p?.bkashEnabled ?? flat.bkashEnabled ?? false),
    bkashNumber: String(p?.bkashNumber ?? flat.bkashNumber ?? ""),
    nagadEnabled: Boolean(p?.nagadEnabled ?? flat.nagadEnabled ?? false),
    nagadNumber: String(p?.nagadNumber ?? flat.nagadNumber ?? ""),
    rocketEnabled: Boolean(p?.rocketEnabled ?? flat.rocketEnabled ?? false),
    rocketNumber: String(p?.rocketNumber ?? flat.rocketNumber ?? ""),
  };
}

function pickNotifications(doc: Record<string, unknown>) {
  const n = doc.notifications as Record<string, unknown> | undefined;
  const flat = doc;
  return {
    orderNotification: Boolean(n?.orderNotification ?? flat.orderNotification ?? true),
    lowStockNotification: Boolean(n?.lowStockNotification ?? flat.stockNotification ?? true),
    newReviewNotification: Boolean(n?.newReviewNotification ?? flat.reviewNotification ?? false),
  };
}

export async function GET() {
  try {
    const { authorized, error } = await requireAdmin("settings_access");
    if (!authorized) return error;
    await connectDB();

    let doc = await Settings.findOne().lean();
    if (!doc) {
      const created = await Settings.create({});
      doc = created.toObject() as Record<string, unknown>;
    }
    const d = doc as Record<string, unknown>;

    const data = {
      store: pickStore(d),
      shipping: pickShipping(d),
      payment: pickPayment(d),
      notifications: pickNotifications(d),
    };

    return Response.json({ success: true, data });
  } catch (err) {
    console.error("[admin/settings GET]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { authorized, error } = await requireAdmin("settings_access");
    if (!authorized) return error;
    await connectDB();

    const body = await req.json();
    if (!body || typeof body !== "object") {
      return Response.json({ success: false, message: "Invalid body" }, { status: 400 });
    }

    let doc = await Settings.findOne();
    if (!doc) {
      doc = await Settings.create({});
    }

    const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

    // Store – replace entire subdocument
    if (body.store && typeof body.store === "object") {
      doc.store = {
        storeName: String(body.store.storeName ?? "").trim(),
        storeEmail: String(body.store.storeEmail ?? "").trim(),
        storePhone: String(body.store.storePhone ?? "").trim(),
        storeAddress: String(body.store.storeAddress ?? "").trim(),
      };
    }

    // Shipping – replace entire subdocument
    if (body.shipping && typeof body.shipping === "object") {
      doc.shipping = {
        dhakaCharge: Math.max(0, num(body.shipping.dhakaCharge)),
        outsideDhakaCharge: Math.max(0, num(body.shipping.outsideDhakaCharge)),
        freeShippingMin: Math.max(0, num(body.shipping.freeShippingMin)),
      };
    }

    // Payment
    if (body.payment && typeof body.payment === "object") {
      doc.payment = doc.payment ?? {};
      doc.payment.codEnabled = Boolean(body.payment.codEnabled);
      doc.payment.bkashEnabled = Boolean(body.payment.bkashEnabled);
      doc.payment.bkashNumber = String(body.payment.bkashNumber ?? "").trim();
      doc.payment.nagadEnabled = Boolean(body.payment.nagadEnabled);
      doc.payment.nagadNumber = String(body.payment.nagadNumber ?? "").trim();
      doc.payment.rocketEnabled = Boolean(body.payment.rocketEnabled);
      doc.payment.rocketNumber = String(body.payment.rocketNumber ?? "").trim();
    }

    // Notifications
    if (body.notifications && typeof body.notifications === "object") {
      doc.notifications = doc.notifications ?? {};
      doc.notifications.orderNotification = Boolean(body.notifications.orderNotification);
      doc.notifications.lowStockNotification = Boolean(body.notifications.lowStockNotification);
      doc.notifications.newReviewNotification = Boolean(body.notifications.newReviewNotification);
    }

    doc.markModified("store");
    doc.markModified("shipping");
    doc.markModified("payment");
    doc.markModified("notifications");
    await doc.save();

    const $unset: Record<string, 1> = {};
    for (const k of LEGACY_KEYS) {
      $unset[k] = 1;
    }
    if (Object.keys($unset).length > 0) {
      await Settings.updateOne({ _id: doc._id }, { $unset });
    }

    const fresh = (await Settings.findById(doc._id).lean()) ?? doc.toObject();
    const data = {
      store: pickStore(fresh as Record<string, unknown>),
      shipping: pickShipping(fresh as Record<string, unknown>),
      payment: pickPayment(fresh as Record<string, unknown>),
      notifications: pickNotifications(fresh as Record<string, unknown>),
    };

    return Response.json({ success: true, data });
  } catch (err) {
    console.error("[admin/settings PUT]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
