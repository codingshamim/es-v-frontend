"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { connectSocket, disconnectSocket } from "@/lib/socket";

interface ChatMessage {
  _id: string;
  sender: "customer" | "admin";
  senderName: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface Conversation {
  _id: string;
  status: "active" | "pending" | "closed";
  messages: ChatMessage[];
}

function normalizeMessages(data: { messages?: ChatMessage[]; message?: ChatMessage }): ChatMessage[] {
  if (Array.isArray(data.messages) && data.messages.length > 0) {
    return data.messages.map((m, i) => ({
      _id: (m as { _id?: string })._id ?? `msg-${i}`,
      sender: m.sender,
      senderName: m.senderName ?? (m.sender === "admin" ? "Support" : "You"),
      message: m.message,
      timestamp: typeof m.timestamp === "string" ? m.timestamp : (m.timestamp as Date)?.toISO?.() ?? new Date().toISOString(),
      read: m.read ?? false,
    }));
  }
  if (data.message) {
    const m = data.message;
    return [{
      _id: (m as { _id?: string })._id ?? "msg-0",
      sender: m.sender,
      senderName: m.senderName ?? "You",
      message: m.message,
      timestamp: typeof m.timestamp === "string" ? m.timestamp : (m.timestamp as Date)?.toISO?.() ?? new Date().toISOString(),
      read: m.read ?? false,
    }];
  }
  return [];
}

export default function LiveChatWidget() {
  const { data: session, status: authStatus } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const [startName, setStartName] = useState("");
  const [startPhone, setStartPhone] = useState("");
  const [startMessage, setStartMessage] = useState("");
  const [startSubmitting, setStartSubmitting] = useState(false);
  const [startError, setStartError] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<ReturnType<typeof connectSocket> | null>(null);

  const isLoggedIn = authStatus === "authenticated" && !!session?.user;
  const showStartForm = !isLoggedIn && !conversationId;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!isOpen) return;

    const socket = connectSocket();
    socketRef.current = socket;
    setSocketConnected(socket.connected);

    socket.on("connect", () => {
      setSocketConnected(true);
      setStartError("");
    });
    socket.on("connect_error", () => setSocketConnected(false));

