"use client";
import React, { useState, useEffect, useRef } from "react";
import SellerLayout from "@/components/SellerLayout";
import { Users, Mail, Phone, Calendar, Search, MapPin, MoreHorizontal, MessageCircle, X, ShoppingBag, Clock, ChevronRight, Package, MoreVertical, Grid3x3, List } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";

function formatAddress(address) {
  if (!address) return "Locality Unknown";
  
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
    const city = addrObj.city || addrObj.municipality || "";
    const province = addrObj.province || "";
    
    if (city && province) return `${city}, ${province}`;
    return city || province || "Locality Unknown";
  }
  
  return "Locality Unknown";
}

function PortfolioModal({ customer, onClose }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get("/orders/seller");
        const customerOrders = res.data.filter(o => o.customer?.id === customer.id);
        setOrders(customerOrders);
      } catch (err) {
        console.error("Failed to load portfolio");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [customer.id]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-red-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-lg shadow-md ring-2 ring-orange-100">
              {customer.name?.[0]}
            </div>
            <div>
              <div className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-0.5">Purchase Portfolio</div>
              <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-white rounded-xl transition-colors border border-gray-200 group">
            <X className="w-4 h-4 text-gray-600 group-hover:text-orange-600" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="py-16 text-center text-gray-500 animate-pulse">Loading order history...</div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <Package className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">No orders found for this customer.</p>
            </div>
          ) : (
            orders.map((order) => {
              const statusColors = {
                Pending: "bg-amber-50 text-amber-700 border-amber-200",
                Processing: "bg-blue-50 text-blue-700 border-blue-200",
                Shipped: "bg-purple-50 text-purple-700 border-purple-200",
                Delivered: "bg-green-50 text-green-700 border-green-200",
                Completed: "bg-green-100 text-green-800 border-green-300",
                Cancelled: "bg-red-50 text-red-600 border-red-200",
              };
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 border border-gray-100 rounded-2xl p-5 hover:bg-white hover:shadow-md hover:border-gray-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="font-bold text-gray-900 tracking-tight">
                        #LB-{order.id.toString().slice(-8).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 font-medium">
                        <Clock className="w-3 h-3" />
                        {new Date(order.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${statusColors[order.status] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                        {order.status}
                      </span>
                      <div className="font-mono font-bold text-sm text-orange-600">
                        ₱{(order.totalAmount || order.totalPrice)?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(order.items || order.orderItems || []).slice(0, 3).map((item, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5">
                        <ShoppingBag className="w-3 h-3 text-gray-500" />
                        <span className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{item.product?.name}</span>
                        <span className="text-xs text-gray-500">×{item.quantity}</span>
                      </div>
                    ))}
                    {(order.items || order.orderItems || []).length > 3 && (
                      <div className="flex items-center px-2.5 py-1.5 text-xs text-gray-500 font-bold">
                        +{(order.items || order.orderItems).length - 3} more
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-600">
            <span className="font-bold text-gray-900">{orders.length}</span> total order{orders.length !== 1 ? "s" : ""}
          </div>
          <div className="font-mono text-sm font-bold text-orange-600">
            Total: ₱{orders.reduce((sum, o) => sum + (parseFloat(o.totalAmount || o.totalPrice) || 0), 0).toLocaleString()}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function MoreMenu({ customer, onMessage, onViewPortfolio }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 shadow-sm"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -6 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-12 z-50 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden w-48"
          >
            <button
              onClick={() => { onMessage(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-900 hover:bg-orange-50 hover:text-orange-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> Send Message
            </button>
            <button
              onClick={() => { onViewPortfolio(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-900 hover:bg-orange-50 hover:text-orange-600 transition-colors border-t border-gray-100"
            >
              <ChevronRight className="w-4 h-4" /> View Portfolio
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SellerCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [filter, setFilter] = useState("Active");
  const [viewType, setViewType] = useState("grid");
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetId = searchParams.get("id");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await api.get("/orders/seller");
        const uniqueCustomers = [];
        const seenIds = new Set();
        res.data.forEach(order => {
          if (order.customer && !seenIds.has(order.customer.id)) {
            uniqueCustomers.push({
              ...order.customer,
              lastOrder: order.createdAt,
              address: order.shippingAddress,
              orderCount: 1
            });
            seenIds.add(order.customer.id);
          } else if (order.customer) {
            const index = uniqueCustomers.findIndex(c => c.id === order.customer.id);
            uniqueCustomers[index].orderCount += 1;
            if (new Date(order.createdAt) > new Date(uniqueCustomers[index].lastOrder)) {
              uniqueCustomers[index].lastOrder = order.createdAt;
              uniqueCustomers[index].address = order.shippingAddress;
            }
          }
        });
        setCustomers(uniqueCustomers);
      } catch (err) {
        console.error("Failed to fetch customers");
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  // Auto-open portfolio if ?id= is present in the URL
  useEffect(() => {
    if (!loading && customers.length > 0 && targetId) {
      const match = customers.find(c => String(c.id) === String(targetId));
      if (match && !selectedPortfolio) {
        setSelectedPortfolio(match);
      }
    }
  }, [loading, customers, targetId]);

  const filtered = customers.filter(c =>
    !searchTerm ||
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatAddress(c.address).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SellerLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="mb-6">
              <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                Workshop Registry
              </div>
              <h1 className="text-2xl">
                <span className="text-gray-900">CUSTOMER </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
                  directory
                </span>
              </h1>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Filter customers by name or locality..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all text-sm"
                />
              </div>

              <div className="flex gap-3">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                >
                  <option>All Customers</option>
                  <option>Active</option>
                  <option>Recent</option>
                </select>

                <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
                  <button
                    onClick={() => setViewType("grid")}
                    className={`p-2 rounded-lg transition-all ${viewType === 'grid' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewType("list")}
                    className={`p-2 rounded-lg transition-all ${viewType === 'list' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600">
              Showing {filtered.length} of {customers.length} customers
            </p>
          </div>

          {/* Customer Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-200 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No customers found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              filtered.map((customer, idx) => (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.5 }}
                  className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-gray-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 ring-2 ring-orange-100 rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                        {customer.name?.[0]}{customer.name?.split(" ")[1]?.[0] || ""}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {customer.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatAddress(customer.address)}
                        </p>
                      </div>
                    </div>
                    <MoreMenu
                      customer={customer}
                      onMessage={() => router.push(`/seller/messages?userId=${customer.id}`)}
                      onViewPortfolio={() => setSelectedPortfolio(customer)}
                    />
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50">
                        <Mail className="h-4 w-4 text-gray-600" />
                      </div>
                      <span className="text-gray-700">{customer.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50">
                        <Phone className="h-4 w-4 text-gray-600" />
                      </div>
                      <span className="text-gray-700">{customer.mobileNumber || customer.mobile || '+63 9xx xxx xxxx'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Package className="h-4 w-4" />
                      <span>Last order: {new Date(customer.lastOrder).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg shadow-md">
                      {customer.orderCount} {customer.orderCount === 1 ? 'Order' : 'Orders'}
                    </div>
                    <button
                      onClick={() => setSelectedPortfolio(customer)}
                      className="text-xs font-bold uppercase tracking-wider text-orange-600 hover:text-orange-700 transition-all flex items-center gap-2 group/btn"
                    >
                      View Portfolio <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedPortfolio && (
          <PortfolioModal
            customer={selectedPortfolio}
            onClose={() => setSelectedPortfolio(null)}
          />
        )}
      </AnimatePresence>
    </SellerLayout>
  );
}