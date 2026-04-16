"use client";
import React, { useState, useEffect } from "react";
import SellerLayout from "@/components/SellerLayout";
import { User, Mail, Phone, Calendar, ShieldCheck, MapPin, Building, Trash2, Facebook, Instagram, Youtube, Music, Link as LinkIcon, Plus, X, Edit2, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { api } from "@/lib/api";
import dynamic from 'next/dynamic';
import { INPUT_LIMITS, sanitizePersonNameInput, sanitizePhoneInput } from "@/lib/inputValidation";

const LocationPicker = dynamic(
  () => import('@/components/LocationPicker'),
  { ssr: false, loading: () => <div className="h-52 w-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-[var(--muted)] text-xs font-bold uppercase tracking-widest">Loading Map...</div> }
);

export default function SellerProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    facebookLink: '',
    instagramLink: '',
    tiktokLink: '',
    youtubeLink: '',
    socialLinks: [],
    gcashNumber: '',
    mayaNumber: ''
  });
  const [qrFile, setQrFile] = useState(null);
  const [mayaQrFile, setMayaQrFile] = useState(null);
  const [profileFile, setProfileFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [locationForm, setLocationForm] = useState({
    shopHouseNo: '',
    shopStreet: '',
    shopBarangay: '',
    shopCity: '',
    shopProvince: '',
    shopPostalCode: '',
    shopLatitude: null,
    shopLongitude: null
  });
  const [isSavingLocation, setIsSavingLocation] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/users/profile');
        setUser(data.user);
        localStorage.setItem("seller_user", JSON.stringify(data.user));
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileFile(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let gcashQrUrl = null;
      if (qrFile) {
        const gcashFormData = new FormData();
        gcashFormData.append('image', qrFile);
        const uploadRes = await api.post('/upload', gcashFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        gcashQrUrl = uploadRes.data.url;
      }

      let profileUrl = null;
      if (profileFile) {
        const profileFormData = new FormData();
        profileFormData.append('image', profileFile);
        const uploadRes = await api.post('/upload', profileFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        profileUrl = uploadRes.data.url;
      }

      let mayaQrUrl = null;
      if (mayaQrFile) {
        const mayaFormData = new FormData();
        mayaFormData.append('image', mayaQrFile);
        const uploadRes = await api.post('/upload', mayaFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        mayaQrUrl = uploadRes.data.url;
      }

      const updatePayload = { ...formData };
      if (profileUrl) updatePayload.profilePhoto = profileUrl;
      if (gcashQrUrl) updatePayload.gcashQrCode = gcashQrUrl;
      if (mayaQrUrl) updatePayload.mayaQrCode = mayaQrUrl;

      const { data } = await api.put('/users/profile', updatePayload);

      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Error updating profile. Please ensure image size is optimized.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveLocation = async (e) => {
    e.preventDefault();
    setIsSavingLocation(true);
    try {
      const { data } = await api.put('/users/profile', locationForm);
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      setShowLocationModal(false);
      setShowMapPicker(false);
    } catch (err) {
      console.error('Failed to save location', err);
      alert('Error saving location.');
    } finally {
      setIsSavingLocation(false);
    }
  };

  return (
    <SellerLayout>
      <div className="max-w-4xl mx-auto space-y-12 mb-20">
        <div>
          <div className="eyebrow">Profile</div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[var(--charcoal)] uppercase">
            Workshop <span className="text-[var(--rust)] italic lowercase">Profile</span>
          </h1>
        </div>

        {loading ? (
          <div className="artisan-card p-24 text-center text-[var(--muted)] animate-pulse italic">Connecting to heritage registry...</div>
        ) : !user ? (
          <div className="artisan-card p-20 text-center text-[var(--muted)]">Session expired. Please sign in to the platform.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Left: Identity Card */}
            <div className="md:col-span-1 space-y-6">
              <div className="artisan-card p-10 flex flex-col items-center text-center group hover:scale-[1.02] transition-all shadow-2xl relative overflow-hidden bg-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--rust)] opacity-5 -translate-y-1/2 translate-x-1/2 rounded-full ring-4 ring-white" />
                <div className="w-24 h-24 bg-[var(--bark)] rounded-3xl flex items-center justify-center text-white font-serif text-xl font-bold shadow-2xl ring-4 ring-white group-hover:rotate-6 transition-transform overflow-hidden">
                  {user.profilePhoto ? (
                    <img src={user.profilePhoto.startsWith('http') ? user.profilePhoto : `http://localhost:5000/uploads/profile_photos/${user.profilePhoto.split('/').pop()}`} alt={user.name} className="w-full h-full object-cover" onError={(e) => e.target.src = '/images/placeholder.png'} />
                  ) : (
                    user.name ? user.name[0] : "L"
                  )}
                </div>
                <div className="mt-8 space-y-2 relative z-10">
                  <h3 className="font-serif text-2xl font-bold text-[var(--charcoal)]">{user.name}</h3>

                </div>
                <div className={`mt-6 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm ${user.isVerified ? 'bg-green-50 text-green-700 border-green-200 ring-2 ring-white' : 'bg-amber-50 text-amber-700 border-amber-200 ring-2 ring-white animate-pulse'}`}>
                  {user.isVerified ? "Status: Verified" : "Review in Progress"}
                </div>

                {/* Dynamic Social Links Row */}
                <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
                  {(() => {
                    let links = user.socialLinks;
                    if (typeof links === 'string') { try { links = JSON.parse(links); } catch { links = []; } }
                    if (!Array.isArray(links)) links = [];
                    const filtered = links.filter(l => l.url && l.url.trim());
                    return filtered.length > 0 ? (
                      filtered.map((link, idx) => (
                        <SocialIcon key={idx} href={link.url.trim()} tooltip={link.label || link.url} />
                      ))
                    ) : (
                      <div className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest opacity-50">No Social Links</div>
                    );
                  })()}
                </div>
              </div>


            </div>

            {/* Right: Detailed Info */}
            <div className="md:col-span-2 space-y-8 animate-fade-in">
              <div className="artisan-card p-12 space-y-10 shadow-2xl bg-white/50 backdrop-blur-md">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                  <ProfileItem label="ShopName" value={user.name} icon={<User />} />
                  <ProfileItem label="Email Address" value={user.email} icon={<Mail />} />
                  <ProfileItem label="Contact Number" value={user.mobileNumber || user.mobile || 'Not set'} icon={<Phone />} />
                  {/* Clickable Location */}
                  <div className="space-y-2 group">
                    <div className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest flex items-center gap-2 group-hover:text-[var(--rust)] transition-colors">
                      <MapPin className="w-3.5 h-3.5" /> Location
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-bold text-[var(--charcoal)] border-b border-transparent group-hover:border-[var(--border)] pb-1 transition-all flex-1">
                        {user.shopCity ? `${user.shopCity}, ${user.shopProvince}` : 'Not set'}
                      </div>
                      <button
                        onClick={() => {
                          setLocationForm({
                            shopHouseNo: user.shopHouseNo || '',
                            shopStreet: user.shopStreet || '',
                            shopBarangay: user.shopBarangay || '',
                            shopCity: user.shopCity || '',
                            shopProvince: user.shopProvince || '',
                            shopPostalCode: user.shopPostalCode || '',
                            shopLatitude: user.shopLatitude || null,
                            shopLongitude: user.shopLongitude || null,
                          });
                          setShowMapPicker(false);
                          setShowLocationModal(true);
                        }}
                        className="p-1.5 rounded-lg bg-[var(--rust)]/10 text-[var(--rust)] hover:bg-[var(--rust)] hover:text-white transition-all"
                        title="Set Shop Location"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-10 border-t border-[var(--border)] grid grid-cols-1 gap-10">
                  <ProfileItem 
                    label="Established On" 
                    value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "March 2026"} 
                    icon={<Calendar />} 
                  />
                </div>

                <div className="pt-10 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
                  {/* GCash Section */}
                  <div className="space-y-4">
                    <div className="text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.2em] flex items-center gap-2">
                      GCash Account
                    </div>
                    <div className="text-lg font-serif font-bold text-[var(--charcoal)] tracking-tight">
                      {user.gcashNumber || 'Not set'}
                    </div>
                    {user.gcashQrCode ? (
                      <div className="w-[120px] h-[120px] rounded-2xl overflow-hidden border-2 border-[var(--border)] shadow-sm bg-white flex items-center justify-center p-2 group/qr relative">
                        <img src={user.gcashQrCode.startsWith('http') ? user.gcashQrCode : `http://localhost:5000/uploads/seller_documents/${user.gcashQrCode.split('/').pop()}`} alt="GCash QR" className="w-full h-full object-contain rounded-lg" onError={(e) => e.target.src = '/images/placeholder.png'} />
                      </div>
                    ) : (
                      <div className="w-[120px] h-[120px] rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--input-bg)]/30 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest opacity-40">No QR Code</span>
                      </div>
                    )}
                  </div>

                  {/* Maya Section */}
                  <div className="space-y-4">
                    <div className="text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.2em] flex items-center gap-2">
                      Maya Account
                    </div>
                    <div className="text-lg font-serif font-bold text-[var(--charcoal)] tracking-tight">
                      {user.mayaNumber || 'Not set'}
                    </div>
                    {user.mayaQrCode ? (
                      <div className="w-[120px] h-[120px] rounded-2xl overflow-hidden border-2 border-[var(--border)] shadow-sm bg-white flex items-center justify-center p-2 group/qr relative">
                        <img src={user.mayaQrCode.startsWith('http') ? user.mayaQrCode : `http://localhost:5000/uploads/seller_documents/${user.mayaQrCode.split('/').pop()}`} alt="Maya QR" className="w-full h-full object-contain rounded-lg" onError={(e) => e.target.src = '/images/placeholder.png'} />
                      </div>
                    ) : (
                      <div className="w-[120px] h-[120px] rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--input-bg)]/30 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest opacity-40">No QR Code</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-10 border-t border-[var(--border)] flex flex-col md:flex-row gap-4">
                  <button
                    onClick={() => {
                      setFormData({
                        name: user.name || '',
                        mobileNumber: user.mobileNumber || user.mobile || '',
                        facebookLink: user.facebookLink || '',
                        instagramLink: user.instagramLink || '',
                        tiktokLink: user.tiktokLink || '',
                        youtubeLink: user.youtubeLink || '',
                        socialLinks: (() => { let v = user.socialLinks; if (typeof v === 'string') { try { v = JSON.parse(v); } catch { v = []; } } return Array.isArray(v) ? v : []; })(),
                        gcashNumber: user.gcashNumber || '',
                        mayaNumber: user.mayaNumber || ''
                      });
                      setQrFile(null);
                      setMayaQrFile(null);
                      setIsEditing(true);
                    }}
                    className="flex-1 btn-primary py-4 text-xs font-bold uppercase tracking-widest shadow-xl">
                    Edit Profile
                  </button>
                  <button className="flex-1 py-4 px-6 border-2 border-[var(--border)] rounded-xl text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 hover:border-red-200 transition-all flex items-center justify-center gap-2 group"><Trash2 className="w-4 h-4 group-hover:scale-110" /> Deactivate Workshop</button>
                </div>
              </div>

              <div className="p-8 bg-amber-50 border border-amber-100 rounded-3xl flex items-center gap-6 shadow-sm">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner"><ShieldCheck className="w-6 h-6" /></div>
                <div>
                  <div className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">Security Recommendation</div>
                  <div className="text-xs text-amber-700/70 font-medium leading-relaxed">Artisan accounts should maintain multi-factor authentication for higher transaction security during heritage auctions.</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 md:p-12 shadow-2xl relative block">
            <button onClick={() => setIsEditing(false)} className="absolute top-8 right-8 text-[var(--muted)] hover:text-black transition-colors bg-gray-100 p-2 rounded-full">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
            <h3 className="font-serif text-2xl font-bold mb-8 text-[var(--charcoal)]">Edit <span className="text-[var(--rust)] italic">Profile</span></h3>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Profile Photo Upload */}
              <div className="flex flex-col items-center gap-4 mb-8">
                <div className="relative group/photo cursor-pointer" onClick={() => document.getElementById('profileUpload').click()}>
                  <div className="w-28 h-28 rounded-3xl border-2 border-dashed border-[var(--border)] bg-[var(--input-bg)] flex items-center justify-center overflow-hidden transition-all group-hover/photo:border-[var(--rust)]">
                    {profilePreview || user.profilePhoto ? (
                      <img src={profilePreview || (user.profilePhoto.startsWith('http') ? user.profilePhoto : `http://localhost:5000/uploads/profile_photos/${user.profilePhoto.split('/').pop()}`)} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-[var(--muted)]" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center transition-opacity">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <input id="profileUpload" type="file" accept="image/*" className="hidden" onChange={handleProfileChange} />
                </div>
                <div className="text-center">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--charcoal)]">Shop Profile Photo</h4>
                  <p className="text-[9px] text-[var(--muted)]">Click to upload your workshop avatar</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Shop Name</label>
                  <input required type="text" value={formData.name} maxLength={INPUT_LIMITS.personName} onChange={e => setFormData({ ...formData, name: sanitizePersonNameInput(e.target.value) })} className="w-full p-4 border border-[var(--border)] rounded-xl bg-[var(--input-bg)] text-sm text-[var(--charcoal)] focus:outline-none focus:border-[var(--rust)] focus:ring-1 focus:ring-[var(--rust)]" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Mobile Number</label>
                  <input type="text" value={formData.mobileNumber} inputMode="numeric" maxLength={INPUT_LIMITS.mobileNumber} onChange={e => setFormData({ ...formData, mobileNumber: sanitizePhoneInput(e.target.value) })} className="w-full p-4 border border-[var(--border)] rounded-xl bg-[var(--input-bg)] text-sm text-[var(--charcoal)] focus:outline-none focus:border-[var(--rust)] focus:ring-1 focus:ring-[var(--rust)]" />
                </div>
                <div className="col-span-full pt-6 border-t border-[var(--border)]">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-[var(--charcoal)]">Social Links</h4>
                      <p className="text-[10px] text-[var(--muted)]">social media links</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, socialLinks: [...formData.socialLinks, { label: '', url: '' }] })}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--rust)] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Link
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.socialLinks.map((link, idx) => (
                      <div key={idx} className="p-4 border border-[var(--border)] rounded-2xl bg-[var(--cream)]/10 space-y-4 relative group/link">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              socialLinks: prev.socialLinks.filter((_, i) => i !== idx)
                            }));
                          }}
                          className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover/link:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest">Link Description</label>
                            <input
                              type="text"
                              placeholder="e.g. My Portfolio"
                              className="w-full p-3 border border-[var(--border)] rounded-xl bg-white text-xs text-[var(--charcoal)] focus:outline-none focus:border-[var(--rust)]"
                              value={link.label}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormData(prev => ({
                                  ...prev,
                                  socialLinks: prev.socialLinks.map((l, i) =>
                                    i === idx ? { ...l, label: val } : l
                                  )
                                }));
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest">Link URL</label>
                            <input
                              type="text"
                              placeholder="e.g. instagram.com/shop"
                              className="w-full p-3 border border-[var(--border)] rounded-xl bg-white text-xs text-[var(--charcoal)] focus:outline-none focus:border-[var(--rust)]"
                              value={link.url}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormData(prev => ({
                                  ...prev,
                                  socialLinks: prev.socialLinks.map((l, i) =>
                                    i === idx ? { ...l, url: val } : l
                                  )
                                }));
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {formData.socialLinks.length === 0 && (
                      <div className="py-10 text-center border-2 border-dashed border-[var(--border)] rounded-2xl">
                        <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest opacity-50">No Dynamic Links Yet</p>
                      </div>
                    )}
                  </div>
                </div>



                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">GCash Number</label>
                  <input type="text" value={formData.gcashNumber} inputMode="numeric" maxLength={INPUT_LIMITS.mobileNumber} onChange={e => setFormData({ ...formData, gcashNumber: sanitizePhoneInput(e.target.value) })} className="w-full p-4 border border-[var(--border)] rounded-xl bg-[var(--input-bg)] text-sm text-[var(--charcoal)] focus:outline-none focus:border-[var(--rust)] focus:ring-1 focus:ring-[var(--rust)]" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">GCash QR Code</label>
                  <input type="file" accept="image/*" onChange={e => setQrFile(e.target.files[0])} className="w-full p-4 border border-[var(--border)] rounded-xl bg-[var(--input-bg)] text-sm flex items-center focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Maya Number</label>
                  <input type="text" value={formData.mayaNumber} inputMode="numeric" maxLength={INPUT_LIMITS.mobileNumber} onChange={e => setFormData({ ...formData, mayaNumber: sanitizePhoneInput(e.target.value) })} className="w-full p-4 border border-[var(--border)] rounded-xl bg-[var(--input-bg)] text-sm text-[var(--charcoal)] focus:outline-none focus:border-[var(--rust)] focus:ring-1 focus:ring-[var(--rust)]" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Maya QR Code</label>
                  <input type="file" accept="image/*" onChange={e => setMayaQrFile(e.target.files[0])} className="w-full p-4 border border-[var(--border)] rounded-xl bg-[var(--input-bg)] text-sm flex items-center focus:outline-none" />
                </div>
              </div>
              <div className="pt-4 mt-8 border-t border-[var(--border)]">
                <button disabled={isSubmitting} type="submit" className="w-full btn-primary py-4 text-xs font-bold uppercase tracking-widest shadow-xl flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Pushing to Registry...
                    </span>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location Modal */}
      <AnimatePresence>
        {showLocationModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLocationModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.92, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 20, opacity: 0 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden z-10"
            >
              <div className="p-10">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-[var(--charcoal)] tracking-tight uppercase">
                      Shop <span className="text-[var(--rust)] italic lowercase">Location</span>
                    </h2>
                    <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mt-1">Set your workshop address</p>
                  </div>
                  <button onClick={() => setShowLocationModal(false)} className="p-2 bg-gray-100 rounded-xl text-[var(--muted)] hover:text-red-500 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveLocation} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest flex items-center gap-2"><Home className="w-3.5 h-3.5" /> House no, or landmark</label>
                      <input type="text" value={locationForm.shopHouseNo} onChange={e => setLocationForm(p => ({ ...p, shopHouseNo: e.target.value }))} placeholder="e.g. 123" className="w-full p-4 border border-[var(--border)] rounded-xl bg-[var(--input-bg)] text-sm text-[var(--charcoal)] focus:outline-none focus:border-[var(--rust)]" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Street</label>
                      <input type="text" value={locationForm.shopStreet} onChange={e => setLocationForm(p => ({ ...p, shopStreet: e.target.value }))} placeholder="e.g. M.H. Del Pilar St." className="w-full p-4 border border-[var(--border)] rounded-xl bg-[var(--input-bg)] text-sm text-[var(--charcoal)] focus:outline-none focus:border-[var(--rust)]" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Barangay</label>
                      <input type="text" value={locationForm.shopBarangay} onChange={e => setLocationForm(p => ({ ...p, shopBarangay: e.target.value }))} placeholder="e.g. Poblacion" className="w-full p-4 border border-[var(--border)] rounded-xl bg-[var(--input-bg)] text-sm text-[var(--charcoal)] focus:outline-none focus:border-[var(--rust)]" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> City / Municipality</label>
                      <input type="text" value={locationForm.shopCity} onChange={e => setLocationForm(p => ({ ...p, shopCity: e.target.value }))} placeholder="e.g. Lumban" className="w-full p-4 border border-[var(--border)] rounded-xl bg-[var(--input-bg)] text-sm text-[var(--charcoal)] focus:outline-none focus:border-[var(--rust)]" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Province</label>
                      <input type="text" value={locationForm.shopProvince} onChange={e => setLocationForm(p => ({ ...p, shopProvince: e.target.value }))} placeholder="e.g. Laguna" className="w-full p-4 border border-[var(--border)] rounded-xl bg-[var(--input-bg)] text-sm text-[var(--charcoal)] focus:outline-none focus:border-[var(--rust)]" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Postal Code</label>
                      <input type="text" value={locationForm.shopPostalCode} onChange={e => setLocationForm(p => ({ ...p, shopPostalCode: e.target.value }))} placeholder="e.g. 4014" className="w-full p-4 border border-[var(--border)] rounded-xl bg-[var(--input-bg)] text-sm text-[var(--charcoal)] focus:outline-none focus:border-[var(--rust)]" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[var(--border)] pt-5">
                    <button
                      type="button"
                      onClick={() => setShowMapPicker(v => !v)}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                        locationForm.shopLatitude
                          ? 'bg-green-50 text-green-700 border-2 border-green-200'
                          : showMapPicker
                          ? 'bg-[var(--rust)] text-white'
                          : 'bg-[var(--input-bg)] text-[var(--muted)] hover:bg-[var(--rust)] hover:text-white'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                      {locationForm.shopLatitude ? `Pinned (${locationForm.shopLatitude.toFixed(4)})` : (showMapPicker ? 'Hide Map' : 'Drop Pin on Map')}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if ('geolocation' in navigator) {
                          navigator.geolocation.getCurrentPosition(
                            async (pos) => {
                              const lat = pos.coords.latitude;
                              const lng = pos.coords.longitude;
                              setLocationForm(p => ({ ...p, shopLatitude: lat, shopLongitude: lng }));
                              
                              // Auto-fill address from GPS
                              try {
                                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`, {
                                  headers: { 'User-Agent': 'LumbaRongApp/1.0' }
                                });
                                const data = await res.json();
                                if (data && data.address) {
                                  const addr = data.address;
                                  setLocationForm(p => ({
                                    ...p,
                                    shopHouseNo: addr.house_number || p.shopHouseNo,
                                    shopStreet: addr.road || addr.pedestrian || p.shopStreet,
                                    shopBarangay: addr.suburb || addr.quarter || addr.village || p.shopBarangay,
                                    shopCity: addr.city || addr.town || addr.municipality || p.shopCity,
                                    shopProvince: addr.state || addr.region || p.shopProvince,
                                    shopPostalCode: addr.postcode || p.shopPostalCode,
                                  }));
                                }
                              } catch (e) {
                                console.error("Reverse geocoding failed", e);
                              }
                            },
                            () => alert('Unable to get your location.')
                          );
                        }
                      }}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-[var(--input-bg)] text-[var(--muted)] hover:bg-green-50 hover:text-green-700 transition-all"
                    >
                      <MapPin className="w-4 h-4" /> Use My Location
                    </button>
                  </div>

                  <AnimatePresence>
                    {showMapPicker && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="rounded-2xl overflow-hidden border border-[var(--border)]">
                          <LocationPicker
                            onLocationFound={({ lat, lng, address }) => {
                              setLocationForm(p => ({
                                ...p,
                                shopLatitude: lat,
                                shopLongitude: lng,
                                shopHouseNo: address.houseNumber || p.shopHouseNo,
                                shopStreet: address.street || p.shopStreet,
                                shopBarangay: address.barangay || p.shopBarangay,
                                shopCity: address.city || p.shopCity,
                                shopProvince: address.province || p.shopProvince,
                                shopPostalCode: address.postalCode || p.shopPostalCode,
                              }));
                            }}
                            initialLat={locationForm.shopLatitude || 14.2952}
                            initialLng={locationForm.shopLongitude || 121.4647}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={isSavingLocation}
                    className="w-full btn-primary py-4 text-xs font-bold uppercase tracking-widest shadow-xl flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingLocation ? 'Saving...' : 'Save Location'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </SellerLayout>
  );
}

function SocialIcon({ href, tooltip }) {
  if (!href || !href.trim()) return null;
  const url = href.startsWith('http') ? href : `https://${href}`;

  const getPlatform = (url) => {
    const lower = url.toLowerCase();
    if (lower.includes('facebook.com')) return { icon: <Facebook />, color: "#1877F2" };
    if (lower.includes('instagram.com')) return { icon: <Instagram />, color: "#E4405F" };
    if (lower.includes('tiktok.com')) return { icon: <Music />, color: "#010101" };
    if (lower.includes('youtube.com')) return { icon: <Youtube />, color: "#FF0000" };
    return { icon: <LinkIcon />, color: "var(--rust)" };
  };

  const { icon, color } = getPlatform(url);

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      title={tooltip}
      className="p-2.5 rounded-xl border border-[var(--border)] hover:border-transparent transition-all hover:scale-110 shadow-sm hover:shadow-md group"
    >
      {React.cloneElement(icon, {
        className: "w-4 h-4 transition-colors",
        style: { color: color }
      })}
    </a>
  );
}

function ProfileItem({ label, value, icon }) {
  return (
    <div className="space-y-2 group">
      <div className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest flex items-center gap-2 group-hover:text-[var(--rust)] transition-colors">
        {React.cloneElement(icon, { className: "w-3.5 h-3.5" })} {label}
      </div>
      <div className="text-sm font-bold text-[var(--charcoal)] border-b border-transparent group-hover:border-[var(--border)] pb-1 transition-all">
        {value}
      </div>
    </div>
  );
}
