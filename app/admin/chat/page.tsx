"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import {
  PaperAirplaneIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

interface Message {
  _id: string;
  sender: "customer" | "admin";
  senderId?: string;
  senderName: string;
  message: string;
  createdAt?: string;
  timestamp?: string;
}

interface Conversation {
  _id: string;
  customer?: {
    _id: string;
    name?: string;
    email?: string;
    avatar?: string;
  } | null;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  status: "active" | "pending" | "closed";
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  totalOrders?: number;
  totalSpent?: number;
}

type TabFilter = "active" | "pending" | "closed";

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatMessageTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function AdminChatPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [tab, setTab] = useState<TabFilter>("active");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<ReturnType<typeof connectSocket> | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;
    socket.emit("join-admin");

    fetch("/api/admin/chat")
      .then((res) => res.json())
      .then((json) => {
        const list = json?.data ?? json?.conversations ?? json;
        setConversations(Array.isArray(list) ? list : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    socket.on("new-conversation", (conv: Conversation) => {
      setConversations((prev) => {
        if (prev.find((c) => c._id === conv._id)) return prev;
        return [conv, ...prev];
      });
    });

    socket.on("conversation-updated", (updated: Conversation & { conversationId?: string }) => {
      const id = updated._id ?? updated.conversationId;
      if (!id) return;
      setConversations((prev) =>
        prev.map((c) => (c._id === id ? { ...c, ...updated, _id: c._id, lastMessageAt: updated.lastMessageAt ?? c.lastMessageAt } : c)),
      );
    });

    socket.on("new-message", (data: { conversationId: string; message: Message & { timestamp?: string } }) => {
      const createdAt = data.message.timestamp ?? data.message.createdAt ?? new Date().toISOString();
      const id = data.message._id != null ? String(data.message._id) : `m-${Date.now()}`;
      const normalizedMessage: Message = {
        ...data.message,
        _id: id,
        createdAt,
      };

      setSelectedId((currentId) => {
        if (currentId === data.conversationId) {
          setMessages((prev) => {
            if (prev.find((m) => m._id === normalizedMessage._id)) return prev;
            return [...prev, normalizedMessage];
          });
        }
        return currentId;
      });

      setConversations((prev) =>
        prev.map((c) =>
          c._id === data.conversationId
            ? {
                ...c,
                lastMessage: data.message.message,
                lastMessageAt: createdAt,
                unreadCount:
                  data.message.sender === "customer"
                    ? (c.unreadCount || 0) + 1
                    : c.unreadCount,
              }
            : c,
        ),
      );
    });

    return () => {
      disconnectSocket();
      socketRef.current = null;
    };
  }, []);

  const selectConversation = useCallback(
    async (id: string) => {
      setSelectedId(id);
      setMessagesLoading(true);
      setMessages([]);

      try {
        const res = await fetch(`/api/admin/chat/${id}`);
        const json = await res.json();
        const conv = json?.data;
        const list = Array.isArray(conv?.messages) ? conv.messages : [];
        setMessages(list);
      } catch {
        /* failed to load */
      } finally {
        setMessagesLoading(false);
      }

      socketRef.current?.emit("join-conversation", id);
      socketRef.current?.emit("mark-read", id);

      setConversations((prev) =>
        prev.map((c) => (c._id === id ? { ...c, unreadCount: 0 } : c)),
      );
    },
    [],
  );

  const sendMessage = useCallback(() => {
    if (!input.trim() || !selectedId || !session?.user) return;

    const user = session.user as { id?: string; name?: string };
    socketRef.current?.emit("send-message", {
      conversationId: selectedId,
      message: input.trim(),
      sender: "admin",
      senderId: user.id,
      senderName: user.name || "Admin",
    });

    setInput("");
  }, [input, selectedId, session]);

  const closeConversation = useCallback(() => {
    if (!selectedId) return;
    socketRef.current?.emit("close-conversation", selectedId);
    setConversations((prev) =>
      prev.map((c) =>
        c._id === selectedId ? { ...c, status: "closed" } : c,
      ),
    );
  }, [selectedId]);

  const openDeleteModal = useCallback((id: string) => {
    setDeleteTargetId(id);
    setDeleteError(null);
    setDeleteModalOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    if (deleteLoading) return;
    setDeleteModalOpen(false);
    setDeleteTargetId(null);
    setDeleteError(null);
  }, [deleteLoading]);

  const confirmDeleteConversation = useCallback(async () => {
    const id = deleteTargetId;
    if (!id) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/chat/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Delete failed");
      setConversations((prev) => prev.filter((c) => c._id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setMessages([]);
      }
      closeDeleteModal();
    } catch (err) {
      console.error("delete conversation:", err);
      setDeleteError("চ্যাট ডিলিট করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteTargetId, selectedId, closeDeleteModal]);

  const list = Array.isArray(conversations) ? conversations : [];
  const filtered = list.filter((c) => c.status === tab);
  const selected = list.find((c) => c._id === selectedId) || null;

  const tabs: { key: TabFilter; label: string }[] = [
    { key: "active", label: "Active" },
    { key: "pending", label: "Pending" },
    { key: "closed", label: "Closed" },
  ];

  const tabCounts = {
    active: list.filter((c) => c.status === "active").length,
    pending: list.filter((c) => c.status === "pending").length,
    closed: list.filter((c) => c.status === "closed").length,
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6 overflow-hidden">
      {/* LEFT — Chat List Panel */}
      <div className="w-80 shrink-0 flex flex-col bg-white dark:bg-[#111111] border-r border-gray-200 dark:border-[#1a1a1a]">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            Live Chat
          </h2>
          <div className="flex gap-1 bg-gray-100 dark:bg-[#0a0a0a] rounded-xl p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${
                  tab === t.key
                    ? "bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {t.label}
                {tabCounts[t.key] > 0 && (
                  <span className="ml-1 text-[10px] bg-accent-teal/10 text-accent-teal px-1.5 py-0.5 rounded-full">
                    {tabCounts[t.key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner size="lg" className="text-accent-teal" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
              <ChatBubbleLeftRightIcon className="w-10 h-10 mb-2" />
              <p className="text-sm">No conversations</p>
            </div>
          ) : (
            filtered.map((conv) => (
              <div
                key={conv._id}
                className={`w-full flex items-start gap-2 px-4 py-3 transition hover:bg-gray-50 dark:hover:bg-[#0d0d0d] ${
                  selectedId === conv._id
                    ? "bg-gray-50 dark:bg-[#0d0d0d] border-l-2 border-accent-teal"
                    : "border-l-2 border-transparent"
                }`}
              >
                <button
                  type="button"
                  onClick={() => selectConversation(conv._id)}
                  className="flex-1 flex items-start gap-3 min-w-0 text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {conv.customer?.avatar ? (
                      <img
                        src={conv.customer.avatar}
                        alt={conv.customer?.name ?? conv.customerName ?? "User"}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(conv.customer?.name ?? conv.customerName ?? "U")
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {conv.customer?.name ?? conv.customerName ?? "Unknown"}
                      </p>
                      {conv.lastMessageAt && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                          {formatTime(conv.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {conv.lastMessage || "No messages yet"}
                      </p>
                      {(conv.unreadCount ?? 0) > 0 && (
                        <span className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-accent-teal text-white text-[10px] font-bold">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteModal(conv._id);
                  }}
                  className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition"
                  title="Delete chat"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CENTER — Chat Window */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-[#0a0a0a] min-w-0">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <ChatBubbleLeftRightIcon className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">Select a conversation</p>
            <p className="text-sm mt-1">
              Choose a chat from the left to start responding
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-[#1a1a1a]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-sm font-bold">
                  {getInitials(selected.customer?.name ?? selected.customerName ?? "U")}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">
                    {selected.customer?.name ?? selected.customerName ?? "Unknown"}
                  </p>
                  {(selected.customerPhone || selected.customer?.email) && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {selected.customerPhone ?? selected.customer?.email}
                    </p>
                  )}
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                      selected.status === "active"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : selected.status === "pending"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {selected.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selected.status !== "closed" && (
                  <button
                    onClick={closeConversation}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    <XMarkIcon className="w-3.5 h-3.5" />
                    Close Chat
                  </button>
                )}
                <button
                  onClick={() => openDeleteModal(selected._id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                  title="Delete chat"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Spinner size="lg" className="text-accent-teal" />
                </div>
              ) : !Array.isArray(messages) || messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
                  <p className="text-sm">No messages yet</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] ${
                        msg.sender === "admin"
                          ? "bg-accent-teal text-white rounded-2xl rounded-tr-sm"
                          : "bg-gray-200 dark:bg-[#1a1a1a] text-gray-900 dark:text-white rounded-2xl rounded-tl-sm"
                      } px-4 py-2.5`}
                    >
                      <p className={`text-[10px] font-medium mb-1 ${
                        msg.sender === "admin"
                          ? "text-white/70"
                          : "text-gray-500 dark:text-gray-400"
                      }`}>
                        {msg.senderName}
                      </p>
                      <p className="text-sm leading-relaxed">{msg.message}</p>
                      <p
                        className={`text-[10px] mt-1 ${
                          msg.sender === "admin"
                            ? "text-white/50"
                            : "text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        {formatMessageTime(msg.createdAt ?? msg.timestamp ?? "")}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {selected.status !== "closed" && (
              <div className="px-5 py-3 bg-white dark:bg-[#111111] border-t border-gray-200 dark:border-[#1a1a1a]">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-accent-teal transition"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="p-2.5 bg-accent-teal text-white rounded-xl hover:bg-accent-teal/90 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* RIGHT — Customer Info Panel */}
      {selected && (
        <div className="hidden lg:flex w-72 shrink-0 flex-col bg-white dark:bg-[#111111] border-l border-gray-200 dark:border-[#1a1a1a]">
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col items-center pt-8 pb-6 px-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-2xl font-bold mb-4">
                {selected.customer?.avatar ? (
                  <img
                    src={selected.customer.avatar}
                    alt={selected.customer.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(selected.customer?.name || "U")
                )}
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white text-center">
                {selected.customer?.name || "Unknown"}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {selected.customer?.email || "No email"}
              </p>
              <a
                href={`/admin/users?id=${selected.customer?._id}`}
                className="mt-3 text-xs font-medium text-accent-teal hover:underline transition"
              >
                View Profile
              </a>
            </div>

            <div className="px-6 pb-6">
              <div className="border-t border-gray-200 dark:border-[#1a1a1a] pt-5">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                  Quick Stats
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {selected.totalOrders ?? "—"}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                      Total Orders
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {selected.totalSpent != null
                        ? `৳${selected.totalSpent.toLocaleString()}`
                        : "—"}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                      Total Spent
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-chat-modal-title"
          onClick={(e) => e.target === e.currentTarget && closeDeleteModal()}
        >
          <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] w-full max-w-sm p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 id="delete-chat-modal-title" className="text-lg font-bold text-gray-900 dark:text-white mb-2 font-bengali">
              {deleteError ? "ত্রুটি" : "চ্যাট ডিলিট করুন"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-bengali mb-6">
              {deleteError ?? "এই চ্যাট সম্পূর্ণ ডিলিট করা হবে। চালিয়ে যেতে চান?"}
            </p>
            <div className="flex gap-2">
              {deleteError ? (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={closeDeleteModal}
                  className="flex-1 font-bengali"
                >
                  ঠিক আছে
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={closeDeleteModal}
                    disabled={deleteLoading}
                    className="flex-1 font-bengali"
                  >
                    বাতিল
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={confirmDeleteConversation}
                    disabled={deleteLoading}
                    className="flex-1 font-bengali bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white"
                  >
                    {deleteLoading ? "ডিলিট হচ্ছে..." : "ডিলিট করুন"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
