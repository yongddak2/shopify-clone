"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ShieldCheck,
  UserMinus,
  Save,
  Star,
  Heart,
  RotateCcw,
  Ticket,
} from "lucide-react";
import {
  getAdminUserDetail,
  updateAdminUserRole,
  updateAdminUserMemo,
  withdrawAdminUser,
} from "@/lib/admin";
import { invalidateAdminMemberRelated } from "@/lib/queryInvalidator";
import { useAuthStore } from "@/stores/authStore";
import type { AdminMemberDetail } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "주문대기",
  PAID: "결제완료",
  PREPARING: "배송준비중",
  SHIPPED: "배송중",
  DELIVERED: "배송완료",
  CANCELLED: "주문취소",
  REFUNDED: "환불완료",
  RETURN_REQUESTED: "반품신청",
  EXCHANGE_REQUESTED: "교환신청",
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-[var(--badge-yellow-bg)] text-[var(--badge-yellow-text)]",
  PAID: "bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)]",
  PREPARING: "bg-[var(--badge-orange-bg)] text-[var(--badge-orange-text)]",
  SHIPPED: "bg-[var(--badge-purple-bg)] text-[var(--badge-purple-text)]",
  DELIVERED: "bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]",
  CANCELLED: "bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]",
  REFUNDED: "bg-[var(--badge-gray-bg)] text-[var(--badge-gray-text)]",
  RETURN_REQUESTED: "bg-orange-500/20 text-orange-300",
  EXCHANGE_REQUESTED: "bg-orange-500/20 text-orange-300",
};

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR");
}

