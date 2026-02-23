import { OrderCard } from "./OrderCard";

const MOCK_ORDERS = [
  {
    orderId: "ES-2024-78542",
    date: "২০ ফেব্রুয়ারি, ২০২৬",
    status: "completed" as const,
    items: [
      {
        title: "Mens Premium T-Shirt - Explicit",
        variant: "সাইজ: L | কালার: হলুদ",
        quantity: 2,
        price: "৳1,440",
        image:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop",
      },
    ],
    total: "৳2,619",
  },
  {
    orderId: "ES-2024-78231",
    date: "১৮ ফেব্রুয়ারি, ২০২৬",
    status: "pending" as const,
    items: [
      {
        title: "Classic Striped T-Shirt",
        variant: "সাইজ: XL | কালার: কালো",
        quantity: 1,
        price: "৳799",
        image:
          "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=100&h=100&fit=crop",
      },
    ],
    total: "৳859",
  },
];

export function OrdersTab() {
  return (
    <div className="space-y-4">
      {MOCK_ORDERS.map((order) => (
        <OrderCard
          key={order.orderId}
          orderId={order.orderId}
          date={order.date}
          status={order.status}
          items={order.items}
          total={order.total}
        />
      ))}
    </div>
  );
}
