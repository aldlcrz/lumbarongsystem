"use client";
import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  Clock, UserCheck, ShoppingBag, Store, ShieldCheck,
  Mail, ArrowRight, Activity, MapPin, Download, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api, BACKEND_URL } from "@/lib/api";
import { io } from "socket.io-client";

const TYPE_META = {
  order:    { color: "bg-green-500",        Icon: ShoppingBag },
  seller:   { color: "bg-[var(--rust)]",    Icon: Store       },
  user:     { color: "bg-blue-500",         Icon: UserCheck   },
  platform: { color: "bg-[var(--bark)]",    Icon: Activity    },
};

function getIcon(type) {
  const { Icon } = TYPE_META[type] || TYPE_META.platform;
  return <Icon className="w-5 h-5" />;
}
function getBg(type) {
  return (TYPE_META[type] || TYPE_META.platform).color;
}

function timeAgo(date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60)  return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AdminActivity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topLocations, setTopLocations] = useState([]);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState(null); // 'ok' | 'err'

  // ── Load recent orders as the initial activity feed ───────────────────────
  const loadActivity = useCallback(async () => {
    try {
      const res = await api.get("/admin/analytics");

      // Build activity list from recent orders
      const acts = (res.data.recentActivity || []).map(o => ({
        id: o.id,
        type: "order",
        label: "Heritage Order",
        user: o.desc?.split("–")[0]?.trim() || "Customer",
        desc: o.title + (o.status ? ` — ${o.status}` : ""),
        time: o.time ? timeAgo(o.time) : "Just now",
        rawTime: o.time,
      }));
      setActivities(acts);
      setTopLocations(res.data.topLocations || []);
    } catch (err) {
      console.warn("Activity load failed", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivity();

    // Real-time socket updates
    const socket = io(BACKEND_URL);

    socket.on("stats_update", (data) => {
      setActivities(prev => [{
        id: Date.now(),
        type: data?.type || "platform",
        label: data?.type === "order" ? "Order Update" : "Workshop Activity",
        user: "Platform",
        desc: "Real-time platform synchronization detected.",
        time: "Just now",
      }, ...prev].slice(0, 20));
    });

    socket.on("order_created", (order) => {
      setActivities(prev => [{
        id: Date.now(),
        type: "order",
        label: "New Heritage Order",
        user: order.customer?.name || "Customer",
        desc: `Order #LB-${String(order.id || "").padStart(6, "0")} placed`,
        time: "Just now",
      }, ...prev].slice(0, 20));
    });

    socket.on("user_updated", (data) => {
      if (data?.user?.role === "seller") {
        setActivities(prev => [{
          id: Date.now(),
          type: "seller",
          label: "Seller Update",
          user: data.user.name || "Seller",
          desc: `Seller account ${data.action || "updated"}`,
          time: "Just now",
        }, ...prev].slice(0, 20));
      }
    });

    return () => socket.disconnect();
  }, [loadActivity]);

  // ── Export current activity list as CSV ──────────────────────────────────
  const handleExport = () => {
    const rows = [
      ["Type", "Label", "User", "Description", "Time"],
      ...activities.map(a => [a.type, a.label, a.user, a.desc, a.time]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity_log_${new Date().toLocaleDateString("en-CA")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Broadcast ────────────────────────────────────────────────────────────
  const handleBroadcast = async () => {
    const msg = broadcastMsg.trim();
    if (!msg) return;
    setBroadcasting(true);
    setBroadcastStatus(null);
    try {
      await api.post("/admin/broadcast", { message: msg });
      setBroadcastStatus("ok");
      setBroadcastMsg("");
    } catch {
      setBroadcastStatus("err");
    } finally {
      setBroadcasting(false);
      setTimeout(() => setBroadcastStatus(null), 3000);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-10 mb-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="eyebrow">Registry Log</div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--charcoal)]">
              System <span className="text-[var(--rust)] italic">Activity</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadActivity}
              className="p-2.5 bg-white border border-[var(--border)] rounded-xl hover:border-[var(--rust)] hover:text-[var(--rust)] transition-all shadow-sm"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[var(--border)] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:border-[var(--rust)] hover:text-[var(--rust)] transition-all shadow-sm"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white border border-[var(--border)] rounded-lg shadow-sm text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> LIVE
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-2 bg-[var(--warm-white)]">
            <Activity className="w-4 h-4 text-[var(--rust)]" />
            <span className="font-bold text-xs text-[var(--charcoal)] tracking-widest uppercase">Latest Operations</span>
            <span className="ml-auto text-[10px] font-bold text-[var(--muted)] opacity-50 uppercase tracking-widest">
              {activities.length} entries
            </span>
          </div>

          {loading ? (
            <div className="px-6 py-20 text-center text-[var(--muted)] italic animate-pulse text-sm">
              Loading activity log…
            </div>
          ) : activities.length === 0 ? (
            <div className="px-6 py-20 text-center text-[var(--muted)] italic text-sm opacity-50">
              No activity recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              <AnimatePresence initial={false}>
                {activities.map((act, i) => (
                  <motion.div
                    key={`${act.id}-${i}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i < 6 ? i * 0.04 : 0 }}
                    className="px-6 py-5 hover:bg-[var(--warm-white)] transition-colors flex items-center gap-6"
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 ${getBg(act.type)}`}>
                      {getIcon(act.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-[var(--rust)] uppercase tracking-wider">{act.label}</span>
                          <span className="hidden md:inline w-1 h-1 bg-[var(--border)] rounded-full" />
                          <h4 className="text-sm font-semibold text-[var(--charcoal)] truncate">{act.user}</h4>
                        </div>
                        <span className="text-[10px] font-medium text-[var(--muted)] flex items-center gap-1.5 tabular-nums shrink-0">
                          <Clock className="w-3 h-3" /> {act.time}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--muted)] truncate max-w-2xl">{act.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Bottom Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Regional Distribution — wired from analytics */}
          <div className="bg-white rounded-xl border border-[var(--border)] p-8 relative overflow-hidden group shadow-sm">
            <div className="absolute top-[-20px] right-[-20px] p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
              <MapPin className="w-32 h-32 text-[var(--charcoal)]" />
            </div>
            <div className="relative z-10 space-y-6">
              <h3 className="text-xl font-bold text-[var(--charcoal)]">Regional Distribution</h3>
              {topLocations.length === 0 ? (
                <p className="text-sm text-[var(--muted)] italic opacity-50">No location data yet.</p>
              ) : (
                <div className="space-y-4">
                  {topLocations.map((loc, i) => (
                    <GeoItem key={i} label={loc.city} count={`${loc.count} order${loc.count !== 1 ? "s" : ""}`} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Broadcast System */}
          <div className="bg-white rounded-xl border border-[var(--border)] p-8 relative overflow-hidden group shadow-sm">
            <div className="absolute top-[-20px] right-[-20px] p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
              <Mail className="w-32 h-32 text-[var(--charcoal)]" />
            </div>
            <div className="relative z-10 h-full flex flex-col gap-5">
              <div>
                <h3 className="text-xl font-bold text-[var(--charcoal)]">Broadcast System</h3>
                <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                  Send an urgent notification to all registered users in the network.
                </p>
              </div>

              <textarea
                value={broadcastMsg}
                onChange={e => setBroadcastMsg(e.target.value)}
                placeholder="Type your broadcast message here…"
                rows={4}
                className="w-full px-4 py-3 bg-[var(--input-bg)] border-2 border-transparent focus:border-[var(--rust)] rounded-xl outline-none text-sm resize-none transition-all"
              />

              <AnimatePresence>
                {broadcastStatus === "ok" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-green-600 text-xs font-bold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Broadcast transmitted successfully.
                  </motion.div>
                )}
                {broadcastStatus === "err" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-red-600 text-xs font-bold">
                    Failed to send broadcast. Please try again.
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={handleBroadcast}
                disabled={broadcasting || !broadcastMsg.trim()}
                className="w-full py-3.5 bg-[var(--charcoal)] text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[var(--rust)] transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {broadcasting ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Transmitting…</>
                ) : (
                  <><ArrowRight className="w-4 h-4" /> Initiate Broadcast</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function GeoItem({ label, count }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 group/geo">
      <span className="text-xs font-bold text-[var(--charcoal)] group-hover/geo:text-[var(--rust)] transition-colors">{label}</span>
      <span className="text-[10px] font-sans font-bold text-[var(--rust)] bg-[var(--warm-white)] px-2 py-0.5 rounded-full ring-1 ring-[var(--border)]">
        {count}
      </span>
    </div>
  );
}
