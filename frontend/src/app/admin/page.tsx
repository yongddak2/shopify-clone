"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Package, ClipboardList, Users, Ticket } from "lucide-react";
import {
  getAdminProducts,
  getAdminOrders,
  getAdminUsers,
  getAdminCoupons,
} from "@/lib/admin";
import type { AdminProduct } from "@/types";

const cards = [
  { key: "products", label: "총 상품", icon: Package, href: "/admin/products", color: "#5b9bd5" },
  { key: "orders", label: "총 주문", icon: ClipboardList, href: "/admin/orders", color: "#d4a84b" },
  { key: "users", label: "총 회원", icon: Users, href: "/admin/users", color: "#5bbd5b" },
  { key: "coupons", label: "총 쿠폰", icon: Ticket, href: "/admin/coupons", color: "#a85bd4" },
] as const;

export default function AdminDashboard() {
  const products = useQuery({ queryKey: ["admin", "products", 0], queryFn: () => getAdminProducts(0) });
  const orders = useQuery({ queryKey: ["admin", "orders", 0], queryFn: () => getAdminOrders(0) });
  const users = useQuery({ queryKey: ["admin", "users", 0], queryFn: () => getAdminUsers(0) });
  const coupons = useQuery({ queryKey: ["admin", "coupons", 0], queryFn: () => getAdminCoupons(0) });

  // 상품은 소프트 삭제된 것을 제외
  const productCount = products.data?.data?.content
    ? (products.data.data.content as AdminProduct[]).filter((p) => p.deletedAt === null).length
    : null;

  const counts: Record<string, number | null> = {
    products: productCount,
    orders: orders.data?.data?.totalElements ?? null,
    users: users.data?.data?.totalElements ?? null,
    coupons: coupons.data?.data?.totalElements ?? null,
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-light tracking-[0.15em] text-[var(--text-primary)] mb-8">
        DASHBOARD
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          const count = counts[card.key];
          return (
            <Link
              key={card.key}
              href={card.href}
              className="bg-[var(--card-bg)] border border-[var(--border-color)] p-6 hover:border-[var(--text-muted)] transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs tracking-wider text-[var(--text-muted)]">
                  {card.label}
                </span>
                <Icon className="w-5 h-5" style={{ color: card.color }} strokeWidth={1.5} />
              </div>
              <p className="text-3xl font-light text-[var(--text-primary)]">
                {count !== null ? count.toLocaleString() : "—"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