    if (isLoggedIn) {
      setIsConnecting(true);
      fetch("/api/chat/my-conversation")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            const conv: Conversation = data.data;
            setConversationId(conv._id);
            setMessages(normalizeMessages({ messages: conv.messages ?? [] }));
            setIsClosed(conv.status === "closed");
            socket.emit("join-conversation", conv._id);
          }
        })
        .catch(() => {})
        .finally(() => setIsConnecting(false));
    }

    socket.on("new-message", (payload: { message?: ChatMessage; conversationId?: string } | ChatMessage) => {
      const raw = "message" in payload ? payload.message : payload;
      if (!raw || typeof (raw as ChatMessage).message !== "string") return;
      if ((raw as ChatMessage).sender === "admin") {
        setHasUnread((prev) => (!document.hasFocus() ? true : prev));
      }
      const msg = raw as ChatMessage;
      const normalized: ChatMessage = {
        _id: msg._id != null ? String(msg._id) : `m-${Date.now()}`,
        sender: msg.sender,
        senderName: msg.senderName ?? (msg.sender === "admin" ? "Support" : "You"),
        message: msg.message,
        timestamp: typeof msg.timestamp === "string" ? msg.timestamp : (msg.timestamp as Date)?.toISO?.() ?? new Date().toISOString(),
        read: msg.read ?? false,
      };
      setMessages((prev) => {
        if (prev.some((m) => m._id === normalized._id)) return prev;
        return [...prev, normalized];
      });
    });

    socket.on("conversation-started", (data: { conversationId: string; messages?: ChatMessage[]; message?: ChatMessage }) => {
      setConversationId(data.conversationId);
      socket.emit("join-conversation", data.conversationId);
      setMessages(normalizeMessages(data));
      setStartError("");
      setStartSubmitting(false);
    });

    socket.on("conversation-closed", () => setIsClosed(true));

    socket.on("error", (err: { message?: string }) => {
      setStartError(err?.message ?? "Something went wrong.");
      setStartSubmitting(false);
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("new-message");
      socket.off("conversation-started");
      socket.off("conversation-closed");
      socket.off("error");
      disconnectSocket();
      socketRef.current = null;
      setSocketConnected(false);
    };
  }, [isOpen, isLoggedIn]);

  const handleStartMessage = () => {
    const name = startName.trim();
    const phone = startPhone.trim();
    const msg = startMessage.trim();
    if (!name || !phone || !msg) {
      setStartError("নাম, ফোন নম্বর এবং মেসেজ পূরণ করুন।");
      return;
    }
    if (!socketRef.current || !socketConnected) return;
    setStartError("");
    setStartSubmitting(true);
    socketRef.current.emit("start-conversation", {
      customerName: name,
      customerPhone: phone,
      message: msg,
    });
    setStartMessage("");
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || !socketRef.current || !socketConnected || isClosed) return;

    if (!conversationId) {
      if (isLoggedIn) {
        const user = session?.user as { id?: string; name?: string; email?: string };
        socketRef.current.emit("start-conversation", {
          customerId: user?.id,
          customerName: user?.name ?? "Customer",
          customerEmail: user?.email,
          message: text,
        });
      }
    } else {
      socketRef.current.emit("send-message", {
        conversationId,
        message: text,
      });
    }

    setInput("");
    inputRef.current?.focus();
  };

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) setHasUnread(false);
  };

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <>
      <div
        className={`fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-white dark:bg-[#111111] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#1a1a1a] flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${
          isOpen
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-4 pointer-events-none"
        }`}
        role="dialog"
        aria-label="Live chat"
        aria-hidden={!isOpen}
      >
        <div className="bg-accent-teal p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">ES FITT Support</h4>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" aria-hidden="true" />
                <span className="text-white/80 text-xs">Online</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleToggle}
            className="text-white/80 hover:text-white transition-colors p-1"
            aria-label="Close chat"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {showStartForm ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!socketConnected && (
              <p className="text-sm text-amber-600 dark:text-amber-400 font-bengali">
                চ্যাট কানেক্ট হচ্ছে... যদি লম্বা সময় ধরে দেখেন তবে পেজ রিফ্রেশ করুন অথবা পরে আবার চেষ্টা করুন।
              </p>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400 font-bengali">
              সাপোর্টের সাথে চ্যাট শুরু করতে নিচের তথ্য দিন এবং মেসেজ লিখুন।
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 font-bengali">নাম</label>
              <input
                type="text"
                value={startName}
                onChange={(e) => setStartName(e.target.value)}
                placeholder="আপনার নাম"
                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl border-none outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-accent-teal/50 font-bengali"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 font-bengali">ফোন নম্বর</label>
              <input
                type="tel"
                value={startPhone}
                onChange={(e) => setStartPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl border-none outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-accent-teal/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 font-bengali">মেসেজ</label>
              <textarea
                value={startMessage}
                onChange={(e) => setStartMessage(e.target.value)}
                placeholder="আপনার মেসেজ লিখুন..."
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl border-none outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-accent-teal/50 resize-none font-bengali"
              />
            </div>
            {startError && (
              <p className="text-xs text-red-500 font-bengali">{startError}</p>
            )}
            <button
              type="button"
              onClick={handleStartMessage}
              disabled={!socketConnected || startSubmitting || !startName.trim() || !startPhone.trim() || !startMessage.trim()}
              className="w-full py-3 bg-accent-teal text-white text-sm font-semibold rounded-xl hover:bg-accent-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bengali"
            >
              {startSubmitting ? "শুরু হচ্ছে..." : socketConnected ? "মেসেজ স্টার্ট করুন" : "কানেক্ট হচ্ছে..."}
            </button>
            <p className="text-[10px] text-gray-400 text-center">
              লগইন করলে আপনার অ্যাকাউন্টের সাথে চ্যাট লিংক হবে।
            </p>
          </div>
        ) : (
          <>
            {isLoggedIn && isConnecting && (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-accent-teal border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!showStartForm && !isConnecting && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && !conversationId && isLoggedIn && (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-8">
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-bengali">নো মেসেজ ইয়েট</p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs font-bengali">মেসেজ লিখে সেন্ড করুন</p>
                    </div>
                  )}

                  {messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`flex ${msg.sender === "customer" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.sender === "admin" && (
                        <div className="w-7 h-7 bg-accent-teal rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mr-2 mt-auto">
                          ES
                        </div>
                      )}
                      <div
                        className={`px-4 py-2.5 max-w-[80%] ${
                          msg.sender === "customer"
                            ? "bg-accent-teal text-white rounded-2xl rounded-br-sm ml-auto"
                            : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-200 rounded-2xl rounded-bl-sm"
                        }`}
                      >
                        {msg.sender === "admin" && (
                          <p className="text-[10px] font-medium text-accent-teal dark:text-accent-teal/80 mb-0.5">
                            {msg.senderName}
                          </p>
                        )}
                        <p className="text-sm leading-relaxed font-bengali">{msg.message}</p>
                        <span
                          className={`text-[10px] mt-1 block ${
                            msg.sender === "customer" ? "text-white/60" : "text-gray-400"
                          }`}
                        >
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {isClosed && (
                  <div className="px-4 py-3 bg-gray-100 dark:bg-[#1a1a1a] text-center text-xs text-gray-500 border-t border-gray-200 dark:border-[#222] font-bengali">
                    এই কনভারসেশন বন্ধ করা হয়েছে।
                  </div>
                )}

                {!isClosed && (conversationId || isLoggedIn) && (
                  <div className="border-t border-gray-200 dark:border-[#1a1a1a] p-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder="মেসেজ লিখুন..."
                        className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl border-none outline-none text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-accent-teal/50 font-bengali"
                      />
                      <button
                        onClick={handleSend}
                        disabled={!input.trim() || !socketConnected}
                        className="p-2.5 bg-accent-teal text-white rounded-xl hover:bg-accent-teal/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Send message"
                      >
                        <PaperAirplaneIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <button
        onClick={handleToggle}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-accent-teal text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center ${
          hasUnread ? "animate-pulse" : ""
        }`}
        aria-label={isOpen ? "Close chat" : "Open live chat"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <>
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
            )}
          </>
        )}
      </button>
    </>
  );
}
