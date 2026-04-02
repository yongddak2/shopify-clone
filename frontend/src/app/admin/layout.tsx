"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Users,
  Ticket,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { logout } from "@/lib/auth";
import { getMyInfo } from "@/lib/user";

const menuItems = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "상품관리", icon: Package, exact: false },
  { href: "/admin/orders", label: "주문관리", icon: ClipboardList, exact: false },
  { href: "/admin/users", label: "회원관리", icon: Users, exact: false },
  { href: "/admin/coupons", label: "쿠폰관리", icon: Ticket, exact: false },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoggedIn, setUser } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [checking, setChecking] = useState(true);
  const [denied, setDenied] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // 비로그인 → /login
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }

    // user가 이미 있고 ADMIN이면 통과
    if (user?.role === "ADMIN") {
      setChecking(false);
      return;
    }

    // user가 없으면 API로 가져옴
    if (!user) {
      getMyInfo()
        .then((res) => {
          setUser(res.data);
          if (res.data.role !== "ADMIN") {
            setDenied(true);
            setTimeout(() => router.replace("/"), 1500);
          } else {
            setChecking(false);
          }
        })
        .catch(() => {
          router.replace("/login");
        });
    } else {
      // user는 있지만 ADMIN이 아닌 경우 → 메인으로
      setDenied(true);
      setTimeout(() => router.replace("/"), 1500);
    }
  }, [mounted, isLoggedIn, user, router, setUser]);

  const handleLogout = async () => {
    await logout();
    setLogoutModalOpen(false);
    router.push("/login");
  };

  // 권한 없음 메시지
  if (denied) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <p className="text-sm text-[var(--text-muted)]">관리자 권한이 필요합니다</p>
      </div>
    );
  }

  // 로딩 스피너
  if (!mounted || checking) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--text-muted)] border-t-[var(--text-primary)] rounded-full animate-spin" />
      </div>
    );
  }

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      {/* 사이드바 */}
      <aside className="w-60 bg-[var(--header-bg)] border-r border-[var(--border-color)] flex flex-col flex-shrink-0 sticky top-0 h-screen">
        {/* 로고 */}
        <div className="h-16 flex items-center px-6 border-b border-[var(--border-color)]">
          <span className="text-lg font-bold tracking-widest text-[var(--text-primary)]">
            SHOPIFY
          </span>
          <span className="text-xs text-[var(--text-muted)] ml-2 tracking-wider">
            ADMIN
          </span>
        </div>

        {/* 메뉴 */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors ${
                  active
                    ? "bg-[var(--card-bg)] text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg)]"
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={1.5} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 하단 고정 */}
        <div className="mt-auto px-3 pb-8 pt-4 border-t border-[var(--border-color)] space-y-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg)] transition-colors"
          >
            <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
            사이트
          </a>
          <button
            onClick={() => setLogoutModalOpen(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg)] transition-colors w-full"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
            로그아웃
          </button>
        </div>
      </aside>

      {/* 콘텐츠 */}
      <main className="flex-1 min-h-screen">{children}</main>

      {/* 로그아웃 모달 */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--overlay-bg)]"
            onClick={() => setLogoutModalOpen(false)}
          />
          <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] px-8 py-8 max-w-sm w-full mx-6 text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-8">
              로그아웃 하시겠습니까?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setLogoutModalOpen(false)}
                className="flex-1 py-3 text-sm tracking-wider border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 text-sm tracking-wider bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