function formatDate(s: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateTime(s: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const memberId = Number(id);
  const router = useRouter();
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const [memo, setMemo] = useState("");
  const [memoTouched, setMemoTouched] = useState(false);
  const [actionError, setActionError] = useState("");
  const [confirm, setConfirm] = useState<"role" | "withdraw" | null>(null);

  const { data, isLoading, error } = useQuery<AdminMemberDetail>({
    queryKey: ["admin", "user", memberId],
    queryFn: () => getAdminUserDetail(memberId),
    enabled: !Number.isNaN(memberId),
  });

  useEffect(() => {
    if (data && !memoTouched) {
      setMemo(data.adminMemo ?? "");
    }
  }, [data, memoTouched]);

  const isSelf = currentUser?.id === memberId;

  const memoMutation = useMutation({
    mutationFn: (next: string) => updateAdminUserMemo(memberId, next),
    onSuccess: () => {
      invalidateAdminMemberRelated(qc);
      setMemoTouched(false);
      setActionError("");
    },
    onError: () => setActionError("메모 저장에 실패했습니다."),
  });

  const roleMutation = useMutation({
    mutationFn: () => {
      if (!data) throw new Error("no data");
      const next = data.role === "ADMIN" ? "USER" : "ADMIN";
      return updateAdminUserRole(memberId, next);
    },
    onSuccess: () => {
      invalidateAdminMemberRelated(qc);
      setConfirm(null);
      setActionError("");
    },
    onError: () => {
      setActionError("권한 변경에 실패했습니다.");
      setConfirm(null);
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: () => withdrawAdminUser(memberId),
    onSuccess: () => {
      invalidateAdminMemberRelated(qc);
      setConfirm(null);
      router.push("/admin/users");
    },
    onError: () => {
      setActionError("탈퇴 처리에 실패했습니다.");
      setConfirm(null);
    },
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-8 w-40 bg-[var(--border-color)] animate-pulse rounded mb-8" />
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-[var(--border-color)] animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> 회원 목록
        </Link>
        <p className="text-sm text-[var(--text-muted)]">회원 정보를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="w-4 h-4" /> 회원 목록
        </Link>
        <h1 className="text-xl font-light tracking-[0.15em] text-[var(--text-primary)]">
          MEMBER #{data.id}
        </h1>
      </div>

      {actionError && (
        <p className="text-sm text-[var(--badge-red-text)]">{actionError}</p>
      )}

      {/* 기본 정보 + 액션 */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-6">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex-1 min-w-[280px]">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg text-[var(--text-primary)]">{data.name}</h2>
              <span
                className={`px-2 py-0.5 text-xs rounded ${
                  data.role === "ADMIN"
                    ? "bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]"
                    : "bg-[var(--badge-gray-bg)] text-[var(--badge-gray-text)]"
                }`}
              >
                {data.role}
              </span>
              {data.deletedAt && (
                <span className="px-2 py-0.5 text-xs rounded bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]">
                  탈퇴
                </span>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <Row label="이메일" value={data.email} />
              <Row label="전화번호" value={data.phone || "—"} />
              <Row label="생일" value={formatDate(data.birthDate)} />
              <Row label="가입경로" value={data.provider} />
              <Row label="가입일" value={formatDate(data.createdAt)} />
              <Row label="비밀번호 변경" value={formatDate(data.passwordChangedAt)} />
              <Row label="탈퇴일" value={formatDate(data.deletedAt)} />
            </dl>
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-col gap-2 min-w-[160px]">
            <button
              onClick={() => setConfirm("role")}
              disabled={isSelf || data.deletedAt !== null}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs tracking-wider border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title={isSelf ? "본인 계정은 변경 불가" : ""}
            >
              <ShieldCheck className="w-4 h-4" />
              {data.role === "ADMIN" ? "USER로 변경" : "ADMIN으로 변경"}
            </button>
            <button
              onClick={() => setConfirm("withdraw")}
              disabled={isSelf || data.deletedAt !== null}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs tracking-wider border border-[var(--badge-red-bg)] text-[var(--badge-red-text)] hover:bg-[var(--badge-red-bg)]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title={isSelf ? "본인 계정은 탈퇴 불가" : ""}
            >
              <UserMinus className="w-4 h-4" />
              강제 탈퇴
            </button>
          </div>
        </div>
      </div>

      {/* 주문 통계 카드 4개 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="총 주문 수" value={`${formatPrice(data.totalOrderCount)}건`} />
        <StatCard label="결제 완료 주문" value={`${formatPrice(data.paidOrderCount)}건`} />
        <StatCard label="총 결제액" value={`${formatPrice(data.totalPaidAmount)}원`} />
        <StatCard label="평균 객단가" value={`${formatPrice(data.averageOrderValue)}원`} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="마지막 주문" value={formatDate(data.lastOrderAt)} />
        <StatCard label="취소·환불" value={`${formatPrice(data.cancelledOrCancelRefundCount)}건`} />
        <StatCard label="반품/교환 신청" value={`${formatPrice(data.returnExchangeCount)}건`} />
        <StatCard
          label="평균 별점"
          value={data.reviewAverageRating != null ? data.reviewAverageRating.toFixed(2) : "—"}
        />
      </div>

      {/* 활동 카운트 미니 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <MiniCard
          icon={Ticket}
          color="#a85bd4"
          label="보유 쿠폰"
          value={data.couponTotalCount}
          sub={`사용가능 ${data.couponUsableCount} / 사용 ${data.couponUsedCount} / 만료 ${data.couponExpiredCount}`}
        />
        <MiniCard
          icon={Star}
          color="#d4a84b"
          label="작성 리뷰"
          value={data.reviewCount}
          sub={
            data.reviewAverageRating != null
              ? `평균 ${data.reviewAverageRating.toFixed(2)}점`
              : "—"
          }
        />
        <MiniCard
          icon={Heart}
          color="#d45b5b"
          label="찜한 상품"
          value={data.wishlistCount}
          sub=""
        />
      </div>

      {/* 관리자 메모 */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm tracking-[0.15em] text-[var(--text-primary)]">
            관리자 메모
          </h3>
          <span className="text-xs text-[var(--text-muted)]">{memo.length} / 500</span>
        </div>
        <textarea
          value={memo}
          onChange={(e) => {
            setMemo(e.target.value.slice(0, 500));
            setMemoTouched(true);
          }}
          placeholder="블랙리스트 / VIP / 상담 이력 등 운영 메모"
          className="w-full h-24 bg-transparent border border-[var(--border-color)] p-3 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)] resize-none"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={() => memoMutation.mutate(memo)}
            disabled={!memoTouched || memoMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs tracking-wider bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {memoMutation.isPending ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      {/* 최근 주문 + 배송지 2컬럼 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)]">
          <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
            <h3 className="text-sm tracking-[0.15em] text-[var(--text-primary)]">
              최근 주문 (최대 10건)
            </h3>
            <Link
              href="/admin/orders"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              주문관리 →
            </Link>
          </div>
          <div className="p-6">
            {data.recentOrders.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-6">
                주문 내역 없음
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-[var(--text-muted)] border-b border-[var(--border-color)]">
                    <th className="text-left py-2 font-normal">주문번호</th>
                    <th className="text-right py-2 font-normal">금액</th>
                    <th className="text-right py-2 font-normal">상태</th>
                    <th className="text-right py-2 font-normal">날짜</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((o) => (
                    <tr
                      key={o.orderId}
                      className="border-b border-[var(--border-color)] last:border-0"
                    >
                      <td className="py-3 text-[var(--text-primary)] font-mono text-xs">
                        {o.orderNumber}
                      </td>
                      <td className="py-3 text-right text-[var(--text-secondary)]">
                        {formatPrice(o.finalAmount)}원
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs rounded ${
                            STATUS_BADGE[o.status] ??
                            "bg-[var(--badge-gray-bg)] text-[var(--badge-gray-text)]"
                          }`}
                        >
                          {STATUS_LABELS[o.status] ?? o.status}
                        </span>
                      </td>
                      <td className="py-3 text-right text-[var(--text-muted)] text-xs">
                        {formatDate(o.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="bg-[var(--card-bg)] border border-[var(--border-color)]">
          <div className="px-6 py-4 border-b border-[var(--border-color)]">
            <h3 className="text-sm tracking-[0.15em] text-[var(--text-primary)]">
              등록 배송지 ({data.addresses.length}개)
            </h3>
          </div>
          <div className="p-6">
            {data.addresses.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-6">
                등록된 배송지 없음
              </p>
            ) : (
              <ul className="space-y-3">
                {data.addresses.map((addr) => (
                  <li
                    key={addr.id}
                    className="border border-[var(--border-color)] p-4 text-sm"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[var(--text-primary)]">{addr.label}</span>
                      {addr.defaultAddress && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)] rounded">
                          기본
                        </span>
                      )}
                    </div>
                    <p className="text-[var(--text-secondary)]">
                      {addr.recipient} · {addr.phone}
                    </p>
                    <p className="text-[var(--text-muted)] text-xs mt-1">
                      ({addr.zipcode}) {addr.address} {addr.addressDetail}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* 확인 모달 */}
      {confirm === "role" && (
        <ConfirmModal
          title="권한 변경"
          message={`${data.name} 회원의 권한을 ${
            data.role === "ADMIN" ? "USER" : "ADMIN"
          }으로 변경하시겠습니까?`}
          confirmText="변경"
          loading={roleMutation.isPending}
          onCancel={() => setConfirm(null)}
          onConfirm={() => roleMutation.mutate()}
        />
      )}
      {confirm === "withdraw" && (
        <ConfirmModal
          title="강제 탈퇴"
          message={`${data.name} (${data.email}) 회원을 탈퇴 처리하시겠습니까? 주문/리뷰 등 데이터는 보존되며, 회원의 로그인이 차단됩니다.`}
          confirmText="탈퇴 처리"
          danger
          loading={withdrawMutation.isPending}
          onCancel={() => setConfirm(null)}
          onConfirm={() => withdrawMutation.mutate()}
        />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-[var(--text-muted)]">{label}</dt>
      <dd className="text-[var(--text-secondary)]">{value}</dd>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-5">
      <p className="text-[11px] tracking-wider text-[var(--text-muted)] mb-2">{label}</p>
      <p className="text-xl font-light text-[var(--text-primary)] truncate">{value}</p>
    </div>
  );
}

function MiniCard({
  icon: Icon,
  color,
  label,
  value,
  sub,
}: {
  icon: typeof RotateCcw;
  color: string;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] tracking-wider text-[var(--text-muted)]">{label}</span>
        <Icon className="w-4 h-4" style={{ color }} strokeWidth={1.5} />
      </div>
      <p className="text-2xl font-light text-[var(--text-primary)]">{formatPrice(value)}</p>
      {sub && <p className="text-[11px] text-[var(--text-muted)] mt-1">{sub}</p>}
    </div>
  );
}

function ConfirmModal({
  title,
  message,
  confirmText,
  danger,
  loading,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmText: string;
  danger?: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-[var(--overlay-bg)]" onClick={onCancel} />
      <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] px-8 py-8 max-w-md w-full mx-6">
        <h3 className="text-base text-[var(--text-primary)] mb-3">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-8 leading-relaxed">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 text-sm tracking-wider border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-3 text-sm tracking-wider transition-colors disabled:opacity-50 ${
              danger
                ? "bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] hover:bg-[var(--badge-red-bg)]/70"
                : "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)]"
            }`}
          >
            {loading ? "처리 중..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
