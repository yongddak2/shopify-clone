"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, CornerDownRight } from "lucide-react";
import { getFaqs } from "@/lib/faq";
import type { SupportCategory } from "@/types";

const CATEGORY_TABS: { value: SupportCategory | "ALL"; label: string }[] = [
  { value: "ALL", label: "ALL" },
  { value: "DELIVERY", label: "배송" },
  { value: "EXCHANGE", label: "교환/반품" },
  { value: "PAYMENT", label: "결제" },
  { value: "MEMBER", label: "회원" },
  { value: "PRODUCT", label: "상품" },
  { value: "ETC", label: "기타" },
];

export default function FaqPage() {
  const [selectedCategory, setSelectedCategory] = useState<SupportCategory | "ALL">("ALL");
  const [openId, setOpenId] = useState<number | null>(null);

  const { data: faqs, isLoading } = useQuery({
    queryKey: ["faqs"],
    queryFn: getFaqs,
    staleTime: 5 * 60 * 1000,
  });

  const filtered = useMemo(() => {
    if (!faqs) return [];
    if (selectedCategory === "ALL") return faqs;
    return faqs.filter((f) => f.category === selectedCategory);
  }, [faqs, selectedCategory]);

  return (
    <div>
      <header className="mb-10">
        <h1 className="text-2xl tracking-[0.2em] font-light text-[var(--text-primary)]">
          FAQ
        </h1>
        <p className="mt-3 text-xs tracking-wider text-[var(--text-dim)]">
          자주 묻는 질문을 카테고리별로 모아두었습니다.
        </p>
      </header>

      <div>
        <div className="flex items-center gap-6 overflow-x-auto pb-4 mb-8 border-b border-[var(--border-color)] scrollbar-hide">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setSelectedCategory(tab.value);
                setOpenId(null);
              }}
              className={`text-xs tracking-widest whitespace-nowrap transition-colors ${
                selectedCategory === tab.value
                  ? "text-[var(--text-primary)] font-semibold border-b-2 border-[var(--text-primary)] pb-1"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-[var(--skeleton)] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-[var(--text-muted)] text-sm">
            등록된 FAQ가 없습니다.
          </div>
        ) : (
          <ul className="border-t border-[var(--border-color)]">
            {filtered.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <li key={faq.id} className="border-b border-[var(--border-color)]">
                  <button
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    className="w-full flex items-center gap-3 py-5 px-2 text-left hover:bg-[var(--card-bg)] transition-colors"
                  >
                    <span className="inline-block w-16 text-[10px] tracking-wider text-[var(--text-muted)]">
                      {faq.categoryLabel}
                    </span>
                    <span className="flex-1 text-sm text-[var(--text-secondary)]">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      strokeWidth={1.5}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-2 pb-6 pl-[88px] flex gap-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                        <CornerDownRight
                          className="w-4 h-4 text-[var(--text-muted)] mt-0.5 shrink-0"
                          strokeWidth={1.5}
                        />
                        <span className="whitespace-pre-wrap">{faq.answer}</span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
