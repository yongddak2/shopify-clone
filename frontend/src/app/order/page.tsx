"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getCart } from "@/lib/cart";
import { createOrder } from "@/lib/order";
import { getMyAddresses, addMyAddress } from "@/lib/user";
import { useAuthStore } from "@/stores/authStore";
import Button from "@/components/common/Button";
import type { CartItem, MemberAddress } from "@/types";

declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: { zonecode: string; address: string }) => void;
      }) => { open: () => void };
    };
  }
}

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR");
}

function itemPrice(item: { basePrice: number; additionalPrice: number }) {
  return item.basePrice + item.additionalPrice;
}

interface CartGroup {
  productId: number;
  productName: string;
  thumbnailUrl: string | null;
  items: CartItem[];
}

function groupByProduct(items: CartItem[]): CartGroup[] {
  const map = new Map<number, CartGroup>();
  for (const item of items) {
    const existing = map.get(item.productId);
    if (existing) {
      existing.items.push(item);
      if (!existing.thumbnailUrl && item.thumbnailUrl) {
        existing.thumbnailUrl = item.thumbnailUrl;
      }
    } else {
      map.set(item.productId, {
        productId: item.productId,
        productName: item.productName,
        thumbnailUrl: item.thumbnailUrl,
        items: [item],
      });
    }
  }
  const groups = Array.from(map.values());
  groups.sort((a, b) => {
    const maxA = Math.max(...a.items.map((i) => i.id));
    const maxB = Math.max(...b.items.map((i) => i.id));
    return maxB - maxA;
  });
  for (const group of groups) {
    group.items.sort((a, b) => a.id - b.id);
  }
  return groups;
}

const DELIVERY_THRESHOLD = 50000;
const DELIVERY_FEE = 3000;

const MEMO_OPTIONS = [
  { value: "", label: "배송 메모를 선택해주세요" },
  { value: "문 앞에 놔주세요", label: "문 앞에 놔주세요" },
  { value: "경비실에 맡겨주세요", label: "경비실에 맡겨주세요" },
  { value: "택배함에 넣어주세요", label: "택배함에 넣어주세요" },
  { value: "배송 전에 연락 주세요", label: "배송 전에 연락 주세요" },
  { value: "__custom__", label: "직접입력" },
];

