"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import SellerLayout from "@/components/SellerLayout";
import { MessageCircle, Search, MoreVertical, Send, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { useSocket } from "@/context/SocketContext";
import { useSearchParams } from "next/navigation";

export default function SellerMessagesPage() {
  return (
    <Suspense fallback={<SellerLayout><div className="py-24 text-center text-[var(--muted)] animate-pulse italic">Synchronizing threads...</div></SellerLayout>}>
      <SellerMessages />
    </Suspense>
  );
}

function SellerMessages() {
  const searchParams = useSearchParams();
  // Support both ?userId= (from customer list) and ?customerId= (from customer detail)
  const customerIdParam = searchParams.get("customerId") || searchParams.get("userId");
  const customerNameParam = searchParams.get("customerName");

  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { socket } = useSocket();
  const scrollRef = useRef(null);

  const fetchThreads = async () => {
    try {
      const res = await api.get("/chat/threads");
      return res.data;
    } catch (err) {
      console.error("Failed to fetch threads", err?.response?.data || err.message);
      return [];
    }
  };

  // On mount: load threads, then auto-open if a customerId is in the URL
  useEffect(() => {
    const init = async () => {
      const allThreads = await fetchThreads();
      setThreads(allThreads);
      setLoading(false);

      if (customerIdParam) {
        const existing = allThreads.find(t => String(t.otherUser?.id) === String(customerIdParam));
        if (existing) {
          // Already have a conversation — open it directly
          await openThread(existing);
        } else {
          // No conversation yet — create a ghost thread so the seller can send the first message
          const ghost = {
            otherUser: { id: customerIdParam, name: decodeURIComponent(customerNameParam || "Customer"), role: "customer" },
            lastMessage: null,
            timestamp: null,
            unreadCount: 0,
            isGhost: true
          };
          setActiveThread(ghost);
          setMessages([]);
          // Add ghost to thread list so it shows in sidebar
          setThreads([ghost, ...allThreads]);
        }
      } else if (allThreads.length > 0) {
        await openThread(allThreads[0]);
      }
    };
    init();
  }, [customerIdParam]);

  // Socket: real-time message delivery
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      setActiveThread(current => {
        if (current && (
          String(msg.senderId) === String(current.otherUser?.id) ||
          String(msg.receiverId) === String(current.otherUser?.id)
        )) {
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
        return current;
      });
      // Refresh thread list to update last message + unread counts
      fetchThreads().then(setThreads).catch(() => {});
    };

    socket.on("receive_message", handleNewMessage);
    return () => socket.off("receive_message", handleNewMessage);
  }, [socket]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openThread = async (thread) => {
    setActiveThread(thread);
    if (thread.isGhost) {
      setMessages([]);
      return;
    }
    try {
      const res = await api.get(`/chat/conversation/${thread.otherUser.id}`);
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to fetch messages", err?.response?.data || err.message);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeThread || isSending) return;

    setIsSending(true);
    try {
      const res = await api.post("/chat/send", {
        receiverId: activeThread.otherUser.id,
        content: newMessage
      });

      // Convert ghost thread to real thread after first message
      if (activeThread.isGhost) {
        const realThread = { ...activeThread, isGhost: false, lastMessage: newMessage, timestamp: new Date().toISOString() };
        setActiveThread(realThread);
        setThreads(prev => [realThread, ...prev.filter(t => t.otherUser?.id !== activeThread.otherUser?.id)]);
      }

      setMessages(prev => {
        if (prev.some(m => m.id === res.data.id)) return prev;
        return [...prev, res.data];
      });
      setNewMessage("");
      fetchThreads().then(allThreads => {
        setThreads(allThreads);
      });
    } catch (err) {
      console.error("Failed to send message", err?.response?.data || err.message);
    } finally {
      setIsSending(false);
    }
  };

  const myId = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("seller_user") || localStorage.getItem("user") || "{}").id
    : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    if (!activeThread) return;
    setMenuOpen(false);
    try {
      await api.put(`/chat/read/${activeThread.otherUser.id}`);
      setThreads(prev => prev.map(t =>
        t.otherUser?.id === activeThread.otherUser.id ? { ...t, unreadCount: 0 } : t
      ));
    } catch (err) {
      console.warn("Mark read failed", err?.response?.data || err.message);
    }
  };

  const handleDeleteConversation = async () => {
    if (!activeThread) return;
    if (!confirm(`Delete all messages with ${activeThread.otherUser.name}? This cannot be undone.`)) return;
    setMenuOpen(false);
    try {
      await api.delete(`/chat/conversation/${activeThread.otherUser.id}`);
      setMessages([]);
      setThreads(prev => prev.filter(t => t.otherUser?.id !== activeThread.otherUser.id));
      setActiveThread(null);
    } catch (err) {
      console.warn("Delete conversation failed", err?.response?.data || err.message);
    }
  };

  return (
    <SellerLayout>
      <div className="h-[calc(100vh-140px)] flex bg-white rounded-3xl overflow-hidden shadow-2xl border border-[var(--border)]">
        {/* Left: Thread List */}
        <div className="w-96 border-r border-[var(--border)] flex flex-col bg-gray-50/50">
          <div className="p-8 border-b border-[var(--border)]">
            <div className="eyebrow !mb-2">Heritage Support</div>
            <h2 className="font-serif text-2xl font-bold text-[var(--charcoal)] mb-6">
              Customer <span className="text-[var(--rust)] italic lowercase">Inquiries</span>
            </h2>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
              <input
                type="text"
                placeholder="Filter inquiries..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-[var(--border)] rounded-2xl outline-none focus:border-[var(--rust)] transition-all text-xs font-bold uppercase tracking-widest shadow-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
            {loading ? (
              <div className="py-10 text-center text-[var(--muted)] animate-pulse italic text-sm">
                Synchronizing workshop threads...
              </div>
            ) : threads.length === 0 ? (
              <div className="py-10 text-center text-[var(--muted)] space-y-4">
                <MessageCircle className="w-10 h-10 mx-auto opacity-20" />
                <div className="text-sm font-bold opacity-60">NO INQUIRIES YET</div>
              </div>
            ) : threads.map((thread) => (
              <button
                key={thread.otherUser.id}
                onClick={() => openThread(thread)}
                className={`w-full p-5 rounded-2xl flex items-start gap-4 transition-all duration-300 text-left ${
                  activeThread?.otherUser?.id === thread.otherUser.id
                    ? "bg-white shadow-xl ring-2 ring-[var(--rust)] scale-[1.02]"
                    : "hover:bg-white hover:shadow-lg"
                }`}
              >
                <div className="w-12 h-12 bg-[var(--bark)] rounded-xl flex items-center justify-center text-white font-serif text-lg font-bold shadow-md shrink-0">
                  {thread.otherUser.name?.[0] || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-sm font-bold text-[var(--charcoal)] truncate">
                        {thread.otherUser.name || "Customer"}
                      </div>
                      <span className={`text-[7px] px-1 py-0 rounded font-bold uppercase tracking-tight shadow-sm ${thread.otherUser.role === 'seller' ? 'bg-[var(--rust)] text-white' : 'bg-[var(--bark)] text-white'}`}>
                        {thread.otherUser.role}
                      </span>
                    </div>
                    <div className="text-[9px] font-bold text-[var(--muted)] whitespace-nowrap ml-2">
                      {thread.isGhost ? "New" : thread.timestamp
                        ? new Date(thread.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : ""}
                    </div>
                  </div>
                  <div className="text-[11px] text-[var(--muted)] line-clamp-1 opacity-70 italic">
                    {thread.isGhost ? "Start new conversation" : (thread.lastMessage || "Start of conversation")}
                  </div>
                  {thread.unreadCount > 0 && (
                    <div className="mt-1.5 inline-flex h-4 min-w-4 px-1 items-center justify-center bg-[var(--rust)] text-white text-[8px] font-bold rounded-full">
                      {thread.unreadCount}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Active Chat */}
        <div className="flex-1 flex flex-col bg-white">
          {activeThread ? (
            <>
              <div className="p-8 border-b border-[var(--border)] flex items-center justify-between bg-white z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[var(--bark)] rounded-xl flex items-center justify-center text-white font-serif text-xl font-bold shadow-lg">
                    {activeThread.otherUser.name?.[0] || "?"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <h2 className="text-lg font-bold text-[var(--charcoal)]">{activeThread.otherUser.name}</h2>
                       <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest ${activeThread.otherUser.role === 'seller' ? 'bg-[var(--rust)] text-white' : 'bg-[var(--bark)] text-white'}`}>
                          {activeThread.otherUser.role}
                       </span>
                    </div>
                    <div className="text-[10px] text-green-600 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-1">
                      {activeThread.isGhost ? (
                        <span className="text-amber-600">● New Inquiry</span>
                      ) : (
                        <><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Active Session</>
                      )}
                    </div>
                  </div>
                </div>
                {/* 3-dot Menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen(prev => !prev)}
                    className={`p-3 rounded-xl transition-all ${menuOpen ? 'bg-[var(--rust)] text-white' : 'hover:bg-[var(--cream)] text-[var(--muted)] hover:text-[var(--rust)]'}`}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 bg-white rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden animate-fade-up">
                      {/* View Profile */}
                      <a
                        href={`/seller/customer?id=${activeThread.otherUser.id}`}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-5 py-4 text-sm font-semibold text-[var(--charcoal)] hover:bg-[var(--cream)] transition-colors"
                      >
                        <span className="w-7 h-7 rounded-lg bg-[var(--cream)] flex items-center justify-center text-[var(--rust)]">👤</span>
                        View Customer Profile
                      </a>

                      {/* Mark All Read */}
                      <button
                        onClick={handleMarkAllRead}
                        className="w-full flex items-center gap-3 px-5 py-4 text-sm font-semibold text-[var(--charcoal)] hover:bg-[var(--cream)] transition-colors text-left"
                      >
                        <span className="w-7 h-7 rounded-lg bg-[var(--cream)] flex items-center justify-center text-[var(--rust)]">✓</span>
                        Mark All as Read
                      </button>

                      <div className="h-px bg-[var(--border)] mx-4" />

                      {/* Delete Conversation */}
                      <button
                        onClick={handleDeleteConversation}
                        className="w-full flex items-center gap-3 px-5 py-4 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors text-left"
                      >
                        <span className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">🗑</span>
                        Delete Conversation
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-6 bg-[var(--cream)]/20 custom-scrollbar">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <span className="bg-white px-4 py-2 rounded-full border border-[var(--border)] text-[9px] font-bold uppercase tracking-widest text-[var(--muted)] shadow-sm">
                      {activeThread.isGhost ? "Send your first message below" : "Heritage Thread Active"}
                    </span>
                  </div>
                )}

                {messages.map((msg, i) => {
                  const isMine = String(msg.senderId || msg.sender?.id) === String(myId);
                  const senderName = isMine ? 'You' : (msg.sender?.name || activeThread.otherUser.name || 'Customer');

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'} gap-3 mb-6`}
                    >
                      {!isMine && (
                        <div title={senderName} className="w-8 h-8 rounded-full bg-[var(--bark)] text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm">
                          {senderName[0]}
                        </div>
                      )}

                      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[70%]`}>
                        <div className={`p-5 rounded-2xl shadow-lg font-medium text-sm leading-relaxed border-4 border-white ${
                          isMine
                            ? "bg-[var(--rust)] text-white rounded-tr-none"
                            : "bg-white text-[var(--charcoal)] rounded-tl-none"
                        }`}>
                          {msg.content}
                          <div className={`text-[8px] mt-2 font-bold uppercase tracking-wider opacity-60 ${isMine ? "text-white" : "text-[var(--muted)]"}`}>
                            {msg.createdAt
                              ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                              : "Just now"}
                          </div>
                        </div>
                      </div>

                      {isMine && (
                        <div className="w-8 h-8 rounded-full bg-[var(--rust)] text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-md">
                          {(typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}').name?.[0] : 'S') || 'S'}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
                <div ref={scrollRef} />
              </div>

              <form onSubmit={sendMessage} className="p-6 border-t border-[var(--border)] bg-white">
                <div className="flex items-center gap-3 bg-[var(--cream)]/30 px-5 py-3 rounded-2xl border border-[var(--border)] focus-within:border-[var(--rust)] focus-within:bg-white transition-all shadow-inner">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
                    placeholder={activeThread.isGhost ? `Start a conversation with ${activeThread.otherUser.name}...` : "Type your heritage response..."}
                    rows={1}
                    className="flex-1 bg-transparent border-none outline-none text-sm font-medium italic resize-none py-1"
                  />
                  <button
                    type="submit"
                    disabled={isSending}
                    className="p-3.5 bg-[var(--rust)] text-white rounded-xl shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 p-10">
              <div className="w-24 h-24 bg-[var(--cream)] rounded-3xl flex items-center justify-center shadow-inner ring-1 ring-[var(--border)]">
                <MessageCircle className="w-10 h-10 text-[var(--muted)] opacity-30" />
              </div>
              <div>
                <h3 className="font-serif text-2xl font-bold opacity-60">Workshop Communication</h3>
                <p className="max-w-xs text-[var(--muted)] font-medium leading-relaxed italic mt-2">
                  Select a customer thread on the left to begin your mastercraft dialogue.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </SellerLayout>
  );
}
