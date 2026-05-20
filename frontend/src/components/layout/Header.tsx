"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { logout } from "@/lib/auth";
import { getCart } from "@/lib/cart";

type MenuKey = "SHOP" | "ABOUT" | "PNTK" | "INFO";

const SHOP_CATEGORIES = [
  { label: "ALL", href: "/products" },
  { label: "BAGS", href: "/products?category=BAGS" },
  { label: "TOPS", href: "/products?category=TOPS" },
  { label: "BOTTOMS", href: "/products?category=BOTTOMS" },
  { label: "ACCS", href: "/products?category=ACCS" },
];

const INFO_LINKS = [
  { label: "NOTICE", href: "/info/notice" },
  { label: "Q&A", href: "/info/qa" },
  { label: "FAQ", href: "/info/faq" },
];

function Logo() {
  return (
    <Link href="/" className="block hover:opacity-90 transition-opacity">
      <img src="/logo.png" alt="PanTrKa" className="h-10" />
    </Link>
  );
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isLoggedIn, user } = useAuthStore();
  const loggedIn = mounted && isLoggedIn();
  const isAdmin = mounted && loggedIn && user?.role === "ADMIN";

  const { data: cartData } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: loggedIn,
  });
  const cartCount = cartData?.data?.length ?? 0;

  const isMain = pathname === "/";
  // 메인 페이지 상단에서는 호버 중에도 헤더 자체는 항상 투명 유지
  const isTransparent = isMain && !scrolled && !searchOpen;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isMain) {
      setScrolled(false);
      return;
    }
    const handleScroll = () => {
      const isDesktop = window.innerWidth >= 768;
      const bannerHeight = isDesktop
        ? Math.min(window.innerHeight * 0.8, 800)
        : window.innerHeight * 0.5;
      setScrolled(window.scrollY >= bannerHeight);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isMain]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    if (logoutModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [logoutModalOpen]);

  useEffect(() => {
    setOpenMenu(null);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    setLogoutModalOpen(false);
    window.location.href = "/";
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

  const scheduleClose = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => setOpenMenu(null), 140);
  };
  const cancelClose = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = null;
  };
  const openOrSwitch = (menu: MenuKey | null) => {
    cancelClose();
    setOpenMenu(menu);
  };

  // 헤더 좌측 메뉴 — Abril Fatface, 핑크 액센트, 호버 시 흰색
  const menuLabelClass =
    "font-serif-display text-lg lg:text-xl tracking-wide uppercase " +
    "text-[var(--header-pink-accent)] hover:text-white transition-colors";

  // 헤더 우측 링크 (Search / Login / Cart / My page) — 같은 폰트·색상, 약간 작게
  const rightLinkClass =
    "font-serif-display text-sm lg:text-base tracking-wide " +
    "text-[var(--header-pink-accent)] hover:text-white transition-colors whitespace-nowrap";

  return (
    <>
      <header
        data-transparent={isTransparent ? "true" : undefined}
        className="fixed top-0 left-0 right-0 z-50 bg-[var(--header-bg)] border-b border-[var(--border-color)] transition-colors duration-300"
      >
        {/* 전체 폭 + 좌우 padding만 — 메뉴/아이콘이 양끝에 붙도록 max-w 제거. z-10으로 드롭다운 패널 위에 올라감 */}
        <div className="relative z-10 flex items-center justify-between h-16 px-4 sm:px-6 lg:px-10">
          {/* 좌측: 4개 메뉴 (화면 좌측 끝에 붙음) */}
          <nav className="flex items-center gap-5 lg:gap-8">
            <div
              onMouseEnter={() => openOrSwitch("SHOP")}
              onMouseLeave={scheduleClose}
            >
              <Link
                href="/products"
                className={menuLabelClass}
                onClick={() => setOpenMenu(null)}
              >
                SHOP
              </Link>
            </div>

            <div
              onMouseEnter={() => openOrSwitch("ABOUT")}
              onMouseLeave={scheduleClose}
            >
              <Link
                href="/about"
                className={menuLabelClass}
                onClick={() => setOpenMenu(null)}
              >
                ABOUT
              </Link>
            </div>

            <div
              onMouseEnter={() => openOrSwitch("PNTK")}
              onMouseLeave={scheduleClose}
            >
              <Link
                href="/pntk"
                className={menuLabelClass}
                onClick={() => setOpenMenu(null)}
              >
                PNTK
              </Link>
            </div>

            <div
              onMouseEnter={() => openOrSwitch("INFO")}
              onMouseLeave={scheduleClose}
            >
              <button type="button" className={menuLabelClass}>
                INFO
              </button>
            </div>
          </nav>

          {/* 중앙: 로고 */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Logo />
          </div>

          {/* 우측: Search / Login·Logout / Cart:N / My page — 동일 폰트·색상 */}
          <div className="flex items-center gap-6 lg:gap-8">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className={rightLinkClass}
            >
              Search
            </button>

            {!mounted ? (
              <div className="w-48" />
            ) : (
              <>
                {loggedIn ? (
                  <button
                    onClick={() => setLogoutModalOpen(true)}
                    className={rightLinkClass}
                  >
                    Logout
                  </button>
                ) : (
                  <Link href="/login" className={rightLinkClass}>
                    Login/Join
                  </Link>
                )}

                <Link
                  href={loggedIn ? "/cart" : "/login"}
                  className={rightLinkClass}
                >
                  Cart:{cartCount}
                </Link>

                <Link
                  href={loggedIn ? "/mypage" : "/login"}
                  className={rightLinkClass}
                >
                  My page
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    className={`${rightLinkClass} hidden md:inline`}
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        {/* 4개 메뉴 드롭다운 — 모두 동일 너비 */}
        <DropdownPanel
          open={openMenu === "SHOP"}
          onMouseEnter={() => openOrSwitch("SHOP")}
          onMouseLeave={scheduleClose}
        >
          <ShopDropdownContent onItemClick={() => setOpenMenu(null)} />
        </DropdownPanel>

        <DropdownPanel
          open={openMenu === "ABOUT"}
          onMouseEnter={() => openOrSwitch("ABOUT")}
          onMouseLeave={scheduleClose}
        >
          <AboutDropdownContent />
        </DropdownPanel>

        <DropdownPanel
          open={openMenu === "PNTK"}
          onMouseEnter={() => openOrSwitch("PNTK")}
          onMouseLeave={scheduleClose}
        >
          <PntkDropdownContent />
        </DropdownPanel>

        <DropdownPanel
          open={openMenu === "INFO"}
          onMouseEnter={() => openOrSwitch("INFO")}
          onMouseLeave={scheduleClose}
        >
          <InfoDropdownContent onItemClick={() => setOpenMenu(null)} />
        </DropdownPanel>
      </header>

      {/* 검색바 */}
      <div
        className="fixed left-0 right-0 z-40 transition-all duration-300 ease-in-out border-b border-[var(--border-color)] bg-[var(--header-bg)]"
        style={{
          top: "4rem",
          transform: searchOpen ? "translateY(0)" : "translateY(-100%)",
          opacity: searchOpen ? 1 : 0,
          pointerEvents: searchOpen ? "auto" : "none",
        }}
      >
        <div className="px-4 sm:px-6 lg:px-10">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-4 h-14"
          >
            <Search
              className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0"
              strokeWidth={1.5}
            />
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

      {searchOpen && (
        <div
          className="fixed inset-0 z-30 bg-[var(--overlay-bg-light)] backdrop-blur-md"
          style={{ top: "calc(4rem + 3.5rem)" }}
          onClick={closeSearch}
        />
      )}

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

function DropdownPanel({
  open,
  onMouseEnter,
  onMouseLeave,
  children,
}: {
  open: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  children: React.ReactNode;
}) {
  // 4개 메뉴 모두 동일한 너비 — SHOP 기준으로 통일
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-hidden={!open}
      className="absolute top-0 left-0 w-[36vw] min-w-[440px] max-w-[640px] h-screen origin-top transition-all duration-300 ease-out"
      style={{
        background: "var(--dropdown-pink-bg)",
        opacity: open ? 1 : 0,
        transform: open ? "translateY(0)" : "translateY(-12px)",
        pointerEvents: open ? "auto" : "none",
      }}
    >
      {children}
    </div>
  );
}

function ShopDropdownContent({ onItemClick }: { onItemClick: () => void }) {
  return (
    <div className="h-full pt-28 pb-10 pl-10 lg:pl-16 pr-6">
      <Link
        href="/pntk/2026-hs"
        onClick={onItemClick}
        className="block font-display font-bold tracking-tight text-[34px] lg:text-[44px] leading-none mb-8 italic"
        style={{
          color: "var(--header-yellow)",
          textShadow: "0 2px 8px rgba(0,0,0,0.25)",
        }}
      >
        2026 H/S
      </Link>

      <ul className="space-y-5 lg:space-y-6">
        {SHOP_CATEGORIES.map((cat) => (
          <li key={cat.label}>
            <Link
              href={cat.href}
              onClick={onItemClick}
              className="font-display font-bold tracking-tight text-[30px] lg:text-[40px] leading-none italic block hover:opacity-90 transition-opacity"
              style={{
                color: "var(--header-yellow)",
                textShadow: "0 2px 8px rgba(0,0,0,0.25)",
              }}
            >
              {cat.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AboutDropdownContent() {
  // 콘텐츠는 추후 사용자 전달 예정 — 패널 활성화만 구현
  return (
    <div className="h-full pt-28 pb-10 pl-10 lg:pl-16 pr-6">
      <p
        className="font-display tracking-wide italic text-[18px] lg:text-[20px]"
        style={{
          color: "var(--header-yellow)",
          textShadow: "0 2px 8px rgba(0,0,0,0.25)",
        }}
      >
        준비 중
      </p>
    </div>
  );
}

function PntkDropdownContent() {
  // 콘텐츠는 추후 사용자 전달 예정 — 패널 활성화만 구현
  return (
    <div className="h-full pt-28 pb-10 pl-10 lg:pl-16 pr-6">
      <p
        className="font-display tracking-wide italic text-[18px] lg:text-[20px]"
        style={{
          color: "var(--header-yellow)",
          textShadow: "0 2px 8px rgba(0,0,0,0.25)",
        }}
      >
        준비 중
      </p>
    </div>
  );
}

function InfoDropdownContent({ onItemClick }: { onItemClick: () => void }) {
  return (
    <div className="h-full pt-28 pb-10 pl-10 lg:pl-16 pr-6">
      <ul className="space-y-5 lg:space-y-6">
        {INFO_LINKS.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              onClick={onItemClick}
              className="font-display font-bold tracking-tight text-[30px] lg:text-[40px] leading-none italic block hover:opacity-90 transition-opacity"
              style={{
                color: "var(--header-yellow)",
                textShadow: "0 2px 8px rgba(0,0,0,0.25)",
              }}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
