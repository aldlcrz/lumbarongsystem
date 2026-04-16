"use client";
import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import ConfirmationModal from "@/components/ConfirmationModal";
import { Users, Search, Mail, Phone, Calendar, ShieldCheck, Trash2, Snowflake, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { useSocket } from "@/context/SocketContext";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("customers");
  const [toast, setToast] = useState(null); // { type: 'success'|'error', msg }
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);
  const [terminateTarget, setTerminateTarget] = useState(null);
  const [terminationReason, setTerminationReason] = useState("");

  const { socket } = useSocket();

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === "customers" ? "/admin/customers" : "/admin/sellers";
      const res = await api.get(endpoint);
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchUsers();

    if (socket) {
      socket.on("stats_update", (data) => {
        if (data?.type === "user") fetchUsers();
      });
      socket.on("user_updated", (data) => {
        if (data?.user?.role === "customer" || data?.user?.role === "seller") fetchUsers();
      });
    }

    return () => {
      if (socket) {
        socket.off("stats_update");
        socket.off("user_updated");
      }
    };
  }, [socket, fetchUsers]);

  const handleToggleStatus = async (id) => {
    try {
      await api.put(`/admin/${activeTab}/${id}/toggle-status`);
      await fetchUsers();
      showToast("success", "Account status updated.");
    } catch (err) {
      showToast("error", "Failed to update status.");
    }
  };

  const handleTerminateAccount = async () => {
    if (!terminateTarget) return;
    if (!terminationReason.trim()) {
      alert("Please provide a reason for termination.");
      return;
    }
    try {
      await api.delete(`/admin/${activeTab}/${terminateTarget.id}`, { data: { reason: terminationReason } });
      await fetchUsers();
      showToast("success", "Account terminated and purged.");
      setShowTerminateConfirm(false);
      setTerminationReason("");
    } catch (err) {
      showToast("error", "Termination failed.");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this user?")) return;
    try {
      await api.delete(`/admin/customers/${id}`);
      await fetchUsers();
      showToast("success", "User deleted successfully.");
    } catch (err) {
      showToast("error", "Failed to delete user.");
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.mobileNumber || u.mobile || "").includes(searchTerm)
  );

  return (
    <AdminLayout>
      <div className="space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="eyebrow">Registry Management</div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-[var(--charcoal)]">
              Heritage <span className="text-[var(--rust)] italic lowercase">Users</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 p-1 bg-white border border-[var(--border)] rounded-xl shadow-sm">
                <button
                    onClick={() => setActiveTab("customers")}
                    className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "customers" ? "bg-[var(--rust)] text-white shadow" : "text-[var(--muted)] hover:text-[var(--rust)]"}`}
                >
                    Customers
                </button>
                <button
                    onClick={() => setActiveTab("sellers")}
                    className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "sellers" ? "bg-[var(--rust)] text-white shadow" : "text-[var(--muted)] hover:text-[var(--rust)]"}`}
                >
                    Artisans
                </button>
            </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Search by name, email or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-[var(--border)] rounded-2xl outline-none focus:border-[var(--rust)] transition-all font-medium text-sm"
            />
          </div>
        </div>
      </div>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${
                toast.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Registry Container */}
        <div className="artisan-card p-0 overflow-hidden shadow-2xl">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--input-bg)] border-b border-[var(--border)]">
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Profile</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Contact Details</th>
                   <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Status</th>
                  {activeTab === 'sellers' && <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Health</th>}
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-8 py-20 text-center text-[var(--muted)] italic animate-pulse">
                      Synchronizing community records...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-8 py-20 text-center text-[var(--muted)] italic">
                      {searchTerm ? "No results found." : "No customer records found."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((user, idx) => {
                    const isFrozen = user.status === "frozen";
                    return (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="hover:bg-gray-50/50 transition-colors group"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[var(--bark)] rounded-xl flex items-center justify-center text-white font-serif text-lg font-bold shadow-md">
                              {user.name ? user.name[0].toUpperCase() : "U"}
                            </div>
                            <div>
                              <div className="font-bold text-[var(--charcoal)] group-hover:text-[var(--rust)] transition-colors">
                                {user.name}
                              </div>
                              <div className="text-[10px] text-[var(--muted)] font-bold flex items-center gap-1 uppercase tracking-widest mt-0.5">
                                <Calendar className="w-3 h-3" />
                                Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="space-y-1.5">
                            <div className="text-xs font-medium text-[var(--charcoal)] flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-[var(--muted)]" /> {user.email}
                            </div>
                            <div className="text-xs font-medium text-[var(--charcoal)] flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-[var(--muted)]" />
                              {user.mobileNumber || user.mobile || "—"}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div
                            className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border italic shadow-sm ${
                              isFrozen
                                ? "bg-blue-50 text-blue-700 border-blue-100"
                                : "bg-green-50 text-green-700 border-green-100"
                            }`}
                          >
                            {isFrozen ? <Snowflake className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                            {isFrozen ? "Frozen" : "Active"}
                          </div>
                        </td>
                        {activeTab === 'sellers' && (
                          <td className="px-8 py-6">
                            {user.avgRating ? (
                              <div className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border shadow-sm ${
                                Number(user.avgRating) < 3 ? "bg-red-50 text-red-700 border-red-100" : "bg-green-50 text-green-700 border-green-100"
                              }`}>
                                {Number(user.avgRating) < 3 ? "⚠️ Warning" : "✓ Good"} 
                                <span className="opacity-60 ml-1">({Number(user.avgRating).toFixed(1)}★)</span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest opacity-40 italic">New Artisan</span>
                            )}
                          </td>
                        )}
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleToggleStatus(user.id)}
                              className={`p-2.5 rounded-xl transition-all ${
                                isFrozen
                                  ? "text-green-600 hover:bg-green-50 border border-transparent hover:border-green-100"
                                  : "text-blue-500 hover:bg-blue-50 border border-transparent hover:border-blue-100"
                              }`}
                              title={isFrozen ? "Unfreeze Account" : "Freeze Account"}
                            >
                              <Snowflake className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setTerminateTarget(user);
                                setShowTerminateConfirm(true);
                              }}
                              className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-red-100"
                              title="Terminate Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden flex flex-col divide-y divide-[var(--border)]">
            {loading ? (
              <div className="px-8 py-20 text-center text-[var(--muted)] italic animate-pulse">
                Synchronizing community records...
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-8 py-20 text-center text-[var(--muted)] italic">
                {searchTerm ? "No results found." : "No records identified."}
              </div>
            ) : (
              filtered.map((user, idx) => (
                <MobileUserCard
                  key={user.id}
                  user={user}
                  index={idx}
                  activeTab={activeTab}
                  onToggleStatus={() => handleToggleStatus(user.id)}
                  onTerminate={() => {
                    setTerminateTarget(user);
                    setShowTerminateConfirm(true);
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* Footer count */}
        {!loading && (
          <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest opacity-50 px-2">
            Showing {filtered.length} of {users.length} registered {activeTab}
          </div>
        )}

        {/* Terminate Modal */}
        <ConfirmationModal
          isOpen={showTerminateConfirm}
          onClose={() => { setShowTerminateConfirm(false); setTerminationReason(""); }}
          onConfirm={handleTerminateAccount}
          title={`Terminate ${activeTab === 'customers' ? 'Customer' : 'Artisan'}?`}
          message={`Are you sure you want to PERMANENTLY terminate ${terminateTarget?.name}'s account? This will purge all profile data${activeTab === 'sellers' ? ' and permanently delete all their listed products.' : '.'} This action is irreversible.`}
          confirmText="Terminate & Purge"
          cancelText="Cancel"
          type="danger"
        >
          <div className="mt-6 text-left">
             <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] ml-1">Reason for Termination</label>
             <textarea 
               value={terminationReason}
               onChange={(e) => setTerminationReason(e.target.value)}
               placeholder="e.g. Terms of Service violation, Fraudulent activity..."
               className="w-full mt-2 p-4 bg-gray-50 border border-[var(--border)] rounded-2xl text-xs font-medium outline-none focus:border-red-500 transition-all min-h-[100px] resize-none"
             />
          </div>
        </ConfirmationModal>

      </div>
    </AdminLayout>
  );
}
function MobileUserCard({ user, index, activeTab, onToggleStatus, onTerminate }) {
  const isFrozen = user.status === "frozen";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="p-6 space-y-4 active:bg-gray-50 transition-colors"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--bark)] rounded-xl flex items-center justify-center text-white font-serif font-bold shadow-sm">
            {user.name ? user.name[0].toUpperCase() : "U"}
          </div>
          <div>
            <div className="font-bold text-sm text-[var(--charcoal)]">{user.name}</div>
            <div className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-widest">
              Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </div>
          </div>
        </div>
        <div
          className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-full border italic ${
            isFrozen ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-green-50 text-green-700 border-green-100"
          }`}
        >
          {isFrozen ? "Frozen" : "Active"}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 border-y border-[var(--border)]/30 py-4">
        <div className="text-[11px] font-medium text-[var(--charcoal)] flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-[var(--muted)]" /> {user.email}
        </div>
        <div className="text-[11px] font-medium text-[var(--charcoal)] flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 text-[var(--muted)]" /> {user.mobileNumber || user.mobile || "—"}
        </div>
        {activeTab === 'sellers' && user.avgRating && (
          <div className="text-[11px] font-bold text-[var(--rust)] flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Performance: {Number(user.avgRating).toFixed(1)}★
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onToggleStatus}
          className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-all ${
            isFrozen ? "bg-green-50 text-green-700 border-green-200" : "bg-blue-50 text-blue-700 border-blue-200"
          }`}
        >
          {isFrozen ? "Unfreeze" : "Freeze"}
        </button>
        <button
          onClick={onTerminate}
          className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-red-200"
        >
          Terminate
        </button>
      </div>
    </motion.div>
  );
}
