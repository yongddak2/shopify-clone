"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  ClipboardList,
  MapPin,
  Heart,
  Ticket,
  MessageSquare,
  UserCog,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

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

  if (!mounted || !isLoggedIn()) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--text-muted)] border-t-[var(--text-primary)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 py-12">
      <h1 className="text-2xl tracking-[0.2em] font-light text-center mb-12 text-[var(--text-primary)]">
        MY PAGE
      </h1>

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
