"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingBag, User, Menu, X } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { logout } from "@/lib/auth";

function Logo() {
  return (
    <Link
      href="/"
      className="text-xl font-bold tracking-widest text-[var(--text-primary)] hover:opacity-80 transition-opacity"
    >
      SHOPIFY
    </Link>
  );
}

const sideMenuLinks = [
  { href: "/products", label: "SHOP" },
];

export default function Header() {
  const router = useRouter();
  const [sideOpen, setSideOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { isLoggedIn, user } = useAuthStore();
  const loggedIn = mounted && isLoggedIn();
  const isAdmin = mounted && loggedIn && user?.role === "ADMIN";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    if (sideOpen || logoutModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sideOpen, logoutModalOpen]);

  const handleLogout = async () => {
    await logout();
    setLogoutModalOpen(false);
    setSideOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    router.push(`/search?keyword=${encodeURIComponent(trimmed)}`);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-[var(--header-bg)] border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-16">
            {/* 왼쪽: 햄버거 (데스크톱 + 모바일 공통) */}
            <div className="w-24 flex items-center">
              <button
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                onClick={() => setSideOpen(true)}
              >
                <Menu className="w-6 h-6" strokeWidth={1.5} />
              </button>
            </div>

            {/* 중앙: 로고 */}
            <div className="absolute left-1/2 -translate-x-1/2">
              <Logo />
            </div>

            {/* 오른쪽: 아이콘들 (로그인 전후 동일 레이아웃) */}
            <div className="flex items-center gap-5">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <Search className="w-5 h-5" strokeWidth={1.5} />
              </button>

              {!mounted ? (
                <div className="w-32" />
              ) : (
                <>
                  {/* Login/Join 또는 LOGOUT */}
                  {loggedIn ? (
                    <>
                      <button
                        onClick={() => setLogoutModalOpen(true)}
                        className="text-xs tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors hidden md:block"
                      >
                        LOGOUT
                      </button>
                      <button
                        onClick={() => setLogoutModalOpen(true)}
                        className="text-[10px] tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors md:hidden"
                      >
                        LOGOUT
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      className="text-xs tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      Login/Join
                    </Link>
                  )}

                  {/* 쇼핑백 - 항상 표시 */}
                  <Link
                    href={loggedIn ? "/cart" : "/login"}
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                  </Link>

                  {/* 마이페이지 - 항상 표시 */}
                  <Link
                    href={loggedIn ? "/mypage" : "/login"}
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <User className="w-5 h-5" strokeWidth={1.5} />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 검색바 - 레이어드 슬라이드 다운 */}
      <div
        className="fixed left-0 right-0 z-50 transition-all duration-300 ease-in-out border-b border-[var(--border-color)] bg-[var(--header-bg)]"
        style={{
          top: "4rem",
          transform: searchOpen ? "translateY(0)" : "translateY(-100%)",
          opacity: searchOpen ? 1 : 0,
          pointerEvents: searchOpen ? "auto" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-4 h-14"
          >
            <Search className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" strokeWidth={1.5} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="검색어를 입력하세요"
              className="flex-1 bg-transparent text-sm text-[var(--text-secondary)] placeholder-[var(--text-dim)] focus:outline-none"
            />
            <button
              type="button"
              onClick={closeSearch}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </form>
        </div>
      </div>

      {/* 검색 오버레이 (은은하게) */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-40 bg-[var(--overlay-bg-light)]"
          style={{ top: "calc(4rem + 3.5rem)" }}
          onClick={closeSearch}
        />
      )}

      {/* 사이드 메뉴 오버레이 */}
      <div
        className="fixed inset-0 z-[60] bg-[var(--overlay-bg)] transition-opacity duration-300"
        style={{
          opacity: sideOpen ? 1 : 0,
          pointerEvents: sideOpen ? "auto" : "none",
        }}
        onClick={() => setSideOpen(false)}
      />

      {/* 사이드 메뉴 패널 */}
      <div
        className="fixed top-0 left-0 bottom-0 z-[70] w-[75vw] max-w-[350px] bg-[var(--header-bg)] border-r border-[var(--border-color)] transition-transform duration-300 ease-in-out flex flex-col"
        style={{
          transform: sideOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        {/* 패널 상단 */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-[var(--border-color)]">
          <span className="text-lg font-bold tracking-widest text-[var(--text-primary)]">
            SHOPIFY
          </span>
          <button
            onClick={() => setSideOpen(false)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-6 h-6" strokeWidth={1.5} />
          </button>
        </div>

        {/* 패널 메뉴 */}
        <nav className="flex flex-col px-6 py-6 gap-5">
          {sideMenuLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm tracking-[0.15em] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              onClick={() => setSideOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <>
              <div className="border-t border-[var(--border-color)]" />
              <Link
                href="/admin"
                className="text-sm tracking-[0.15em] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                onClick={() => setSideOpen(false)}
              >
                관리자
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* 로그아웃 확인 모달 */}
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
    </>
  );
}
