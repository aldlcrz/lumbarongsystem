"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Store, CheckCircle, XCircle, Eye, ShieldCheck, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { useSocket } from "@/context/SocketContext";

export default function AdminSellersPage() {
  const [activeTab, setActiveTab] = useState("pending"); // "pending" or "active"
  const [performance, setPerformance] = useState([]);
  const [perfRange, setPerfRange] = useState("month");
  const [perfLoading, setPerfLoading] = useState(false);

  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [sellerReviews, setSellerReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const { socket } = useSocket();

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/pending-sellers");
      setSellers(res.data);
    } catch (err) {
      console.error("Failed to fetch pending sellers");
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async () => {
    try {
      setPerfLoading(true);
      const res = await api.get(`/admin/seller-performance?range=${perfRange}`);
      setPerformance(res.data);
    } catch (err) {
      console.error("Failed to fetch seller performance");
    } finally {
      setPerfLoading(false);
    }
  };

  const fetchSellerReviews = async (sellerId) => {
    try {
      setReviewsLoading(true);
      const res = await api.get(`/reviews/seller/${sellerId}`);
      setSellerReviews(res.data);
      setIsReviewsOpen(true);
    } catch (err) {
      console.error("Failed to fetch seller reviews");
      alert("Could not retrieve feedback records.");
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "pending") fetchSellers();
    if (activeTab === "active") fetchPerformance();

    if (socket) {
      const handler = () => {
        if (activeTab === "pending") fetchSellers();
        if (activeTab === "active") fetchPerformance();
      };
      
      socket.on('stats_update', handler);
      socket.on('user_updated', handler);
      socket.on('dashboard_update', handler);

      return () => {
        socket.off('stats_update', handler);
        socket.off('user_updated', handler);
        socket.off('dashboard_update', handler);
      };
    }
  }, [socket, activeTab, perfRange]);

  const verifySeller = async (id) => {
    if(!confirm("Verify this seller for the Lumban community?")) return;
    setError(null); setSuccess(null);
    try {
      await api.put(`/admin/verify-seller/${id}`);
      setSuccess("Seller verified successfully!");
      fetchSellers();
      if (activeTab === "active") fetchPerformance();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const rejectSeller = async (id) => {
    if(!confirm("Are you sure you want to reject this seller's application?")) return;
    setError(null); setSuccess(null);
    try {
      await api.put(`/admin/reject-seller/${id}`);
      setSuccess("Seller application removed.");
      fetchSellers();
      if (activeTab === "active") fetchPerformance();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed.");
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-10 mb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="eyebrow">Enterprise Management</div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-[var(--charcoal)]">
              Artisan <span className="text-[var(--rust)] italic lowercase">Workshops</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1 p-1 bg-white border border-[var(--border)] rounded-xl shadow-sm">
                <button 
                  onClick={() => setActiveTab("pending")}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "pending" ? "bg-[var(--rust)] text-white shadow" : "text-[var(--muted)] hover:text-[var(--rust)]"}`}
                >
                  Applications ({sellers.length})
                </button>
                <button 
                  onClick={() => setActiveTab("active")}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "active" ? "bg-[var(--rust)] text-white shadow" : "text-[var(--muted)] hover:text-[var(--rust)]"}`}
                >
                  Marketplace
                </button>
             </div>
             {activeTab === "active" && (
                <div className="flex items-center gap-1 p-1 bg-white border border-[var(--border)] rounded-xl shadow-sm scale-90">
                  {["today", "week", "month", "year"].map(f => (
                    <button
                      key={f}
                      onClick={() => setPerfRange(f)}
                      className={`px-3 py-1 rounded-md text-[8px] font-bold uppercase tracking-tighter ${perfRange === f ? "bg-[var(--bark)] text-white" : "text-[var(--muted)]"}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
             )}
          </div>
        </div>

        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-bold flex items-center gap-2">
              <XCircle className="w-4 h-4" /> {error}
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> {success}
            </motion.div>
          )}
        </AnimatePresence>

        {activeTab === "pending" ? (
          loading ? (
            <div className="artisan-card p-20 text-center text-[var(--muted)] animate-pulse">Scanning community applications...</div>
          ) : sellers.length === 0 ? (
            <div className="artisan-card p-20 text-center space-y-4">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto"><CheckCircle className="w-8 h-8" /></div>
              <h3 className="text-xl font-bold">Queue is empty</h3>
              <p className="text-[var(--muted)]">All artisan applications have been processed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {sellers.map((seller, idx) => (
                <motion.div 
                  key={seller.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="artisan-card p-8 flex flex-col md:flex-row items-center justify-between gap-8 group"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-[var(--bark)] rounded-2xl flex items-center justify-center text-white font-serif text-2xl font-bold shadow-lg group-hover:scale-105 transition-transform">
                      {seller.name[0]}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[var(--charcoal)]">{seller.name}</h3>
                      <div className="text-sm text-[var(--muted)] italic mb-2">{seller.email}</div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-bold tracking-widest uppercase">PENDING APPROVAL</span>
                        <span className="text-[10px] text-[var(--muted)] flex items-center gap-1">
                          <Clock className="w-3 h-3" /> 
                          Applied {new Date(seller.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => { setSelectedSeller(seller); setIsModalOpen(true); }}
                      className="px-4 py-2.5 border border-[var(--border)] rounded-xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:border-[var(--rust)] hover:text-[var(--rust)] transition-all"
                    >
                      <Eye className="w-4 h-4" /> View Docs
                    </button>
                    <button 
                      onClick={() => rejectSeller(seller.id)}
                      className="px-4 py-2.5 border border-red-200 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-red-100 transition-all font-bold"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                    <button 
                      onClick={() => verifySeller(seller.id)}
                      className="px-4 py-2.5 bg-[var(--bark)] text-white rounded-xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-green-600 transition-all shadow-md group"
                    >
                      <ShieldCheck className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Approve
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          /* Active Marketplace Performance View */
          <div className="artisan-card overflow-hidden">
             {perfLoading ? (
               <div className="p-20 text-center animate-pulse text-[var(--muted)] italic">Loading marketplace performance...</div>
             ) : performance.length === 0 ? (
               <div className="p-20 text-center text-[var(--muted)]">No active sellers found in the selected range.</div>
             ) : (
               <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[var(--stone)]/30 border-b border-[var(--border)]">
                      <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Artisan Workshop</th>
                      <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Member Since</th>
                      <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] text-right">Orders</th>
                      <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] text-right">Revenue ({perfRange})</th>
                      <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] text-center">Status</th>
                      <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {performance.map(item => (
                      <tr key={item.id} className="hover:bg-[var(--stone)]/10 transition-colors">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-[var(--bark)] rounded-lg flex items-center justify-center text-white font-serif font-bold text-sm">
                               {item.name[0]}
                             </div>
                             <div>
                               <div className="font-bold text-[var(--charcoal)]">{item.name}</div>
                               <div className="text-[10px] text-[var(--muted)]">{item.email}</div>
                             </div>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-xs text-[var(--muted)]">
                          {new Date(item.joinedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-8 py-6 text-right font-bold text-sm">
                           {item.orderCount}
                        </td>
                        <td className="px-8 py-6 text-right font-serif font-bold text-lg text-[var(--rust)]">
                           ₱{item.totalRevenue.toLocaleString()}
                        </td>
                        <td className="px-8 py-6 text-center">
                           <span className={`text-[9px] px-3 py-1 rounded-full font-extrabold tracking-widest uppercase ${item.orderCount > 0 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                              {item.orderCount > 0 ? 'ACTIVE' : 'DORMANT'}
                           </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <button 
                             onClick={() => {
                               setSelectedSeller(item);
                               fetchSellerReviews(item.id);
                             }}
                             className="text-[10px] font-bold text-[var(--rust)] hover:underline uppercase tracking-widest"
                           >
                             Reviews
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && selectedSeller && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-[var(--charcoal)]/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--stone)]/30">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-[var(--charcoal)]">Verification Documents</h2>
                  <p className="text-sm text-[var(--muted)]">Reviewing credentials for <span className="font-bold text-[var(--rust)]">{selectedSeller.name}</span></p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white rounded-full transition-colors text-[var(--muted)] hover:text-[var(--rust)]"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <DocumentCard title="Indigency Certificate" src={selectedSeller.indigencyCertificate} />
                  <DocumentCard title="Valid ID" src={selectedSeller.validId} />
                  <DocumentCard title="GCash QR Code" src={selectedSeller.gcashQrCode} />
                </div>
              </div>

              <div className="p-6 border-t border-[var(--border)] bg-[var(--stone)]/30 flex justify-end gap-4">
                 <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-sm font-bold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--charcoal)]"
                >
                  Back to Queue
                </button>
                  <button 
                    onClick={() => {
                      rejectSeller(selectedSeller.id);
                      setIsModalOpen(false);
                    }}
                    className="px-8 py-3 bg-red-100 text-red-700 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-red-200 transition-all"
                  >
                    Reject Application
                  </button>
                  <button 
                    onClick={() => {
                      verifySeller(selectedSeller.id);
                      setIsModalOpen(false);
                    }}
                    className="px-8 py-3 bg-[var(--bark)] text-white rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg"
                  >
                    Approve Seller
                  </button>
              </div>
            </motion.div>
          </div>
        )}

        {isReviewsOpen && selectedSeller && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReviewsOpen(false)}
              className="absolute inset-0 bg-[var(--charcoal)]/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--stone)]/30">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-[var(--rust)] rounded-xl flex items-center justify-center text-white">
                      <Star className="w-6 h-6 fill-current" />
                   </div>
                   <div>
                      <h2 className="text-xl font-serif font-bold text-[var(--charcoal)]">Artisan Feedback</h2>
                      <p className="text-xs text-[var(--muted)]">Monitoring customer satisfaction for <span className="font-bold text-[var(--rust)]">{selectedSeller.name}</span></p>
                   </div>
                </div>
                <button 
                  onClick={() => setIsReviewsOpen(false)}
                  className="p-2 hover:bg-white rounded-full transition-colors text-[var(--muted)]"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto artisan-scrollbar bg-[#FAFAFA]">
                {reviewsLoading ? (
                  <div className="py-20 text-center text-[var(--muted)] italic animate-pulse">Syncing feedback registry...</div>
                ) : sellerReviews.length === 0 ? (
                  <div className="py-20 text-center text-[var(--muted)] italic border-2 border-dashed border-[var(--border)] rounded-2xl">
                    No customer feedback has been recorded for this workshop yet.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {sellerReviews.map((review) => (
                      <div key={review.id} className="bg-white p-5 rounded-2xl border border-[var(--border)] shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-[var(--stone)] flex items-center justify-center text-[var(--rust)] font-bold text-xs overflow-hidden">
                                {review.customer?.profilePhoto ? (
                                  <img src={review.customer.profilePhoto} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  review.customer?.name?.[0] || 'C'
                                )}
                             </div>
                             <div>
                                <div className="text-xs font-bold text-[var(--charcoal)]">{review.customer?.name}</div>
                                <div className="flex text-amber-400">
                                   {[...Array(5)].map((_, i) => (
                                     <Star key={i} className={`w-2.5 h-2.5 ${i < review.rating ? 'fill-current' : 'opacity-20'}`} />
                                   ))}
                                </div>
                             </div>
                          </div>
                          <div className="text-[10px] text-[var(--muted)] font-bold bg-[var(--stone)]/30 px-2 py-1 rounded">
                             {new Date(review.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                        <div className="text-[11px] font-bold text-[var(--rust)] bg-[var(--rust)]/5 px-2 py-1 rounded w-fit mb-2">
                           Product: {review.product?.name}
                        </div>
                        <p className="text-xs text-[var(--charcoal)]/80 leading-relaxed italic">"{review.comment}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-[var(--border)] bg-[var(--stone)]/30 flex justify-end">
                  <button 
                    onClick={() => setIsReviewsOpen(false)}
                    className="px-8 py-3 bg-[var(--charcoal)] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--rust)] transition-all"
                  >
                    Close Review Panel
                  </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}

function DocumentCard({ title, src }) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] px-1">{title}</h4>
      <div className="aspect-[3/4] rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--stone)]/50 overflow-hidden group hover:border-[var(--rust)] transition-colors relative">
        {src ? (
          <>
            <img src={src} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
               <a href={src} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white/90 backdrop-blur rounded-lg text-xs font-bold uppercase tracking-wider shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
                 Open Full Size
               </a>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[var(--muted)] p-6 text-center italic">
            <XCircle className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-[10px]">No document available</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Clock(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  );
}
