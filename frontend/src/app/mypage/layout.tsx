"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ClipboardList,
  MapPin,
  Heart,
  Ticket,
  MessageSquare,
  UserCog,
  Truck,
  PackageCheck,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { getMyInfo } from "@/lib/user";
import { getOrders } from "@/lib/order";
import { getMyCoupons } from "@/lib/coupon";
import { getWishlists } from "@/lib/wishlist";
import type { OrderResponse, MemberCoupon } from "@/types";

const menuItems = [
  { href: "/mypage/orders", label: "주문내역", icon: ClipboardList },
  { href: "/mypage/addresses", label: "배송지 관리", icon: MapPin },
  { href: "/mypage/wishlist", label: "찜 목록", icon: Heart },
  { href: "/mypage/coupons", label: "쿠폰함", icon: Ticket },
  { href: "/mypage/reviews", label: "리뷰 관리", icon: MessageSquare },
  { href: "/mypage/profile", label: "회원정보 수정", icon: UserCog },
];

export default function MypageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoggedIn()) {
      router.replace("/login");
    }
  }, [mounted, isLoggedIn, router]);

  const loggedIn = mounted && isLoggedIn();

  const { data: userData } = useQuery({
    queryKey: ["myInfo"],
    queryFn: getMyInfo,
    enabled: loggedIn,
  });

  const { data: ordersData } = useQuery({
    queryKey: ["orders", 0],
    queryFn: () => getOrders(0, 100),
    enabled: loggedIn,
  });

  const { data: couponsData } = useQuery({
    queryKey: ["myCoupons"],
    queryFn: getMyCoupons,
    enabled: loggedIn,
  });

  const { data: wishlistData } = useQuery({
    queryKey: ["wishlists"],
    queryFn: getWishlists,
    enabled: loggedIn,
  });

  const userName = userData?.data?.name;
  const orders = ordersData?.data?.content ?? [];
  const shippedCount = orders.filter(
    (o: OrderResponse) => o.status === "PREPARING" || o.status === "SHIPPED"
  ).length;
  const deliveredCount = orders.filter(
    (o: OrderResponse) => o.status === "DELIVERED"
  ).length;
  const activeCoupons = (couponsData?.data ?? []).filter(
    (c: MemberCoupon) => c.usable && new Date(c.expiredAt) >= new Date()
  ).length;
  const wishlistCount = wishlistData?.data?.length ?? 0;

  if (!mounted || !isLoggedIn()) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--text-muted)] border-t-[var(--text-primary)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 py-12">
      <h1 className="text-2xl tracking-[0.2em] font-light text-center mb-8 text-[var(--text-primary)]">
        MY PAGE
      </h1>

      {/* 대시보드 카드 */}
      {userName && (
        <div className="mb-10">
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            <span className="text-[var(--text-primary)] font-medium">{userName}</span>님
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              href="/mypage/orders?tab=shipping"
              className="border border-[var(--border-color)] p-4 text-center hover:border-[var(--text-muted)] transition-colors"
            >
              <Truck className="w-5 h-5 mx-auto mb-2 text-[var(--text-muted)]" strokeWidth={1.5} />
              <p className="text-lg font-medium text-[var(--text-primary)]">{shippedCount}</p>
              <p className="text-[10px] text-[var(--text-muted)] tracking-wider">배송중</p>
            </Link>
            <Link
              href="/mypage/orders?tab=delivered"
              className="border border-[var(--border-color)] p-4 text-center hover:border-[var(--text-muted)] transition-colors"
            >
              <PackageCheck className="w-5 h-5 mx-auto mb-2 text-[var(--text-muted)]" strokeWidth={1.5} />
              <p className="text-lg font-medium text-[var(--text-primary)]">{deliveredCount}</p>
              <p className="text-[10px] text-[var(--text-muted)] tracking-wider">배송완료</p>
            </Link>
            <Link
              href="/mypage/coupons"
              className="border border-[var(--border-color)] p-4 text-center hover:border-[var(--text-muted)] transition-colors"
            >
              <Ticket className="w-5 h-5 mx-auto mb-2 text-[var(--text-muted)]" strokeWidth={1.5} />
              <p className="text-lg font-medium text-[var(--text-primary)]">{activeCoupons}</p>
              <p className="text-[10px] text-[var(--text-muted)] tracking-wider">쿠폰</p>
            </Link>
            <Link
              href="/mypage/wishlist"
              className="border border-[var(--border-color)] p-4 text-center hover:border-[var(--text-muted)] transition-colors"
            >
              <Heart className="w-5 h-5 mx-auto mb-2 text-[var(--text-muted)]" strokeWidth={1.5} />
              <p className="text-lg font-medium text-[var(--text-primary)]">{wishlistCount}</p>
              <p className="text-[10px] text-[var(--text-muted)] tracking-wider">찜</p>
            </Link>
          </div>
        </div>
      )}

      {/* 모바일: 가로 탭 */}
      <div className="md:hidden overflow-x-auto scrollbar-hide mb-8 border-b border-[var(--border-color)]">
        <div className="flex gap-1 min-w-max">
          {menuItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-3 text-xs tracking-wider whitespace-nowrap transition-colors ${
                  active
                    ? "text-[var(--text-primary)] border-b-2 border-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex gap-10">
        {/* 데스크톱: 사이드 메뉴 */}
        <aside className="hidden md:block w-[200px] flex-shrink-0">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "text-[var(--text-primary)] bg-[var(--card-bg)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg)]"
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* 콘텐츠 영역 */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
