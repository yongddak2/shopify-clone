"use client";

import { useState, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminRequests,
  approveRequest,
  rejectRequest,
  completeRequest,
} from "@/lib/admin";
import { invalidateOrderRelated } from "@/lib/queryInvalidator";
import type { ReturnExchangeRequest, RequestStatus } from "@/types";

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("ko-KR");
}

const STATUS_LABELS: Record<RequestStatus, string> = {
  REQUESTED: "신청완료",
  APPROVED: "승인",
  REJECTED: "거절",
  COMPLETED: "처리완료",
};

const STATUS_BADGE: Record<RequestStatus, string> = {
  REQUESTED: "bg-[var(--badge-yellow-bg)] text-[var(--badge-yellow-text)]",
  APPROVED: "bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)]",
  REJECTED: "bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]",
  COMPLETED: "bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]",
};

const STATUS_TABS: { key: "ALL" | RequestStatus; label: string }[] = [
  { key: "ALL", label: "전체" },
  { key: "REQUESTED", label: "신청완료" },
  { key: "APPROVED", label: "승인" },
  { key: "REJECTED", label: "거절" },
  { key: "COMPLETED", label: "처리완료" },
];

type ActionType = "approve" | "reject" | "complete";

export default function AdminRequestsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"ALL" | RequestStatus>("ALL");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [actionTarget, setActionTarget] = useState<{
    request: ReturnExchangeRequest;
    action: ActionType;
  } | null>(null);
  const [memo, setMemo] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "requests", page],
    queryFn: () => getAdminRequests(page),
    staleTime: 0,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, memo }: { id: number; memo: string }) =>
      approveRequest(id, memo || undefined),
    onSuccess: () => {
      invalidateOrderRelated(queryClient);
      closeModal();
    },
    onError: () => alert("승인 처리에 실패했습니다."),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, memo }: { id: number; memo: string }) =>
      rejectRequest(id, memo),
    onSuccess: () => {
      invalidateOrderRelated(queryClient);
      closeModal();
    },
    onError: () => alert("거절 처리에 실패했습니다."),
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => completeRequest(id),
    onSuccess: () => {
      invalidateOrderRelated(queryClient);
      // 재고도 변동되므로 상품 캐시도 갱신
      queryClient.invalidateQueries({ queryKey: ["product"] });
      closeModal();
    },
    onError: () => alert("처리 완료에 실패했습니다."),
  });

  const closeModal = () => {
    setActionTarget(null);
    setMemo("");
  };

  const handleConfirm = () => {
    if (!actionTarget) return;
    const { request, action } = actionTarget;
    if (action === "approve") {
      approveMutation.mutate({ id: request.id, memo });
    } else if (action === "reject") {
      if (!memo.trim()) {
        alert("거절 사유는 필수입니다.");
        return;
      }
      rejectMutation.mutate({ id: request.id, memo: memo.trim() });
    } else if (action === "complete") {
      completeMutation.mutate(request.id);
    }
  };

  const allRequests = data?.data?.content ?? [];
  const filtered =
    statusFilter === "ALL"
      ? allRequests
      : allRequests.filter((r) => r.status === statusFilter);
  const totalPages = data?.data?.totalPages ?? 0;

  const isPending =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    completeMutation.isPending;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-light tracking-wider text-[var(--text-primary)] mb-6">
        반품/교환 관리
      </h1>

      {/* 상태 탭 */}
      <div className="flex gap-1 mb-6 border-b border-[var(--border-color)]">
        {STATUS_TABS.map((tab) => {
          const active = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-3 text-xs tracking-wider transition-colors ${
                active
                  ? "text-[var(--text-primary)] border-b-2 border-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-[var(--skeleton)] animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <p className="text-center py-20 text-sm text-[var(--text-muted)]">
          요청 내역이 없습니다.
        </p>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="overflow-x-auto border border-[var(--border-color)]">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-[var(--card-bg)] text-[var(--text-muted)] text-xs">
              <tr>
                <th className="px-4 py-3 text-left">주문번호</th>
                <th className="px-4 py-3 text-left">유형</th>
                <th className="px-4 py-3 text-left">사유</th>
                <th className="px-4 py-3 text-left">희망옵션</th>
                <th className="px-4 py-3 text-left">상태</th>
                <th className="px-4 py-3 text-left">신청일</th>
                <th className="px-4 py-3 text-left">관리</th>
              </tr>
            </thead>
            <tbody className="text-[var(--text-secondary)]">
              {filtered.map((req) => {
                const isExpanded = expandedId === req.id;
                return (
                  <Fragment key={req.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : req.id)}
                      className="border-t border-[var(--border-color)] cursor-pointer hover:bg-[var(--card-bg)]"
                    >
                      <td className="px-4 py-3">{req.orderNumber}</td>
                      <td className="px-4 py-3">
                        {req.type === "RETURN" ? "반품" : "교환"}
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate">
                        {req.reasonDetailLabel}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {req.type === "EXCHANGE" && req.desiredOptionValue
                          ? req.desiredOptionValue
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs rounded ${
                            STATUS_BADGE[req.status]
                          }`}
                        >
                          {STATUS_LABELS[req.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {formatDate(req.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="flex gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {req.status === "REQUESTED" && (
                            <>
                              <button
                                onClick={() =>
                                  setActionTarget({
                                    request: req,
                                    action: "approve",
                                  })
                                }
                                className="px-2 py-1 text-xs border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
                              >
                                승인
                              </button>
                              <button
                                onClick={() =>
                                  setActionTarget({
                                    request: req,
                                    action: "reject",
                                  })
                                }
                                className="px-2 py-1 text-xs border border-[var(--border-color)] text-red-400 hover:border-red-400"
                              >
                                거절
                              </button>
                            </>
                          )}
                          {req.status === "APPROVED" && (
                            <button
                              onClick={() =>
                                setActionTarget({
                                  request: req,
                                  action: "complete",
                                })
                              }
                              className="px-2 py-1 text-xs border border-[var(--border-color)] text-green-400 hover:border-green-400"
                            >
                              처리완료
                            </button>
                          )}
                          {(req.status === "REJECTED" ||
                            req.status === "COMPLETED") && (
                            <span className="text-xs text-[var(--text-dim)]">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-[var(--section-bg)]">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="space-y-3 text-xs">
                            <div>
                              <span className="text-[var(--text-muted)]">
                                상세 사유:{" "}
                              </span>
                              <span className="text-[var(--text-secondary)]">
                                {req.reasonDetailLabel} ({req.reasonCategory ===
                                "CHANGE_OF_MIND"
                                  ? "단순 변심"
                                  : "상품/배송 문제"})
                              </span>
                            </div>
                            <div>
                              <span className="text-[var(--text-muted)]">
                                내용:{" "}
                              </span>
                              <span className="text-[var(--text-secondary)] whitespace-pre-wrap">
                                {req.reasonText}
                              </span>
                            </div>
                            {req.type === "EXCHANGE" && req.desiredOptionValue && (
                              <div>
                                <span className="text-[var(--text-muted)]">
                                  희망 교환 옵션:{" "}
                                </span>
                                <span className="font-bold text-[var(--text-primary)]">
                                  {req.desiredOptionValue}
                                </span>
                              </div>
                            )}
                            {req.imageUrls && req.imageUrls.length > 0 && (
                              <div>
                                <span className="text-[var(--text-muted)] block mb-2">
                                  첨부 이미지:
                                </span>
                                <div className="flex gap-2 flex-wrap">
                                  {req.imageUrls.map((url, idx) => (
                                    <a
                                      key={idx}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <img
                                        src={url}
                                        alt={`첨부 ${idx + 1}`}
                                        className="w-20 h-20 object-cover border border-[var(--border-color)]"
                                      />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                            {req.adminMemo && (
                              <div>
                                <span className="text-[var(--text-muted)]">
                                  관리자 메모:{" "}
                                </span>
                                <span className="text-[var(--text-secondary)]">
                                  {req.adminMemo}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-8 h-8 text-xs ${
                page === i
                  ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]"
                  : "border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* 액션 모달 */}
      {actionTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--overlay-bg)]"
            onClick={closeModal}
          />
          <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] px-8 py-8 max-w-md w-full mx-6">
            <h3 className="text-base text-[var(--text-primary)] mb-4">
              {actionTarget.action === "approve" && "요청 승인"}
              {actionTarget.action === "reject" && "요청 거절"}
              {actionTarget.action === "complete" && "처리 완료"}
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              주문번호: {actionTarget.request.orderNumber}
            </p>

            {actionTarget.action !== "complete" && (
              <div className="mb-6">
                <label className="block text-xs text-[var(--text-muted)] mb-2">
                  관리자 메모{" "}
                  {actionTarget.action === "reject" ? "(필수)" : "(선택)"}
                </label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  rows={4}
                  placeholder={
                    actionTarget.action === "reject"
                      ? "거절 사유를 입력해주세요."
                      : "메모를 입력해주세요. (선택)"
                  }
                  className="w-full p-3 bg-[var(--background)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--text-muted)]"
                />
              </div>
            )}

            {actionTarget.action === "complete" && (
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                처리 완료 시 주문 상품의 재고가 복구됩니다. 진행하시겠습니까?
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 py-3 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                취소
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1 py-3 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] disabled:opacity-50"
              >
                {isPending ? "처리 중..." : "확인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
