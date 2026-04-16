"use client";
import React, { useState, useEffect, useMemo } from "react";
import SellerLayout from "@/components/SellerLayout";
import { Package, Clock, Eye, Search, Filter, X, MapPin, CreditCard, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { useSocket } from "@/context/SocketContext";
import { getProductImageSrc } from "@/lib/productImages";
import ConfirmationModal from "@/components/ConfirmationModal";

const STATUS_TABS = ["All", "Pending", "Processing", "Shipped", "Delivered", "Completed", "Cancelled"];

const STATUS_MAPPING = {
  "Pending": ["Pending"],
  "Processing": ["Processing"],
  "Shipped": ["Shipped"],
  "Delivered": ["Delivered"],
  "Completed": ["Completed"],
  "Cancelled": ["Cancelled"]
};

function formatAddress(address) {
  if (!address) return "Lumban, Laguna, Philippines";
  
  let addrObj = address;
  if (typeof address === "string") {
    try {
      // Handle potential JSON string from DB
      addrObj = JSON.parse(address);
    } catch (e) {
      return address;
    }
  }
  
  if (typeof addrObj === "object" && addrObj !== null) {
    const { street, houseNo, barangay, city, municipality, province, postalCode } = addrObj;
    
    // Attempt to build a multi-line format or return a clean string
    const parts = [];
    if (houseNo || street) parts.push(`${houseNo || ""} ${street || ""}`.trim());
    if (barangay) parts.push(barangay);
    if (city || municipality) parts.push(city || municipality);
    if (province) parts.push(province);
    
    return parts.filter(Boolean).join(", ") || "Lumban, Laguna, Philippines";
  }
  
  return "Lumban, Laguna, Philippines";
}

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState(null);
  const { socket } = useSocket();

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders/seller");
      setOrders(res.data || []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    if (socket) {
      socket.on('order_updated', fetchOrders);
      socket.on('new_order', fetchOrders);
      socket.on('order_status_update', fetchOrders);
    }

    return () => {
      if (socket) {
        socket.off('order_updated');
        socket.off('new_order');
        socket.off('order_status_update');
      }
    };
  }, [socket]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderStatus = order.status || "Pending";
      const matchesTab = activeTab === "All" ||
        STATUS_MAPPING[activeTab]?.some(s => s.toLowerCase() === orderStatus.toLowerCase());

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        order.id.toString().toLowerCase().includes(searchLower) ||
        (order.customer?.name || "").toLowerCase().includes(searchLower);

      return matchesTab && matchesSearch;
    });
  }, [orders, activeTab, searchTerm]);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-[var(--rust)]/20 border-t-[var(--rust)] rounded-full animate-spin" />
    </div>
  );

  return (
    <SellerLayout>
      <div className="space-y-10 animate-fade-in pt-12 mb-20 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-0.5 w-12 bg-[var(--rust)] rounded-full" />
              <span className="text-[10px] font-black text-[var(--rust)] tracking-[0.3em] uppercase">Workshop Log</span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-[var(--charcoal)] tracking-tighter uppercase leading-none">
              ORDER <span className="font-serif italic text-[var(--rust)] font-normal ml-1 lowercase">registry</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] group-focus-within:text-[var(--rust)] transition-colors" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white border border-[var(--border)] rounded-2xl pl-12 pr-6 py-4 text-sm w-full md:w-[320px] outline-none focus:border-[var(--rust)] focus:ring-4 focus:ring-[var(--rust)]/5 transition-all shadow-sm"
              />
            </div>
            <button className="flex items-center gap-2 px-6 py-4 bg-white border border-[var(--border)] rounded-2xl text-[var(--muted)] hover:text-[var(--rust)] hover:border-[var(--rust)] transition-all shadow-sm">
              <Filter className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Filter</span>
            </button>
          </div>
        </header>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-[var(--stone)]/10 rounded-[2rem] border border-[var(--border)]/30 overflow-x-auto no-scrollbar">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all cursor-pointer ${activeTab === tab
                  ? 'bg-[var(--rust)] text-white shadow-lg shadow-red-900/20'
                  : 'text-[var(--muted)] hover:text-[var(--charcoal)]'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table/Card Container */}
        <div className="bg-white rounded-[2.5rem] border border-[var(--border)] overflow-hidden shadow-xl shadow-stone-200/50">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-[var(--stone)]/30 border-b border-[var(--border)]">
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Order ID</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Client Info</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] text-center">Status Management</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Value / Settlement</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] text-right">Order Log</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/50">
                <AnimatePresence mode="popLayout">
                  {filteredOrders.map((order, idx) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      index={idx}
                      onView={() => setSelectedOrder(order)}
                      isUpdating={updatingId === order.id}
                      onUpdateStatus={async (newStatus) => {
                        setUpdatingId(order.id);
                        try {
                          await api.put(`/orders/${order.id}/status`, { status: newStatus });
                          fetchOrders();
                        } catch (err) {
                          console.error("Failed to update status:", err.response?.data?.message || err.message);
                        } finally {
                          setUpdatingId(null);
                        }
                      }}
                    />
                  ))}
                </AnimatePresence>
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center text-[var(--muted)] italic font-medium">
                      No orders identified in this registry sector.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden flex flex-col divide-y divide-[var(--border)]">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order, idx) => (
                <MobileOrderCard
                  key={order.id}
                  order={order}
                  index={idx}
                  onView={() => setSelectedOrder(order)}
                  isUpdating={updatingId === order.id}
                  onUpdateStatus={async (newStatus) => {
                    setUpdatingId(order.id);
                    try {
                      await api.put(`/orders/${order.id}/status`, { status: newStatus });
                      fetchOrders();
                    } catch (err) {
                      console.error("Failed to update status:", err.response?.data?.message || err.message);
                    } finally {
                      setUpdatingId(null);
                    }
                  }}
                />
              ))}
            </AnimatePresence>
            {filteredOrders.length === 0 && (
              <div className="px-8 py-20 text-center text-[var(--muted)] italic font-medium">
                No orders identified in this registry sector.
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {selectedOrder && (
            <OrderModal
              order={selectedOrder}
              onClose={() => setSelectedOrder(null)}
              isUpdating={updatingId === selectedOrder.id}
              onUpdateStatus={async (newStatus) => {
                setUpdatingId(selectedOrder.id);
                try {
                  await api.put(`/orders/${selectedOrder.id}/status`, { status: newStatus });
                  const res = await api.get("/orders/seller");
                  setOrders(res.data);
                  setSelectedOrder(prev => ({ ...prev, status: newStatus }));
                } catch (err) {
                  console.error("Failed to update status:", err.response?.data?.message || err.message);
                } finally {
                  setUpdatingId(null);
                }
              }}
              onCancelClick={(id) => {
                setCancelTargetId(id);
                setShowCancelConfirm(true);
              }}
            />
          )}
        </AnimatePresence>

        <ConfirmationModal
          isOpen={showCancelConfirm}
          onClose={() => setShowCancelConfirm(false)}
          onConfirm={() => {
            if (cancelTargetId) {
               api.put(`/orders/${cancelTargetId}/status`, { status: "Cancelled" })
                 .then(() => fetchOrders())
                 .catch(err => console.error(err));
            }
          }}
          title="Cancel this order?"
          message="This will notify the customer and halt the shipping process. This action is irreversible."
          confirmText="Yes, Cancel Order"
          cancelText="No, Keep it"
          type="danger"
        />
      </div>
    </SellerLayout>
  );
}

