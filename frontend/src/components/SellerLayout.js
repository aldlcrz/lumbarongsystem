"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ReceiptText,
  Store,
  MessageCircle,
  Bell,
  Search,
  LogOut,
  Menu,
  PlusCircle,
  X,
  CheckCheck,
  User
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const sidebarData = [
  {
    group: "MY SHOP", items: [
      { label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" />, path: "/seller/dashboard" },
      { label: "Products", icon: <Package className="w-5 h-5" />, path: "/seller/inventory" },
    ]
  },
  {
    group: "SALES", items: [
      { label: "My Orders", icon: <ReceiptText className="w-5 h-5" />, path: "/seller/orders" },
      { label: "Customers", icon: <Store className="w-5 h-5" />, path: "/seller/customer" },
    ]
  },
  {
    group: "MESSAGES", items: [
      { label: "Customer Chat", icon: <MessageCircle className="w-5 h-5" />, path: "/seller/messages" },
    ]
  },
];

const mobileNavItems = [
  { label: "Dashboard", icon: <LayoutDashboard />, path: "/seller/dashboard" },
  { label: "Inventory", icon: <Package />, path: "/seller/inventory" },
  { label: "Orders", icon: <ReceiptText />, path: "/seller/orders" },
  { label: "Messages", icon: <MessageCircle />, path: "/seller/messages" },
  { label: "Profile", icon: <User />, path: "/seller/profile" },
];

import { useSocket } from "@/context/SocketContext";
import { api, clearSession } from "@/lib/api";
import { normalizeNotification, formatNotificationTime } from "@/lib/notifications";
import MobileBottomNav from "./MobileBottomNav";
import { ArrowRight, ShieldCheck } from "lucide-react";
import ConfirmationModal from "./ConfirmationModal";

export default function SellerLayout({ children }) {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPopoutOpen, setIsPopoutOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState([]);
  const { socket } = useSocket();
  const router = useRouter();

  const fetchNotifications = React.useCallback(async () => {
    const token = localStorage.getItem("seller_token");
    if (!token || token === "null" || token === "undefined") return;
    try {
      const res = await api.get("/notifications");
      let data = Array.isArray(res.data) ? res.data : [];
      data = data.filter(n => n.link && n.link.startsWith('/seller'));
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (error) {
      if (error?.response?.status !== 401) {
        console.error("Failed to sync workshop alerts:", error?.response?.data || error.message);
      }
    }
  }, []);

  React.useEffect(() => {
    const checkAuth = () => {
      // Only use role-specific keys — no generic fallback to prevent cross-tab contamination
      const storedUser = JSON.parse(localStorage.getItem("seller_user") || "null");
      const token = localStorage.getItem("seller_token");

      setUser(storedUser);

      // If no valid seller session, redirect to login
      if (!token || !storedUser || (storedUser.role !== 'seller' && storedUser.role !== 'admin')) {
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
    };

    checkAuth();
    fetchNotifications();

    if (socket && user?.id) {
      socket.on('new_notification', (incoming) => {
        if (incoming.link && incoming.link.startsWith('/seller')) {
          setNotifications(prev => [incoming, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      });
      socket.on('notification_count_update', fetchNotifications);
    }

    window.addEventListener('storage', checkAuth);
    return () => {
      window.removeEventListener('storage', checkAuth);
      if (socket) {
        socket.off('new_notification');
        socket.off('notification_count_update');
      }
    };
  }, [socket, fetchNotifications, user?.id]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put(`/notifications/read-all`);
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read");
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    clearSession('seller');
    window.location.href = "/";
  };

  const isVerified = user?.isVerified;

  return (
    <div data-panel="seller" className="flex h-screen bg-[#F4ECE3] overflow-hidden">
      {/* Sidebar Desktop */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className="hidden lg:flex flex-col w-[280px] h-full bg-white border-r border-[var(--border)] overflow-y-auto"
      >
        <div className="p-10 flex flex-col h-full">
          <div className="mb-12">
            <Link href="/seller/dashboard" className="font-serif text-xl font-bold text-[var(--charcoal)] tracking-tighter">
              LUMBARONG
            </Link>
            <div className="flex items-center gap-1.5 mt-2 px-1 text-[var(--rust)] font-bold tracking-widest text-[10px]">
              <Store className="w-3 h-3" /> SELLER SIDE
            </div>
          </div>

          <nav className="flex-1 space-y-10">
            {sidebarData.map((group, idx) => (
              <div key={idx} className="space-y-4">
                <div className="text-[10px] font-bold text-[var(--muted)] opacity-60 tracking-widest uppercase px-3">
                  {group.group}
                </div>
                <div className="space-y-1.5">
                  {group.items.map((item, i) => {
                    const active = pathname === item.path || (item.path !== '/seller/dashboard' && pathname.startsWith(item.path));
                    const disabled = !isVerified && item.path !== "/seller/profile" && item.path !== "/seller/dashboard";
                    return (
                      <Link
                        key={i}
                        href={disabled ? "#" : item.path}
                        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group tracking-wide text-sm font-medium ${active ? 'bg-[rgba(192,66,42,0.08)] text-[var(--rust)] border-l-4 border-[var(--rust)]' : 'text-[var(--charcoal)] hover:bg-[var(--cream)] hover:text-[var(--rust)]'} ${disabled ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
                      >
                        <span className={`transition-colors ${active ? 'text-[var(--rust)]' : 'text-[var(--muted)] group-hover:text-[var(--rust)]'}`}>
                          {item.icon}
                        </span>
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-10 pt-8 border-t border-[var(--border)]">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all font-bold text-xs tracking-widest uppercase"
            >
              <LogOut className="w-4 h-4" /> logout
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-[var(--border)] h-[72px] flex items-center shrink-0">
          <div className="fluid-container flex items-center justify-between px-4 lg:px-10">
            <div className="flex items-center gap-4 lg:flex-1">
              {/* Search logic disabled based on UI polish request */}
            </div>

            <div className="flex items-center gap-2 md:gap-6">
              <div className="relative">
                <button
                  onClick={() => setIsPopoutOpen(!isPopoutOpen)}
                  className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isPopoutOpen ? 'bg-[var(--rust)] text-white shadow-lg' : 'bg-[var(--cream)] text-[var(--charcoal)] hover:text-[var(--rust)]'}`}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-[var(--rust)] text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm scale-110">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Popout */}
                <AnimatePresence>
                  {isPopoutOpen && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsPopoutOpen(false)}
                        className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[2px]"
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-80 md:w-96 max-h-[500px] bg-white rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden z-50 flex flex-col"
                      >
                        <div className="p-3 lg:p-5 border-b border-[var(--border)] flex items-center justify-between bg-stone-50/50">
                          <div>
                            <h3 className="font-serif font-bold text-[var(--charcoal)] leading-tight">Artisan Alerts</h3>
                            {unreadCount > 0 && <span className="text-[10px] font-black tracking-widest text-[var(--muted)] opacity-50 uppercase">{unreadCount} New</span>}
                          </div>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-[10px] bg-[var(--cream)] border border-[var(--border)] hover:bg-[var(--rust)] hover:text-white transition-all rounded-md px-2 py-1 font-bold text-[var(--charcoal)] tracking-wider flex items-center gap-1"
                            >
                              <CheckCheck className="w-3 h-3" /> Mark All Read
                            </button>
                          )}
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                          {notifications.filter(n => !dismissedNotificationIds.includes(n.id)).length === 0 ? (
                            <div className="py-20 text-center space-y-3">
                              <Bell className="w-8 h-8 mx-auto text-[var(--muted)] opacity-20" />
                              <div className="text-sm font-medium text-[var(--muted)]">All quiet in the workshop.</div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {notifications
                                .filter(n => !dismissedNotificationIds.includes(n.id))
                                .map((notif) => {
                                const n = normalizeNotification(notif);
                                return (
                                  <div
                                    key={notif.id}
                                    onClick={() => {
                                      if (n.link) {
                                        if (!n.read) markAsRead(notif.id);
                                        router.push(n.link);
                                        setIsPopoutOpen(false);
                                      }
                                    }}
                                    className={`relative p-4 rounded-xl transition-all group ${n.link ? 'cursor-pointer' : ''} ${!n.read ? 'bg-[var(--cream)]/40 hover:bg-[var(--cream)]/60' : 'hover:bg-stone-50'}`}
                                  >
                                    {!n.read && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[var(--rust)] rounded-full" />}
                                    <div className="pl-3 space-y-1">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="text-xs font-bold text-[var(--charcoal)] leading-tight">{n.title}</div>
                                        <div className="text-[9px] font-bold text-[var(--muted)] opacity-50 whitespace-nowrap pt-0.5 uppercase tracking-tighter">
                                          {formatNotificationTime(n.createdAt)}
                                        </div>
                                      </div>
                                      <p className="text-[11px] text-[var(--muted)] leading-relaxed line-clamp-2">{n.message}</p>

                                      <div className="flex items-center gap-3 pt-2">
                                        {n.link && (
                                          <span className="text-[10px] font-bold text-[var(--rust)] group-hover:underline flex items-center gap-1">
                                            View Details <ArrowRight className="w-3 h-3" />
                                          </span>
                                        )}
                                        {!n.read && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              markAsRead(notif.id);
                                            }}
                                            className="text-[10px] font-bold text-[var(--muted)] hover:text-[var(--rust)] transition-colors ml-auto"
                                          >
                                            Mark as read
                                          </button>
                                        )}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDismissedNotificationIds(prev => [...prev, notif.id]);
                                          }}
                                          className="text-[10px] font-bold text-[var(--muted)] hover:text-red-500 transition-colors"
                                        >
                                          Dismiss
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        {notifications.length > 0 && (
                          <div className="p-4 bg-stone-50 border-t border-[var(--border)] text-center">
                            <button
                              onClick={() => setIsPopoutOpen(false)}
                              className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--rust)] transition-colors"
                            >
                              Close Alerts
                            </button>
                          </div>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              <div className="hidden lg:block w-[1px] h-8 bg-[var(--border)]" />
              <Link href="/seller/profile" className="flex items-center gap-3 group">
                <div className="hidden lg:block text-right">
                  <div className="text-sm font-bold text-[var(--charcoal)] group-hover:text-[var(--rust)] transition-colors">{user?.name || "Artisan Shop"}</div>
                  <div className={`text-[10px] font-bold uppercase tracking-widest ${isVerified ? 'text-green-600' : 'text-amber-600 animate-pulse'}`}>
                    {isVerified ? "VERIFIED" : "PENDING VERIFICATION"}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[var(--bark)] border-2 border-white shadow-md flex items-center justify-center text-white font-serif text-lg font-bold overflow-hidden transition-transform active:scale-95">
                  {user?.profilePhoto ? (
                    <img
                      src={user.profilePhoto}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${user?.name || "Seller"}&background=EBE5DE&color=2A2A2A`;
                      }}
                    />
                  ) : (
                    user?.name ? user.name[0] : "A"
                  )}
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto fluid-container !pt-10 pb-[100px] lg:pb-10">
          <div className="max-w-[1400px] mx-auto">
            {!isVerified && pathname !== "/seller/profile" && pathname !== "/seller/dashboard" ? (
              <div className="artisan-card p-20 text-center space-y-6 animate-fade-up">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto scale-110 shadow-lg">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="font-serif text-3xl font-bold">Lumban Community Verification</h2>
                <p className="max-w-md mx-auto text-[var(--muted)] leading-relaxed">Your application is currently being reviewed by our heritage administrators. Access to shop operations will be granted once your documents are verified.</p>
                <div className="text-[10px] font-bold text-amber-700 bg-amber-50 px-4 py-2 rounded-full inline-block border border-amber-200">EXPECTED WINDOW: 24-48 HOURS</div>
              </div>
            ) : (
              children
            )}
          </div>
        </main>

        <MobileBottomNav items={mobileNavItems} />
      </div>

      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Sign Out"
        message="Are you sure you want to log out?"
        confirmText="Yes"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
