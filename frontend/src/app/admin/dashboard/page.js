"use client";
import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  Activity,
  CloudRain,
  RefreshCw,
  Download,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
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
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { useSocket } from "@/context/SocketContext";

// ─── Fallback data (shown while loading) ────────────────────────────────────
const EMPTY_WEEK = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(n => ({ name: n, revenue: 0 }));
const EMPTY_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun"].map(n => ({ name: n, hits: 0 }));

// ─── Status color map ────────────────────────────────────────────────────────
const STATUS_META = {
  Pending:    { color: "bg-amber-100 text-amber-700",  icon: <Clock className="w-4 h-4 text-amber-500" /> },
  Processing: { color: "bg-blue-100 text-blue-700",    icon: <RefreshCw className="w-4 h-4 text-blue-500" /> },
  Shipped:    { color: "bg-indigo-100 text-indigo-700",icon: <Truck className="w-4 h-4 text-indigo-500" /> },
  Completed:  { color: "bg-green-100 text-green-700",  icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
  Delivered:  { color: "bg-green-100 text-green-700",  icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
  Cancelled:  { color: "bg-red-100 text-red-700",      icon: <XCircle className="w-4 h-4 text-red-500" /> },
};

const PIE_COLORS = ["#C0422A", "#E56D4B", "#8C7B70", "#B3A499", "#E5DDD5"];

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [showUserGrowth, setShowUserGrowth] = useState(false);
  const [showRevenueTrend, setShowRevenueTrend] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState("week");

  const [stats, setStats] = useState({
    totalSales: "—",
    totalOrders: "—",
    activeCustomers: "—",
    liveProducts: "—",
  });

  const [analytics, setAnalytics] = useState({
    revenueSeries: EMPTY_WEEK,
    monthlySignups: EMPTY_MONTHS,
    recentActivity: [],
    topLocations: [],
    orderStatusBreakdown: { pending: 0, processing: 0, shipped: 0, completed: 0, cancelled: 0 },
    topProducts: [],
    topCategories: [],
  });

  const { socket } = useSocket();

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get(`/admin/stats?range=${dateFilter}`);
      setStats(res.data);
    } catch (err) {
      console.warn("Stats fetch failed", err.message);
    }
  }, [dateFilter]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await api.get(`/admin/analytics?range=${dateFilter}`);
      const d = res.data;
      setAnalytics({
        revenueSeries: d.revenueSeries || [],
        monthlySignups: d.monthlySignups || EMPTY_MONTHS,
        recentActivity: d.recentActivity || [],
        topLocations: d.topLocations || [],
        orderStatusBreakdown: d.orderStatusBreakdown || { pending: 0, processing: 0, shipped: 0, completed: 0, cancelled: 0 },
        topProducts: d.topProducts || [],
        topCategories: d.topCategories || [],
      });
    } catch (err) {
      console.warn("Analytics fetch failed", err.message);
    }
  }, [dateFilter]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchAnalytics()]);
    setRefreshing(false);
  }, [fetchStats, fetchAnalytics]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) refresh();
  }, [mounted, dateFilter, refresh]);

  // Real-time socket updates
  useEffect(() => {
    if (!socket) return;
    const handler = () => refresh();
    socket.on("stats_update", handler);
    socket.on("order_created", handler);
    socket.on("order_updated", handler);
    socket.on("user_updated", handler);
    return () => {
      socket.off("stats_update", handler);
      socket.off("order_created", handler);
      socket.off("order_updated", handler);
      socket.off("user_updated", handler);
    };
  }, [socket, refresh]);

  const handleDownloadReport = () => {
    const rows = [
      ["Metric", "Value"],
      ["Total Sales", stats.totalSales],
      ["Total Orders", stats.totalOrders],
      ["Active Customers", stats.activeCustomers],
      ["Live Products", stats.liveProducts],
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lumbarong_report_${new Date().toLocaleDateString("en-CA")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };



  if (!mounted) return null;

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8 lg:space-y-10 mb-16 sm:mb-20 animate-fade-down">
        {/* Page Heading */}
        <div className="flex flex-col gap-4 md:gap-6">
          <div>
            <div className="eyebrow">Enterprise Overview</div>
            <h1 className="font-serif text-charcoal text-2xl md:text-3xl font-bold tracking-tight">
              Dashboard <span className="text-[var(--muted)] opacity-40 font-light italic">Insights</span>
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-white border border-[var(--border)] rounded-xl shadow-sm flex-wrap sm:flex-nowrap">
              {["today", "week", "month", "year"].map(f => (
                <button
                  key={f}
                  onClick={() => setDateFilter(f)}
                  className={`px-3 sm:px-4 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${dateFilter === f ? "bg-[var(--rust)] text-white shadow" : "text-[var(--muted)] hover:text-[var(--rust)]"}`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              <button
                onClick={refresh}
                disabled={refreshing}
                className="p-2.5 bg-white border border-[var(--border)] rounded-xl hover:border-[var(--rust)] hover:text-[var(--rust)] transition-all shadow-sm flex-shrink-0"
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[var(--rust)]" : ""}`} />
              </button>
              <button
                onClick={handleDownloadReport}
                className="flex items-center gap-2 px-3 sm:px-5 py-2.5 bg-[var(--bark)] text-white rounded-xl text-[9px] sm:text-xs font-bold uppercase tracking-widest hover:bg-[var(--rust)] transition-all whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Download Report</span>
                <span className="sm:hidden">Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard label="Total Sales"       value={stats.totalSales}       icon={<DollarSign className="w-4 h-4" />} color="rust"  loading={refreshing} />
          <StatCard label="Total Orders"      value={stats.totalOrders}      icon={<ShoppingBag className="w-4 h-4" />} color="blue"  loading={refreshing} />
          <StatCard label="Active Customers"  value={stats.activeCustomers}  icon={<Users className="w-4 h-4" />}     color="green" loading={refreshing} />
          <StatCard label="Live Products"     value={stats.liveProducts}     icon={<Package className="w-4 h-4" />}   color="amber" loading={refreshing} />
        </div>

        {/* Primary Functional Graphs */}
        <div className="space-y-6">
          {/* Revenue Trend */}
          <div className="artisan-card flex flex-col justify-start">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 pb-2 gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[var(--charcoal)] mb-1">Revenue Trend</h3>
                <div className="text-xs text-[var(--muted)] tracking-wider capitalize">Total earnings • {dateFilter} view</div>
              </div>
            </div>

            <div className="h-[250px] sm:h-[300px] mt-4 sm:mt-6">
              <ResponsiveContainer width="100%" height="100%" key={`revenue-${dateFilter}`}>
                      <AreaChart data={analytics.revenueSeries}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#C0422A" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#C0422A" stopOpacity={0} />
                          </linearGradient>
                        </defs>
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
                          tick={{ fontSize: 10, fill: "#8C7B70" }}
                          tickFormatter={(val) => `₱${val.toLocaleString()}`}
                        />
                        <Tooltip 
                          contentStyle={{ background: "#fff", borderRadius: "14px", border: "1px solid #E5DDD5", fontSize: "12px", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} 
                          labelStyle={{ fontWeight: "bold", color: "#2A2A2A" }} 
                          formatter={(val) => [`₱${val.toLocaleString()}`, "Revenue"]}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#C0422A" 
                          strokeWidth={4} 
                          fillOpacity={1} 
                          fill="url(#colorRevenue)" 
                          animationDuration={1500} 
                        />
                      </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* User Signups Area Chart */}
          <div className="artisan-card flex flex-col justify-start">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 pb-2 gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[var(--charcoal)] mb-1">User Growth</h3>
                <div className="text-xs text-[var(--muted)] tracking-wider capitalize">New registrations • {dateFilter} view</div>
              </div>
            </div>

            <div className="h-[250px] sm:h-[280px] mt-4 sm:mt-6">
              <ResponsiveContainer width="100%" height="100%" key={`growth-${dateFilter}`}>
                      <AreaChart data={analytics.monthlySignups}>
                        <defs>
                          <linearGradient id="colorHits" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#C0422A" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#C0422A" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#8C7B70", fontWeight: "600" }} />
                        <Tooltip contentStyle={{ background: "#fff", borderRadius: "14px", border: "1px solid #E5DDD5", fontSize: "12px" }} labelStyle={{ fontWeight: "bold" }} />
                        <Area type="monotone" dataKey="hits" stroke="#C0422A" strokeWidth={3} fillOpacity={1} fill="url(#colorHits)" animationDuration={1200} />
                      </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Locations */}
          <div className="artisan-card min-h-[400px] flex flex-col">
            <h3 className="text-lg font-bold text-[var(--charcoal)] mb-6 underline decoration-[var(--border)] decoration-4 underline-offset-8">
              Orders by Location
            </h3>
            {analytics.topLocations.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-[var(--muted)] text-sm italic opacity-50">
                No location data yet
              </div>
            ) : (
              <div className="space-y-6 flex-1 flex flex-col justify-center">
                {analytics.topLocations.map((loc, i) => {
                  const maxCount = Math.max(...analytics.topLocations.map(l => l.count), 1);
                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold tracking-widest">
                        <span>{loc.city.toUpperCase()}</span>
                        <span className="text-[var(--muted)] opacity-60">{loc.count} orders</span>
                      </div>
                      <div className="h-2 w-full bg-[var(--cream)] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${(loc.count / maxCount) * 100}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: i * 0.1 }}
                          className="h-full bg-[var(--rust)] rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {Object.entries(analytics.orderStatusBreakdown).map(([status, count]) => {
            const label = status.charAt(0).toUpperCase() + status.slice(1);
            const meta = STATUS_META[label] || STATUS_META.Pending;
            return (
              <div key={status} className="artisan-card p-3 sm:p-5 flex flex-col items-center gap-2 text-center">
                <div className={`w-8 sm:w-10 h-8 sm:h-10 rounded-xl flex items-center justify-center ${meta.color}`}>
                  {meta.icon}
                </div>
                <div className="text-xl sm:text-2xl font-serif font-bold text-[var(--charcoal)]">{count}</div>
                <div className="text-[9px] sm:text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">{label}</div>
              </div>
            );
          })}
        </div>

        {/* Global Network Tops */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 my-6 lg:my-8">
          
          {/* Best Selling Products */}
          <div className="artisan-card flex flex-col min-h-[400px]">
            <h3 className="text-base sm:text-lg font-bold text-[var(--charcoal)] mb-4 sm:mb-6 underline decoration-[var(--border)] decoration-4 underline-offset-8">
              Top Selling Products
            </h3>
            {!analytics.topProducts || analytics.topProducts.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-[var(--muted)] text-sm italic opacity-50">
                No product sales in this period
              </div>
            ) : (
              <div className="flex-1 flex flex-col space-y-3 sm:space-y-4">
                <div className="grid grid-cols-12 gap-2 px-2 pb-2 text-[8px] sm:text-[10px] uppercase font-bold tracking-widest text-[var(--muted)] border-b border-[var(--border)]">
                  <div className="col-span-6">Product</div>
                  <div className="col-span-3 text-right">Sales</div>
                  <div className="col-span-3 text-right">Revenue</div>
                </div>
                {analytics.topProducts.slice(0, 5).map((prod, i) => {
                  const maxSales = Math.max(...analytics.topProducts.map(p => p.sales), 1);
                  const pct = Math.max((prod.sales / maxSales) * 100, 2);
                  return (
                    <motion.div
                      key={prod.id || i}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="grid grid-cols-12 gap-2 items-center bg-[#f7f6f2] rounded-xl p-2 sm:p-3 hover:bg-[#FAF9F7] transition-all"
                    >
                      <div className="col-span-6 overflow-hidden">
                        <div className="text-[11px] sm:text-[12px] font-bold text-[var(--charcoal)] truncate pr-2">{prod.name}</div>
                        <div className="text-[9px] sm:text-[10px] text-[var(--muted)] lowercase">{prod.category}</div>
                      </div>
                      <div className="col-span-3 pr-2">
                        <div className="flex items-center gap-2 mb-1.5 h-1.5 w-full bg-[#e3dfd7] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.1 + (i * 0.1) }}
                            className="h-full bg-[var(--rust)] rounded-full"
                          />
                        </div>
                        <div className="text-[9px] sm:text-[10px] font-bold text-right w-full text-[var(--charcoal)]">{prod.sales} sold</div>
                      </div>
                      <div className="col-span-3 text-right text-[10px] sm:text-[11px] font-bold text-[var(--rust)]">
                        ₱{prod.revenue?.toLocaleString() || 0}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Categories Donut */}
          <div className="artisan-card flex flex-col min-h-[400px]">
            <h3 className="text-base sm:text-lg font-bold text-[var(--charcoal)] mb-4 sm:mb-6 underline decoration-[var(--border)] decoration-4 underline-offset-8">
              Top Categories
            </h3>
            {!analytics.topCategories || analytics.topCategories.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-[var(--muted)] text-sm italic opacity-50">
                No category data yet
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-full h-[200px] sm:h-[220px]">
                  <ResponsiveContainer width="100%" height="100%" key={`categories-${dateFilter}`}>
                    <PieChart>
                      <Pie
                        data={analytics.topCategories}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                        animationDuration={1500}
                        stroke="none"
                      >
                        {analytics.topCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "#fff", border: "1px solid #E5DDD5", borderRadius: "12px", fontSize: "11px" }}
                        itemStyle={{ fontWeight: "bold" }}
                        formatter={(val) => [`${val} items`, "Sales"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Custom Legend */}
                <div className="w-full mt-3 sm:mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-2 sm:px-4">
                  {analytics.topCategories.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                       <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></span>
                       <span className="text-[10px] sm:text-[11px] font-bold text-[var(--charcoal)] uppercase tracking-wider">{entry.name}</span>
                       <span className="text-[9px] sm:text-[11px] text-[var(--muted)]">({entry.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </AdminLayout>
  );
}

function StatCard({ label, value, icon, color, loading }) {
  const colorMap = {
    rust:  "bg-[rgba(192,66,42,0.1)] text-[var(--rust)]",
    blue:  "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <motion.div whileHover={{ y: -4 }} className="artisan-card group cursor-pointer relative overflow-hidden">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className={`w-8 sm:w-10 h-8 sm:h-10 rounded-xl flex items-center justify-center transition-all ${colorMap[color]}`}>
          {icon}
        </div>
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Live" />
      </div>
      {loading ? (
        <div className="h-5 sm:h-6 w-16 sm:w-20 bg-[var(--cream)] animate-pulse rounded-lg mb-1" />
      ) : (
        <div className="text-lg sm:text-xl font-serif font-bold text-[var(--charcoal)] group-hover:text-[var(--rust)] transition-colors mb-1">
          {value}
        </div>
      )}
      <div className="text-[9px] sm:text-[10px] font-bold text-[var(--muted)] opacity-60 uppercase tracking-widest">
        {label}
      </div>
    </motion.div>
  );
}