function OrderRow({ order, index, onView, onUpdateStatus, isUpdating }) {
  const currentStatus = order.status || "Pending";
  const STATUS_CYCLE = ["Pending", "Processing", "Shipped", "Delivered", "Completed"];
  const currentIdx = STATUS_CYCLE.findIndex(s => s.toLowerCase() === currentStatus.toLowerCase());
  const nextStatus = currentIdx !== -1 && currentIdx < STATUS_CYCLE.length - 1 ? STATUS_CYCLE[currentIdx + 1] : null;

  const currentStepIndex = currentIdx;

  const getDotColor = (dotIdx) => {
    if (dotIdx < currentStepIndex) return "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]";
    if (dotIdx === currentStepIndex) return "bg-[var(--rust)] shadow-[0_0_8px_rgba(192,66,42,0.3)]";
    return "bg-[var(--border)]";
  };

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group hover:bg-[var(--stone)]/5 transition-colors"
    >
      <td className="px-8 py-6 align-top">
        <div className="font-serif font-bold text-[var(--charcoal)] group-hover:text-[var(--rust)] transition-colors mb-2 tracking-tighter">
          #LB-{order.id.toString().slice(-8).toUpperCase()}
        </div>
        <div className="flex items-center gap-1.5 opacity-60">
          <Clock className="w-3 h-3 text-[var(--muted)]" />
          <span className="text-[10px] font-bold text-[var(--muted)]">{order.items?.length || 0} Pieces Ordered</span>
        </div>
        <div className="flex gap-1 mt-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${getDotColor(i)} transition-all duration-500`} />
          ))}
        </div>
      </td>

      <td className="px-8 py-6 align-top">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[var(--bark)] text-white flex items-center justify-center font-bold shadow-md">
            {order.customer?.name ? order.customer.name[0] : "C"}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xs text-[var(--charcoal)] truncate tracking-tight uppercase">{order.customer?.name || "Customer"}</div>
            <div className="text-[10px] text-[var(--muted)] font-medium italic truncate max-w-[200px]">
              {formatAddress(order.shippingAddress)}
            </div>
          </div>
        </div>
      </td>

      <td className="px-8 py-6 align-top text-center">
        <button
          onClick={() => nextStatus && !isUpdating && onUpdateStatus(nextStatus)}
          disabled={!nextStatus || isUpdating}
          className={`px-4 py-1.5 rounded-lg text-[10px] font-black tracking-[0.1em] shadow-sm transition-all border ${isUpdating ? 'animate-pulse opacity-70 cursor-wait' :
              nextStatus ? 'cursor-pointer hover:scale-105 active:scale-95 hover:shadow-md' : 'cursor-default'
            } ${currentStatus.toLowerCase() === 'delivered' || currentStatus.toLowerCase() === 'completed'
              ? 'bg-green-50 text-green-700 border-green-100'
              : 'bg-amber-50 text-amber-700 border-amber-100'
            }`}
        >
          {isUpdating ? "UPDATING..." : currentStatus.toUpperCase()}
        </button>
      </td>

      <td className="px-8 py-6 align-top">
        <div className="font-mono text-xs font-bold text-[var(--charcoal)]">₱{(order.totalAmount || order.totalPrice)?.toLocaleString()}</div>
        <div className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mt-1 opacity-60">
          {order.paymentMethod?.toUpperCase()}
        </div>
      </td>

      <td className="px-8 py-6 align-top text-right">
        <div className="flex items-center justify-end gap-2">
          {(currentStatus === 'Pending' || currentStatus === 'Processing') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm("Are you sure you want to cancel this order?")) {
                  onUpdateStatus("Cancelled");
                }
              }}
              disabled={isUpdating}
              title="Cancel Order"
              className="p-2.5 bg-red-50 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-all shadow-sm group/btn disabled:opacity-50"
            >
              <X className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
            </button>
          )}
          <button
            onClick={onView}
            className="p-2.5 bg-[var(--cream)] text-[var(--muted)] hover:text-white hover:bg-[var(--rust)] rounded-xl transition-all shadow-sm group/btn"
          >
            <Eye className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

