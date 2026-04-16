"use client";
import React, { useState, useEffect } from "react";
import { 
  Plus, 
  MapPin, 
  Trash2, 
  Home, 
  Navigation,
  Loader2,
  X,
  Phone,
  User,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import dynamic from 'next/dynamic';
import {
  INPUT_LIMITS,
  normalizeAddressPayload,
  sanitizeAddressLineInput,
  sanitizePersonNameInput,
  sanitizePhoneInput,
  sanitizePlaceNameInput,
  sanitizePostalCodeInput,
} from "@/lib/inputValidation";

const LocationPicker = dynamic(
  () => import('@/components/LocationPicker'),
  { ssr: false, loading: () => <div className="h-64 w-full bg-slate-100 animate-pulse rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--muted)] text-xs font-bold uppercase tracking-widest leading-relaxed text-center">Initializing <br /> Satellite Imagery...</div> }
);

export default function AddressManager() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    recipientName: "",
    phone: "",
    houseNo: "",
    street: "",
    barangay: "",
    city: "",
    province: "",
    postalCode: "",
    isDefault: false,
    latitude: null,
    longitude: null
  });

  const fetchAddresses = async () => {
    try {
      const response = await api.get("/addresses");
      setAddresses(response.data);
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleOpenModal = (address = null) => {
    if (address) {
      setEditingAddress(address);
      setFormData(address);
    } else {
      setEditingAddress(null);
      setFormData({
        recipientName: "",
        phone: "",
        houseNo: "",
        street: "",
        barangay: "",
        city: "",
        province: "",
        postalCode: "",
        isDefault: false,
        latitude: null,
        longitude: null
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const normalizedAddress = {
        ...normalizeAddressPayload(formData),
        latitude: formData.latitude ?? null,
        longitude: formData.longitude ?? null,
        isDefault: Boolean(formData.isDefault),
      };
      setFormData(normalizedAddress);
      if (editingAddress) {
        await api.put(`/addresses/${editingAddress.id}`, normalizedAddress);
      } else {
        await api.post("/addresses", normalizedAddress);
      }
      setShowModal(false);
      fetchAddresses();
    } catch (error) {
      alert(error.response?.data?.message || error.message || "Failed to save address.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      await api.delete(`/addresses/${id}`);
      fetchAddresses();
    } catch (error) {
      alert("Failed to delete address.");
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.patch(`/addresses/${id}/set-default`, {});
      fetchAddresses();
    } catch (error) {
      alert("Failed to update default address.");
    }
  };

  const handlePinLocationInCard = async (id) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          await api.put(`/addresses/${id}`, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          alert("📍 Location pinned successfully!");
          fetchAddresses();
        } catch (e) {
          alert("Failed to update coordinates.");
        }
      }, () => {
        alert("Unable to get location.");
      });
    }
  };

  const handleLocationFound = ({ lat, lng, address }) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      // Aggressive fallback for street and house number
      houseNo: address.houseNumber ? sanitizeAddressLineInput(address.houseNumber, INPUT_LIMITS.houseNo) : prev.houseNo,
      street: address.street ? sanitizeAddressLineInput(address.street, INPUT_LIMITS.street) : prev.street,
      barangay: address.barangay ? sanitizeAddressLineInput(address.barangay, INPUT_LIMITS.barangay) : prev.barangay,
      city: address.city ? sanitizePlaceNameInput(address.city, INPUT_LIMITS.city) : prev.city,
      province: address.province ? sanitizePlaceNameInput(address.province, INPUT_LIMITS.province) : prev.province,
      postalCode: address.postalCode ? sanitizePostalCodeInput(address.postalCode) : prev.postalCode,
    }));
  };

  const [showMapPicker, setShowMapPicker] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-serif font-bold text-[var(--charcoal)] uppercase tracking-tight">
            Delivery <span className="text-[var(--rust)] italic lowercase font-normal">Registry</span>
          </h2>
          <p className="text-[var(--muted)] text-[10px] uppercase font-bold tracking-widest mt-1 opacity-60">Manage your shipping destinations</p>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-[var(--rust)] text-white px-6 py-3 rounded-xl font-bold uppercase text-[9px] tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> New Address
        </button>
      </div>

      {loading && addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 border-2 border-dashed border-[var(--border)] rounded-[2rem]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--rust)]" />
          <p className="font-serif italic text-sm text-[var(--muted)]">Consulting the archives...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {addresses.map((addr) => (
              <motion.div 
                key={addr.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`relative group bg-[#FDFBF9] border-2 rounded-3xl p-6 transition-all shadow-sm hover:shadow-xl ${addr.isDefault ? 'border-[var(--rust)] ring-2 ring-[var(--rust)]/5' : 'border-[var(--border)] hover:border-[var(--rust)]/30'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  {addr.isDefault ? (
                    <div className="bg-[var(--rust)] text-white px-2 py-0.5 rounded-md text-[7px] font-extrabold uppercase tracking-widest">Default</div>
                  ) : (
                    <button 
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-[7px] font-extrabold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--rust)]"
                    >
                      Set Default
                    </button>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handlePinLocationInCard(addr.id)}
                      className="p-1.5 bg-[var(--rust)]/5 rounded-lg text-[var(--rust)] hover:bg-[var(--rust)] hover:text-white transition-all"
                    >
                       <MapPin className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleOpenModal(addr)}
                      className="text-[9px] font-bold uppercase tracking-widest text-[var(--rust)] hover:underline"
                    >
                       Edit
                    </button>
                    <button 
                       onClick={() => handleDelete(addr.id)}
                       className="text-[var(--muted)] hover:text-red-500 transition-colors"
                    >
                       <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-serif text-lg font-bold text-[var(--charcoal)] leading-none">{addr.recipientName}</h3>
                  <p className="text-[10px] font-bold text-[var(--muted)]">{addr.phone}</p>
                  <p className="text-xs text-[var(--charcoal)]/80 leading-relaxed font-medium">
                    {addr.houseNo} {addr.street}, Brgy. {addr.barangay}, {addr.city}, {addr.province} {addr.postalCode}
                  </p>
                  {addr.latitude && (
                    <div className="flex items-center gap-1.5 text-[8px] font-bold text-[var(--rust)] uppercase tracking-widest bg-[var(--rust)]/5 py-1.5 px-2 rounded-md w-fit mt-2">
                      <MapPin className="w-2.5 h-2.5" /> Pinned
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {addresses.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-[var(--border)]">
               <MapPin className="w-10 h-10 text-[var(--muted)]/20 mx-auto mb-4" />
               <h3 className="font-serif text-xl font-bold text-[var(--charcoal)]">No Destinations</h3>
               <p className="text-[var(--muted)] text-xs mt-1">Add your first shipping address above.</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }} 
               onClick={() => setShowModal(false)}
               className="absolute inset-0 bg-[var(--charcoal)]/40 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0 }}
               className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
             >
                <div className="p-8 pb-32 overflow-y-auto artisan-scrollbar">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-[var(--charcoal)] uppercase tracking-tighter">
                        {editingAddress ? 'Update' : 'Establish'} <span className="text-[var(--rust)] italic lowercase">Address</span>
                      </h2>
                      <p className="text-[var(--muted)] text-[10px] font-bold uppercase tracking-widest mt-1">Registry node metadata</p>
                    </div>
                    <button onClick={() => setShowModal(false)} className="p-2 bg-[var(--input-bg)] rounded-xl text-[var(--muted)] hover:text-red-500">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="Recipient" value={formData.recipientName} onChange={(val) => setFormData({ ...formData, recipientName: sanitizePersonNameInput(val) })} icon={<User className="w-4 h-4" />} placeholder="Full Name" maxLength={INPUT_LIMITS.personName} autoComplete="name" />
                        <InputGroup label="Phone" value={formData.phone} onChange={(val) => setFormData({ ...formData, phone: sanitizePhoneInput(val) })} icon={<Phone className="w-4 h-4" />} placeholder="Mobile Number" inputMode="numeric" maxLength={INPUT_LIMITS.mobileNumber} autoComplete="tel" />
                        <InputGroup label="House no, or landmark" value={formData.houseNo} onChange={(val) => setFormData({ ...formData, houseNo: sanitizeAddressLineInput(val, INPUT_LIMITS.houseNo) })} icon={<Home className="w-4 h-4" />} placeholder="Building/No." maxLength={INPUT_LIMITS.houseNo} autoComplete="address-line1" />
                        <InputGroup label="Street" value={formData.street} onChange={(val) => setFormData({ ...formData, street: sanitizeAddressLineInput(val, INPUT_LIMITS.street) })} icon={<MapPin className="w-4 h-4" />} placeholder="Road Name" maxLength={INPUT_LIMITS.street} autoComplete="address-line2" />
                        <InputGroup label="Barangay" value={formData.barangay} onChange={(val) => setFormData({ ...formData, barangay: sanitizeAddressLineInput(val, INPUT_LIMITS.barangay) })} icon={<Navigation className="w-4 h-4" />} placeholder="Lumban" maxLength={INPUT_LIMITS.barangay} />
                        <InputGroup label="City" value={formData.city} onChange={(val) => setFormData({ ...formData, city: sanitizePlaceNameInput(val, INPUT_LIMITS.city) })} icon={<Navigation className="w-4 h-4" />} placeholder="City" maxLength={INPUT_LIMITS.city} autoComplete="address-level2" />
                        <InputGroup label="Province" value={formData.province} onChange={(val) => setFormData({ ...formData, province: sanitizePlaceNameInput(val, INPUT_LIMITS.province) })} icon={<Navigation className="w-4 h-4" />} placeholder="Province" maxLength={INPUT_LIMITS.province} autoComplete="address-level1" />
                        <InputGroup label="Postal" value={formData.postalCode} onChange={(val) => setFormData({ ...formData, postalCode: sanitizePostalCodeInput(val) })} icon={<Navigation className="w-4 h-4" />} placeholder="XXXX" inputMode="numeric" maxLength={INPUT_LIMITS.postalCode} autoComplete="postal-code" />
                     </div>

                     <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-[var(--border)] pt-8 mt-4">
                        <button
                          type="button"
                          onClick={() => setShowMapPicker(!showMapPicker)}
                          className={`w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${formData.latitude ? 'bg-green-50 text-green-700 border-2 border-green-200 shadow-sm' : (showMapPicker ? 'bg-[var(--rust)] text-white' : 'bg-[var(--input-bg)] text-[var(--muted)]')}`}
                        >
                          <MapPin className="w-4 h-4" /> {formData.latitude ? `Location Pinned (${formData.latitude.toFixed(4)})` : (showMapPicker ? 'Hide Heritage Map' : 'Precision Pin')}
                        </button>

                        <label className="flex items-center gap-3 cursor-pointer group py-2">
                           <div 
                             onClick={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
                             className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.isDefault ? 'bg-green-600 border-green-600 shadow-md' : 'border-[var(--border)]'}`}
                           >
                              {formData.isDefault && <Check className="w-3 h-3 text-white" />}
                           </div>
                           <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--charcoal)] opacity-80">Default Destination</span>
                        </label>
                     </div>

                     <AnimatePresence>
                        {showMapPicker && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-6 border-t border-[var(--border)] mt-4">
                              <LocationPicker 
                                onLocationFound={handleLocationFound}
                                initialLat={formData.latitude || 14.2952}
                                initialLng={formData.longitude || 121.4647}
                                onConfirm={() => setShowMapPicker(false)}
                              />
                            </div>
                          </motion.div>
                        )}
                     </AnimatePresence>

                     <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[var(--rust)] text-white py-5 rounded-2xl font-bold uppercase text-xs tracking-[0.3em] shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-10 active:shadow-inner"
                     >
                       {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (editingAddress ? 'Revise Destination' : 'Confirm Registry')}
                     </button>
                  </form>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InputGroup({
  label,
  value,
  onChange,
  icon,
  placeholder,
  type = "text",
  inputMode,
  maxLength,
  autoComplete = "off",
}) {
  return (
    <div className="space-y-2">
      <label className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[var(--charcoal)] ml-1 opacity-70">{label}</label>
      <div className="relative group">
        <div className="absolute top-1/2 -translate-y-1/2 left-4 text-[var(--muted)] group-focus-within:text-[var(--rust)] transition-colors">
          {icon}
        </div>
        <input 
          type={type} 
          required
          inputMode={inputMode}
          maxLength={maxLength}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[var(--input-bg)] text-[var(--charcoal)] placeholder:text-[var(--muted)]/50 border-2 border-transparent outline-none focus:border-[var(--rust)] focus:bg-white transition-all pl-12 pr-4 py-4 rounded-xl text-xs font-bold shadow-inner"
        />
      </div>
    </div>
  );
}
