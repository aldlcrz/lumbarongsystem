"use client";
import React, { useState, useEffect } from "react";
import CustomerLayout from "@/components/CustomerLayout";
import { 
  Copy, 
  Calendar, 
  Search, 
  RefreshCw,
  Clock,
  Star,
  ChevronRight,
  Package,
  ShoppingBag,
  Loader2,
  X,
  MapPin,
  CreditCard,
  CheckCircle,
  XCircle,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { useSocket } from "@/context/SocketContext";
import { normalizeProductImages, getProductImageSrc } from "@/lib/productImages";
import ConfirmationModal from "@/components/ConfirmationModal";

const STAR_LABELS = { 1: "Terrible", 2: "Bad", 3: "Okay", 4: "Good", 5: "Perfect!" };

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false);
  const [newlyCompletedOrderId, setNewlyCompletedOrderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Shopee-style: Per-item rating modal
  const [ratingModal, setRatingModal] = useState(null); // { orderId, item }
  const [ratingData, setRatingData] = useState({ rating: 5, comment: "" });
  // Track which productIds have been rated this session
  const [ratedProducts, setRatedProducts] = useState({});
  const [actionLoading, setActionLoading] = useState(false);

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnData, setReturnData] = useState({ orderId: null, reason: "" });

  const handleCopy = (id) => {
    navigator.clipboard.writeText(`LB-OR-${id.toString().slice(-8).toUpperCase()}`);
    setSuccess("Order ID copied to clipboard.");
    setTimeout(() => setSuccess(null), 3000);
  };

  const openRatingModal = (orderId, item) => {
    setRatingModal({ orderId, item });
    setRatingData({ rating: 5, comment: "" });
  };

  const submitRating = async () => {
    if (!ratingModal?.item?.product?.id) {
      setError("No product found to rate.");
      setTimeout(() => setError(null), 3000);
      return;
    }
    try {
      setActionLoading(true);
      await api.post(`/products/${ratingModal.item.product.id}/reviews`, {
        rating: ratingData.rating,
        comment: ratingData.comment,
      });
      // Mark this product as rated so the button turns into a badge
      setRatedProducts((prev) => ({ ...prev, [ratingModal.item.product.id]: ratingData.rating }));
      setSuccess("Thank you! Your review has been posted.");
      setRatingModal(null);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit rating.");
      setTimeout(() => setError(null), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  const openReturnModal = (order) => {
    setReturnData({ orderId: order.id, reason: "" });
    setReturnModalOpen(true);
  };

  const submitReturn = async () => {
    if (!returnData.reason.trim()) {
      setError("Please enter a reason.");
      setTimeout(() => setError(null), 3000);
      return;
    }
    try {
      setActionLoading(true);
      await api.post("/returns", { orderId: returnData.orderId, reason: returnData.reason });
      setSuccess("Return request submitted.");
      setReturnModalOpen(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to submit return: " + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  const tabs = [
    { key: "ALL",         label: "ALL",       short: "ALL" },
    { key: "PENDING",     label: "PENDING",   short: "PENDING" },
    { key: "TO SHIP",     label: "TO SHIP",   short: "TO SHIP" },
    { key: "TO RECEIVE", label: "TO RECEIVE", short: "TO RCV" },
    { key: "COMPLETED",  label: "COMPLETED",  short: "DONE" },
    { key: "CANCELLED",  label: "CANCELLED",  short: "CANCLD" },
  ];

  const getDisplayStatus = (status) => {
    switch (status?.toLowerCase()) {
      case "pending": return "PENDING";
      case "processing":
      case "to ship": return "TO SHIP";
      case "shipped":
      case "to receive": return "TO RECEIVE";
      case "delivered": return "DELIVERED";
      case "completed": return "COMPLETED";
      case "cancelled": return "CANCELLED";
      default: return "PENDING";
    }
  };

  const getStatusStyle = (status) => {
    switch (getDisplayStatus(status)) {
      case "PENDING": return { border: "border-yellow-200", text: "text-yellow-600", dot: "bg-yellow-500" };
      case "TO SHIP": return { border: "border-blue-200", text: "text-blue-600", dot: "bg-blue-500" };
      case "TO RECEIVE": return { border: "border-blue-200", text: "text-blue-600", dot: "bg-blue-500" };
      case "DELIVERED": return { border: "border-green-200", text: "text-green-600", dot: "bg-green-500" };
      case "COMPLETED": return { border: "border-green-400", text: "text-green-700", dot: "bg-green-600" };
      case "CANCELLED": return { border: "border-red-200", text: "text-red-500", dot: "bg-red-500" };
      default: return { border: "border-gray-200", text: "text-gray-500", dot: "bg-gray-500" };
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get("/orders/my-orders");
      setOrders(response.data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setError(null); setSuccess(null);
    try {
      await api.patch(`/orders/${orderId}/cancel`, {});
      setSuccess("Order cancelled successfully.");
      setTimeout(() => setSuccess(null), 3000);
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel order. Please try again.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleConfirmReceipt = async (orderId) => {
    if (!confirm("Have you received all items in this order? This will release payment to the artisan.")) return;
    setActionLoading(true);
    setError(null);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: "Completed" });
      setSuccess("Thank you for confirming! Please leave a review for the artisan.");
      setNewlyCompletedOrderId(orderId);
      setShowFeedbackPrompt(true);
      setTimeout(() => setSuccess(null), 4000);
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to confirm receipt.");
      setTimeout(() => setError(null), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  const { socket } = useSocket();

  useEffect(() => {
    fetchOrders();
    if (socket) {
      socket.on("order_status_update", (data) => {
        setOrders((prev) =>
          prev.map((order) => (order.id === data.orderId ? { ...order, status: data.status } : order))
        );
      });
      socket.on("new_order_confirmed", fetchOrders);
    }
    return () => {
      if (socket) {
        socket.off("order_status_update");
        socket.off("new_order_confirmed");
      }
    };
  }, [socket]);

  const filteredOrders = orders.filter((order) => {
    const matchesTab = activeTab === "ALL" || getDisplayStatus(order.status) === activeTab;
    const matchesSearch =
      String(order.id).includes(searchQuery) ||
      order.items?.some((i) => i.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const getSafeImage = (imgSrc) => getProductImageSrc(imgSrc);

  const getParsedAddress = (address) => {
    if (!address) return {};
    if (typeof address === "string") {
      try { return JSON.parse(address); } catch (e) { return {}; }
    }
    return address;
  };

  return (
    <CustomerLayout>
      <div className="max-w-[1024px] mx-auto space-y-6 mb-20 px-4 md:px-0">

        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6 pb-4 sm:pb-6">
          <div className="space-y-2 sm:space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-4 sm:w-6 h-[2.5px] bg-[var(--rust)]"></span>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--rust)]">MY ACCOUNT</span>
            </div>
            <h1 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#2A2A2A]">
              My <span className="text-[var(--rust)] italic font-medium">Orders</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="relative group flex-1 sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders..."
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-[var(--border)] rounded-xl text-[11px] sm:text-xs font-medium text-[#2A2A2A] placeholder:text-[var(--muted)] outline-none focus:border-[var(--rust)] focus:ring-1 focus:ring-[var(--rust)] transition-all shadow-sm"
              />
            </div>
            <button onClick={fetchOrders} className="p-2.5 sm:p-3 bg-white border border-[var(--border)] rounded-xl hover:text-[var(--rust)] hover:bg-[#FDFCFB] transition-colors shadow-sm active:scale-95">
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--muted)] hover:text-[var(--rust)] transition-all" />
            </button>
          </div>
        </div>

        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-[1rem] text-sm font-bold flex items-center gap-2 mb-6">
              <XCircle className="w-5 h-5 text-red-500" /> {error}
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-[1rem] text-sm font-bold flex items-center gap-2 mb-6">
              <CheckCircle className="w-5 h-5 text-green-500" /> {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs - Grid on mobile, row on desktop */}
        <div className="border-b border-[var(--border)]">
          {/* Mobile: 3-column grid with full labels, smaller text */}
          <div className="grid grid-cols-3 sm:hidden">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`py-2.5 px-1 text-[8px] font-bold uppercase tracking-[0.04em] transition-all border-b-2 outline-none focus:outline-none text-center leading-tight ${
                  activeTab === key
                    ? "border-[var(--rust)] text-[var(--rust)] bg-[var(--rust)]/5"
                    : "border-transparent text-[#2A2A2A]/40"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Desktop: single row */}
          <div className="hidden sm:flex gap-1">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-6 py-4 text-xs font-bold uppercase tracking-[0.1em] transition-all whitespace-nowrap border-b-2 outline-none focus:outline-none ${
                  activeTab === key
                    ? "border-[var(--rust)] text-[var(--rust)]"
                    : "border-transparent text-[#2A2A2A]/40 hover:text-[#2A2A2A]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-4"></div>

        {/* Orders List */}
        <div className="space-y-6">
          {loading ? (
            <div className="py-24 text-center">
              <Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--muted)] opacity-50 mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest text-[var(--muted)]">Loading Orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 sm:py-24 text-center bg-white rounded-[1.5rem] border border-[var(--border)] shadow-sm px-6">
              <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-[var(--muted)] opacity-20 mb-4 sm:mb-6" />
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#2A2A2A] mb-2">No Records Found</h3>
              <p className="text-xs sm:text-sm text-[var(--muted)] italic">No orders found matching your current filter.</p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredOrders.map((order, idx) => {
                const displayStatus = getDisplayStatus(order.status);
                const sProps = getStatusStyle(order.status);
                const isCompleted = displayStatus === "COMPLETED";

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`bg-white rounded-[1.5rem] border border-[var(--border)] shadow-sm overflow-hidden ${newlyCompletedOrderId === order.id ? "ring-2 ring-amber-400" : ""}`}
                  >
                    {/* Card Header */}
                    <div className="px-5 sm:px-8 py-4 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                        <div className="flex items-center gap-1.5">
                          ORDER ID{" "}
                          <span className="text-[#2A2A2A] tracking-normal">LB-OR-{order.id.toString().slice(-8).toUpperCase()}</span>
                          <button onClick={(e) => { e.stopPropagation(); handleCopy(order.id); }} className="ml-1 hover:text-[var(--rust)] transition-colors">
                            <Copy className="w-3.5 h-3.5 opacity-60" />
                          </button>
                        </div>
                        <div className="w-px h-3 bg-[var(--border)] hidden sm:block" />
                        <div className="flex items-center gap-1.5 opacity-80">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(order.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                      </div>
                      <div className={`px-3 sm:px-4 py-1.5 rounded-full border flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest ${sProps.border} ${sProps.text} bg-white`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${sProps.dot}`} /> {displayStatus}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 sm:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8">

                      {/* LEFT: Items — each gets its own Rate button (Shopee-style) */}
                      <div className="flex-1 space-y-4">
                        {order.items?.map((item, i) => {
                          const priceNum = parseFloat(item.price?.toString().replace(/[^0-9.]/g, "") || 0);
                          const productId = item.product?.id;
                          const isRated = !!ratedProducts[productId];
                          const ratedStars = ratedProducts[productId];

                          return (
                            <div key={i} className="bg-[#FDFBF9] rounded-2xl p-4 sm:p-5 border border-[var(--cream)] shadow-sm">
                              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                                {/* Thumbnail */}
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white border border-[var(--border)] flex items-center justify-center rounded-xl shrink-0 p-1">
                                  {item.product?.image ? (
                                    <img src={getProductImageSrc(item.product.image)} alt={item.product.name} className="w-full h-full object-cover rounded-md" />
                                  ) : (
                                    <Package className="w-6 h-6 text-gray-300" />
                                  )}
                                </div>

                                {/* Details + Rate button */}
                                <div className="flex-1 flex flex-col sm:flex-row items-center sm:items-start justify-between w-full gap-4 text-center sm:text-left">
                                  <div className="space-y-2">
                                    <div className="text-[15px] font-bold text-[#2A2A2A]">{item.product?.name || "Lumbarong Product"}</div>
                                    <div className="flex items-center justify-center sm:justify-start gap-2">
                                      <span className="bg-[#EAE5DF] text-[#2A2A2A]/70 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest shadow-sm">Qty: {item.quantity}</span>
                                      <span className="bg-[#EAE5DF] text-[#2A2A2A]/70 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest shadow-sm">Size: {item.size || "M"}</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <div className="font-serif text-[18px] sm:text-[20px] font-bold text-[var(--rust)]">
                                      ₱{(priceNum || 0).toLocaleString()}
                                    </div>
                                    {/* Shopee-style: Rate → Rated badge per item */}
                                    {isCompleted && (
                                      isRated ? (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-[10px] font-extrabold text-green-700 uppercase tracking-widest">
                                          <Check className="w-3 h-3" /> Rated {ratedStars}★
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => openRatingModal(order.id, item)}
                                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-full text-[10px] font-extrabold uppercase tracking-widest transition-all active:scale-95"
                                        >
                                          <Star className="w-3 h-3 fill-current" /> Rate
                                        </button>
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* RIGHT: Actions & Totals */}
                      <div className="lg:w-64 shrink-0 flex flex-col lg:items-end border-t lg:border-t-0 lg:border-l border-[var(--border)] pt-6 lg:pt-0 lg:pl-8 mt-2 lg:mt-0">
                        <div className="w-full flex lg:flex-col justify-between items-center lg:items-end gap-1 mb-6">
                          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--muted)] opacity-60">ORDER TOTAL</span>
                          <div className="text-right">
                            <div className="font-serif text-[28px] lg:text-[32px] font-bold text-[var(--rust)] leading-none mb-1">₱{(order.totalAmount || 0).toLocaleString()}</div>
                            <div className="text-[10px] text-[var(--muted)] tracking-wider">{order.items?.length || 1} item{(order.items?.length || 1) !== 1 ? "s" : ""}</div>
                          </div>
                        </div>
                        <div className="w-full space-y-3">
                          <button onClick={() => setSelectedOrder(order)} className="w-full py-3.5 bg-[#2A1E14] hover:bg-[#1C140D] text-white rounded-xl text-[10px] font-extrabold uppercase tracking-[0.15em] transition-colors shadow-md flex items-center justify-center gap-2 group">
                            View Details <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </button>

                          {displayStatus === "DELIVERED" && (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); handleConfirmReceipt(order.id); }} className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-[0.15em] transition-colors shadow-md flex items-center justify-center gap-2 group">
                                <Check className="w-3.5 h-3.5" /> Confirm Receipt
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); openReturnModal(order); }} className="w-full py-3.5 bg-white hover:bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-extrabold uppercase tracking-[0.15em] transition-colors flex items-center justify-center gap-2 group shadow-sm">
                                <RefreshCw className="w-3.5 h-3.5" /> Request Return
                              </button>
                            </>
                          )}

                          {displayStatus === "CANCELLED" && (
                            <div className="text-center text-[10px] italic text-red-500/60 mt-2 bg-red-50 py-2 rounded-lg border border-red-100 uppercase tracking-widest font-bold">Order Cancelled</div>
                          )}

                          {displayStatus === "PENDING" && (
                            <button onClick={(e) => { e.stopPropagation(); handleCancelOrder(order.id); }} className="w-full py-3.5 bg-white hover:bg-red-50 text-red-500 border border-red-100 rounded-xl text-[10px] font-extrabold uppercase tracking-[0.15em] transition-colors shadow-sm flex items-center justify-center gap-2 group mt-2">
                              <X className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" /> Cancel Order
                            </button>
                          )}

                          {displayStatus !== "CANCELLED" && displayStatus !== "COMPLETED" && displayStatus !== "PENDING" && (
                            <div className="text-center text-[10px] italic text-[var(--muted)] opacity-60 mt-2">Cancellation not available</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {}}
        title="Signing Out?"
        message="Are you sure you want to end your session? We'd love to see you back soon!"
        confirmText="Yes, Logout"
        cancelText="Cancel"
        type="danger"
      />

      <ConfirmationModal
        isOpen={showFeedbackPrompt}
        onClose={() => setShowFeedbackPrompt(false)}
        onConfirm={() => {
            setShowFeedbackPrompt(false);
            setActiveTab("COMPLETED");
        }}
        title="Share Your Experience"
        message="Would you like to leave a review for this artisan? Your feedback helps the Lumban community grow."
        confirmText="Leave Feedback"
        cancelText="Maybe Later"
        type="info"
      />

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="absolute inset-0 bg-[#2A1E14]/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[2rem] shadow-2xl relative z-10 overflow-hidden flex flex-col border border-white/20">
              <div className="px-8 py-6 border-b border-[var(--border)] flex items-center justify-between bg-[#FDFCFB]">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#2A2A2A]">Order Details</h2>
                  <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mt-1">
                    LB-OR-{selectedOrder.id.toString().slice(-8).toUpperCase()} • {new Date(selectedOrder.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2.5 bg-white border border-[var(--border)] rounded-xl hover:text-[var(--rust)] transition-all active:scale-90 shadow-sm">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-8 artisan-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-extrabold text-[var(--rust)] uppercase tracking-widest opacity-80"><MapPin className="w-3 h-3" /> SHIPPING ADDRESS</div>
                    <div className="bg-[#FDFBF9] p-4 rounded-2xl border border-[var(--cream)] shadow-sm">
                      <div className="font-bold text-[#2A2A2A] text-sm mb-1">{getParsedAddress(selectedOrder.shippingAddress)?.name || "Registry Name Missing"}</div>
                      <div className="text-[10px] font-bold text-[var(--rust)] mb-2">{getParsedAddress(selectedOrder.shippingAddress)?.phone || "Phone Missing"}</div>
                      <div className="text-xs text-[var(--muted)] leading-relaxed min-h-[3rem]">
                        {!(getParsedAddress(selectedOrder.shippingAddress)?.houseNo || getParsedAddress(selectedOrder.shippingAddress)?.street || getParsedAddress(selectedOrder.shippingAddress)?.barangay) ? (
                          <div className="italic opacity-40 py-2 uppercase text-[9px] font-bold tracking-widest text-[#2A2118]">Archived Registry Data Unavailable</div>
                        ) : (
                          <>
                            {getParsedAddress(selectedOrder.shippingAddress)?.houseNo && <span>{getParsedAddress(selectedOrder.shippingAddress).houseNo} </span>}
                            {getParsedAddress(selectedOrder.shippingAddress)?.street && <span>{getParsedAddress(selectedOrder.shippingAddress).street}, </span>}
                            <br />
                            {getParsedAddress(selectedOrder.shippingAddress)?.barangay && <span>Brgy. {getParsedAddress(selectedOrder.shippingAddress).barangay}, </span>}
                            {getParsedAddress(selectedOrder.shippingAddress)?.city && <span>{getParsedAddress(selectedOrder.shippingAddress).city}, </span>}
                            <br />
                            {getParsedAddress(selectedOrder.shippingAddress)?.province && <span>{getParsedAddress(selectedOrder.shippingAddress).province}, </span>}
                            {getParsedAddress(selectedOrder.shippingAddress)?.postalCode && <span>{getParsedAddress(selectedOrder.shippingAddress).postalCode}</span>}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-extrabold text-[var(--rust)] uppercase tracking-widest opacity-80"><CreditCard className="w-3 h-3" /> PAYMENT METHOD</div>
                    <div className="bg-[#FDFBF9] p-4 rounded-2xl border border-[var(--cream)] shadow-sm">
                      <div className="font-bold text-[#2A2A2A] text-sm mb-1">{selectedOrder.paymentMethod || "GCash"}</div>
                      <div className="text-xs text-[var(--muted)]">Reference: <span className="font-mono text-[var(--rust)]">{selectedOrder.paymentReference || "N/A"}</span></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-extrabold text-[var(--rust)] uppercase tracking-widest opacity-80"><Clock className="w-3 h-3" /> ORDER STATUS</div>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest ${getStatusStyle(selectedOrder.status).border} ${getStatusStyle(selectedOrder.status).text}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${getStatusStyle(selectedOrder.status).dot}`} />
                    {selectedOrder.status}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-extrabold text-[var(--rust)] uppercase tracking-widest opacity-80"><ShoppingBag className="w-3 h-3" /> PURCHASED ITEMS</div>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, i) => (
                      <div key={i} className="flex gap-4 p-4 bg-white border border-[var(--border)] rounded-2xl shadow-sm">
                        <div className="w-14 h-14 bg-[#FDFBF9] rounded-xl border border-[var(--border)] flex items-center justify-center p-1 shrink-0 overflow-hidden">
                          <img src={getSafeImage(item.product?.image)} alt="" className="w-full h-full object-cover rounded-lg" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[#2A2A2A] text-sm truncate">{item.product?.name}</div>
                          <div className="text-[10px] text-[var(--muted)] mt-0.5">Qty: {item.quantity} • Size: {item.size}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-serif font-bold text-[16px] text-[var(--rust)]">₱{Number(item.price || 0).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-8 py-6 bg-[#FDFCFB] border-t border-[var(--border)] flex items-center justify-between">
                <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">SUBTOTAL AMOUNT</span>
                <div className="font-serif text-3xl font-bold text-[var(--rust)]">₱{Number(selectedOrder.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Return Modal */}
      <AnimatePresence>
        {returnModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setReturnModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md relative z-10 space-y-4 border border-[var(--border)]">
              <h3 className="font-serif text-2xl font-bold text-[#2A2A2A]">Request Return</h3>
              <p className="text-sm text-[var(--muted)]">Please explain why you need to return this order.</p>
              <textarea
                value={returnData.reason}
                onChange={(e) => setReturnData({ ...returnData, reason: e.target.value })}
                placeholder="Reason for return..."
                className="w-full p-3 border border-[var(--border)] rounded-xl text-sm min-h-[100px] outline-none focus:border-[var(--rust)] transition-colors"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setReturnModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-bold text-[var(--muted)] hover:bg-gray-100 transition-colors">Cancel</button>
                <button onClick={submitReturn} disabled={actionLoading} className="px-4 py-2 bg-[var(--rust)] text-white rounded-lg text-sm font-bold shadow-md disabled:opacity-50 flex items-center justify-center min-w-[100px]">
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Request"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Shopee-style Rating Modal */}
      <AnimatePresence>
        {ratingModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setRatingModal(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 border border-[var(--border)] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)] bg-[#FDFCFB]">
                <h3 className="font-serif text-xl font-bold text-[#2A2A2A]">Rate Product</h3>
                <button onClick={() => setRatingModal(null)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <X className="w-4 h-4 text-[var(--muted)]" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Product info strip */}
                <div className="flex items-center gap-4 p-4 bg-[#FDFBF9] rounded-2xl border border-[var(--cream)]">
                  <div className="w-14 h-14 rounded-xl border border-[var(--border)] bg-white overflow-hidden shrink-0">
                    {ratingModal.item.product?.image ? (
                      <img src={getProductImageSrc(ratingModal.item.product.image)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-gray-300 m-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-[#2A2A2A] text-sm truncate">{ratingModal.item.product?.name || "Product"}</div>
                    <div className="text-[10px] text-[var(--muted)] mt-0.5 uppercase tracking-wider">
                      Qty: {ratingModal.item.quantity} · Size: {ratingModal.item.size}
                    </div>
                  </div>
                </div>

                {/* Star picker with Shopee-style labels */}
                <div className="text-center space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">Product Quality</p>
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRatingData((prev) => ({ ...prev, rating: star }))}
                        className="transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star className={`w-10 h-10 transition-colors ${star <= ratingData.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                      </button>
                    ))}
                  </div>
                  {/* Animated star label */}
                  <motion.p
                    key={ratingData.rating}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm font-bold"
                    style={{ color: ratingData.rating <= 2 ? "#C0422A" : ratingData.rating === 3 ? "#9c6e30" : "#2E7D53" }}
                  >
                    {STAR_LABELS[ratingData.rating]}
                  </motion.p>
                </div>

                {/* Comment */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] mb-2">Your Comments (Optional)</p>
                  <textarea
                    value={ratingData.comment}
                    onChange={(e) => setRatingData((prev) => ({ ...prev, comment: e.target.value }))}
                    placeholder="Share your experience with this masterpiece..."
                    className="w-full p-3 border border-[var(--border)] rounded-xl text-sm min-h-[90px] outline-none focus:border-amber-400 transition-colors resize-none"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button onClick={() => setRatingModal(null)} className="flex-1 py-3 rounded-xl text-sm font-bold text-[var(--muted)] border border-[var(--border)] hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={submitRating}
                    disabled={actionLoading}
                    className="flex-[2] py-3 bg-amber-400 hover:bg-amber-500 text-white rounded-xl text-sm font-extrabold uppercase tracking-wider shadow-md disabled:opacity-50 flex items-center justify-center transition-all active:scale-95"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Review"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </CustomerLayout>
  );
}
