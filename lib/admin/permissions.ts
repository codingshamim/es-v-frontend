export const ADMIN_PERMISSIONS = [
  "user_management",
  "product_management",
  "order_management",
  "category_management",
  "coupon_management",
  "review_management",
  "analytics_access",
  "settings_access",
  "chat_access",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<AdminPermission, string> = {
  user_management: "ইউজার ম্যানেজমেন্ট",
  product_management: "প্রোডাক্ট ম্যানেজমেন্ট",
  order_management: "অর্ডার ম্যানেজমেন্ট",
  category_management: "ক্যাটাগরি ম্যানেজমেন্ট",
  coupon_management: "কুপন ম্যানেজমেন্ট",
  review_management: "রিভিউ ম্যানেজমেন্ট",
  analytics_access: "এনালিটিক্স",
  settings_access: "সেটিংস",
  chat_access: "লাইভ চ্যাট",
};

export function hasPermission(
  role: string,
  permissions: string[] | undefined,
  required: AdminPermission,
): boolean {
  if (role === "admin") return true;
  if (role !== "moderator") return false;
  return permissions?.includes(required) ?? false;
}