export default function OrderPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();

  const [form, setForm] = useState({
    recipient: "",
    phone: "",
    zipcode: "",
    address: "",
    addressDetail: "",
  });
  const [memoSelect, setMemoSelect] = useState("");
  const [customMemo, setCustomMemo] = useState("");
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [error, setError] = useState("");

  // 비로그인 redirect
  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
    }
  }, [isLoggedIn, router]);

  const { data: cartData, isLoading: cartLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: isLoggedIn(),
  });

  const { data: addressData } = useQuery({
    queryKey: ["addresses"],
    queryFn: getMyAddresses,
    enabled: isLoggedIn(),
  });

  // 장바구니 비어있으면 redirect
  useEffect(() => {
    if (!cartLoading && cartData && cartData.data.length === 0) {
      router.replace("/cart");
    }
  }, [cartLoading, cartData, router]);

  // 기본 배송지 자동 입력
  useEffect(() => {
    if (addressData?.data) {
      const defaultAddr = addressData.data.find(
        (a: MemberAddress) => a.defaultAddress
      );
      if (defaultAddr && !form.recipient) {
        setForm({
          recipient: defaultAddr.recipient,
          phone: defaultAddr.phone,
          zipcode: defaultAddr.zipcode ?? "",
          address: defaultAddr.address,
          addressDetail: defaultAddr.addressDetail ?? "",
        });
      }
    }
  }, [addressData]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePostcodeSearch = () => {
    new window.daum.Postcode({
      oncomplete: (data) => {
        setForm((prev) => ({
          ...prev,
          zipcode: data.zonecode,
          address: data.address,
          addressDetail: "",
        }));
      },
    }).open();
  };

  const actualMemo = memoSelect === "__custom__" ? customMemo : memoSelect;

  const orderMutation = useMutation({
    mutationFn: async () => {
      if (saveAsDefault) {
        try {
          await addMyAddress({
            label: `${form.recipient}의 배송지`,
            recipient: form.recipient,
            phone: form.phone,
            zipcode: form.zipcode,
            address: form.address,
            addressDetail: form.addressDetail,
            defaultAddress: true,
          });
        } catch {
          // 배송지 저장 실패해도 주문은 계속 진행
        }
      }
      return createOrder({
        recipient: form.recipient,
        phone: form.phone,
        address: `[${form.zipcode}] ${form.address} ${form.addressDetail}`.trim(),
        memo: actualMemo,
      });
    },
    onSuccess: (data) => {
      alert("주문이 완료되었습니다.");
      router.push(`/orders/${data.data.id}`);
    },
    onError: () => {
      setError("주문에 실패했습니다. 다시 시도해주세요.");
    },
  });

  const handleAddressSelect = (addr: MemberAddress) => {
    setForm({
      ...form,
      recipient: addr.recipient,
      phone: addr.phone,
      zipcode: addr.zipcode ?? "",
      address: addr.address,
      addressDetail: addr.addressDetail ?? "",
    });
  };

  if (!isLoggedIn()) return null;

  const items = cartData?.data ?? [];
  const groups = useMemo(() => groupByProduct(items), [items]); // eslint-disable-line react-hooks/exhaustive-deps
  const addresses = addressData?.data ?? [];
  const totalAmount = items.reduce(
    (sum, item) => sum + itemPrice(item) * item.quantity,
    0
  );
  const deliveryFee = totalAmount >= DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const finalAmount = totalAmount + deliveryFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.recipient.trim() || !form.phone.trim() || !form.address.trim() || !form.addressDetail.trim()) {
      setError("배송 정보를 모두 입력해주세요.");
      return;
    }

    orderMutation.mutate();
  };

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-10 py-12">
      <Script
        src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="lazyOnload"
      />
      <h1 className="text-2xl tracking-[0.2em] font-light text-center mb-12 text-[var(--text-primary)]">
        ORDER
      </h1>

      {cartLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-[var(--skeleton)] animate-pulse" />
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* 주문 상품 요약 (상품 그룹별) */}
          <section className="mb-10">
            <h2 className="text-xs tracking-widest text-[var(--text-muted)] mb-4">
              주문상품
            </h2>
            <div className="border-t border-[var(--border-color)]">
              {groups.map((group) => (
                <div
                  key={group.productId}
                  className="flex gap-4 py-4 border-b border-[var(--border-color)]"
                >
                  {/* 작은 썸네일 */}
                  <div className="w-14 h-14 bg-[var(--card-bg)] flex-shrink-0 overflow-hidden">
                    {group.thumbnailUrl ? (
                      <img
                        src={group.thumbnailUrl}
                        alt={group.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[var(--section-bg)]" />
                    )}
                  </div>

                  {/* 상품 정보 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-secondary)] truncate mb-1">
                      {group.productName}
                    </p>
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs text-[var(--text-muted)] mt-1"
                      >
                        <span>
                          {item.optionValue} / {item.quantity}개
                        </span>
                        <span className="text-sm text-[var(--text-secondary)]">
                          {formatPrice(itemPrice(item) * item.quantity)}원
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 배송 정보 */}
          <section className="mb-10">
            <h2 className="text-xs tracking-widest text-[var(--text-muted)] mb-4">
              배송 정보
            </h2>

            {/* 저장된 배송지 선택 */}
            {addresses.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-[var(--text-muted)] mb-2">저장된 배송지</p>
                <div className="flex flex-wrap gap-2">
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => handleAddressSelect(addr)}
                      className={`px-3 py-1.5 text-xs border transition-colors ${
                        form.recipient === addr.recipient &&
                        form.phone === addr.phone
                          ? "border-[var(--text-primary)] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]"
                          : "border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]"
                      }`}
                    >
                      {addr.label}
                      {addr.defaultAddress && " (기본)"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs tracking-wider text-[var(--text-muted)] mb-2">
                  수령인 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.recipient}
                  onChange={(e) =>
                    setForm({ ...form, recipient: e.target.value })
                  }
                  className="w-full border-b border-[var(--border-color)] bg-transparent py-2 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors placeholder-[var(--text-dim)]"
                  placeholder="수령인 이름"
                />
              </div>
              <div>
                <label className="block text-xs tracking-wider text-[var(--text-muted)] mb-2">
                  연락처 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  className="w-full border-b border-[var(--border-color)] bg-transparent py-2 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors placeholder-[var(--text-dim)]"
                  placeholder="010-1234-5678"
                />
              </div>
              <div>
                <label className="block text-xs tracking-wider text-[var(--text-muted)] mb-2">
                  우편번호 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3 items-end mb-3">
                  <input
                    type="text"
                    value={form.zipcode}
                    readOnly
                    className="w-28 border-b border-[var(--border-color)] bg-transparent py-2 text-sm text-[var(--text-secondary)] focus:outline-none placeholder-[var(--text-dim)]"
                    placeholder="우편번호"
                  />
                  <button
                    type="button"
                    onClick={handlePostcodeSearch}
                    className="px-4 py-2 text-xs tracking-wider border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
                  >
                    주소 검색
                  </button>
                </div>
                <input
                  type="text"
                  value={form.address}
                  readOnly
                  className="w-full border-b border-[var(--border-color)] bg-transparent py-2 text-sm text-[var(--text-secondary)] focus:outline-none placeholder-[var(--text-dim)] mb-3"
                  placeholder="기본주소"
                />
                <div>
                  <label className="block text-xs tracking-wider text-[var(--text-muted)] mb-2">
                    상세주소 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.addressDetail}
                    onChange={(e) =>
                      setForm({ ...form, addressDetail: e.target.value })
                    }
                    className="w-full border-b border-[var(--border-color)] bg-transparent py-2 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors placeholder-[var(--text-dim)]"
                    placeholder="상세주소 (동/호수)"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs tracking-wider text-[var(--text-muted)] mb-2">
                  배송 메모
                </label>
                <select
                  value={memoSelect}
                  onChange={(e) => {
                    setMemoSelect(e.target.value);
                    if (e.target.value !== "__custom__") {
                      setCustomMemo("");
                    }
                  }}
                  className="w-full border-b border-[var(--border-color)] bg-transparent py-2 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors"
                >
                  {MEMO_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[var(--card-bg)] text-[var(--text-secondary)]">
                      {opt.label}
                    </option>
                  ))}
                </select>
                {memoSelect === "__custom__" && (
                  <input
                    type="text"
                    value={customMemo}
                    onChange={(e) => setCustomMemo(e.target.value)}
                    className="w-full border-b border-[var(--border-color)] bg-transparent py-2 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors placeholder-[var(--text-dim)] mt-3"
                    placeholder="배송 시 요청사항을 입력해주세요"
                  />
                )}
              </div>

              {/* 기본 배송지로 저장 */}
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={saveAsDefault}
                  onChange={(e) => setSaveAsDefault(e.target.checked)}
                  className="w-4 h-4 accent-[var(--text-primary)]"
                />
                <span className="text-xs text-[var(--text-muted)]">기본 배송지로 저장</span>
              </label>
            </div>
          </section>

          {/* 결제 금액 요약 */}
          <section className="mb-10 border-t border-[var(--border-color)] pt-8 space-y-3">
            <h2 className="text-xs tracking-widest text-[var(--text-muted)] mb-4">
              결제 정보
            </h2>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">총 상품 금액</span>
              <span className="text-[var(--text-secondary)]">{formatPrice(totalAmount)}원</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">배송비</span>
              <span className="text-[var(--text-secondary)]">
                {deliveryFee === 0 ? "무료" : `${formatPrice(deliveryFee)}원`}
              </span>
            </div>
            <div className="flex justify-between text-base font-medium pt-4 border-t border-[var(--border-color)]">
              <span className="text-[var(--text-primary)]">최종 결제 금액</span>
              <span className="text-[var(--text-primary)]">{formatPrice(finalAmount)}원</span>
            </div>
          </section>

          {error && (
            <p className="text-red-400 text-sm text-center mb-4">{error}</p>
          )}

          <Button type="submit" fullWidth loading={orderMutation.isPending}>
            결제하기
          </Button>

          <p className="text-xs text-[var(--text-muted)] text-center mt-4">
            * 토스페이먼츠 결제 연동은 추후 적용 예정입니다.
          </p>
        </form>
      )}
    </div>
  );
}
