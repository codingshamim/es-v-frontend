import { requireAdmin } from "@/lib/admin/auth-check";
import { connectDB } from "@/lib/db/connectDB";
import Settings from "@/lib/models/Settings";
import { NextRequest } from "next/server";

async function getOrCreateSettings() {
  let settings = await Settings.findOne().lean();
  if (!settings) {
    settings = await Settings.create({});
    settings = settings.toObject();
  }
  return settings;
}

export async function GET() {
  try {
    const { authorized, error } = await requireAdmin("settings_access");
    if (!authorized) return error;
    await connectDB();
    const settings = await getOrCreateSettings();
    return Response.json({ success: true, data: settings });
  } catch (err) {
    console.error("[admin/settings GET]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

const LEGACY_FLAT_KEYS = [
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

export async function PUT(req: NextRequest) {
  try {
    const { authorized, error } = await requireAdmin("settings_access");
    if (!authorized) return error;
    await connectDB();
    const body = await req.json();

    const existing = await Settings.findOne().lean();
    const $set: Record<string, unknown> = {};

    if (body.store && typeof body.store === "object") {
      $set.store = { ...(existing?.store ?? {}), ...body.store };
    }
    if (body.shipping && typeof body.shipping === "object") {
      $set.shipping = { ...(existing?.shipping ?? {}), ...body.shipping };
    }
    if (body.payment && typeof body.payment === "object") {
      $set.payment = { ...(existing?.payment ?? {}), ...body.payment };
    }
    if (body.notifications && typeof body.notifications === "object") {
      $set.notifications = { ...(existing?.notifications ?? {}), ...body.notifications };
    }

    const update: Record<string, unknown> = Object.keys($set).length > 0 ? { $set } : {};
    const $unset: Record<string, 1> = {};
    for (const key of LEGACY_FLAT_KEYS) {
      $unset[key] = 1;
    }
    if (Object.keys($unset).length > 0) {
      update.$unset = $unset;
    }

    if (Object.keys(update).length === 0) {
      const out = existing ?? (await Settings.create({})).toObject();
      return Response.json({ success: true, data: out });
    }

    const options = { returnDocument: "after", upsert: true, setDefaultsOnCreate: true };
    const settings = await Settings.findOneAndUpdate({}, update, options).lean();

    if (!settings) {
      return Response.json({ success: false, message: "Failed to save settings" }, { status: 500 });
    }
    return Response.json({ success: true, data: settings });
  } catch (err) {
    console.error("[admin/settings PUT]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
