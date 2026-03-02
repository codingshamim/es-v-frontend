"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";
import {
  StarIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface Review {
  _id: string;
  user: {
    name: string;
    email: string;
  };
  product: {
    _id: string;
    name: string;
  };
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  adminReply?: {
    text: string;
    repliedAt: string;
    repliedBy?: string;
  };
  createdAt: string;
}

interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  totalPages: number;
  stats: {
    averageRating: number;
    totalReviews: number;
    positiveReviews: number;
    negativeReviews: number;
  };
}

function StarRating({ rating, size = "w-4 h-4" }: { rating: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${size} ${star <= rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

const RATING_FILTERS = [
  { label: "All", value: "" },
  { label: "5 Stars", value: "5" },
  { label: "4 Stars", value: "4" },
  { label: "3 Stars", value: "3" },
  { label: "2 Stars", value: "2" },
  { label: "1 Star", value: "1" },
];

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    positiveReviews: 0,
    negativeReviews: 0,
  });
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [replySaving, setReplySaving] = useState(false);

  const limit = 20;

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (ratingFilter) params.set("rating", ratingFilter);

      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const list = Array.isArray(data.reviews) ? data.reviews : Array.isArray(data.data) ? data.data : [];
      const pagination = data.pagination || {};
      setReviews(list);
      setTotal(data.total ?? pagination.total ?? 0);
      setTotalPages(data.totalPages ?? pagination.totalPages ?? 1);
      if (data.stats) {
        setStats({
          averageRating: Number(data.stats.averageRating ?? data.stats.avgRating) || 0,
          totalReviews: Number(data.stats.totalReviews) || 0,
          positiveReviews: Number(data.stats.positiveReviews) || 0,
          negativeReviews: Number(data.stats.negativeReviews) || 0,
        });
      }
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [page, ratingFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    setPage(1);
  }, [ratingFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/reviews/${deleteTarget._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchReviews();
    } catch {
      /* silently fail */
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const openReply = (review: Review) => {
    setReplyTargetId(review._id);
    setReplyDraft(review.adminReply?.text ?? "");
  };

  const closeReply = () => {
    setReplyTargetId(null);
    setReplyDraft("");
  };

  const handleSaveReply = async () => {
    if (!replyTargetId) return;
    setReplySaving(true);
    try {
      const res = await fetch(`/api/admin/reviews/${replyTargetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminReply: replyDraft }),
      });
      if (!res.ok) throw new Error("Failed to save reply");
      const json = await res.json();
      if (json.data) {
        setReviews((prev) =>
          prev.map((r) => (r._id === replyTargetId ? { ...r, adminReply: json.data.adminReply } : r)),
        );
      }
      closeReply();
    } catch {
      /* silently fail */
    } finally {
      setReplySaving(false);
    }
  };

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Reviews
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {total} total reviews
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Average Rating</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {(stats.averageRating ?? 0).toFixed(1)}
              </p>
              <div className="mt-1">
                <StarRating rating={Math.round(stats.averageRating ?? 0)} size="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20">
              <StarIcon className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {(stats.totalReviews ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Positive Reviews</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {(stats.positiveReviews ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-emerald-500 mt-1">4-5 stars</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
              <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Negative Reviews</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {(stats.negativeReviews ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-red-500 mt-1">1-3 stars</p>
            </div>
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Filter */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/10 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">
            Filter by rating:
          </span>
          {RATING_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setRatingFilter(filter.value)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                ratingFilter === filter.value
                  ? "bg-white text-black dark:bg-white dark:text-black"
                  : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" className="text-white dark:text-white" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No reviews found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/10 p-5 hover:border-gray-300 dark:hover:border-white/20 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/20 flex items-center justify-center shrink-0">
                  <span className="text-gray-700 dark:text-white font-semibold text-sm">
                    {review.user?.name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {review.user?.name || "Unknown User"}
                    </h3>
                    <StarRating rating={review.rating} />
                    {review.isVerifiedPurchase && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">
                        Verified Purchase
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/admin/products/${review.product?._id}/edit`}
                    className="inline-block text-sm text-white dark:text-white hover:opacity-80 transition-colors mt-1"
                  >
                    {review.product?.name || "Unknown Product"}
                  </Link>

                  {review.comment && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                      {review.comment}
                    </p>
                  )}

                  {review.adminReply?.text && (
                    <div className="mt-3 pl-3 border-l-2 border-white/30 dark:border-white/20 bg-white/5 dark:bg-white/5 rounded-r-lg py-2 pr-3">
                      <p className="text-xs font-semibold text-gray-700 dark:text-white mb-1">
                        Admin reply
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {review.adminReply.text}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                        {review.adminReply.repliedAt
                          ? formatDate(review.adminReply.repliedAt)
                          : ""}
                      </p>
                    </div>
                  )}

                  {replyTargetId === review._id ? (
                    <div className="mt-3 space-y-2">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        Admin reply
                      </label>
                      <textarea
                        value={replyDraft}
                        onChange={(e) => setReplyDraft(e.target.value)}
                        placeholder="Write your reply to this review..."
                        rows={3}
                        className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-white/50 dark:focus:ring-white/50 focus:border-transparent resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSaveReply}
                          disabled={replySaving}
                          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-black hover:bg-gray-100 dark:bg-white dark:text-black dark:hover:bg-gray-200 border border-gray-200 dark:border-white/20 disabled:opacity-50 transition-colors"
                        >
                          {replySaving ? "Saving..." : "Save reply"}
                        </button>
                        <button
                          type="button"
                          onClick={closeReply}
                          disabled={replySaving}
                          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/10 disabled:opacity-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openReply(review)}
                      className="mt-2 text-xs font-medium text-gray-700 dark:text-white hover:text-white dark:text-white dark:hover:opacity-80 transition-colors"
                    >
                      {review.adminReply?.text ? "Edit admin reply" : "Add admin reply"}
                    </button>
                  )}

                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {formatDate(review.createdAt)}
                  </p>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => setDeleteTarget(review)}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                  title="Delete review"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (p) =>
                p === 1 ||
                p === totalPages ||
                (p >= page - 1 && p <= page + 1),
            )
            .reduce<(number | string)[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              typeof p === "string" ? (
                <span
                  key={`ellipsis-${i}`}
                  className="px-2 text-gray-400 dark:text-gray-500"
                >
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                    page === p
                      ? "bg-white text-black dark:bg-white dark:text-black"
                      : "bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  {p}
                </button>
              ),
            )}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/10 p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Review
              </h3>
              <button
                onClick={() => setDeleteTarget(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Are you sure you want to delete this review by{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {deleteTarget.user?.name || "Unknown User"}
              </span>
              ?
            </p>
            <div className="flex items-center gap-2 mb-4">
              <StarRating rating={deleteTarget.rating} size="w-3.5 h-3.5" />
              <span className="text-xs text-gray-500">
                on {deleteTarget.product?.name || "Unknown Product"}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {deleting ? (
                  <Spinner size="sm" className="text-white" />
                ) : (
                  <TrashIcon className="w-4 h-4" />
                )}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
