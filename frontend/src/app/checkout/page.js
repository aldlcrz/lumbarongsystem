"use client";
import React, { useState, useEffect } from "react";
import CustomerLayout from "@/components/CustomerLayout";
import Image from "next/image";
import Link from "next/link";
import {
  CreditCard,
  Truck,
  ShieldCheck,
  MapPin,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Upload,
  Phone,
  Scan,
  Loader2,
  Lock,
  ChevronRight,
  History,
  ShoppingCart,
  BookOpen,
  X,
  Plus,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { getProductImageSrc } from "@/lib/productImages";
import dynamic from "next/dynamic";
import {
  INPUT_LIMITS,
  normalizeAddressPayload,
  sanitizeAddressLineInput,
  sanitizePaymentReferenceInput,
  sanitizePersonNameInput,
  sanitizePhoneInput,
  sanitizePlaceNameInput,
  sanitizePostalCodeInput,
  validatePaymentReference,
} from "@/lib/inputValidation";

const LocationPickerMap = dynamic(() => import("@/components/LocationPicker"), { ssr: false });


export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showValidation, setShowValidation] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("GCash");
  const [showMap, setShowMap] = useState(false);

  // Checkout State
  const [address, setAddress] = useState({
    recipientName: "",
    phone: "",
    houseNo: "",
    street: "",
    barangay: "",
    city: "",
    province: "",
    postalCode: "",
    latitude: null,
    longitude: null
  });
  const [gcashRef, setGcashRef] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [mode, setMode] = useState("cart");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showAddressBook, setShowAddressBook] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isNewAddress, setIsNewAddress] = useState(false);
  const [addressLoaded, setAddressLoaded] = useState(false);


  // Address Book Management
  const [addrForm, setAddrForm] = useState({ recipientName: "", phone: "", houseNo: "", street: "", barangay: "", city: "", province: "", postalCode: "", isDefault: false, latitude: null, longitude: null });
  const [addrEditing, setAddrEditing] = useState(null);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addrMapPicker, setAddrMapPicker] = useState(false);
  const [addrLoading, setAddrLoading] = useState(false);

  const getCustomerToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("customer_token") || localStorage.getItem("token");
  };

  const parsePrice = React.useCallback((value) => {
    if (typeof value === "number") return value;
    return parseFloat(String(value || "0").replace(/[^0-9.]/g, "")) || 0;
  }, []);

  const buildAddressPayload = React.useCallback((source) => ({
    ...normalizeAddressPayload(source),
    latitude: source.latitude ?? null,
    longitude: source.longitude ?? null,
    isDefault: Boolean(source.isDefault),
  }), []);

  const refreshAddresses = async () => {
    try {
      const response = await api.get("/addresses");
      setSavedAddresses(response.data);
      return response.data;
    } catch (e) { console.error("Could not load address book"); return []; }
  };

  useEffect(() => {
    const token = getCustomerToken();
    if (!token && currentStep !== 3) {
      window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname + window.location.search);
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const checkoutMode = urlParams.get('mode') || 'cart';
    setMode(checkoutMode);

    let items = [];
    if (checkoutMode === 'buy_now') {
      const item = JSON.parse(localStorage.getItem("checkout_item") || "null");
      if (item) items = [item];
    } else {
      items = JSON.parse(localStorage.getItem("checkout_items") || "[]");
    }

    if (items.length === 0 && currentStep !== 3) {
      window.location.href = "/cart";
    }
    setCartItems(items);

    const fetchSavedAddresses = async () => {
      const data = await refreshAddresses();
      const defaultAddr = data.find(a => a.isDefault) || data[0];
      if (defaultAddr) {
        setAddress({
          recipientName: defaultAddr.recipientName,
          phone: defaultAddr.phone,
          houseNo: defaultAddr.houseNo,
          street: defaultAddr.street,
          barangay: defaultAddr.barangay,
          city: defaultAddr.city,
          province: defaultAddr.province,
          postalCode: defaultAddr.postalCode,
          latitude: defaultAddr.latitude,
          longitude: defaultAddr.longitude
        });
        setIsNewAddress(false);
      } else {
        setIsNewAddress(true);
      }
      setAddressLoaded(true);
    };
    fetchSavedAddresses();

  }, [currentStep]);

  // Adjust payment method based on product settings when items are loaded
  useEffect(() => {
    if (cartItems.length > 0) {
      const firstItem = cartItems[0];
      const allowGcash = firstItem.allowGcash !== false; // handle null/undefined as true
      const allowMaya = firstItem.allowMaya !== false;

      if (!allowGcash && paymentMethod === "GCash" && allowMaya) {
        setPaymentMethod("Maya");
      } else if (!allowMaya && paymentMethod === "Maya" && allowGcash) {
        setPaymentMethod("GCash");
      }
    }
  }, [cartItems, paymentMethod]);

  const openAddrForm = (addr = null) => {
    if (addr) {
      setAddrEditing(addr);
      setAddrForm({ ...addr });
    } else {
      setAddrEditing(null);
      setAddrForm({ recipientName: "", phone: "", houseNo: "", street: "", barangay: "", city: "", province: "", postalCode: "", isDefault: false, latitude: null, longitude: null });
    }
    setAddrMapPicker(false);
    setShowAddrForm(true);
  };

  const handleSaveAddr = async (e) => {
    e.preventDefault();
    setAddrLoading(true);
    try {
      const normalizedAddress = buildAddressPayload(addrForm);
      setAddrForm(normalizedAddress);
      if (addrEditing) {
        await api.put(`/addresses/${addrEditing.id}`, normalizedAddress);
      } else {
        await api.post("/addresses", normalizedAddress);
      }
      setShowAddrForm(false);
      refreshAddresses();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to save address.");
    } finally {
      setAddrLoading(false);
    }
  };

  const handleDeleteAddr = async (id) => {
    if (!confirm("Delete this address?")) return;
    try { await api.delete(`/addresses/${id}`); refreshAddresses(); } catch { alert("Failed to delete."); }
  };

  const handleSetDefaultAddr = async (id) => {
    try { await api.patch(`/addresses/${id}/set-default`, {}); refreshAddresses(); } catch { alert("Failed to set default."); }
  };

  const selectAddress = (addr) => {
    setAddress({
      recipientName: addr.recipientName,
      phone: addr.phone,
      houseNo: addr.houseNo,
      street: addr.street,
      barangay: addr.barangay,
      city: addr.city,
      province: addr.province,
      postalCode: addr.postalCode,
      latitude: addr.latitude,
      longitude: addr.longitude
    });
    setIsNewAddress(false);
    setShowAddressBook(false);
  };


  const subtotal = cartItems.reduce((acc, item) => acc + (parsePrice(item.price) * item.quantity), 0);
  const shipping = cartItems.reduce((max, item) => Math.max(max, parsePrice(item.shippingFee)), 0);
  const maxDays = cartItems.reduce((max, item) => Math.max(max, parseInt(item.shippingDays || 3)), 0);
  const total = subtotal + shipping;

  const isGcashPayment = paymentMethod === "GCash";
  const isMayaPayment = paymentMethod === "Maya";
  const isBuyNowMode = mode === "buy_now";

  const firstItem = cartItems[0];
  const currentSeller = firstItem?.seller || firstItem?.product?.seller;

  // Prioritize product-specific payment details, then fallback to seller profile
  const sellerGcashNumber = firstItem?.gcashNumber || currentSeller?.gcashNumber || "Ask Seller";
  const sellerGcashName = currentSeller?.name || "Artisan Workshop";
  const sellerGcashQrCode = firstItem?.gcashQrCode || currentSeller?.gcashQrCode;

  const sellerMayaNumber = firstItem?.mayaNumber || currentSeller?.mayaNumber || "Ask Seller";
  const sellerMayaName = currentSeller?.name || "Artisan Workshop";
  const sellerMayaQrCode = firstItem?.mayaQrCode || currentSeller?.mayaQrCode;

  const handleNext = () => {
    if (currentStep === 1) {
      try {
        const normalizedAddress = buildAddressPayload(address);
        setAddress(normalizedAddress);
        setCurrentStep(2);
      } catch (err) {
        setShowValidation(true);
        alert(err.message || "Please complete the shipping address correctly.");
        return;
      }
    } else if (currentStep === 2) {
      let normalizedReference = "";
      if (isGcashPayment || isMayaPayment) {
        try {
          normalizedReference = validatePaymentReference(
            gcashRef,
            `${isGcashPayment ? "GCash" : "Maya"} reference number`
          );
          setGcashRef(normalizedReference);
        } catch (err) {
          alert(err.message || "Please provide a valid payment reference number.");
          setShowValidation(true);
          return;
        }
        if (!screenshot) {
          setShowValidation(true);
          return;
        }
      }

      let normalizedAddress;
      try {
        normalizedAddress = buildAddressPayload(address);
        setAddress(normalizedAddress);
      } catch (err) {
        alert(err.message || "Please review the shipping address.");
        setShowValidation(true);
        return;
      }

      handlePlaceOrder(normalizedAddress, normalizedReference);
    }
  };

  const handlePlaceOrder = async (validatedAddress = null, validatedPaymentReference = "") => {
    setLoading(true);
    try {
      const formData = new FormData();
      const shippingAddress = validatedAddress || buildAddressPayload(address);
      formData.append("items", JSON.stringify(cartItems));

      // Lazada-style: Ensure all address fields are caught
      formData.append("shippingAddress", JSON.stringify(shippingAddress));
      formData.append("paymentMethod", paymentMethod);
      if (isGcashPayment || isMayaPayment) {
        formData.append("paymentReference", validatedPaymentReference || validatePaymentReference(gcashRef));
      }
      if ((isGcashPayment || isMayaPayment) && screenshot) {
        formData.append("paymentProof", screenshot);
      }

      // First, attempt to save the address to the user's permanent address book if it's new
      // We check if an address with the same houseNo already exists to avoid duplicates
      if (shippingAddress.houseNo && shippingAddress.street) {
        const existing = savedAddresses.find(a =>
          a.houseNo === shippingAddress.houseNo && a.street === shippingAddress.street && a.barangay === shippingAddress.barangay
        );
        if (!existing) {
          try {
            await api.post("/addresses", {
              recipientName: shippingAddress.recipientName,
              phone: shippingAddress.phone,
              houseNo: shippingAddress.houseNo,
              street: shippingAddress.street,
              barangay: shippingAddress.barangay,
              city: shippingAddress.city,
              province: shippingAddress.province,
              postalCode: shippingAddress.postalCode,
              latitude: shippingAddress.latitude,
              longitude: shippingAddress.longitude,
              isDefault: savedAddresses.length === 0
            });
          } catch (e) {
            console.warn("Failed to auto-save address to book, proceeding with order anyway.");
          }
        }
      }

      const token = localStorage.getItem("token");
      const response = await api.post("/orders", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      const newOrder = response.data;
      setSelectedOrder(newOrder); // Store for success screen reference
      setLoading(false);
      setCurrentStep(3); // Success

      // Cleanup cart if needed
      if (mode === 'cart') {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const remaining = cart.filter(item => !cartItems.some(ci => ci.id === item.id && ci.size === item.size && (ci.variation || "") === (item.variation || "")));
        localStorage.setItem("cart", JSON.stringify(remaining));
        window.dispatchEvent(new Event('storage'));
      }
      localStorage.removeItem("checkout_items");
      localStorage.removeItem("checkout_item");
    } catch (err) {
      console.error("Seller order placement failed:", err);
      alert(err.response?.data?.message || "Failed to transmit order to registry.");
      setLoading(false);
    }
  };


  const steps = [
    { id: 1, label: "SHIPPING", icon: Truck },
    { id: 2, label: "PAYMENT", icon: CreditCard },
    { id: 3, label: "CONFIRMED", icon: CheckCircle2 },
  ];

  return (
    <CustomerLayout>
      <style>{`
        .formal-num { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif; font-weight: 600; font-variant-numeric: tabular-nums; }
        .pd-meta-val { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif; font-weight: 700; color: inherit; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; }
      `}</style>
      <div className={`mx-auto animate-fade-in relative z-10 ${isBuyNowMode ? 'max-w-6xl space-y-8 mb-12' : 'max-w-7xl space-y-8 sm:space-y-10 lg:space-y-12 mb-16 lg:mb-20'}`}>
        {/* Header & Breadcrumbs */}
        <div className={`flex flex-col border-b border-[var(--border)] ${isBuyNowMode ? 'gap-6 pb-8 lg:flex-row lg:items-center lg:justify-between' : 'gap-6 pb-8 lg:flex-row lg:items-end lg:justify-between lg:pb-12'}`}>
          <div className="max-w-2xl">
            <div className="eyebrow uppercase tracking-[0.4em] mb-3">{isBuyNowMode ? 'Direct Checkout' : 'Secure Fulfillment Wizard'}</div>
            <h1 className={`font-serif font-bold tracking-tighter text-[var(--charcoal)] uppercase ${isBuyNowMode ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'}`}>
              {isBuyNowMode ? (
                <>Streamlined <span className="text-[var(--rust)] italic lowercase">Checkout</span></>
              ) : (
                <>Heritage <span className="text-[var(--rust)] italic lowercase">Checkout</span></>
              )}
            </h1>
            <p className={`text-[var(--muted)] leading-relaxed ${isBuyNowMode ? 'text-sm sm:text-base mt-3 max-w-xl' : 'text-sm sm:text-base mt-4 max-w-2xl'}`}>
              {isBuyNowMode
                ? 'A tighter single-item checkout with clearer shipping, payment, and order summary sections.'
                : 'Complete your shipping and payment details to place your order with the seller registry.'}
            </p>
          </div>

          <div className="w-full overflow-x-auto no-scrollbar lg:w-auto">
            <div className={`flex min-w-max items-center ${isBuyNowMode ? 'gap-3' : 'gap-4 sm:gap-6'}`}>
              {steps.map((s, idx) => (
                <React.Fragment key={s.id}>
                  <div className={`flex items-center gap-3 transition-all duration-500 ${currentStep >= s.id ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                    <div className={`flex items-center justify-center shadow-lg ring-4 ring-white ${isBuyNowMode ? 'w-9 h-9 rounded-xl' : 'w-10 h-10 rounded-2xl'} ${currentStep >= s.id ? 'bg-[var(--rust)] text-white scale-110' : 'bg-[var(--border)] text-[var(--muted)]'}`}>
                      <s.icon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] leading-none text-[var(--muted)]">Step 0{s.id}</span>
                      <span className={`text-[11px] font-bold uppercase tracking-[0.18em] ${currentStep >= s.id ? 'text-[var(--charcoal)]' : 'text-[var(--muted)]'}`}>{s.label}</span>
                    </div>
                  </div>
                  {idx < steps.length - 1 && <ChevronRight className={`text-[var(--border)] ${isBuyNowMode ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {(currentStep === 1 || currentStep === 2) && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`grid grid-cols-1 lg:grid-cols-12 items-start ${isBuyNowMode ? 'gap-8' : 'gap-12'}`}
            >
              {/* Left: Input Columns */}
              <div className={isBuyNowMode ? 'lg:col-span-7 space-y-8' : 'lg:col-span-8 space-y-12'}>
                <AnimatePresence mode="wait">
                  {currentStep === 1 && (
                    <motion.div
                      key="shipping"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`artisan-card border-2 border-transparent hover:border-[var(--rust)]/10 transition-all bg-white/80 backdrop-blur-xl ${isBuyNowMode ? 'p-6 sm:p-8 space-y-6 sm:space-y-8 shadow-lg' : 'p-6 sm:p-8 lg:p-12 space-y-6 sm:space-y-8 lg:space-y-10 shadow-xl'}`}
                    >
                      <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <h3 className={`font-serif font-bold text-[var(--charcoal)] tracking-tight flex items-center gap-4 ${isBuyNowMode ? 'text-xl sm:text-2xl' : 'text-xl sm:text-2xl lg:text-3xl'}`}>
                          <div className={`bg-[var(--rust)] text-white flex items-center justify-center shadow-lg ${isBuyNowMode ? 'w-10 h-10 rounded-xl' : 'w-12 h-12 rounded-2xl rotate-3'}`}><MapPin className={`${isBuyNowMode ? 'w-5 h-5' : 'w-6 h-6'}`} /></div>
                          Shipment Registry
                        </h3>
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
                          {!isNewAddress && (
                            <button
                              type="button"
                              onClick={() => setIsNewAddress(true)}
                              className="px-4 py-2 text-left text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--muted)] transition-all hover:text-[var(--rust)] font-sans sm:text-[10px] sm:text-center"
                            >
                              Use Different Address
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowAddressBook(true)}
                            className="flex items-center gap-2 rounded-xl border border-[var(--rust)]/20 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--rust)] transition-all hover:bg-[var(--rust)]/5 font-sans sm:text-[10px]"
                          >
                            <BookOpen className="w-3.5 h-3.5" /> Address Book
                          </button>
                        </div>
                      </div>

                      {!isNewAddress && address.recipientName ? (
                        <div className="group flex flex-col gap-4 rounded-2xl border border-[var(--rust)]/10 bg-[var(--cream)]/30 p-5 transition-all hover:bg-white hover:shadow-lg sm:flex-row sm:items-start sm:gap-6 sm:rounded-3xl sm:p-8">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--rust)]/5 bg-white shadow-sm sm:h-14 sm:w-14">
                            <MapPin className="w-6 h-6 text-[var(--rust)]" />
                          </div>
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-[var(--rust)] uppercase tracking-[0.18em] sm:text-[10px]">Fulfillment Node Active</span>

                            </div>
                            <div className="text-lg font-serif font-bold text-[var(--charcoal)] sm:text-xl">{address.recipientName}</div>
                            <div className="mb-2 text-sm font-bold tracking-[0.16em] text-[var(--muted)] pd-meta-val">{address.phone}</div>
                            <p className="text-sm leading-relaxed text-[var(--muted)] italic sm:text-base">
                              {address.houseNo} {address.street}, {address.barangay},<br />
                              {address.city}, {address.province} <span className="pd-meta-val">{address.postalCode}</span>
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className={`grid grid-cols-1 md:grid-cols-2 ${isBuyNowMode ? 'gap-6 pt-2' : 'gap-8 pt-4'}`}>
                          <InputGroup compact={isBuyNowMode} label="Full Name" placeholder="Enter recipient name" value={address.recipientName} onChange={(e) => setAddress({ ...address, recipientName: sanitizePersonNameInput(e.target.value) })} icon={<UserIcon className="w-4 h-4" />} maxLength={INPUT_LIMITS.personName} autoComplete="name" />
                          <InputGroup compact={isBuyNowMode} label="Phone Number" placeholder="09XXXXXXXXX" value={address.phone} onChange={(e) => setAddress({ ...address, phone: sanitizePhoneInput(e.target.value) })} icon={<Phone className="w-4 h-4" />} inputMode="numeric" maxLength={INPUT_LIMITS.mobileNumber} autoComplete="tel" />

                          <InputGroup compact={isBuyNowMode} label="House no, or landmark" placeholder="Bldg/House Number" value={address.houseNo} onChange={(e) => setAddress({ ...address, houseNo: sanitizeAddressLineInput(e.target.value, INPUT_LIMITS.houseNo) })} icon={<MapPin className="w-4 h-4" />} maxLength={INPUT_LIMITS.houseNo} autoComplete="address-line1" />
                          <InputGroup compact={isBuyNowMode} label="Street" placeholder="Street Name" value={address.street} onChange={(e) => setAddress({ ...address, street: sanitizeAddressLineInput(e.target.value, INPUT_LIMITS.street) })} icon={<MapPin className="w-4 h-4" />} maxLength={INPUT_LIMITS.street} autoComplete="address-line2" />

                          <InputGroup compact={isBuyNowMode} label="Barangay" placeholder="Barangay Name" value={address.barangay} onChange={(e) => setAddress({ ...address, barangay: sanitizeAddressLineInput(e.target.value, INPUT_LIMITS.barangay) })} icon={<MapPin className="w-4 h-4" />} maxLength={INPUT_LIMITS.barangay} />
                          <InputGroup compact={isBuyNowMode} label="City / Municipality" placeholder="Your City" value={address.city} onChange={(e) => setAddress({ ...address, city: sanitizePlaceNameInput(e.target.value, INPUT_LIMITS.city) })} icon={<MapPin className="w-4 h-4" />} maxLength={INPUT_LIMITS.city} autoComplete="address-level2" />

                          <InputGroup compact={isBuyNowMode} label="Province" placeholder="Your Province" value={address.province} onChange={(e) => setAddress({ ...address, province: sanitizePlaceNameInput(e.target.value, INPUT_LIMITS.province) })} icon={<MapPin className="w-4 h-4" />} maxLength={INPUT_LIMITS.province} autoComplete="address-level1" />
                          <InputGroup compact={isBuyNowMode} label="Postal Code" placeholder="ZIP Code" value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: sanitizePostalCodeInput(e.target.value) })} icon={<MapPin className="w-4 h-4" />} inputMode="numeric" maxLength={INPUT_LIMITS.postalCode} autoComplete="postal-code" />

                          <div className="md:col-span-2">
                            <button
                              type="button"
                              onClick={() => setShowMap(v => !v)}
                              className={`w-full py-4 border-2 border-dashed rounded-2xl flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest transition-all ${showMap
                                ? 'bg-[var(--rust)] border-[var(--rust)] text-white'
                                : address.latitude
                                  ? 'bg-green-50 border-green-500 text-green-700'
                                  : 'bg-[var(--input-bg)] border-[var(--border)] text-[var(--muted)] hover:border-[var(--rust)] hover:text-[var(--rust)]'
                                }`}
                            >
                              {showMap ? (
                                <><MapPin className="w-4 h-4" /> Hide Interactive Map</>
                              ) : address.latitude ? (
                                <><CheckCircle2 className="w-4 h-4" /> Location Pinned ({address.latitude.toFixed(4)}, {address.longitude.toFixed(4)})</>
                              ) : (
                                <><MapPin className="w-4 h-4" /> Drop Precise Map Pin (Optional)</>
                              )}
                            </button>

                            {showMap && (
                              <div className="mt-4">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-3 ml-1">Interactive Heritage Map</div>
                                <LocationPickerMap
                                  initialLat={address.latitude || 14.2952}
                                  initialLng={address.longitude || 121.4647}
                                  onLocationFound={({ lat, lng, address: geo }) => {
                                    setAddress(prev => ({
                                      ...prev,
                                      latitude: lat,
                                      longitude: lng,
                                      street: geo.street ? sanitizeAddressLineInput(geo.street, INPUT_LIMITS.street) : prev.street,
                                      barangay: geo.barangay ? sanitizeAddressLineInput(geo.barangay, INPUT_LIMITS.barangay) : prev.barangay,
                                      city: geo.city ? sanitizePlaceNameInput(geo.city, INPUT_LIMITS.city) : prev.city,
                                      province: geo.province ? sanitizePlaceNameInput(geo.province, INPUT_LIMITS.province) : prev.province,
                                      postalCode: geo.postalCode ? sanitizePostalCodeInput(geo.postalCode) : prev.postalCode,
                                    }));
                                  }}
                                  onConfirm={() => setShowMap(false)}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>

                  )}

                  {currentStep === 2 && (
                    <motion.div
                      key="payment"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`artisan-card shadow-xl bg-white/80 backdrop-blur-xl ${isBuyNowMode ? 'p-6 sm:p-8 space-y-6 sm:space-y-8' : 'p-6 sm:p-8 lg:p-12 space-y-6 sm:space-y-8 lg:space-y-10'}`}
                    >
                      <h3 className={`font-serif font-bold text-[var(--charcoal)] tracking-tight flex items-center gap-4 ${isBuyNowMode ? 'text-xl sm:text-2xl' : 'text-xl sm:text-2xl lg:text-3xl'}`}>
                        <div className={`bg-blue-600 text-white flex items-center justify-center shadow-lg ${isBuyNowMode ? 'w-10 h-10 rounded-xl' : 'w-12 h-12 rounded-2xl -rotate-3'}`}><CreditCard className={`${isBuyNowMode ? 'w-5 h-5' : 'w-6 h-6'}`} /></div>
                        Payment Method
                      </h3>

                      <div className={`grid grid-cols-1 md:grid-cols-2 ${isBuyNowMode ? 'gap-4 pt-4' : 'gap-6 pt-6'}`}>
                        {(firstItem?.allowGcash !== false) && (
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("GCash")}
                            className={`border-2 text-left transition-all relative overflow-hidden ${isBuyNowMode ? 'rounded-2xl p-6' : 'rounded-3xl p-8'} ${paymentMethod === "GCash" ? 'border-blue-500 bg-blue-50/10 shadow-xl ring-4 ring-blue-50' : 'border-[var(--border)] bg-white hover:border-blue-300'}`}
                          >
                            <div className="flex items-start justify-between gap-4 relative z-10">
                              <div className="space-y-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">GCash</div>
                                <div className="font-serif text-2xl font-bold text-[var(--charcoal)] leading-none sm:text-3xl">Pay with GCash</div>
                                <p className="text-[11px] font-bold text-[var(--muted)]/60 leading-relaxed uppercase tracking-[0.16em] sm:text-[10px]">Reference & proof of transfer</p>
                              </div>
                              <div className={`bg-blue-600 text-white flex items-center justify-center shadow-lg shrink-0 ${isBuyNowMode ? 'w-12 h-12 rounded-xl' : 'w-14 h-14 rounded-2xl'}`}>
                                <CreditCard className="w-6 h-6" />
                              </div>
                            </div>
                            {paymentMethod === "GCash" && (
                              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 -translate-y-1/2 translate-x-1/2 rounded-full ring-4 ring-white" />
                            )}
                          </button>
                        )}

                        {(firstItem?.allowMaya !== false) && (
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("Maya")}
                            className={`border-2 text-left transition-all relative overflow-hidden ${isBuyNowMode ? 'rounded-2xl p-6' : 'rounded-3xl p-8'} ${paymentMethod === "Maya" ? 'border-teal-500 bg-teal-50/10 shadow-xl ring-4 ring-teal-50' : 'border-[var(--border)] bg-white hover:border-teal-300'}`}
                          >
                            <div className="flex items-start justify-between gap-4 relative z-10">
                              <div className="space-y-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-700">Maya</div>
                                <div className="font-serif text-2xl font-bold text-[var(--charcoal)] leading-none sm:text-3xl">Pay with Maya</div>
                                <p className="text-[11px] font-bold text-[var(--muted)]/60 leading-relaxed uppercase tracking-[0.16em] sm:text-[10px]">Reference & proof of transfer</p>
                              </div>
                              <div className={`bg-teal-600 text-white flex items-center justify-center shadow-lg shrink-0 ${isBuyNowMode ? 'w-12 h-12 rounded-xl' : 'w-14 h-14 rounded-2xl'}`}>
                                <CreditCard className="w-6 h-6" />
                              </div>
                            </div>
                            {paymentMethod === "Maya" && (
                              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-600/5 -translate-y-1/2 translate-x-1/2 rounded-full ring-4 ring-white" />
                            )}
                          </button>
                        )}
                      </div>

                      {(isGcashPayment || isMayaPayment) && (
                        <>
                          <div className={`bg-white border-2 border-[var(--border)] relative overflow-hidden group shadow-lg ${isBuyNowMode ? 'rounded-2xl p-5 sm:p-6 mt-6' : 'rounded-2xl sm:rounded-3xl p-5 sm:p-8 mt-8 sm:mt-10'}`}>
                            <div className={`absolute top-0 left-0 w-1 h-full bg-${isGcashPayment ? 'blue' : 'teal'}-600`} />

                            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-8">
                              <div className={`bg-white shadow-2xl overflow-hidden flex items-center justify-center p-2.5 border-2 border-${isGcashPayment ? 'blue' : 'teal'}-100 ring-8 ring-${isGcashPayment ? 'blue' : 'teal'}-50 shrink-0 relative group/qr ${isBuyNowMode ? 'w-24 h-24 rounded-2xl' : 'w-28 h-28 rounded-3xl'}`}>
                                {(isGcashPayment ? sellerGcashQrCode : sellerMayaQrCode) ? (
                                  <img src={isGcashPayment ? sellerGcashQrCode : sellerMayaQrCode} alt="Seller QR Code" className="w-full h-full object-contain rounded-xl" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                                ) : null}
                                <Scan className={`w-10 h-10 text-${isGcashPayment ? 'blue' : 'teal'}-100`} style={{ display: (isGcashPayment ? sellerGcashQrCode : sellerMayaQrCode) ? 'none' : 'block' }} />
                              </div>

                              <div className="flex-1 space-y-4 text-left">
                                <div>
                                  <div className={`text-[10px] font-black text-${isGcashPayment ? 'blue' : 'teal'}-600 uppercase tracking-[0.2em] mb-2`}>Seller {isGcashPayment ? 'GCash' : 'Maya'} Destination</div>
                                  <div className={`font-serif font-black text-${isGcashPayment ? 'blue' : 'teal'}-900 tracking-tight leading-none break-all ${isBuyNowMode ? 'text-2xl' : 'text-2xl sm:text-3xl'}`}>
                                    {isGcashPayment ? sellerGcashNumber : sellerMayaNumber}
                                  </div>
                                  <div className={`text-[11px] font-black text-${isGcashPayment ? 'blue' : 'teal'}-800/60 uppercase tracking-[0.16em] mt-2 leading-snug sm:text-[10px]`}>
                                    Recipient: {isGcashPayment ? sellerGcashName : sellerMayaName}
                                  </div>
                                </div>

                                <div className={`inline-flex items-center gap-3 bg-${isGcashPayment ? 'blue' : 'teal'}-50 border border-${isGcashPayment ? 'blue' : 'teal'}-100 rounded-xl px-4 py-2`}>
                                  <div className={`w-2 h-2 rounded-full bg-${isGcashPayment ? 'blue' : 'teal'}-500 animate-pulse`} />
                                  <span className={`text-[11px] font-bold text-${isGcashPayment ? 'blue' : 'teal'}-900 uppercase tracking-[0.16em] sm:text-[10px]`}>
                                    Due Amount: <span className="text-[var(--rust)]">₱<span className="pd-meta-val">{total.toLocaleString()}</span></span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className={`grid grid-cols-1 md:grid-cols-2 ${isBuyNowMode ? 'gap-6 pt-2' : 'gap-10 pt-6'}`}>
                            <InputGroup compact={isBuyNowMode} label={`${isGcashPayment ? 'GCash' : 'Maya'} Reference No.`} placeholder="Enter transaction digits..." value={gcashRef} onChange={(e) => setGcashRef(sanitizePaymentReferenceInput(e.target.value))} icon={<Lock className="w-4 h-4" />} inputMode="numeric" maxLength={INPUT_LIMITS.paymentReferenceMax} />
                            <div className="space-y-4">
                              <label className="ml-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)] sm:text-[10px]">Fulfillment Proof Screenshot</label>
                              <button
                                type="button"
                                onClick={() => document.getElementById('screenshot-upload').click()}
                                className={`w-full border-2 border-dashed flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-widest transition-all duration-500 overflow-hidden relative group/upload ${isBuyNowMode ? 'h-14 rounded-xl' : 'h-16 rounded-2xl'} ${screenshot ? 'bg-green-50 border-green-500 text-green-700' : 'bg-[var(--input-bg)] border-[var(--border)] text-[var(--muted)] hover:border-[var(--rust)] hover:text-[var(--rust)] hover:bg-white shadow-inner'}`}
                              >
                                {screenshot ? (
                                  <>
                                    <CheckCircle2 className="w-5 h-5" /> Evidence Logged
                                    <div className="absolute top-0 right-0 p-2 text-[8px] opacity-40 italic">{screenshot.name}</div>
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-5 h-5 group-hover/upload:-translate-y-1 transition-transform" /> Attach Payment Scan
                                  </>
                                )}
                              </button>
                              <input id="screenshot-upload" type="file" className="hidden" onChange={(e) => setScreenshot(e.target.files[0])} />
                            </div>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>               {/* Right: Real-time Order Monitor */}
              <div className={isBuyNowMode ? 'lg:col-span-5 lg:sticky lg:top-20 space-y-6' : 'lg:col-span-4 lg:sticky lg:top-24 space-y-6 lg:space-y-8'}>
                <div className={`artisan-card p-0 overflow-hidden border-2 border-[var(--rust)]/10 bg-white relative ${isBuyNowMode ? 'shadow-2xl' : 'shadow-3xl'}`}>

                  <div className={`relative z-10 ${isBuyNowMode ? 'p-6 sm:p-8 space-y-6' : 'p-6 sm:p-8 lg:p-10 space-y-6 sm:space-y-8'}`}>
                    <div className={`flex items-center justify-between border-b border-[var(--border)] ${isBuyNowMode ? 'pb-4' : 'pb-6'}`}>
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] sm:text-[10px]">Orders Overview</h3>
                      <div className="flex items-center rounded-lg bg-[var(--rust)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] leading-none text-white sm:text-[9px]"><span className="pd-meta-val">{cartItems.length}</span>&nbsp;{cartItems.length > 1 ? 'Pieces' : 'Piece'}</div>
                    </div>

                    <div className={`overflow-y-auto pr-2 custom-scrollbar ${isBuyNowMode ? 'space-y-4 max-h-[240px]' : 'space-y-6 max-h-[300px]'}`}>
                      {cartItems.map((item, idx) => (
                        <div key={idx} className={`flex group ${isBuyNowMode ? 'gap-4' : 'gap-5'}`}>
                          <div className={`bg-[var(--cream)]/30 relative overflow-hidden shrink-0 border border-[var(--border)] shadow-sm ${isBuyNowMode ? 'w-14 h-[4.5rem] rounded-lg' : 'w-16 h-20 rounded-xl'}`}>
                            <img src={getProductImageSrc(item.image || item.product?.image)}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              onError={(e) => { e.target.src = "/images/placeholder.png"; }}
                            />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className={`font-bold tracking-tight line-clamp-2 text-[var(--charcoal)] leading-tight ${isBuyNowMode ? 'text-[0.95rem]' : 'text-sm sm:text-base'}`}>{item.name}</div>
                            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)] sm:text-[9px]">
                              {item.variation && <><span className="text-[var(--rust)]">{item.variation}</span> <div className="w-1 h-1 rounded-full bg-[var(--muted)]/30" /></>}
                              {item.size} • Qty <span className="pd-meta-val">{item.quantity}</span>
                            </div>
                            <div className="text-xs font-serif font-bold text-[var(--rust)] tracking-tight">₱{(parsePrice(item.price)).toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className={`border-t border-[var(--border)] space-y-4 ${isBuyNowMode ? 'pt-6' : 'pt-8'}`}>
                      <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)] sm:text-[10px]">
                        <span>Heritage Value</span>
                        <span className="text-[var(--charcoal)] font-extrabold">₱<span className="pd-meta-val">{subtotal.toLocaleString()}</span></span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)] sm:text-[10px]">
                        <span>Courier Logistics</span>
                        <span className="text-green-600 font-extrabold">{shipping > 0 ? <span>₱<span className="pd-meta-val">{shipping.toLocaleString()}</span></span> : "FREE"}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)] sm:text-[10px]">
                        <span>Estimated Arrival</span>
                        <span className="text-[var(--charcoal)] font-extrabold"><span className="pd-meta-val">3</span>-<span className="pd-meta-val">5</span> Days</span>
                      </div>
                      <div className="pt-2 flex justify-between items-end border-t border-[var(--border)] border-dashed mt-2 pt-6">
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--charcoal)] sm:text-[11px]">Final Due</span>
                        <span className={`font-serif font-bold text-[var(--rust)] tracking-tighter ${isBuyNowMode ? 'text-xl' : 'text-2xl'}`}>₱<span className="pd-meta-val">{total.toLocaleString()}</span></span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleNext}
                    disabled={loading}
                    className={`w-full bg-[var(--rust)] text-xs font-extrabold uppercase tracking-[0.18em] flex items-center justify-center gap-3 active:scale-95 transition-all overflow-hidden relative group/btn disabled:opacity-50 z-20 sm:text-[10px] sm:tracking-[0.3em] ${isBuyNowMode ? 'py-5' : 'py-6 lg:py-7'}`}
                  >
                    <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                    {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
                      currentStep === 1 ? <>Proceed to Payment <ArrowRight className="w-5 h-5" /></> : <>Finalize Heritage Order <CheckCircle2 className="w-5 h-5" /></>
                    )}
                  </button>
                </div>



              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex flex-col items-center justify-center text-center bg-white/50 backdrop-blur-xl border border-white ${isBuyNowMode ? 'py-14 sm:py-16 space-y-8 rounded-[2rem] sm:rounded-[2.75rem] shadow-2xl' : 'py-16 sm:py-20 lg:py-24 space-y-8 sm:space-y-10 lg:space-y-12 rounded-[2rem] sm:rounded-[3rem] lg:rounded-[4rem] shadow-3xl'}`}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-green-500 blur-3xl opacity-20 animate-pulse" />
                <div className={`bg-green-50 text-green-500 flex items-center justify-center shadow-2xl relative z-10 hover:rotate-0 transition-transform duration-700 ring-8 ring-white ${isBuyNowMode ? 'w-24 h-24 rounded-[2rem]' : 'w-32 h-32 rounded-[2.5rem] rotate-6'}`}>
                  <CheckCircle2 className={`${isBuyNowMode ? 'w-12 h-12' : 'w-16 h-16'}`} />
                </div>
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl border border-green-100 text-green-600 animate-bounce">
                  <ShoppingCart className="w-6 h-6" />
                </div>
              </div>

              <div className="space-y-6 px-6">
                <h2 className={`font-serif font-bold text-[var(--charcoal)] tracking-tighter uppercase ${isBuyNowMode ? 'text-3xl sm:text-4xl lg:text-5xl' : 'text-3xl sm:text-4xl lg:text-6xl'}`}>
                  Order <span className="text-[var(--rust)] italic lowercase">Confirmed</span>
                </h2>
                <p className={`text-[var(--muted)] max-w-xl mx-auto italic leading-relaxed font-medium px-4 ${isBuyNowMode ? 'text-base' : 'text-base sm:text-lg'}`}>
                  The seller workshop has been notified of your acquisition. Your heritage order is now entering the logistics registry for premium LUMBÁN dispatch.
                </p>
              </div>

              <div className={`flex flex-col sm:flex-row ${isBuyNowMode ? 'gap-4 pt-2' : 'gap-6 pt-6'}`}>
                <Link href="/orders" className="btn-primary w-full px-8 py-5 shadow-2xl flex items-center justify-center gap-3 group ring-8 ring-[var(--rust)]/10 sm:w-auto sm:px-12">
                  See My order <History className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </Link>
                <Link href="/home" className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-[var(--border)] bg-white px-8 py-5 text-xs font-bold uppercase tracking-[0.18em] shadow-lg transition-all hover:border-[var(--rust)] hover:text-[var(--rust)] sm:w-auto sm:px-12 sm:text-[10px] sm:tracking-widest">
                  Back to Shop <ShoppingCart className="w-5 h-5" />
                </Link>
              </div>

              <div className="pt-10 text-[10px] font-bold text-[var(--muted)] uppercase tracking-[0.2em] opacity-30 sm:pt-12 sm:text-[9px] sm:tracking-[0.4em]">Transaction ID: LB-OR-2024-{selectedOrder?.id?.toString().padStart(6, '0') || 'PROCESSING'}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Validation Error Overlay */}
        <AnimatePresence>
          {showValidation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowValidation(false)}
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-md sm:p-6"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="artisan-card relative z-20 w-full max-w-lg border-red-100 p-6 text-center shadow-[0_40px_100px_rgba(0,0,0,0.5)] space-y-6 sm:p-8 sm:space-y-8 lg:p-12"
              >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-500 shadow-inner ring-4 ring-white rotate-12 sm:h-24 sm:w-24">
                  <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12" />
                </div>
                <div className="space-y-4">
                  <h3 className="font-serif text-3xl font-bold text-[var(--charcoal)] tracking-tight sm:text-4xl">Registry <span className="text-red-600">Errors</span></h3>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] leading-relaxed text-[var(--muted)] sm:text-[10px]">The following required authentication fields remain unfulfilled:</p>
                </div>

                <div className="inline-block w-full space-y-3 rounded-2xl border border-red-100/50 bg-red-50/50 p-5 text-left sm:rounded-3xl sm:p-8">
                  {currentStep === 1 ? (
                    <>
                      {!address.recipientName && <ValidationError label="Full Name" />}
                      {!address.phone && <ValidationError label="Phone Number" />}
                      {!address.houseNo && <ValidationError label="House no, or landmark" />}
                      {!address.street && <ValidationError label="Street" />}
                      {!address.barangay && <ValidationError label="Barangay" />}
                      {!address.city && <ValidationError label="City / Municipality" />}
                      {!address.province && <ValidationError label="Province" />}
                      {!address.postalCode && <ValidationError label="Postal Code" />}
                    </>
                  ) : (
                    <>
                      {(isGcashPayment || isMayaPayment) && !gcashRef && <ValidationError label={`${isGcashPayment ? 'GCash' : 'Maya'} Reference Hash`} />}
                      {(isGcashPayment || isMayaPayment) && !screenshot && <ValidationError label={`Digital ${isGcashPayment ? 'GCash' : 'Maya'} Screenshot Proof`} />}
                    </>
                  )}
                </div>

                <button
                  onClick={() => setShowValidation(false)}
                  className="w-full rounded-2xl bg-red-600 py-5 text-xs font-extrabold uppercase tracking-[0.18em] text-white shadow-2xl transition-all hover:bg-red-700 active:scale-95 sm:py-6 sm:text-[10px] sm:tracking-widest"
                >
                  Fulfill Missing Registry Data
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Address Book Modal Overlay */}
        <AnimatePresence>
          {showAddressBook && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowAddressBook(false); setShowAddrForm(false); }} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
              <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} className="relative flex w-full max-w-4xl max-h-[92vh] flex-col overflow-hidden rounded-[1.75rem] bg-[#FDFBF9] shadow-2xl pointer-events-auto sm:rounded-[2.5rem]">

                {/* Modal Header */}
                <div className="flex shrink-0 flex-col gap-4 border-b border-[var(--border)] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-8">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-[var(--charcoal)] tracking-tighter uppercase sm:text-3xl">
                      {showAddrForm ? (addrEditing ? 'Edit' : 'New') : 'Select'} <span className="text-[var(--rust)] italic lowercase font-normal">{showAddrForm ? 'address' : 'destination'}</span>
                    </h2>
                    <p className="mt-1 text-[11px] font-bold text-[var(--muted)] uppercase tracking-[0.16em] sm:text-[10px]">
                      {showAddrForm ? (addrEditing ? 'Update existing registry entry' : 'Add a new fulfillment node') : 'Choose or manage your saved addresses'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {!showAddrForm && (
                      <button onClick={() => openAddrForm()} className="flex items-center gap-2 rounded-xl bg-[var(--rust)] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-white shadow transition-all hover:scale-105 sm:text-[10px] sm:tracking-widest">
                        <Plus className="w-3.5 h-3.5" /> Add New
                      </button>
                    )}
                    {showAddrForm && (
                      <button onClick={() => setShowAddrForm(false)} className="px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)] transition-colors hover:text-[var(--rust)] sm:text-[10px] sm:tracking-widest">
                        ← Back to List
                      </button>
                    )}
                    <button onClick={() => { setShowAddressBook(false); setShowAddrForm(false); }} className="p-2.5 hover:bg-[var(--cream)] rounded-xl transition-colors border border-[var(--border)]">
                      <X className="w-5 h-5 text-[var(--muted)]" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <AnimatePresence mode="wait">
                    {/* LIST VIEW */}
                    {!showAddrForm && (
                      <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-5 sm:p-8">
                        {savedAddresses.length === 0 ? (
                          <div className="py-16 text-center space-y-4">
                            <div className="w-14 h-14 bg-[var(--cream)] rounded-full flex items-center justify-center mx-auto"><MapPin className="w-7 h-7 text-[var(--muted)]" /></div>
                            <p className="text-[var(--muted)] font-medium text-sm">No saved addresses yet.</p>
                            <button onClick={() => openAddrForm()} className="rounded-xl bg-[var(--rust)] px-8 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white sm:text-[10px] sm:tracking-widest">Add First Address</button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {savedAddresses.map(addr => (
                              <div key={addr.id} className="group relative artisan-card border-2 p-5 transition-all hover:border-[var(--rust)]/50 sm:p-6">
                                {addr.isDefault && <div className="absolute top-4 right-4 rounded bg-[var(--rust)] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white sm:text-[8px]">Default</div>}
                                <button onClick={() => selectAddress(addr)} className="w-full text-left">
                                  <div className="font-bold text-base text-[var(--charcoal)] group-hover:text-[var(--rust)] transition-colors mb-1">{addr.recipientName}</div>
                                  <div className="mb-3 text-[11px] font-bold text-[var(--muted)] sm:text-[10px]">{addr.phone}</div>
                                  <div className="text-xs text-[var(--muted)] leading-relaxed">
                                    {addr.houseNo} {addr.street},<br />
                                    Brgy. {addr.barangay}, {addr.city}, {addr.province}
                                  </div>
                                  {addr.latitude && <div className="mt-2 flex w-fit items-center gap-1 rounded bg-[var(--rust)]/5 px-2 py-1 text-[10px] font-bold text-[var(--rust)] sm:text-[9px]"><MapPin className="w-3 h-3" /> Pinned</div>}
                                </button>
                                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-4">
                                  {!addr.isDefault && (
                                    <button onClick={() => handleSetDefaultAddr(addr.id)} className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)] transition-colors hover:text-[var(--rust)] sm:text-[9px]">Set Default</button>
                                  )}
                                  <button onClick={() => openAddrForm(addr)} className="ml-auto text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--rust)] hover:underline sm:text-[9px]">Edit</button>
                                  <button onClick={() => handleDeleteAddr(addr.id)} className="text-[var(--muted)] hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* ADD / EDIT FORM VIEW */}
                    {showAddrForm && (
                      <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="p-5 sm:p-8">
                        <form onSubmit={handleSaveAddr} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <AbInputGroup label="Recipient Full Name" value={addrForm.recipientName} onChange={v => setAddrForm({ ...addrForm, recipientName: sanitizePersonNameInput(v) })} placeholder="e.g. Juan Dela Cruz" icon={<UserIcon className="w-4 h-4" />} maxLength={INPUT_LIMITS.personName} autoComplete="name" />
                            <AbInputGroup label="Phone Number" value={addrForm.phone} onChange={v => setAddrForm({ ...addrForm, phone: sanitizePhoneInput(v) })} placeholder="0912 345 6789" icon={<Phone className="w-4 h-4" />} inputMode="numeric" maxLength={INPUT_LIMITS.mobileNumber} autoComplete="tel" />
                            <AbInputGroup label="House no, or landmark" value={addrForm.houseNo} onChange={v => setAddrForm({ ...addrForm, houseNo: sanitizeAddressLineInput(v, INPUT_LIMITS.houseNo) })} placeholder="House 123" icon={<MapPin className="w-4 h-4" />} maxLength={INPUT_LIMITS.houseNo} autoComplete="address-line1" />
                            <AbInputGroup label="Street" value={addrForm.street} onChange={v => setAddrForm({ ...addrForm, street: sanitizeAddressLineInput(v, INPUT_LIMITS.street) })} placeholder="M.H. Del Pilar St." icon={<MapPin className="w-4 h-4" />} maxLength={INPUT_LIMITS.street} autoComplete="address-line2" />
                            <AbInputGroup label="Barangay" value={addrForm.barangay} onChange={v => setAddrForm({ ...addrForm, barangay: sanitizeAddressLineInput(v, INPUT_LIMITS.barangay) })} placeholder="Poblacion" icon={<MapPin className="w-4 h-4" />} maxLength={INPUT_LIMITS.barangay} />
                            <AbInputGroup label="City / Municipality" value={addrForm.city} onChange={v => setAddrForm({ ...addrForm, city: sanitizePlaceNameInput(v, INPUT_LIMITS.city) })} placeholder="Lumban" icon={<MapPin className="w-4 h-4" />} maxLength={INPUT_LIMITS.city} autoComplete="address-level2" />
                            <AbInputGroup label="Province" value={addrForm.province} onChange={v => setAddrForm({ ...addrForm, province: sanitizePlaceNameInput(v, INPUT_LIMITS.province) })} placeholder="Laguna" icon={<MapPin className="w-4 h-4" />} maxLength={INPUT_LIMITS.province} autoComplete="address-level1" />
                            <AbInputGroup label="Postal Code" value={addrForm.postalCode} onChange={v => setAddrForm({ ...addrForm, postalCode: sanitizePostalCodeInput(v) })} placeholder="4014" icon={<MapPin className="w-4 h-4" />} inputMode="numeric" maxLength={INPUT_LIMITS.postalCode} autoComplete="postal-code" />
                          </div>

                          <div className="flex flex-col items-start gap-4 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
                            <button
                              type="button"
                              onClick={() => setAddrMapPicker(v => !v)}
                              className={`flex items-center gap-3 rounded-xl px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] transition-all sm:text-[10px] sm:tracking-widest ${addrForm.latitude ? 'bg-green-50 text-green-700 border-2 border-green-200' :
                                addrMapPicker ? 'bg-[var(--rust)] text-white' :
                                  'bg-[var(--input-bg)] text-[var(--muted)] hover:bg-[var(--rust)] hover:text-white'
                                }`}
                            >
                              <MapPin className="w-4 h-4" />
                              {addrForm.latitude ? `Pinned (${addrForm.latitude.toFixed(4)})` : addrMapPicker ? 'Hide Interactive Map' : 'Drop Precise Map Pin'}
                            </button>

                            <label className="flex items-center gap-3 cursor-pointer group">
                              <div
                                onClick={() => setAddrForm({ ...addrForm, isDefault: !addrForm.isDefault })}
                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${addrForm.isDefault ? 'bg-[var(--rust)] border-[var(--rust)]' : 'border-[var(--border)] group-hover:border-[var(--rust)]'
                                  }`}
                              >
                                {addrForm.isDefault && <CheckCircle2 className="w-4 h-4 text-white" />}
                              </div>
                              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--charcoal)] opacity-80 sm:text-[10px] sm:tracking-widest">Set as default destination</span>
                            </label>
                          </div>

                          {addrMapPicker && (
                            <div className="mt-4 pt-4 border-t border-[var(--border)]">
                              <label className="mb-3 block text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--charcoal)] opacity-70 sm:text-[10px] sm:tracking-[0.2em]">Interactive Heritage Map</label>
                              <LocationPickerMap
                                onLocationFound={({ lat, lng, address: geo }) => {
                                  setAddrForm(prev => ({
                                    ...prev,
                                    latitude: lat,
                                    longitude: lng,
                                    street: geo.street ? sanitizeAddressLineInput(geo.street, INPUT_LIMITS.street) : prev.street,
                                    barangay: geo.barangay ? sanitizeAddressLineInput(geo.barangay, INPUT_LIMITS.barangay) : prev.barangay,
                                    city: geo.city ? sanitizePlaceNameInput(geo.city, INPUT_LIMITS.city) : prev.city,
                                    province: geo.province ? sanitizePlaceNameInput(geo.province, INPUT_LIMITS.province) : prev.province,
                                    postalCode: geo.postalCode ? sanitizePostalCodeInput(geo.postalCode) : prev.postalCode,
                                  }));
                                }}
                                onConfirm={() => setAddrMapPicker(false)}
                                initialLat={addrForm.latitude || 14.2952}
                                initialLng={addrForm.longitude || 121.4647}
                              />
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={addrLoading}
                            className="w-full bg-[var(--rust)] text-white py-5 rounded-2xl font-bold uppercase text-xs tracking-[0.3em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                          >
                            {addrLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (addrEditing ? 'Update Address' : 'Save New Address')}
                          </button>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </CustomerLayout>
  );
}

