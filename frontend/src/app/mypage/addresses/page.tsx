"use client";

import { useState } from "react";
import Script from "next/script";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMyAddresses,
  addMyAddress,
  updateMyAddress,
  deleteMyAddress,
} from "@/lib/user";
import { invalidateAddressRelated } from "@/lib/queryInvalidator";
import { useAuthStore } from "@/stores/authStore";
import type { MemberAddress } from "@/types";

declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: { zonecode: string; address: string }) => void;
      }) => { open: () => void };
    };
  }
}

const inputClass =
  "w-full bg-[var(--input-bg)] border border-[var(--border-color)] px-3 py-2 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)] transition-colors placeholder-[var(--text-dim)]";

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

// ─── 배송지 추가/수정 폼 ───
function AddressForm({
  editAddress,
  existingAddresses,
  onCancel,
  onSaved,
}: {
  editAddress: MemberAddress | null;
  existingAddresses: MemberAddress[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    label: editAddress?.label ?? "",
    recipient: editAddress?.recipient ?? "",
    phone: editAddress?.phone ?? "",
    zipcode: editAddress?.zipcode ?? "",
    address: editAddress?.address ?? "",
    addressDetail: editAddress?.addressDetail ?? "",
    defaultAddress: editAddress?.defaultAddress ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [defaultConfirm, setDefaultConfirm] = useState(false);

  const wasDefault = editAddress?.defaultAddress ?? false;

  const handlePostcode = () => {
    new window.daum.Postcode({
      oncomplete: (data) => {
        setForm((p) => ({
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
      !form.recipient.trim() ||
      !form.phone.trim() ||
      !form.address.trim() ||
      !form.addressDetail.trim()
    ) {
      setError("모든 필수 항목을 입력해주세요.");
      return;
    }
    if (!editAddress) {
      const duplicate = existingAddresses.some(
        (a) =>
          a.zipcode === form.zipcode.trim() &&
          a.address === form.address.trim() &&
          a.addressDetail === form.addressDetail.trim()
      );
      if (duplicate) {
        setError("이미 등록된 배송지입니다.");
        return;
      }
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        label: form.label.trim() || `${form.recipient.trim()}의 배송지`,
      };
      if (editAddress) {
        await updateMyAddress(editAddress.id, payload);
      } else {
        await addMyAddress(payload);
      }
      onSaved();
    } catch {
      setError("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-[var(--border-color)] p-6 space-y-4">
      <h3 className="text-sm font-medium tracking-wider text-[var(--text-primary)] mb-2">
        {editAddress ? "배송지 수정" : "새 배송지 추가"}
      </h3>

      <div>
        <label className="block text-xs text-[var(--text-muted)] mb-1">배송지 이름</label>
        <input
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          className={inputClass}
          placeholder="예) 집, 회사"
        />
      </div>
      <div>
        <label className="block text-xs text-[var(--text-muted)] mb-1">
          수령인 <span className="text-red-500">*</span>
        </label>
        <input
          value={form.recipient}
          onChange={(e) => setForm({ ...form, recipient: e.target.value })}
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
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
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
            value={form.zipcode}
            readOnly
            className={`w-28 ${inputClass}`}
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
          value={form.address}
          readOnly
          className={`${inputClass} mb-3`}
          placeholder="기본주소"
        />
        <input
          value={form.addressDetail}
          onChange={(e) => setForm({ ...form, addressDetail: e.target.value })}
          className={inputClass}
          placeholder="상세주소 (동/호수)"
        />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.defaultAddress}
          onChange={(e) => {
            if (e.target.checked && !wasDefault) {
              setDefaultConfirm(true);
            } else {
              setForm({ ...form, defaultAddress: e.target.checked });
            }
          }}
          className="w-4 h-4 accent-[var(--text-primary)]"
        />
        <span className="text-xs text-[var(--text-muted)]">기본 배송지로 설정</span>
      </label>

      <div className="min-h-[1.25rem]">
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-3 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors"
        >
          {saving ? "저장 중..." : editAddress ? "수정하기" : "저장하기"}
        </button>
      </div>

      {/* 기본 배송지 변경 확인 모달 */}
      {defaultConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--overlay-bg)]"
            onClick={() => setDefaultConfirm(false)}
          />
          <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] px-8 py-8 max-w-sm w-full mx-6 text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-8">
              기본 배송지를 변경하시겠습니까?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDefaultConfirm(false)}
                className="flex-1 py-3 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setForm({ ...form, defaultAddress: true });
                  setDefaultConfirm(false);
                }}
                className="flex-1 py-3 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors"
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

// ─── 메인 페이지 ───
export default function MypageAddressesPage() {
  const queryClient = useQueryClient();
  const { isLoggedIn } = useAuthStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MemberAddress | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: getMyAddresses,
    enabled: isLoggedIn(),
  });

  const MAX_ADDRESSES = 10;
  const addresses = data?.data ?? [];
  const isFull = addresses.length >= MAX_ADDRESSES;

  const refresh = () => {
    invalidateAddressRelated(queryClient);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMyAddress(deleteTarget.id);
      refresh();
    } catch {
      // ignore
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <Script
        src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="lazyOnload"
      />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg tracking-[0.1em] font-light text-[var(--text-primary)]">
          배송지 관리
          {!isLoading && (
            <span className="text-sm text-[var(--text-muted)] ml-2 font-normal">
              ({addresses.length}/{MAX_ADDRESSES})
            </span>
          )}
        </h2>
        {!showAddForm && (
          <button
            onClick={() => { setShowAddForm(true); setEditId(null); }}
            disabled={isFull}
            className={`px-4 py-2 text-xs tracking-wider border border-[var(--border-color)] transition-colors ${
              isFull
                ? "text-[var(--text-dim)] cursor-not-allowed"
                : "text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
            }`}
          >
            + 배송지 추가
          </button>
        )}
      </div>
      {isFull && !showAddForm && (
        <p className="text-xs text-[var(--text-dim)] mb-6">
          배송지는 최대 {MAX_ADDRESSES}개까지 등록 가능합니다.
        </p>
      )}
      {!isFull && <div className="mb-4" />}

      {/* 추가 폼 (상단) */}
      {showAddForm && (
        <div className="mb-8">
          <AddressForm
            editAddress={null}
            existingAddresses={addresses}
            onCancel={() => setShowAddForm(false)}
            onSaved={() => {
              setShowAddForm(false);
              refresh();
            }}
          />
        </div>
      )}

      {/* 로딩 */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-[var(--skeleton)] animate-pulse" />
          ))}
        </div>
      )}

      {/* 빈 상태 */}
      {!isLoading && addresses.length === 0 && !showAddForm && (
        <div className="text-center py-20 border border-dashed border-[var(--border-color)]">
          <p className="text-sm text-[var(--text-muted)] mb-6">
            등록된 배송지가 없습니다.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-5 py-2.5 text-xs tracking-wider border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors"
          >
            배송지 추가하기
          </button>
        </div>
      )}

      {/* 배송지 목록 */}
      {!isLoading && addresses.length > 0 && (
        <div className="space-y-4">
          {addresses.map((addr) =>
            editId === addr.id ? (
              <AddressForm
                key={addr.id}
                editAddress={addr}
                existingAddresses={addresses}
                onCancel={() => setEditId(null)}
                onSaved={() => {
                  setEditId(null);
                  refresh();
                }}
              />
            ) : (
              <div
                key={addr.id}
                className="border border-[var(--border-color)] p-5"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {addr.label || addr.recipient}
                    </span>
                    {addr.defaultAddress && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)] rounded">
                        기본 배송지
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setEditId(addr.id); setShowAddForm(false); }}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => setDeleteTarget(addr)}
                      className="text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">
                  {addr.recipient} · {addr.phone}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  [{addr.zipcode}] {addr.address} {addr.addressDetail}
                </p>
              </div>
            )
          )}
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--overlay-bg)]"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] px-8 py-8 max-w-sm w-full mx-6 text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              배송지를 삭제하시겠습니까?
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-8">
              {deleteTarget.recipient} - {deleteTarget.address}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
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