function OrderModal({ order, onClose, onUpdateStatus, onCancelClick, isUpdating }) {
  const steps = ["Pending", "Processing", "Shipped", "Delivered", "Completed"];
  const currentStep = steps.findIndex(s => s.toLowerCase() === order.status?.toLowerCase());

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[var(--charcoal)]/80 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="relative bg-white w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col border border-[var(--border)]"
      >
        {/* Modal Header - Lighter Artisan Theme */}
        <div className="p-10 border-b border-[var(--border)] flex items-center justify-between bg-[var(--warm-white)] text-[var(--charcoal)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--rust)]" />
          <div className="relative z-10 flex items-center justify-between w-full pr-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-[2px] bg-[var(--rust)]" />
                <span className="text-[10px] font-black text-[var(--rust)] tracking-[0.3em] uppercase">Order Details</span>
              </div>
              <h2 className="font-serif text-2xl font-bold tracking-tighter">
                Order <span className="font-serif italic font-normal text-[var(--rust)]">#LB-OR-{order.id.toString().slice(-8).toUpperCase()}</span>
              </h2>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`px-6 py-2 rounded-full border text-[10px] font-black tracking-[0.2em] shadow-sm ${
                  order.status === 'Cancelled' ? 'bg-red-50 border-red-200 text-red-600' :
                  order.status === 'Completed' || order.status === 'Delivered' ? 'bg-green-50 border-green-200 text-green-600' :
                  'bg-orange-50 border-orange-200 text-orange-600'
              }`}>
                {order.status?.toUpperCase()}
              </div>
              {(order.status === 'Pending' || order.status === 'Processing') && (
                <button 
                  onClick={() => onCancelClick(order.id)}
                  disabled={isUpdating}
                  className="px-6 py-2 rounded-full border border-red-200 bg-white text-red-600 text-[10px] font-black tracking-[0.2em] hover:bg-red-50 transition-all shadow-sm disabled:opacity-50"
                >
                  {isUpdating ? 'CANCELLING...' : 'CANCEL'}
                </button>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white hover:bg-[var(--cream)] rounded-full transition-all border border-[var(--border)] group active:scale-90">
            <X className="w-6 h-6 text-[var(--muted)] group-hover:text-[var(--rust)] transition-colors" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Left Column: Client & Payment */}
            <div className="space-y-10">
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--rust)]" />
                  <span className="text-[10px] font-black text-[var(--rust)] tracking-widest uppercase">Client Profile</span>
                </div>
                <div className="artisan-card space-y-6">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--bark)] flex items-center justify-center text-white font-serif text-3xl font-bold">
                      {order.customer?.name ? order.customer.name[0] : "C"}
                    </div>
                    <div>
                      <div className="font-bold text-[var(--charcoal)] uppercase tracking-tight text-lg">{order.customer?.name || "Customer"}</div>
                      <div className="text-sm text-[var(--muted)] italic">{order.customer?.email}</div>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-[var(--border)]/50">
                    <div className="text-[10px] font-black text-[var(--muted)] uppercase mb-3 opacity-60 tracking-widest">Shipping Logistics</div>
                    <div className="bg-[var(--cream)]/50 p-5 rounded-2xl border border-[var(--border)]/30">
                      <p className="text-sm italic text-[var(--charcoal)] leading-relaxed font-medium">
                        {formatAddress(order.shippingAddress)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-1.5 h-1.5 rounded-full bg-[var(--rust)]" />
                   <span className="text-[10px] font-black text-[var(--rust)] tracking-widest uppercase">Settlement</span>
                </div>
                <div className="artisan-card grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-[10px] font-black text-[var(--muted)] uppercase mb-2 opacity-60 tracking-widest">Settlement Method</div>
                    <div className="flex items-center gap-3">
                       <CreditCard className="w-4 h-4 text-[var(--rust)]" />
                       <div className="text-sm font-bold text-[var(--charcoal)] uppercase tracking-tight">{order.paymentMethod}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-[var(--muted)] uppercase mb-2 opacity-60 tracking-widest">Status</div>
                    <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                        order.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'
                    }`}>
                      {order.status === 'Cancelled' ? 'CANCELLED' : 'CAPTURED'}
                    </span>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Order Items */}
            <section className="flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--rust)]" />
                  <span className="text-[10px] font-black text-[var(--rust)] tracking-widest uppercase">Order Items</span>
              </div>
              <div className="artisan-card flex-1 flex flex-col min-h-full">
                <div className="flex-1 space-y-5 mb-8">
                  {(order.items || order.orderItems || []).map((item, i) => (
                    <div key={i} className="flex gap-5 p-4 hover:bg-[var(--cream)]/30 rounded-2xl transition-all border border-transparent hover:border-[var(--border)] group">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border border-[var(--border)] shadow-sm shrink-0">
                        <img
                          src={getProductImageSrc(item.product?.image?.[0]?.url || item.product?.image?.[0] || item.product?.image)}
                          alt=""
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="font-bold text-sm truncate text-[var(--charcoal)] uppercase tracking-tight mb-1">{item.product?.name}</div>
                        <div className="text-[11px] text-[var(--muted)] font-medium">Qty: {item.quantity} × ₱{item.price?.toLocaleString()}</div>
                        {item.variant && (
                          <div className="mt-2 inline-block self-start px-2 py-0.5 bg-white rounded text-[8px] font-black text-[var(--muted)] border border-[var(--border)] uppercase tracking-widest">
                            {item.variant}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pt-8 border-t border-[var(--border)]">
                  <div className="bg-[var(--warm-white)] p-8 rounded-[2rem] border-2 border-[var(--rust)] text-[var(--charcoal)] shadow-xl relative overflow-hidden group/total">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--rust)]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover/total:bg-[var(--rust)]/10 transition-all" />
                    <div className="flex justify-between items-end relative z-10">
                      <div>
                        <div className="text-[10px] font-black text-[var(--rust)] uppercase tracking-[0.3em] mb-2">Grand Total</div>
                        <div className="text-[10px] text-[var(--muted)]/60 uppercase tracking-widest italic tracking-widest">Heritage Settlement</div>
                      </div>
                      <div className="text-right">
                        <div className="font-serif text-2xl font-bold tracking-tighter text-[var(--rust)]">
                           ₱{(order.totalAmount || order.totalPrice)?.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
function MobileOrderCard({ order, index, onView, onUpdateStatus, isUpdating }) {
  const currentStatus = order.status || "Pending";
  const STATUS_CYCLE = ["Pending", "Processing", "Shipped", "Delivered", "Completed"];
  const currentIdx = STATUS_CYCLE.findIndex(s => s.toLowerCase() === currentStatus.toLowerCase());
  const nextStatus = currentIdx !== -1 && currentIdx < STATUS_CYCLE.length - 1 ? STATUS_CYCLE[currentIdx + 1] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="p-6 space-y-4 active:bg-[var(--stone)]/5 transition-colors"
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="font-serif font-bold text-[var(--charcoal)] tracking-tighter text-sm">
            #LB-{order.id.toString().slice(-8).toUpperCase()}
          </div>
          <div className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-widest mt-1">
             ₱{(order.totalAmount || order.totalPrice)?.toLocaleString()} • {order.paymentMethod?.toUpperCase()}
          </div>
        </div>
        <button
          onClick={() => nextStatus && !isUpdating && onUpdateStatus(nextStatus)}
          disabled={!nextStatus || isUpdating}
          className={`px-3 py-1 rounded-lg text-[8px] font-black tracking-[0.1em] border ${
            currentStatus.toLowerCase() === 'delivered' || currentStatus.toLowerCase() === 'completed'
              ? 'bg-green-50 text-green-700 border-green-100'
              : 'bg-amber-50 text-amber-700 border-amber-100'
          }`}
        >
          {isUpdating ? "..." : currentStatus.toUpperCase()}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[var(--bark)] text-white flex items-center justify-center text-[10px] font-bold">
          {order.customer?.name ? order.customer.name[0] : "C"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold text-[var(--charcoal)] uppercase truncate">{order.customer?.name || "Customer"}</div>
          <div className="text-[9px] text-[var(--muted)] italic truncate">{formatAddress(order.shippingAddress)}</div>
        </div>
        <button
          onClick={onView}
          className="p-2 bg-[var(--cream)] text-[var(--muted)] rounded-lg"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