function InputGroup({
  label,
  placeholder,
  value,
  onChange,
  icon,
  disabled,
  compact = false,
  type = "text",
  inputMode,
  maxLength,
  autoComplete = "off",
}) {
  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <label className={`ml-1 font-bold uppercase text-[var(--muted)] opacity-70 ${compact ? 'text-[10px] tracking-[0.16em]' : 'text-[11px] tracking-[0.16em] sm:text-[10px] sm:tracking-widest'}`}>{label}</label>
      <div className="relative group">
        <div className={`absolute top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--rust)] transition-colors ${compact ? 'left-4' : 'left-5'}`}>{icon}</div>
        <input
          type={type}
          disabled={disabled}
          inputMode={inputMode}
          maxLength={maxLength}
          autoComplete={autoComplete}
          className={`w-full bg-[var(--input-bg)] border-2 border-transparent outline-none focus:border-[var(--rust)] focus:bg-white transition-all font-bold shadow-inner ${compact ? 'pl-12 pr-4 py-4 rounded-xl text-sm' : 'pl-14 pr-5 py-4 rounded-2xl text-sm sm:py-5 sm:text-base'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          placeholder={placeholder}
          value={value || ""}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

function ValidationError({ label }) {
  return (
    <div className="flex items-center gap-4 py-2 text-red-600">
      <div className="w-2 h-2 bg-red-400 rounded-full" />
      <span className="text-sm font-extrabold uppercase tracking-[0.14em] sm:text-[11px] sm:tracking-[0.2em]">{label}</span>
    </div>
  );
}

function UserIcon(props) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
}

function AbInputGroup({
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
      <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)] opacity-70 sm:text-[9px] sm:tracking-widest">{label}</label>
      <div className="relative group">
        <div className="absolute top-1/2 -translate-y-1/2 left-4 text-[var(--muted)] group-focus-within:text-[var(--rust)] transition-colors">{icon}</div>
        <input
          type={type}
          inputMode={inputMode}
          maxLength={maxLength}
          autoComplete={autoComplete}
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[var(--input-bg)] border-2 border-transparent outline-none focus:border-[var(--rust)] focus:bg-white transition-all font-bold shadow-inner pl-12 pr-4 py-4 rounded-xl text-sm sm:text-base"
        />
      </div>
    </div>
  );
}
