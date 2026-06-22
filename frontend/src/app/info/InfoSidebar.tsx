"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU = [
  { href: "/info/notice", label: "NOTICE" },
  { href: "/info/faq", label: "FAQ" },
  { href: "/info/qa", label: "Q&A" },
];

export default function InfoSidebar() {
  const pathname = usePathname();
  return (
    <nav className="flex md:flex-col gap-6 md:gap-4 overflow-x-auto md:overflow-visible pb-2 md:pb-0 md:sticky md:top-24 scrollbar-hide">
      {MENU.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`text-xs tracking-[0.1em] whitespace-nowrap transition-colors ${
              active
                ? "text-[var(--text-primary)] font-medium"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
