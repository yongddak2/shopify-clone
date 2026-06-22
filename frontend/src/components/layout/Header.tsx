"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { logout } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { useCartPanelStore } from "@/stores/cartPanelStore";
import { getPublicSeasonList } from "@/lib/season";

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
      <img
        src="/logo-header.png"
        alt="PanTrKa"
        className="h-10 w-auto max-w-[180px] md:h-12 md:max-w-none"
      />
    </Link>
  );
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    enabled: mounted,
  });
  const cartCount = cartData?.data?.length ?? 0;
  const openCartPanel = useCartPanelStore((s) => s.openCart);
  // 비회원은 장바구니 클릭 시 페이지 이동 대신 CART 레이어만 띄움
  const handleCartClick = (e: React.MouseEvent) => {
    if (!loggedIn) {
      e.preventDefault();
      openCartPanel();
    }
  };

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
        ? window.innerHeight * 0.9
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
    if (logoutModalOpen || mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [logoutModalOpen, mobileMenuOpen]);

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

  const toggleMobileMenu = () => {
    setSearchOpen(false);
    setMobileMenuOpen((open) => !open);
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
    "font-serif-display font-medium text-[16.667px] lg:text-[18.667px] tracking-wide uppercase " +
    "text-[var(--header-pink-accent)] hover:text-white transition-colors";

  // 헤더 우측 링크 (Search / Login / Cart / My page) — 좌측 메뉴와 같은 크기·굵기
  const rightLinkClass =
    "font-serif-display font-medium text-[16.667px] lg:text-[18.667px] tracking-wide " +
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
          <nav className="hidden md:flex items-center gap-5 lg:gap-8">
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
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
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
                  href="/cart"
                  onClick={handleCartClick}
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

          <button
            type="button"
            onClick={toggleMobileMenu}
            className="md:hidden flex h-10 w-10 items-center justify-start text-[var(--header-pink-accent)]"
            aria-label={mobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <div className="md:hidden flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchOpen((open) => !open);
              }}
              className="flex h-10 w-8 items-center justify-center text-[var(--header-pink-accent)]"
              aria-label="검색"
            >
              <Search className="h-5 w-5" />
            </button>
            <Link
              href="/cart"
              onClick={handleCartClick}
              className="relative flex h-10 w-8 items-center justify-center text-[var(--header-pink-accent)]"
              aria-label={`장바구니 ${cartCount}개`}
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--header-pink-accent)] px-1 text-[10px] leading-none text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        <div
          className="fixed inset-0 z-0 w-screen transition-all duration-200 md:hidden"
          style={{
            background: "var(--dropdown-pink-bg)",
            opacity: mobileMenuOpen ? 1 : 0,
            transform: mobileMenuOpen ? "translateY(0)" : "translateY(-12px)",
            pointerEvents: mobileMenuOpen ? "auto" : "none",
          }}
          aria-hidden={!mobileMenuOpen}
          onClick={() => setMobileMenuOpen(false)}
        >
          <nav className="flex h-full flex-col items-start overflow-y-auto px-8 pb-8 pt-24">
            {[
              { label: "SHOP", href: "/products" },
              { label: "ABOUT", href: "/about" },
              { label: "PNTK", href: "/pntk" },
              ...INFO_LINKS,
            ].map((link) => (
              <Link
                key={`${link.label}-${link.href}`}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="inline-block px-1 py-2 font-serif-display font-medium text-3xl tracking-wide text-[var(--header-yellow)] [text-shadow:0_2px_8px_rgba(0,0,0,0.25)]"
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-auto grid w-full grid-cols-2 justify-items-start gap-x-5 gap-y-4 border-t border-white/20 pt-6 font-serif-display text-base text-[var(--header-yellow)] [text-shadow:0_2px_8px_rgba(0,0,0,0.25)]">
              {loggedIn ? (
                <button
                  type="button"
                  onClick={() => setLogoutModalOpen(true)}
                  className="text-left"
                >
                  Logout
                </button>
              ) : (
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  Login/Join
                </Link>
              )}
              <Link
                href={loggedIn ? "/mypage" : "/login"}
                onClick={() => setMobileMenuOpen(false)}
              >
                My page
              </Link>
              <Link
                href="/cart"
                onClick={(e) => {
                  handleCartClick(e);
                  setMobileMenuOpen(false);
                }}
              >
                Cart:{cartCount}
              </Link>
              {isAdmin && (
                <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                  Admin
                </Link>
              )}
            </div>
          </nav>
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
          <AboutDropdownContent onItemClick={() => setOpenMenu(null)} />
        </DropdownPanel>

        <DropdownPanel
          open={openMenu === "PNTK"}
          onMouseEnter={() => openOrSwitch("PNTK")}
          onMouseLeave={scheduleClose}
        >
          <PntkDropdownContent onItemClick={() => setOpenMenu(null)} />
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
      className="absolute top-0 left-0 hidden h-screen w-[430px] origin-top transition-all duration-300 ease-out md:block"
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
    <div className="h-full pt-28 pb-10 pl-6 lg:pl-10 pr-6">
      <ul className="space-y-5 lg:space-y-6">
        {SHOP_CATEGORIES.map((cat) => (
          <li key={cat.label}>
            <Link
              href={cat.href}
              onClick={onItemClick}
              className="block font-serif-display font-medium text-lg lg:text-xl tracking-wide leading-none hover:opacity-90 transition-opacity"
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

function AboutDropdownContent({ onItemClick }: { onItemClick: () => void }) {
  return (
    <div className="h-full pt-28 pb-10 pl-6 lg:pl-10 pr-6">
      <Link
        href="/about"
        onClick={onItemClick}
        className="block font-serif-display font-medium text-lg lg:text-xl tracking-wide leading-none hover:opacity-90 transition-opacity"
        style={{
          color: "var(--header-yellow)",
          textShadow: "0 2px 8px rgba(0,0,0,0.25)",
        }}
      >
        About PanTrKa
      </Link>
    </div>
  );
}

function PntkDropdownContent({ onItemClick }: { onItemClick: () => void }) {
  const { data: seasons = [] } = useQuery({
    queryKey: ["pntk-seasons"],
    queryFn: getPublicSeasonList,
    staleTime: 60_000,
  });

  return (
    <div className="h-full pt-28 pb-10 pl-6 lg:pl-10 pr-6 overflow-y-auto">
      {seasons.length === 0 ? (
        <p
          className="font-serif-display font-medium text-lg lg:text-xl tracking-wide"
          style={{
            color: "var(--header-yellow)",
            textShadow: "0 2px 8px rgba(0,0,0,0.25)",
          }}
        >
          준비 중
        </p>
      ) : (
        <ul className="space-y-5 lg:space-y-6">
          {seasons.map((season) => (
            <li key={season.id}>
              <Link
                href={`/pntk/${season.slug}`}
                onClick={onItemClick}
                className="block font-serif-display font-medium text-lg lg:text-xl tracking-wide leading-none hover:opacity-90 transition-opacity"
                style={{
                  color: "var(--header-yellow)",
                  textShadow: "0 2px 8px rgba(0,0,0,0.25)",
                }}
              >
                {season.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function InfoDropdownContent({ onItemClick }: { onItemClick: () => void }) {
  return (
    <div className="h-full pt-28 pb-10 pl-6 lg:pl-10 pr-6">
      <ul className="space-y-5 lg:space-y-6">
        {INFO_LINKS.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              onClick={onItemClick}
              className="block font-serif-display font-medium text-lg lg:text-xl tracking-wide leading-none hover:opacity-90 transition-opacity"
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
