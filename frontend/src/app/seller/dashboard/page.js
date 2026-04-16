"use client";
import React, { useState, useEffect, useCallback } from "react";
import SellerLayout from "@/components/SellerLayout";
import { 
  DollarSign, 
  ShoppingBag, 
  MessageCircle, 
  FileDown, 
  BarChart3,
  UserCheck,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { useSocket } from "@/context/SocketContext";

const FILTER_LABELS = { today: "Today", week: "This Week", month: "This Month", year: "This Year" };

const EMPTY_TOP = [{ name: "No data yet", sales: 0 }];

export default function SellerDashboard() {
  const [mounted, setMounted] = useState(false);
  const [showRevenueTrend, setShowRevenueTrend] = useState(false);
  const [dateFilter, setDateFilter] = useState("month");
  const [stats, setStats] = useState({ 
    revenue: 0, 
    orders: 0, 
    inquiries: 0, 
    products: 0,
    topProducts: [],
    retention: 0,
    funnel: { visitors: 0, views: 0, checkout: 0, completed: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [filterKey, setFilterKey] = useState(0); // forces chart re-animation

  const { socket } = useSocket();

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products/seller-stats?range=${dateFilter}`);
      setStats(res.data);
      setFetchError(null);
      setFilterKey(k => k + 1); // trigger re-animation every refresh
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to load stats";
      console.error("Failed to fetch seller stats:", msg);
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted) fetchStats(); }, [mounted, dateFilter, fetchStats]);

  useEffect(() => {
    if (!socket || !mounted) return;
    const handler = () => fetchStats();
    socket.on("stats_update", handler);
    socket.on("new_order", () => {
      setNewOrderAlert(true);
      setTimeout(() => setNewOrderAlert(false), 5000);
      handler();
    });
    return () => {
      socket.off("stats_update", handler);
      socket.off("new_order");
    };
  }, [socket, mounted, fetchStats]);

  const handleExportReport = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders/export-report', { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lumbarong_report_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const topProducts = stats.topProducts && stats.topProducts.length > 0 ? stats.topProducts : EMPTY_TOP;

  // Funnel data with proportional widths
  const funnel = stats.funnel || {};
  const funnelMax = Math.max(funnel.visitors || 0, funnel.views || 0, funnel.checkout || 0, funnel.completed || 0, 1);
  const funnelSteps = [
    { label: "Visitors",       value: funnel.visitors  || 0, color: "var(--bark)" },
    { label: "Product Views",  value: funnel.views     || 0, color: "#594436" },
    { label: "Orders/Checkout",value: funnel.checkout  || 0, color: "#8C7B70" },
    { label: "Completed Sales",value: funnel.completed || 0, color: "var(--rust)" },
  ];

  return (
    <SellerLayout>
      <div className="space-y-10 mb-20">
        
        {/* New Order Toast */}
        <AnimatePresence>
          {newOrderAlert && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-6 right-6 z-50 p-4 bg-green-600 text-white rounded-2xl shadow-2xl flex items-center gap-3"
            >
              <ShoppingBag className="w-5 h-5" />
              <div>
                <div className="font-bold text-sm">New Heritage Order!</div>
                <div className="text-xs opacity-80">A customer just placed an order.</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fetch Error Banner */}
        {fetchError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-bold flex items-center gap-3">
            <span>⚠️</span> Could not load stats: {fetchError}
          </div>
        )}

        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="eyebrow">Artisan Performance</div>
            <h1 className="font-serif text-charcoal text-2xl font-bold tracking-tight uppercase">
              Workshop <span className="text-[var(--rust)] italic lowercase">Dashboard</span>
            </h1>
            <p className="text-xs text-[var(--muted)] mt-1 font-medium">
              Showing data for: <span className="text-[var(--rust)] font-bold">{FILTER_LABELS[dateFilter]}</span>
              {loading && <RefreshCw className="inline-block w-3 h-3 ml-2 animate-spin opacity-60" />}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-white border border-[var(--border)] rounded-xl shadow-sm">
              {["today", "week", "month", "year"].map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setDateFilter(f);
                  }}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${dateFilter === f ? "bg-[var(--rust)] text-white shadow" : "text-[var(--muted)] hover:text-[var(--rust)]"}`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button onClick={handleExportReport} className="px-5 py-3 bg-[var(--bark)] text-white rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-[var(--rust)] transition-all shadow-md">
              <FileDown className="w-4 h-4" /> Export (.csv)
            </button>
          </div>
        </div>

        {/* 4 KPI summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard label="Total Revenue" value={loading ? "—" : `₱${(stats?.revenue || 0).toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} bg="bg-[var(--rust)]" textColor="text-white" />
          <KPICard label="Shop Orders"   value={loading ? "—" : (stats?.orders || 0)}                          icon={<ShoppingBag className="w-5 h-5" />} bg="bg-white" textColor="text-[var(--charcoal)]" />
          <KPICard label="Suki"          value={loading ? "—" : `${stats?.retention || '0'}%`}                 icon={<UserCheck className="w-5 h-5" />}   bg="bg-white" textColor="text-[var(--charcoal)]" />
          <KPICard label="Inquiries"     value={loading ? "—" : (stats?.inquiries || 0)}                       icon={<MessageCircle className="w-5 h-5" />} bg="bg-white" textColor="text-[var(--charcoal)]" />
        </div>



        {/* Revenue Trend Chart (Toggleable) */}
        <AnimatePresence>
          {showRevenueTrend && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginBottom: 0 }} 
              animate={{ opacity: 1, height: 'auto', marginBottom: 32 }} 
              exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
              className="bg-white rounded-[24px] border border-[var(--border)] p-6 md:p-8 shadow-sm"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-[var(--charcoal)] mb-1">Revenue trend</h3>
                  <div className="text-xs text-[var(--muted)] font-medium">
                    Financial performance · {FILTER_LABELS[dateFilter]}
                    {loading && <RefreshCw className="inline-block w-3 h-3 ml-2 animate-spin opacity-60" />}
                  </div>
                </div>
                <button 
                  onClick={() => setShowRevenueTrend(false)}
                  className="p-2.5 rounded-xl transition-all shadow-sm border bg-[var(--rust)] border-[var(--rust)] text-white hover:bg-[#a33520] hover:border-[#a33520]"
                  title="Hide Revenue Trend"
                >
                  <TrendingUp className="w-5 h-5 pointer-events-none" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-[#f7f6f2] rounded-2xl p-5">
                  <div className="text-xs font-semibold text-[var(--charcoal)] opacity-80 mb-2">Total revenue</div>
                  <div className="text-2xl font-semibold text-[var(--charcoal)] flex items-baseline gap-2">
                    ₱{(stats?.revenue || 0).toLocaleString()} <span className="text-xs font-medium text-[var(--muted)]">this period</span>
                  </div>
                </div>
                <div className="bg-[#f7f6f2] rounded-2xl p-5">
                  <div className="text-xs font-semibold text-[var(--charcoal)] opacity-80 mb-2">Units sold</div>
                  <div className="text-2xl font-semibold text-[var(--charcoal)] flex items-baseline gap-2">
                    {stats?.topProducts?.reduce((sum, p) => sum + p.sales, 0) || 0} <span className="text-xs font-medium text-[var(--muted)]">items (top 5)</span>
                  </div>
                </div>
                <div className="bg-[#f7f6f2] rounded-2xl p-5">
                  <div className="text-xs font-semibold text-[var(--charcoal)] opacity-80 mb-2">Avg. order</div>
                  <div className="text-2xl font-semibold text-[var(--charcoal)] flex items-baseline gap-2">
                    ₱{stats?.orders ? (stats.revenue / stats.orders).toFixed(1) : 0} <span className="text-xs font-medium text-[var(--muted)]">/ order</span>
                  </div>
                </div>
              </div>

              <div className="w-full h-[250px] relative">
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-[var(--muted)] animate-spin opacity-30" />
                  </div>
                ) : (
                  <ResponsiveContainer key={`trend-${filterKey}`} width="100%" height="100%">
                    <AreaChart data={stats.performance || []} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C0422A" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#C0422A" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5DDD5" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: "#8C7B70", fontWeight: "600" }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: "#8C7B70", fontWeight: "600" }}
                        tickFormatter={(v) => v === 0 ? "" : `₱${(v/1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        contentStyle={{ background: "#fff", border: "1px solid #E5DDD5", borderRadius: "12px", color: "#1c1917", padding: "10px 14px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                        itemStyle={{ color: "#C0422A", fontWeight: "bold" }}
                        labelStyle={{ fontWeight: "bold", fontSize: "11px", marginBottom: "4px", color: "#8c7b70" }}
                        formatter={(val) => [`₱${val.toLocaleString()}`, "Revenue"]}
                      />
                      <Area type="monotone" dataKey="sales" stroke="#C0422A" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" animationDuration={1000} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Products (New Layout) */}
        <div className="bg-white rounded-[24px] border border-[var(--border)] p-6 md:p-8 shadow-sm">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-[var(--charcoal)] mb-1">Top products</h3>
              <div className="text-xs text-[var(--muted)] font-medium">
                Most sold products · {FILTER_LABELS[dateFilter]}
              </div>
            </div>
            <button 
              onClick={() => setShowRevenueTrend(!showRevenueTrend)} 
              className={`p-2.5 rounded-xl transition-all shadow-sm border ${showRevenueTrend ? 'bg-[var(--rust)] border-[var(--rust)] text-white' : 'bg-white border-[var(--border)] text-[var(--rust)] hover:bg-[#FAF9F7]'}`}
              title={showRevenueTrend ? "Hide Revenue Trend" : "Show Revenue Trend"}
            >
              <BarChart3 className="w-5 h-5 pointer-events-none" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4 px-4 pb-2 text-[11px] font-semibold text-[var(--muted)] border-b border-[var(--border)]">
              <div className="col-span-3 flex items-end gap-1">
                <span>Product</span>
                <span className="text-[var(--charcoal)]">name</span>
              </div>
              <div className="col-span-2 flex items-end">category</div>
              <div className="col-span-3 flex items-end">Sales volume</div>
              <div className="col-span-2 flex items-end">Rating</div>
              <div className="col-span-2 flex items-end">Status</div>
            </div>

            {loading ? (
              <div className="py-12 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-[var(--muted)] animate-spin opacity-30" />
              </div>
            ) : (!stats.topProducts || stats.topProducts.length === 0) ? (
              <div className="py-12 text-center text-sm font-medium text-[var(--muted)]">
                No product sales yet in this period.
              </div>
            ) : (
              stats.topProducts.map((prod, i) => {
                const max = prod.maxSalesRef || 1;
                const pct = Math.max((prod.sales / max) * 100, 2);
                
                let statusColor = "bg-[#fcedeb] text-[#c95a46]";
                if (prod.status === "Top seller") statusColor = "bg-[#eaf5eb] text-[#3b8c4c]";
                else if (prod.status === "Trending") statusColor = "bg-[#fcf5e3] text-[#b88c35]";

                return (
                  <motion.div 
                    key={prod.id || i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="grid grid-cols-12 gap-4 items-center bg-[#f7f6f2] rounded-xl p-4 transition-all hover:bg-[#f1efe9]"
                  >
                    <div className="col-span-3 pr-4 flex flex-col justify-center">
                      <div className="text-[13px] font-bold text-[var(--charcoal)] leading-tight truncate">{prod.name}</div>
                    </div>

                    <div className="col-span-2 flex items-center pr-4">
                      <div className="text-[12px] font-semibold text-[var(--charcoal)] lowercase truncate">{prod.category || "formal"}</div>
                    </div>

                    <div className="col-span-3 pr-4">
                      <div className="flex items-center gap-2 mb-1.5 h-1.5 w-full bg-[#e3dfd7] rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.2 + (i * 0.1) }}
                          className="h-full bg-[var(--rust)] rounded-full"
                        />
                      </div>
                      <div className="text-[11px] font-medium text-[var(--charcoal)]">
                        {prod.sales} sold <span className="opacity-40">·</span> ₱{prod.revenue?.toLocaleString() || 0}
                      </div>
                    </div>

                    <div className="col-span-2 flex flex-col justify-center">
                      <div className="flex items-center gap-1 mb-1">
                        <div className="flex">
                          {[1,2,3,4,5].map(star => (
                            <svg key={star} className={`w-3 h-3 ${star <= Math.round(prod.rating) ? 'text-[#e56d4b] fill-current' : 'text-[#e3dfd7] fill-current'}`} viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-[12px] font-bold text-[var(--charcoal)] ml-1">{prod.rating?.toFixed(1) || "4.5"}</span>
                      </div>
                      <div className="text-[10px] text-[var(--muted)]">{prod.reviewsCount || 0} reviews</div>
                    </div>

                    <div className="col-span-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusColor} whitespace-nowrap`}>
                        {prod.status || "Trending"}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Sales Funnel — re-animates on each filter change using key */}
        <div className="artisan-card p-10">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-bold text-[var(--charcoal)] uppercase tracking-widest underline decoration-[var(--rust)] underline-offset-8">
              Workshop Sales Funnel
            </h3>
            <span className="text-xs text-[var(--muted)] font-bold">{FILTER_LABELS[dateFilter]}</span>
          </div>
          <div className="max-w-2xl mx-auto space-y-5" key={`funnel-${filterKey}`}>
            {funnelSteps.map((step, i) => {
              const pct = funnelMax > 0 ? Math.max((step.value / funnelMax) * 100, step.value > 0 ? 6 : 3) : 3;
              return (
                <FunnelBar
                  key={step.label}
                  label={step.label}
                  value={loading ? "—" : step.value.toLocaleString()}
                  pct={loading ? 3 : pct}
                  color={step.color}
                  delay={i * 0.12}
                />
              );
            })}
          </div>
        </div>

      </div>
    </SellerLayout>
  );
}

function KPICard({ label, value, icon, bg, textColor }) {
  return (
    <div className={`artisan-card p-8 flex flex-col justify-between h-[180px] group hover:scale-[1.02] relative overflow-hidden transition-all ${bg}`}>
      <div className="flex justify-between items-start relative z-10">
        <div className={`text-sm font-bold uppercase tracking-widest ${bg === "bg-white" ? "text-[var(--muted)]" : "text-white/60"}`}>{label}</div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg === "bg-white" ? "bg-[var(--cream)]" : "bg-white/20 text-white"}`}>
          {icon}
        </div>
      </div>
      <div className="relative z-10 flex items-center justify-between">
        <div className={`text-xl font-serif font-bold ${textColor}`}>{value}</div>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded-full border border-white/5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[7px] font-bold text-white/50 uppercase tracking-tighter">Live</span>
        </div>
      </div>
    </div>
  );
}

function FunnelBar({ label, value, pct, color, delay = 0 }) {
  return (
    <div className="flex items-center gap-6 group">
      <div className="w-36 text-right text-[10px] font-bold tracking-widest text-[var(--muted)] uppercase shrink-0">{label}</div>
      <div className="flex-1 h-14 bg-[var(--cream)] rounded-xl overflow-hidden relative">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: "circOut", delay }}
          style={{ backgroundColor: color }}
          className="h-full rounded-r-xl shadow-lg flex items-center justify-end px-6"
        >
          <span className="text-white font-bold text-sm tracking-tight">{value}</span>
        </motion.div>
      </div>
    </div>
  );
}
