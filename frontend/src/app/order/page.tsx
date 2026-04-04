"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCart } from "@/lib/cart";
import { createOrder } from "@/lib/order";
import {
  getMyAddresses,
  addMyAddress,
  updateMyAddress,
  deleteMyAddress,
} from "@/lib/user";
import { getMyCoupons } from "@/lib/coupon";
import { useAuthStore } from "@/stores/authStore";
import Button from "@/components/common/Button";
import type { CartItem, MemberAddress, MemberCoupon } from "@/types";

declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: { zonecode: string; address: string }) => void;
      }) => { open: () => void };
    };
    TossPayments: (clientKey: string) => {
      requestPayment: (
        method: string,
        options: {
          amount: number;
          orderId: string;
          orderName: string;
          successUrl: string;
          failUrl: string;
          customerName?: string;
        }
      ) => Promise<void>;
    };
  }
}

const TOSS_CLIENT_KEY =
  process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ||
  "test_ck_26DlbXAaV0BmZlD9Bbdn8qY50Q9R";

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR");
}

function originalPrice(item: CartItem) {
  return item.basePrice + item.additionalPrice;
}

function itemPrice(item: CartItem) {
  const rate = item.discountRate ?? 0;
  const base = rate > 0 ? Math.round(item.basePrice * (1 - rate / 100)) : item.basePrice;
  return base + item.additionalPrice;
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

// ─── 배송지 추가/수정 모달 ───
function AddressFormModal({
  editAddress,
  onClose,
  onSaved,
}: {
  editAddress: MemberAddress | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [addrForm, setAddrForm] = useState({
    label: editAddress?.label ?? "",
    recipient: editAddress?.recipient ?? "",
    phone: editAddress?.phone ?? "",
    zipcode: editAddress?.zipcode ?? "",
    address: editAddress?.address ?? "",
    addressDetail: editAddress?.addressDetail ?? "",
    defaultAddress: editAddress?.defaultAddress ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  };

  const handlePostcode = () => {
    new window.daum.Postcode({
      oncomplete: (data) => {
        setAddrForm((p) => ({
          ...p,
          zipcode: data.zonecode,
          address: data.address,
          addressDetail: "",
        }));
      },
    }).open();
  };

  const handleSave = async () => {
    if (
      !addrForm.recipient.trim() ||
      !addrForm.phone.trim() ||
      !addrForm.address.trim() ||
      !addrForm.addressDetail.trim()
    ) {
      setFormError("모든 필수 항목을 입력해주세요.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        ...addrForm,
        label: addrForm.label.trim() || `${addrForm.recipient.trim()}의 배송지`,
      };
      if (editAddress) {
        await updateMyAddress(editAddress.id, payload);
      } else {
        await addMyAddress(payload);
      }
      onSaved();
    } catch {
      setFormError("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full border-b border-[var(--border-color)] bg-transparent py-2 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors placeholder-[var(--text-dim)]";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[var(--overlay-bg)]"
        onClick={onClose}
      />
      <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
          <h3 className="text-sm font-medium tracking-wider text-[var(--text-primary)]">
            {editAddress ? "배송지 수정" : "배송지 추가"}
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-lg"
          >
            &times;
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              배송지 이름
            </label>
            <input
              value={addrForm.label}
              onChange={(e) =>
                setAddrForm({ ...addrForm, label: e.target.value })
              }
              className={inputClass}
              placeholder="예) 집, 회사"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              수령인 <span className="text-red-500">*</span>
            </label>
            <input
              value={addrForm.recipient}
              onChange={(e) =>
                setAddrForm({ ...addrForm, recipient: e.target.value })
              }
              className={inputClass}
              placeholder="수령인 이름"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              연락처 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={addrForm.phone}
              onChange={(e) =>
                setAddrForm({ ...addrForm, phone: formatPhone(e.target.value) })
              }
              maxLength={13}
              className={inputClass}
              placeholder="010-1234-5678"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              주소 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3 items-end mb-3">
              <input
                value={addrForm.zipcode}
                readOnly
                className="w-28 border-b border-[var(--border-color)] bg-transparent py-2 text-sm text-[var(--text-secondary)] focus:outline-none placeholder-[var(--text-dim)]"
                placeholder="우편번호"
              />
              <button
                type="button"
                onClick={handlePostcode}
                className="px-4 py-2 text-xs tracking-wider border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
              >
                주소 검색
              </button>
            </div>
            <input
              value={addrForm.address}
              readOnly
              className="w-full border-b border-[var(--border-color)] bg-transparent py-2 text-sm text-[var(--text-secondary)] focus:outline-none placeholder-[var(--text-dim)] mb-3"
              placeholder="기본주소"
            />
            <input
              value={addrForm.addressDetail}
              onChange={(e) =>
                setAddrForm({ ...addrForm, addressDetail: e.target.value })
              }
              className={inputClass}
              placeholder="상세주소 (동/호수)"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={addrForm.defaultAddress}
              onChange={(e) =>
                setAddrForm({ ...addrForm, defaultAddress: e.target.checked })
              }
              className="w-4 h-4 accent-[var(--text-primary)]"
            />
            <span className="text-xs text-[var(--text-muted)]">
              기본 배송지로 설정
            </span>
          </label>

          {formError && (
            <p className="text-xs text-red-400">{formError}</p>
          )}
        </div>

        <div className="px-6 pb-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors"
          >
            {saving
              ? "저장 중..."
              : editAddress
                ? "수정하기"
                : "저장하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 배송지 목록 모달 ───
function AddressListModal({
  addresses,
  selectedId,
  onSelect,
  onClose,
  onRefresh,
}: {
  addresses: MemberAddress[];
  selectedId: number | null;
  onSelect: (addr: MemberAddress) => void;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [chosen, setChosen] = useState<number | null>(selectedId);
  const [subModal, setSubModal] = useState<
    | { type: "add" }
    | { type: "edit"; addr: MemberAddress }
    | { type: "deleteConfirm"; addr: MemberAddress }
    | null
  >(null);
  const [deleting, setDeleting] = useState(false);

  const handleApply = () => {
    const addr = addresses.find((a) => a.id === chosen);
    if (addr) onSelect(addr);
    onClose();
  };

  const handleDelete = async (addr: MemberAddress) => {
    setDeleting(true);
    try {
      await deleteMyAddress(addr.id);
      onRefresh();
    } catch {
      // ignore
    } finally {
      setDeleting(false);
      setSubModal(null);
    }
  };

  if (subModal?.type === "add" || subModal?.type === "edit") {
    return (
      <AddressFormModal
        editAddress={subModal.type === "edit" ? subModal.addr : null}
        onClose={() => setSubModal(null)}
        onSaved={() => {
          setSubModal(null);
          onRefresh();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[var(--overlay-bg)]"
        onClick={onClose}
      />
      <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] w-full max-w-md mx-4 max-h-[85vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
          <h3 className="text-sm font-medium tracking-wider text-[var(--text-primary)]">
            배송지 정보
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-lg"
          >
            &times;
          </button>
        </div>

        {/* 추가 버튼 */}
        <div className="px-6 pt-4">
          <button
            onClick={() => setSubModal({ type: "add" })}
            className="w-full py-2.5 text-xs tracking-wider border border-dashed border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors"
          >
            + 배송지 추가하기
          </button>
        </div>

        {/* 목록 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {addresses.length === 0 && (
            <p className="text-xs text-[var(--text-dim)] text-center py-8">
              저장된 배송지가 없습니다.
            </p>
          )}
          {addresses.map((addr) => (
            <label
              key={addr.id}
              className={`block border p-4 cursor-pointer transition-colors ${
                chosen === addr.id
                  ? "border-[var(--text-primary)]"
                  : "border-[var(--border-color)] hover:border-[var(--text-muted)]"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="address"
                  checked={chosen === addr.id}
                  onChange={() => setChosen(addr.id)}
                  className="mt-0.5 w-4 h-4 accent-[var(--text-primary)]"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-[var(--text-primary)] font-medium">
                      {addr.recipient}
                      {addr.label && (
                        <span className="text-[var(--text-muted)] font-normal"> ({addr.label})</span>
                      )}
                    </span>
                    {addr.defaultAddress && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-[var(--badge-blue-bg,#1e3a5f)] text-[var(--badge-blue-text,#60a5fa)] rounded">
                        기본 배송지
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mb-0.5">
                    [{addr.zipcode}] {addr.address} {addr.addressDetail}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {addr.phone}
                  </p>
                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setSubModal({ type: "edit", addr });
                      }}
                      className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors underline"
                    >
                      수정
                    </button>
                    {!addr.defaultAddress && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setSubModal({ type: "deleteConfirm", addr });
                        }}
                        className="text-[10px] text-[var(--text-muted)] hover:text-red-400 transition-colors underline"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>

        {/* 하단 */}
        <div className="px-6 pb-5 pt-2 border-t border-[var(--border-color)]">
          <button
            onClick={handleApply}
            disabled={chosen === null}
            className="w-full py-3 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-40"
          >
            변경하기
          </button>
        </div>
      </div>

      {/* 삭제 확인 */}
      {subModal?.type === "deleteConfirm" && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--overlay-bg)]"
            onClick={() => setSubModal(null)}
          />
          <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] px-8 py-8 max-w-sm w-full mx-6 text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              배송지를 삭제하시겠습니까?
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-8">
              {subModal.addr.recipient} - {subModal.addr.address}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSubModal(null)}
                className="flex-1 py-3 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(subModal.addr)}
                disabled={deleting}
                className="flex-1 py-3 text-sm bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 메인 주문 페이지 ───
export default function OrderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
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
  const [error, setError] = useState("");
  const [addressModal, setAddressModal] = useState(false);
  const [addressFormModal, setAddressFormModal] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null
  );
  const [selectedCartIds, setSelectedCartIds] = useState<number[] | null>(null);
  const [selectedCouponId, setSelectedCouponId] = useState<number | null>(null);

  // sessionStorage에서 선택된 cartItemIds 읽기
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("orderCartItemIds");
      if (stored) {
        const ids = JSON.parse(stored) as number[];
        if (Array.isArray(ids) && ids.length > 0) {
          setSelectedCartIds(ids);
        }
        sessionStorage.removeItem("orderCartItemIds");
      }
    } catch {
      // ignore
    }
  }, []);

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

  const { data: couponData } = useQuery({
    queryKey: ["myCoupons"],
    queryFn: getMyCoupons,
    enabled: isLoggedIn(),
  });

  useEffect(() => {
    if (!cartLoading && cartData) {
      const filtered = selectedCartIds
        ? cartData.data.filter((item: CartItem) => selectedCartIds.includes(item.id))
        : cartData.data;
      if (filtered.length === 0) {
        router.replace("/cart");
      }
    }
  }, [cartLoading, cartData, selectedCartIds, router]);

  // 기본 배송지 자동 입력
  useEffect(() => {
    if (addressData?.data) {
      const defaultAddr = addressData.data.find(
        (a: MemberAddress) => a.defaultAddress
      );
      if (defaultAddr && !form.recipient) {
        applyAddress(defaultAddr);
      }
    }
  }, [addressData]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyAddress = (addr: MemberAddress) => {
    setForm({
      recipient: addr.recipient,
      phone: addr.phone,
      zipcode: addr.zipcode ?? "",
      address: addr.address,
      addressDetail: addr.addressDetail ?? "",
    });
    setSelectedAddressId(addr.id);
  };

  const actualMemo = memoSelect === "__custom__" ? customMemo : memoSelect;

  const orderMutation = useMutation({
    mutationFn: async () => {
      return createOrder({
        cartItemIds: items.map((item) => item.id),
        recipient: form.recipient,
        phone: form.phone,
        address: `[${form.zipcode}] ${form.address} ${form.addressDetail}`.trim(),
        memo: actualMemo,
        memberCouponId: selectedCouponId,
      });
    },
    onSuccess: async (data) => {
      const { orderNumber, finalAmount } = data.data;

      if (!window.TossPayments) {
        setError("결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      const tossPayments = window.TossPayments(TOSS_CLIENT_KEY);
      const origin = window.location.origin;

      const firstProductName =
        items.length > 0 ? items[0].productName : "상품";
      const orderName =
        items.length > 1
          ? `${firstProductName} 외 ${items.length - 1}건`
          : firstProductName;

      try {
        await tossPayments.requestPayment("카드", {
          amount: finalAmount,
          orderId: orderNumber,
          orderName,
          successUrl: `${origin}/payment/success`,
          failUrl: `${origin}/payment/fail`,
          customerName: form.recipient,
        });
      } catch {
        // 사용자가 결제창을 닫은 경우 등
      }
    },
    onError: () => {
      setError("주문 생성에 실패했습니다. 다시 시도해주세요.");
    },
  });

  if (!isLoggedIn()) return null;

  const allCartItems = cartData?.data ?? [];
  const items = selectedCartIds
    ? allCartItems.filter((item) => selectedCartIds.includes(item.id))
    : allCartItems;
  const groups = useMemo(() => groupByProduct(items), [items]); // eslint-disable-line react-hooks/exhaustive-deps
  const addresses = addressData?.data ?? [];
  const defaultAddr = addresses.find((a) => a.defaultAddress) ?? null;
  const hasAddress = form.recipient && form.address;
  const totalAmount = items.reduce(
    (sum, item) => sum + itemPrice(item) * item.quantity,
    0
  );
  const deliveryFee = totalAmount >= DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;

  // 쿠폰
  const allCoupons = couponData?.data ?? [];
  const availableCoupons = allCoupons.filter(
    (c) => c.usable && new Date(c.expiredAt) > new Date() && c.minOrderAmount <= totalAmount
  );

  const selectedCoupon = availableCoupons.find((c) => c.id === selectedCouponId) ?? null;

  const couponDiscount = useMemo(() => {
    if (!selectedCoupon) return 0;
    let discount = 0;
    if (selectedCoupon.discountType === "FIXED") {
      discount = selectedCoupon.discountValue;
    } else {
      discount = Math.round(totalAmount * selectedCoupon.discountValue / 100);
      if (selectedCoupon.maxDiscountAmount != null) {
        discount = Math.min(discount, selectedCoupon.maxDiscountAmount);
      }
    }
    return Math.min(discount, totalAmount);
  }, [selectedCoupon, totalAmount]);

  const finalAmount = totalAmount - couponDiscount + deliveryFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !form.recipient.trim() ||
      !form.phone.trim() ||
      !form.address.trim() ||
      !form.addressDetail.trim()
    ) {
      setError("배송 정보를 모두 입력해주세요.");
      return;
    }

    orderMutation.mutate();
  };

  const refreshAddresses = () => {
    queryClient.invalidateQueries({ queryKey: ["addresses"] });
  };

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-10 py-12">
      <Script
        src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="lazyOnload"
      />
      <Script
        src="https://js.tosspayments.com/v1/payment"
        strategy="lazyOnload"
      />
      <h1 className="text-2xl tracking-[0.2em] font-light text-center mb-12 text-[var(--text-primary)]">
        ORDER
      </h1>

      {cartLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-16 bg-[var(--skeleton)] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* 주문 상품 요약 */}
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
                        <div className="text-right">
                          {(item.discountRate ?? 0) > 0 && (
                            <span className="text-xs text-[var(--text-dim)] line-through mr-1">
                              {formatPrice(originalPrice(item) * item.quantity)}원
                            </span>
                          )}
                          <span className="text-sm text-[var(--text-secondary)]">
                            {formatPrice(itemPrice(item) * item.quantity)}원
                          </span>
                        </div>
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

            {hasAddress ? (
              /* 배송지가 선택된 상태 */
              <div className="border border-[var(--border-color)] p-5 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {form.recipient}
                    </span>
                    {defaultAddr &&
                      selectedAddressId === defaultAddr.id && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-[var(--badge-blue-bg,#1e3a5f)] text-[var(--badge-blue-text,#60a5fa)] rounded">
                          기본 배송지
                        </span>
                      )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddressModal(true)}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border-color)] px-3 py-1.5"
                  >
                    배송지 변경
                  </button>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">
                  [{form.zipcode}] {form.address} {form.addressDetail}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {form.phone}
                </p>
              </div>
            ) : (
              /* 배송지 없는 상태 */
              <div className="border border-dashed border-[var(--border-color)] p-8 mb-4 text-center">
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  저장된 배송지가 없습니다.
                </p>
                <button
                  type="button"
                  onClick={() => setAddressFormModal(true)}
                  className="px-5 py-2.5 text-xs tracking-wider border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  배송지 추가
                </button>
              </div>
            )}

            {/* 배송 메모 */}
            <div className="space-y-4">
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
                    <option
                      key={opt.value}
                      value={opt.value}
                      className="bg-[var(--card-bg)] text-[var(--text-secondary)]"
                    >
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
            </div>
          </section>

          {/* 쿠폰 적용 */}
          <section className="mb-10">
            <h2 className="text-xs tracking-widest text-[var(--text-muted)] mb-4">
              쿠폰 적용
            </h2>
            {availableCoupons.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">
                사용 가능한 쿠폰이 없습니다
              </p>
            ) : (
              <select
                value={selectedCouponId ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCouponId(val ? Number(val) : null);
                }}
                className="w-full border-b border-[var(--border-color)] bg-transparent py-2 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors"
              >
                <option value="" className="bg-[#333] text-white">
                  쿠폰을 선택하세요 ({availableCoupons.length}장 보유)
                </option>
                {availableCoupons.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#333] text-white">
                    {c.couponName} (
                    {c.discountType === "FIXED"
                      ? `${formatPrice(c.discountValue)}원 할인`
                      : `${c.discountValue}% 할인${c.maxDiscountAmount != null ? `, 최대 ${formatPrice(c.maxDiscountAmount)}원` : ""}`}
                    )
                  </option>
                ))}
              </select>
            )}
            {couponDiscount > 0 && (
              <p className="text-sm text-red-400 mt-2">
                -{formatPrice(couponDiscount)}원 할인 적용
              </p>
            )}
          </section>

          {/* 결제 금액 요약 */}
          <section className="mb-10 border-t border-[var(--border-color)] pt-8 space-y-3">
            <h2 className="text-xs tracking-widest text-[var(--text-muted)] mb-4">
              결제 정보
            </h2>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">총 상품 금액</span>
              <span className="text-[var(--text-secondary)]">
                {formatPrice(totalAmount)}원
              </span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">쿠폰 할인</span>
                <span className="text-red-400">
                  -{formatPrice(couponDiscount)}원
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">배송비</span>
              <span className="text-[var(--text-secondary)]">
                {deliveryFee === 0
                  ? "무료"
                  : `${formatPrice(deliveryFee)}원`}
              </span>
            </div>
            <div className="flex justify-between text-base font-medium pt-4 border-t border-[var(--border-color)]">
              <span className="text-[var(--text-primary)]">
                최종 결제 금액
              </span>
              <span className="text-[var(--text-primary)]">
                {formatPrice(finalAmount)}원
              </span>
            </div>
          </section>

          {error && (
            <p className="text-red-400 text-sm text-center mb-4">{error}</p>
          )}

          <Button type="submit" fullWidth loading={orderMutation.isPending}>
            결제하기
          </Button>
        </form>
      )}

      {/* 배송지 목록 모달 */}
      {addressModal && (
        <AddressListModal
          addresses={addresses}
          selectedId={selectedAddressId}
          onSelect={applyAddress}
          onClose={() => setAddressModal(false)}
          onRefresh={refreshAddresses}
        />
      )}

      {/* 배송지 추가 모달 (배송지 없을 때 직접 추가) */}
      {addressFormModal && (
        <AddressFormModal
          editAddress={null}
          onClose={() => setAddressFormModal(false)}
          onSaved={() => {
            setAddressFormModal(false);
            refreshAddresses();
          }}
        />
      )}
    </div>
  );
}
