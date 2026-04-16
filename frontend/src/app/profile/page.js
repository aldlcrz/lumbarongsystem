"use client";
import React, { useState, useEffect } from "react";
import CustomerLayout from "@/components/CustomerLayout";
import { User, Mail, Phone, MapPin, Package, Edit, Lock, Eye, EyeOff, Check, Loader2, X, TrendingUp, Calendar, DollarSign, Plus, Trash2, Home, Navigation } from "lucide-react";
import { motion } from "framer-motion";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { api } from "@/lib/api";
import { useSocket } from "@/context/SocketContext";
import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import AddressManager from "@/components/AddressManager";
import { INPUT_LIMITS, sanitizePersonNameInput, sanitizePhoneInput } from "@/lib/inputValidation";

export default function CustomerProfile() {
   const [mounted, setMounted] = useState(false);
   useEffect(() => setMounted(true), []);

   const [user, setUser] = useState(null);
   const [loading, setLoading] = useState(true);
   const searchParams = useSearchParams();
   const tabParam = searchParams.get("tab");
   const [activeTab, setActiveTab] = useState(
      tabParam === "address" ? "Address Book" : 
      tabParam === "password" ? "Change Password" : 
      "Account Info"
   );

   useEffect(() => {
      if (tabParam === "address") setActiveTab("Address Book");
      else if (tabParam === "password") setActiveTab("Change Password");
   }, [tabParam]);
   const [showCurrentPassword, setShowCurrentPassword] = useState(false);
   const [showNewPassword, setShowNewPassword] = useState(false);
   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

   // Edit State
   const [isEditing, setIsEditing] = useState(false);
   const [editForm, setEditForm] = useState({ name: "", mobileNumber: "" });
   const [isSaving, setIsSaving] = useState(false);
   const [isUploading, setIsUploading] = useState(false);
   const fileInputRef = React.useRef(null);

   // Change Password State
   const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
   const [isChangingPassword, setIsChangingPassword] = useState(false);
   const [passwordMessage, setPasswordMessage] = useState(null); 

   // Analytics State
   const [stats, setStats] = useState({ activeOrders: 0 });
   const [statsLoading, setStatsLoading] = useState(false);
   const { socket } = useSocket();

   const fetchStats = useCallback(async () => {
      try {
         setStatsLoading(true);
         const res = await api.get("/users/stats");
         setStats(res.data);
      } catch (err) {
         console.error("Failed to fetch customer stats", err);
      } finally {
         setStatsLoading(false);
      }
   }, []);

   useEffect(() => {
      const fetchProfile = async () => {
         try {
            setLoading(true);
            const res = await api.get("/users/profile");
            const userData = res.data.user;
            setUser(userData);
            setEditForm({
               name: userData.name || "",
               mobileNumber: userData.mobileNumber || userData.mobile || ""
            });
            localStorage.setItem("customer_user", JSON.stringify(userData));
         } catch (error) {
            console.error("Failed to fetch fresh profile", error);
            // If fetch fails, we still have the local storage as fallback
            const storedUser = JSON.parse(localStorage.getItem("customer_user") || "{}");
            setUser(storedUser);
            setEditForm({
               name: storedUser.name || "",
               mobileNumber: storedUser.mobileNumber || storedUser.mobile || ""
            });
         } finally {
            setLoading(false);
         }
      };
      fetchProfile();
      fetchStats();
   }, []);

   useEffect(() => {
      if (mounted) fetchStats();

      if (socket) {
         const handler = () => fetchStats();
         socket.on('stats_update', handler);
         socket.on('order_updated', handler);
         socket.on('order_created', handler);

         return () => {
            socket.off('stats_update', handler);
            socket.off('order_updated', handler);
            socket.off('order_created', handler);
         };
      }
   }, [mounted, socket, fetchStats]);



   const handleSaveProfile = async () => {
      try {
         setIsSaving(true);
         const res = await api.put("/users/profile", {
            name: editForm.name,
            mobileNumber: editForm.mobileNumber
         });
         setUser(res.data.user);
         localStorage.setItem("customer_user", JSON.stringify(res.data.user));
         setIsEditing(false);
      } catch (error) {
         console.error("Failed to update profile", error);
         alert(error.response?.data?.message || "Failed to update profile");
      } finally {
         setIsSaving(false);
      }
   };

   const handlePhotoChange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
         setIsUploading(true);
         const formData = new FormData();
         formData.append("image", file);

         const uploadRes = await api.post("/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" }
         });

         const photoUrl = uploadRes.data.url;

         // Update profile with new photo
         const updateRes = await api.put("/users/profile", {
            profilePhoto: photoUrl
         });

         setUser(updateRes.data.user);
         localStorage.setItem("customer_user", JSON.stringify(updateRes.data.user));
      } catch (error) {
         console.error("Failed to upload photo", error);
         alert(error.response?.data?.message || "Failed to upload photo");
      } finally {
         setIsUploading(false);
      }
   };

   const handleChangePassword = async () => {
      const { currentPassword, newPassword, confirmPassword } = passwordForm;
      if (!currentPassword || !newPassword || !confirmPassword) {
         setPasswordMessage({ type: 'error', text: 'Please fill in all password fields.' });
         return;
      }
      if (newPassword.length < 8) {
         setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters.' });
         return;
      }
      if (newPassword !== confirmPassword) {
         setPasswordMessage({ type: 'error', text: 'New password and confirmation do not match.' });
         return;
      }
      try {
         setIsChangingPassword(true);
         setPasswordMessage(null);
         await api.put("/users/change-password", { currentPassword, newPassword });
         setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
         setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } catch (error) {
         setPasswordMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update password.' });
      } finally {
         setIsChangingPassword(false);
         setTimeout(() => setPasswordMessage(null), 5000);
      }
   };

   return (
      <CustomerLayout>
         <div className="max-w-6xl mx-auto mb-20">

            {loading ? (
               <div className="bg-white rounded-3xl p-24 text-center text-[var(--muted)] animate-pulse italic shadow-sm">Synchronizing your customer profile...</div>
            ) : (
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                  {/* Left Column: Avatar & Quick Stats */}
                  <div className="lg:col-span-4 space-y-6">

                     {/* Avatar Card */}
                     <div className="bg-white rounded-[2rem] p-10 flex flex-col items-center text-center shadow-sm border border-[var(--border)] relative overflow-hidden">
                        {/* Avatar Icon */}
                        <div 
                           className="relative mb-4 cursor-pointer group" 
                           onClick={() => fileInputRef.current?.click()}
                        >
                           {user?.profilePhoto ? (
                              <img 
                                 src={user.profilePhoto} 
                                 alt={user.name} 
                                 className="w-24 h-24 rounded-[1.5rem] object-cover shadow-lg relative z-10 border-2 border-white scale-100 group-hover:scale-105 transition-transform"
                                 onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://ui-avatars.com/api/?name=" + (user?.name || "User") + "&background=B94232&color=fff";
                                 }}
                              />
                           ) : (
                              <div className="w-24 h-24 bg-[#B94232] rounded-[1.5rem] flex items-center justify-center text-white font-serif text-5xl font-normal shadow-lg relative z-10 scale-100 group-hover:scale-105 transition-transform">
                                 {user?.name?.[0] || 'J'}
                              </div>
                           )}
                           {/* Green Check Badge */}
                           <div className="absolute -bottom-1 -right-1 z-20 bg-green-600 outline outline-4 outline-white w-6 h-6 rounded-full flex items-center justify-center">
                              <Check strokeWidth={4} className="w-3.5 h-3.5 text-white" />
                           </div>
                           {isUploading && (
                              <div className="absolute inset-0 z-30 bg-black/40 rounded-[1.5rem] flex items-center justify-center">
                                 <Loader2 className="w-6 h-6 text-white animate-spin" />
                              </div>
                           )}
                        </div>

                        <input 
                           type="file" 
                           ref={fileInputRef} 
                           onChange={handlePhotoChange} 
                           className="hidden" 
                           accept="image/*"
                        />

                        <button 
                           onClick={() => fileInputRef.current?.click()}
                           disabled={isUploading}
                           className="text-[10px] font-medium text-[var(--muted)] opacity-80 mb-6 hover:text-[var(--rust)] transition-colors disabled:opacity-50"
                        >
                           {isUploading ? "Uploading..." : "Tap to change photo"}
                        </button>

                        <div className="space-y-1 w-full relative z-10">
                           <h3 className="font-serif text-lg font-bold text-[#2A2A2A]">{user?.name || "Artisan Customer"}</h3>
                           <p className="text-xs text-[var(--muted)] opacity-80">{user?.email || "No email provided"}</p>
                        </div>

                        <div className="mt-8 pt-6 border-t border-[var(--border)] w-full text-center flex items-center justify-center gap-2">
                           <span className="text-[var(--rust)]"><Package className="w-3 h-3" /></span>
                           <p className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-widest opacity-60">
                              {user?.createdAt ? `Member since ${new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}` : "Heritage Member"}
                           </p>
                        </div>
                     </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-1 gap-6">
                         <div className="bg-white rounded-[1.5rem] p-6 flex flex-col items-center justify-center text-center shadow-sm border border-[var(--border)]">
                            <div className="w-10 h-10 rounded-xl border border-red-200 bg-red-50 flex items-center justify-center text-[var(--rust)] mb-3">
                               <Package strokeWidth={1.5} className="w-5 h-5" />
                            </div>
                            <div className="text-xl font-serif font-bold text-[#2A2A2A]">{stats?.activeOrders || "0"}</div>
                            <div className="text-[8px] font-bold text-[var(--muted)] uppercase tracking-widest opacity-60 mt-1">ACTIVE ORDERS</div>
                         </div>
                      </div>

                  </div>

                  {/* Right Column: Detailed Info Tabs */}
                  <div className="lg:col-span-8">
                     <div className="bg-white rounded-[2rem] shadow-sm border border-[var(--border)] overflow-hidden min-h-[500px]">

                        {/* Tabs Header */}
                        <div className="flex border-b border-[var(--border)]">
                           <button
                              onClick={() => setActiveTab("Account Info")}
                              className={`px-8 py-5 text-sm font-bold transition-all relative ${activeTab === "Account Info" ? "text-[#2A2A2A]" : "text-[var(--muted)] hover:text-[#2A2A2A]"}`}
                           >
                              Account Info
                              {activeTab === "Account Info" && (
                                 <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--rust)]" />
                              )}
                           </button>
                           <button
                              onClick={() => setActiveTab("Change Password")}
                              className={`px-8 py-5 text-sm font-bold transition-all relative ${activeTab === "Change Password" ? "text-[#2A2A2A]" : "text-[var(--muted)] hover:text-[#2A2A2A]"}`}
                           >
                              Change Password
                              {activeTab === "Change Password" && (
                                 <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--rust)]" />
                              )}
                           </button>
                           <button
                              onClick={() => setActiveTab("Address Book")}
                              className={`px-8 py-5 text-sm font-bold transition-all relative ${activeTab === "Address Book" ? "text-[#2A2A2A]" : "text-[var(--muted)] hover:text-[#2A2A2A]"}`}
                           >
                              Address Book
                              {activeTab === "Address Book" && (
                                 <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--rust)]" />
                              )}
                           </button>
                        </div>

                        <div className="p-10">
                           {/* Account Info Tab Content */}
                           {activeTab === "Account Info" && (
                              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                 <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                       <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-[var(--rust)] border border-red-100">
                                          <User strokeWidth={1.5} className="w-5 h-5" />
                                       </div>
                                       <div>
                                          <h3 className="font-serif text-lg font-bold text-[#2A2A2A]">Account Information</h3>
                                          <p className="text-xs text-[var(--muted)] mt-1">Your registered account details</p>
                                       </div>
                                    </div>
                                    {!isEditing && (
                                       <button
                                          onClick={() => setIsEditing(true)}
                                          className="flex items-center gap-2 px-6 py-2.5 bg-[#F7F3EE] hover:bg-[#EBE5DE] text-[#2A2A2A] rounded-xl text-xs font-bold transition-all"
                                       >
                                          <Edit className="w-3.5 h-3.5" /> Edit
                                       </button>
                                    )}
                                 </div>

                                 <div className="border border-[var(--border)] rounded-3xl overflow-hidden">
                                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">
                                       <div className="p-6">
                                          <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--rust)] uppercase tracking-widest mb-1.5 opacity-80">
                                             <User className="w-3 h-3" /> FULL NAME
                                          </div>
                                          {isEditing ? (
                                             <input
                                                type="text"
                                                value={editForm.name}
                                                maxLength={INPUT_LIMITS.personName}
                                                onChange={(e) => setEditForm({ ...editForm, name: sanitizePersonNameInput(e.target.value) })}
                                                className="w-full font-bold text-[#2A2A2A] bg-[#FDFCFB] border border-[var(--border)] rounded-xl px-4 py-2 outline-none focus:border-[var(--rust)] shadow-sm transition-all"
                                             />
                                          ) : (
                                             <div className="font-bold text-[#2A2A2A] text-base">{user?.name || "Juan Dela Cruz"}</div>
                                          )}
                                       </div>
                                       <div className="p-6">
                                          <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--rust)] uppercase tracking-widest mb-1.5 opacity-80">
                                             <Mail className="w-3 h-3" /> EMAIL ADDRESS
                                          </div>
                                          <div className={`font-bold text-base ${isEditing ? 'text-[var(--muted)] opacity-70' : 'text-[#2A2A2A]'}`}>{user?.email || "customer@lumbarong.com"}</div>
                                          {isEditing && <div className="text-[9px] text-[var(--rust)] mt-1.5 font-bold uppercase tracking-widest">EMAIL CANNOT BE CHANGED</div>}
                                       </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 border-t border-[var(--border)] divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">
                                       <div className="p-6">
                                          <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--rust)] uppercase tracking-widest mb-1.5 opacity-80">
                                             <Phone className="w-3 h-3" /> PHONE NUMBER
                                          </div>
                                          {isEditing ? (
                                             <input
                                                type="text"
                                                value={editForm.mobileNumber}
                                                inputMode="numeric"
                                                maxLength={INPUT_LIMITS.mobileNumber}
                                                onChange={(e) => setEditForm({ ...editForm, mobileNumber: sanitizePhoneInput(e.target.value) })}
                                                className="w-full font-bold text-[#2A2A2A] bg-[#FDFCFB] border border-[var(--border)] rounded-xl px-4 py-2 outline-none focus:border-[var(--rust)] shadow-sm transition-all"
                                                placeholder="+63 9xx xxx xxxx"
                                             />
                                          ) : (
                                             <div className="font-bold text-[#2A2A2A] text-base">{user?.mobileNumber || user?.mobile || "+63 9xx xxx xxxx"}</div>
                                          )}
                                       </div>
                                       <div className="p-6">
                                          <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--rust)] uppercase tracking-widest mb-1.5 opacity-80">
                                             <MapPin className="w-3 h-3" /> DEFAULT LOCATION
                                          </div>
                                          <div className={`font-bold text-base ${isEditing ? 'text-[var(--muted)] opacity-70' : 'text-[#2A2A2A]'}`}>
                                             {user?.defaultCity || "Registry not set"}
                                          </div>
                                          {isEditing && <div className="text-[9px] text-[var(--muted)] mt-1.5 font-bold uppercase tracking-widest">UPDATE VIA ADDRESS BOOK</div>}
                                       </div>
                                    </div>
                                 </div>

                                 {isEditing && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end gap-3 pt-2">
                                       <button
                                          onClick={() => {
                                             setEditForm({ name: user?.name || "", mobileNumber: user?.mobileNumber || user?.mobile || "" });
                                             setIsEditing(false);
                                          }}
                                          className="px-6 py-3 text-xs font-bold text-[var(--muted)] hover:bg-[#F7F3EE] hover:text-[var(--charcoal)] rounded-xl transition-all border border-transparent hover:border-[var(--border)]"
                                       >
                                          Cancel
                                       </button>
                                       <button
                                          onClick={handleSaveProfile}
                                          disabled={isSaving}
                                          className="px-8 py-3 text-xs font-bold text-white bg-[var(--rust)] hover:bg-[#E8604A] rounded-xl transition-all shadow-[0_8px_20px_rgba(192,66,42,0.2)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                       >
                                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                          Save Changes
                                       </button>
                                    </motion.div>
                                 )}
                              </motion.div>
                           )}

                           {/* Change Password Tab Content */}
                           {activeTab === "Change Password" && (
                              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-xl">
                                 <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-[var(--rust)] border border-red-100">
                                       <Lock strokeWidth={1.5} className="w-5 h-5" />
                                    </div>
                                    <div>
                                       <h3 className="font-serif text-lg font-bold text-[#2A2A2A]">Change Password</h3>
                                       <p className="text-xs text-[var(--muted)] mt-1">Keep your account secure with a strong password</p>
                                    </div>
                                 </div>

                                 <div className="space-y-6">
                                    <div className="space-y-2">
                                       <label className="text-xs font-bold text-[#2A2A2A]">Current Password</label>
                                       <div className="relative flex items-center bg-[#FDFCFB] border border-[var(--border)] rounded-2xl px-4 py-3.5 focus-within:border-[var(--rust)] transition-colors">
                                          <Lock className="w-4 h-4 text-[var(--muted)] mr-3 shrink-0" />
                                          <input
                                             type={showCurrentPassword ? "text" : "password"}
                                             value={passwordForm.currentPassword}
                                             onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                             placeholder="Enter your current password"
                                             className="bg-transparent w-full text-sm outline-none text-[#2A2A2A]"
                                          />
                                          <button
                                             type="button"
                                             onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                             className="text-[var(--muted)] hover:text-[#2A2A2A]"
                                          >
                                             {showCurrentPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                          </button>
                                       </div>
                                    </div>

                                    <div className="space-y-2">
                                       <label className="text-xs font-bold text-[#2A2A2A]">New Password</label>
                                       <div className="relative flex items-center bg-[#FDFCFB] border border-[var(--border)] rounded-2xl px-4 py-3.5 focus-within:border-[var(--rust)] transition-colors">
                                          <Lock className="w-4 h-4 text-[var(--muted)] mr-3 shrink-0" />
                                          <input
                                             type={showNewPassword ? "text" : "password"}
                                             value={passwordForm.newPassword}
                                             onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                             placeholder="At least 8 characters"
                                             className="bg-transparent w-full text-sm outline-none text-[#2A2A2A]"
                                          />
                                          <button
                                             type="button"
                                             onClick={() => setShowNewPassword(!showNewPassword)}
                                             className="text-[var(--muted)] hover:text-[#2A2A2A]"
                                          >
                                             {showNewPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                          </button>
                                       </div>
                                    </div>

                                    <div className="space-y-2">
                                       <label className="text-xs font-bold text-[#2A2A2A]">Confirm New Password</label>
                                       <div className="relative flex items-center bg-[#FDFCFB] border border-[var(--border)] rounded-2xl px-4 py-3.5 focus-within:border-[var(--rust)] transition-colors">
                                          <Lock className="w-4 h-4 text-[var(--muted)] mr-3 shrink-0" />
                                          <input
                                             type={showConfirmPassword ? "text" : "password"}
                                             value={passwordForm.confirmPassword}
                                             onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                             placeholder="Re-enter new password"
                                             className="bg-transparent w-full text-sm outline-none text-[#2A2A2A]"
                                          />
                                          <button
                                             type="button"
                                             onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                             className="text-[var(--muted)] hover:text-[#2A2A2A]"
                                          >
                                             {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                          </button>
                                       </div>
                                    </div>

                                    <button 
                                       onClick={handleChangePassword}
                                       disabled={isChangingPassword}
                                       className="w-full bg-[#E3A8A0] text-white py-4 rounded-xl text-[10px] font-extrabold uppercase tracking-[0.15em] flex items-center justify-center gap-2 hover:bg-[#D99A93] transition-colors mt-2 shadow-sm disabled:opacity-50"
                                    >
                                       {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                       UPDATE PASSWORD
                                    </button>

                                    {passwordMessage && (
                                       <div className={`mt-4 p-4 rounded-xl text-xs font-bold text-center ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                          {passwordMessage.text}
                                       </div>
                                    )}
                                 </div>
                              </motion.div>
                           )}

                           {/* Address Book Tab Content */}
                           {activeTab === "Address Book" && (
                              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                 <AddressManager />
                              </motion.div>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            )}
         </div>
      </CustomerLayout>
   );
}
