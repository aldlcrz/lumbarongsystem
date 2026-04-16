"use client";
import React, { useState } from "react";
import SellerLayout from "@/components/SellerLayout";
import { useRouter } from "next/navigation";
import { Bell, ShoppingBag, MessageSquare, Shield, Clock, ArrowRight, Mail, Loader2, CheckCheck, Package, Store } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { useSocket } from "@/context/SocketContext";
import {
  formatNotificationTime,
  getNotificationHref,
  getNotificationTypeKey,
  getNotificationTypeLabel,
  normalizeNotification,
} from "@/lib/notifications";

export default function SellerNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeNotificationId, setActiveNotificationId] = useState(null);

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await api.get("/notifications?role=seller");
      setNotifications(Array.isArray(res.data) ? res.data.map(normalizeNotification) : []);
    } catch (error) {
      console.error("Failed to fetch seller notifications", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const { socket } = useSocket();

  React.useEffect(() => {
    fetchNotifications();

    if (socket) {
      socket.on('new_notification', (incoming) => {
        if (incoming.targetRole === 'seller') {
          const next = normalizeNotification(incoming);
          setNotifications((prev) => [next, ...prev.filter((n) => n.id !== next.id)]);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('new_notification');
      }
    };
  }, [fetchNotifications, socket]);

  const markAllAsRead = async () => {
    if (!notifications.some(n => !n.read)) return;

    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
    try {
      await api.put("/notifications/read-all?role=seller");
    } catch (error) {
      console.error("Failed to mark notifications as read", error.response?.data || error.message);
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (notification) => {
    const token = localStorage.getItem("token");
    const href = getNotificationHref(notification, 'seller');

    if (!notification.read) {
      setActiveNotificationId(notification.id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === notification.id ? { ...item, read: true } : item))
      );

      try {
        await api.put(
          `/notifications/${notification.id}/read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (error) {
        console.error("Failed to mark notification as read", error.response?.data || error.message);
      } finally {
        setActiveNotificationId(null);
      }
    }

    if (/^https?:\/\//i.test(href)) {
      window.location.href = href;
      return;
    }

    router.push(href);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderNotificationIcon = (notification) => {
    switch (getNotificationTypeKey(notification)) {
      case "order":
        return (
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-[#F4A8A3] bg-[#FEF2F1] text-[#B94232]">
            <Package strokeWidth={2} className="w-5 h-5" />
          </div>
        );
      case "message":
        return (
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-[#DBD4CC] bg-[#F8F5F1] text-[#2A2A2A]">
            <MessageSquare strokeWidth={2} className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 rounded-[1.2rem] flex items-center justify-center shrink-0 border border-[#D1D5DB] bg-[#F3F4F6] text-[#374151]">
            <Store strokeWidth={2} className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <SellerLayout>
      <div className="max-w-[900px] mx-auto space-y-8 mb-20 px-4 md:px-0">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-2">
          <div className="space-y-4">
             <div className="flex items-center gap-3">
               <span className="w-8 h-0.5 bg-[var(--rust)]"></span>
               <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--rust)]">SHOP ALERTS</span>
             </div>
             <h1 className="font-serif text-[42px] font-bold tracking-tight text-[var(--charcoal)] leading-none">
               Workshop <span className="text-[var(--rust)] italic lowercase">Updates</span>
             </h1>
             <p className="text-sm font-bold text-[var(--rust)]">{unreadCount} unread shop alert{unreadCount !== 1 ? 's' : ''}</p>
          </div>
          <button 
            onClick={markAllAsRead} 
            className="self-start md:mt-4 flex items-center gap-2 px-5 py-2.5 bg-white border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--muted)] hover:text-[#2A2A2A] hover:bg-[#FDFCFB] hover:shadow-sm transition-all shadow-sm"
          >
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
        </div>

        {/* Notifications List Container */}
        <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-[var(--border)] divide-y divide-[var(--border)] relative">
           <AnimatePresence initial={false}>
             {loading ? (
                <div className="p-24 text-center space-y-4">
                   <Loader2 className="w-10 h-10 text-[var(--muted)] mx-auto animate-spin opacity-50" />
                   <p className="text-sm text-[var(--muted)] italic">Sychronizing shop updates...</p>
                </div>
             ) : notifications.length === 0 ? (
                <div className="p-24 text-center space-y-4">
                   <Bell className="w-12 h-12 text-[var(--muted)] mx-auto opacity-20" />
                   <h3 className="font-serif text-xl font-bold text-[var(--charcoal)] opacity-80">All clear in the workshop!</h3>
                   <p className="text-sm text-[var(--muted)] italic">No new shop alerts at this time.</p>
                </div>
             ) : (
                notifications.map((notif, idx) => (
                  <motion.div 
                    key={notif.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-6 sm:p-10 flex flex-col sm:flex-row items-start gap-6 relative group transition-colors ${!notif.read ? 'bg-white' : 'bg-[#FAFAFA]'}`}
                  >
                    {!notif.read && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--rust)]" />
                    )}
                    
                    {/* Icon Block */}
                    {renderNotificationIcon(notif)}

                    <div className="flex-1 w-full space-y-3 pt-0.5">
                      {/* Top Meta Row */}
                      <div className="flex justify-between items-start">
                         <div className="text-[10px] font-bold text-[var(--muted)] opacity-80 uppercase tracking-[0.2em]">{getNotificationTypeLabel(notif)}</div>
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] sm:text-[11px] font-medium text-[var(--muted)] opacity-70 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 opacity-50" /> {formatNotificationTime(notif.createdAt)}</span>
                            {!notif.read && (
                               <span className="text-[9px] font-bold text-[var(--rust)] border border-[#F4A8A3] bg-[#FEF2F1] px-2 py-0.5 rounded-md uppercase tracking-wider">NEW</span>
                            )}
                         </div>
                      </div>
                      
                      {/* Title & Description */}
                      <div className="space-y-1.5">
                         <h3 className="text-lg font-bold text-[var(--charcoal)]">{notif.title}</h3>
                         <div className="flex">
                            <div className="w-0.5 bg-[var(--border)] rounded-full mr-3 shrink-0" />
                            <p className="text-[15px] font-medium text-[var(--muted)] leading-relaxed italic opacity-90">{notif.message}</p>
                         </div>
                      </div>
                      
                      {/* Action Links */}
                      <div className="pt-2 flex items-center gap-6">
                         <button onClick={() => handleNotificationClick(notif)} className="flex items-center gap-1 text-[11px] font-extrabold text-[var(--muted)] hover:text-[#2A2A2A] uppercase tracking-[0.1em] transition-colors group/view">
                            TRACK EVENT <ArrowRight className="w-3.5 h-3.5 group-hover/view:translate-x-1 transition-transform ml-1" />
                         </button>
                         {activeNotificationId === notif.id && <Loader2 className="w-4 h-4 animate-spin text-[var(--muted)]" />}
                      </div>
                    </div>
                  </motion.div>
                ))
             )}
           </AnimatePresence>
        </div>

        {/* Shop Settings Block */}
        <div className="bg-[var(--bark)] text-[#EFEAE2] p-8 md:p-12 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-10 mt-6 shadow-2xl">
           <div className="space-y-3 flex-1">
              <h3 className="font-serif text-2xl font-bold tracking-tight italic">Workshop Alerts</h3>
              <p className="text-sm text-[#EFEAE2]/60 font-medium italic max-w-sm leading-relaxed">Customize how you want to receive shop-related alerts about orders and customer messages.</p>
           </div>
           
           <div className="flex flex-col sm:flex-row md:flex-col gap-4 w-full md:w-auto shrink-0">
              <button className="w-full md:w-56 py-3.5 md:py-4 bg-[var(--rust)] hover:bg-[#A3392A] text-white rounded-[1rem] sm:rounded-xl text-[10px] font-extrabold uppercase tracking-[0.15em] flex items-center justify-center gap-2.5 transition-colors shadow-lg border-b-2 border-transparent">
                 <Bell className="w-4 h-4" /> PUSH ALERTS
              </button>
              <button className="w-full md:w-56 py-3.5 md:py-4 bg-transparent hover:bg-white/5 text-[#EFEAE2] border border-white/20 rounded-[1rem] sm:rounded-xl text-[10px] font-extrabold uppercase tracking-[0.15em] flex items-center justify-center gap-2.5 transition-colors">
                 <Mail className="w-4 h-4" /> SHOP EMAIL
              </button>
           </div>
        </div>

      </div>
    </SellerLayout>
  );
}
