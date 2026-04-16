"use client";
import React, { useState, useEffect } from "react";
import CustomerLayout from "@/components/CustomerLayout";
import { 
  ShoppingBag, 
  Minus, 
  Plus, 
  RefreshCw, 
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { getProductImageSrc } from "@/lib/productImages";

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCart = () => {
      const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartItems(storedCart);
      setSelectedItems(storedCart.map(item => `${item.id}-${item.size}-${item.variation || ''}`));
      setLoading(false);
    };

    loadCart();
    
    // Listen for storage events (from other tabs or same tab manual dispatch)
    window.addEventListener('storage', loadCart);
    // Custom event to force update when navigating within the SPA
    window.addEventListener('cart_updated', loadCart);

    return () => {
      window.removeEventListener('storage', loadCart);
      window.removeEventListener('cart_updated', loadCart);
    };
  }, []);

  const toggleItemSelection = (id, size, variation = "") => {
    const key = `${id}-${size}-${variation || ""}`;
    setSelectedItems(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map(item => `${item.id}-${item.size}-${item.variation || ''}`));
    }
  };

  const updateQuantity = (id, size, variation, delta) => {
    const updated = cartItems.map(item => {
      if (item.id === id && item.size === size && (item.variation || "") === (variation || "")) {
        const maxQty = item.stock > 0 ? item.stock : Infinity;
        const newQty = Math.max(1, Math.min(maxQty, item.quantity + delta));
        return { ...item, quantity: newQty };
      }
      return item;
    });
    setCartItems(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  };

  const removeItem = (id, size, variation) => {
    const updated = cartItems.filter(item => !(item.id === id && item.size === size && (item.variation || "") === (variation || "")));
    setCartItems(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    setSelectedItems(prev => prev.filter(k => k !== `${id}-${size}-${variation || ""}`));
    window.dispatchEvent(new Event('storage'));
  };

  const selectedCartItems = cartItems.filter(item => selectedItems.includes(`${item.id}-${item.size}-${item.variation || ""}`));
  const subtotal = selectedCartItems.reduce((acc, item) => {
    const priceStr = String(item.price || "₱0").replace(/[^0-9.]/g, '');
    return acc + (parseFloat(priceStr) * item.quantity);
  }, 0);
  
  const shipping = selectedCartItems.length > 0 ? 0 : 0; // Matching mock where it shows '-' 
  const total = subtotal + (typeof shipping === 'number' ? shipping : 0);

  // Group by Artisan/Workshop
  const groupedItems = cartItems.reduce((acc, item) => {
    const artisan = item.artisan || "Heritage Workshop";
    if (!acc[artisan]) acc[artisan] = [];
    acc[artisan].push(item);
    return acc;
  }, {});

  const handleCheckout = () => {
    if (selectedCartItems.length === 0) {
      alert("Please select at least one heritage piece to proceed.");
      return;
    }
    localStorage.setItem("checkout_items", JSON.stringify(selectedCartItems));
    window.location.href = "/checkout?mode=cart";
  };

  const getPriceNumber = (price) => {
    return parseFloat(String(price || "0").replace(/[^0-9.]/g, '')) || 0;
  };


  const numShops = Object.keys(groupedItems).length;

  return (
    <CustomerLayout>
      <div className="max-w-[1440px] mx-auto px-4 lg:px-10 mb-20 lg:mb-32">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pt-6">
           <div>
              <div className="flex items-center gap-3 mb-4">
                 <span className="w-6 h-[2.5px] bg-[var(--rust)]"></span>
                 <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[var(--rust)]">MARKETPLACE</span>
              </div>
              <h1 className="font-serif text-[42px] md:text-[56px] font-bold text-[#1A1A1A] leading-tight">
                 My <span className="text-[var(--rust)] italic font-medium">Cart</span>
              </h1>
           </div>
           {/* Sync Status */}
           <div className="flex items-center gap-2 mb-2 text-[#22C55E] text-xs font-bold uppercase tracking-widest shrink-0">
              <RefreshCw className="w-4 h-4" />
              Synced with {numShops} shop{numShops !== 1 ? 's' : ''}
           </div>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-[var(--border)] p-24 text-center shadow-sm">
             <div className="w-20 h-20 bg-[var(--cream)] rounded-full flex items-center justify-center mx-auto text-[var(--muted)] opacity-30 mb-8">
                <ShoppingBag className="w-10 h-10" />
             </div>
             <h2 className="text-3xl font-serif font-bold text-[#1A1A1A] mb-4">Your Cart is Empty</h2>
             <p className="text-sm text-[var(--muted)] italic mb-8 max-w-sm mx-auto">Discover authentic hand-embroidered masterpieces waiting to be part of your collection.</p>
             <Link href="/home" className="inline-flex items-center justify-center px-12 py-5 bg-[#1A1A1A] text-white rounded-[1.2rem] text-[10px] font-extrabold uppercase tracking-widest hover:bg-[var(--rust)] transition-colors shadow-lg shadow-black/5">
                Start Shopping
             </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Cart Items Table Container */}
            <div className="lg:col-span-8 flex flex-col gap-8">
               <div className="bg-white rounded-[2rem] border border-[var(--border)] shadow-sm overflow-hidden flex flex-col">
                  
                  {/* Table Headers */}
                  <div className="hidden md:grid grid-cols-12 px-8 py-5 border-b border-[var(--border)] text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#A3A3A3] bg-[#FCFAF8]/40">
                     <div className="col-span-5 flex items-center gap-6">
                        <input 
                           type="checkbox" 
                           checked={selectedItems.length === cartItems.length}
                           onChange={toggleSelectAll}
                           className="w-4 h-4 rounded border-[#D1D1D1] text-[var(--rust)] focus:ring-[var(--rust)] cursor-pointer" 
                        />
                        PRODUCT
                     </div>
                     <div className="col-span-2 text-center">UNIT PRICE</div>
                     <div className="col-span-2 text-center">QUANTITY</div>
                     <div className="col-span-2 text-center">TOTAL</div>
                     <div className="col-span-1 text-right">ACTION</div>
                  </div>

                  {/* Group by Artisan */}
                  <div className="divide-y divide-[var(--border)]">
                     {Object.keys(groupedItems).map((artisan, gIdx) => (
                        <div key={artisan} className="flex flex-col">
                           {/* Shop Row Header */}
                           <div className="px-8 py-5 flex items-center gap-3 bg-[#FCFAF8]/40">
                              <div className="w-8 h-8 rounded-lg bg-[#2A1E14] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">{artisan[0]}</div>
                              <span className="text-xs font-bold text-[#1A1A1A]">{artisan}</span>
                              <div className="px-2 py-0.5 bg-[#EAF7ED] border border-[#A1D4B1] rounded text-[8px] font-bold uppercase tracking-widest text-[#2A6D3A] flex items-center gap-1.5 ml-2">
                                 <div className="w-1 h-1 rounded-full bg-[#2A6D3A] animate-pulse" /> Verified
                              </div>
                           </div>

                           {/* Product Rows */}
                           <div className="divide-y divide-[var(--border)] bg-white">
                              {groupedItems[artisan].map((item, idx) => {
                                 const itemKey = `${item.id}-${item.size}-${item.variation || ""}`;
                                 const isSelected = selectedItems.includes(itemKey);
                                 const priceVal = getPriceNumber(item.price);
                                 const itemTotal = priceVal * item.quantity;

                                 return (
                                    <div key={itemKey} className="px-4 md:px-8 py-6 flex flex-col md:grid md:grid-cols-12 md:items-center gap-6 relative">
                                       <div className="absolute top-4 right-4 md:hidden">
                                          <button onClick={() => removeItem(item.id, item.size, item.variation)} className="p-2 text-[#A3A3A3] hover:text-red-500">
                                             <X className="w-4 h-4" />
                                          </button>
                                       </div>
                                       {/* Check + Product Info */}
                                       <div className="col-span-1 md:col-span-5 flex items-center gap-4 sm:gap-6">
                                          <input 
                                             type="checkbox" 
                                             checked={isSelected}
                                             onChange={() => toggleItemSelection(item.id, item.size, item.variation)}
                                             className="w-4 h-4 rounded border-[#D1D1D1] text-[var(--rust)] focus:ring-[var(--rust)] cursor-pointer shrink-0" 
                                          />
                                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#FDFBF9] border border-[var(--border)] rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-1">
                                             <img 
                                                src={getProductImageSrc(item.image)} 
                                                alt={item.name} 
                                                className="w-full h-full object-cover rounded-lg" 
                                                onError={(e) => { e.target.src = "/images/placeholder.png"; }}
                                             />
                                          </div>
                                           <div className="flex flex-col gap-2">
                                              <div className="text-sm font-bold text-[#1A1A1A] line-clamp-1">{item.name}</div>
                                              <div className="flex items-center gap-1.5 flex-wrap">
                                                 <span className="px-2 py-0.5 bg-[#F6F4F0] rounded text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest">{item.category || "Formal"}</span>
                                                 <span className="px-2 py-0.5 bg-[#F6F4F0] rounded text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest">Size: {item.size || "M"}</span>
                                                 {item.variation && (
                                                   <span className="px-2 py-0.5 bg-[var(--rust)]/10 text-[var(--rust)] rounded text-[9px] font-bold uppercase tracking-widest">
                                                     {item.variation}
                                                   </span>
                                                 )}
                                              </div>
                                           </div>
                                       </div>

                                       {/* Mobile Price Overlay */}
                                       <div className="flex md:hidden items-center justify-between w-full mt-2">
                                          <div className="font-bold text-sm text-[var(--rust)] italic">₱{priceVal.toLocaleString()}</div>
                                          <div className="inline-flex items-center gap-3 px-3 py-1.5 border border-[#EAE5DF] rounded-xl bg-white shadow-sm">
                                             <button onClick={() => updateQuantity(item.id, item.size, item.variation, -1)} className="text-[#A3A3A3] hover:text-[var(--rust)] transition-colors"><Minus className="w-3" /></button>
                                             <span className="min-w-6 text-center text-[11px] font-bold text-[#1A1A1A]">{item.quantity}</span>
                                             <button onClick={() => updateQuantity(item.id, item.size, item.variation, 1)} className="text-[#A3A3A3] hover:text-[var(--rust)] transition-colors"><Plus className="w-3" /></button>
                                          </div>
                                       </div>

                                       {/* Unit Price (MD only) */}
                                       <div className="hidden md:block col-span-2 text-center font-bold text-[14px] text-[#A3A3A3]">
                                          ₱{priceVal.toLocaleString()}
                                       </div>

                                       {/* Quantity Stepper (MD only) */}
                                       <div className="hidden md:flex col-span-2 justify-center">
                                          <div className="inline-flex items-center gap-3 px-3 py-1.5 border border-[#EAE5DF] rounded-xl bg-white shadow-sm">
                                             <button onClick={() => updateQuantity(item.id, item.size, item.variation, -1)} className="text-[#A3A3A3] hover:text-[var(--rust)] transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                                             <span className="min-w-6 text-center text-xs font-bold text-[#1A1A1A]">{item.quantity}</span>
                                             <button onClick={() => updateQuantity(item.id, item.size, item.variation, 1)} className="text-[#A3A3A3] hover:text-[var(--rust)] transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                                          </div>
                                       </div>

                                       {/* Total Price */}
                                       <div className="hidden md:block col-span-2 text-center">
                                          <span className="font-serif text-[18px] font-bold text-[var(--rust)] italic tracking-tight">₱{itemTotal.toLocaleString()}</span>
                                       </div>

                                       {/* Delete Action (MD only) */}
                                       <div className="hidden md:block col-span-1 text-right">
                                          <button onClick={() => removeItem(item.id, item.size, item.variation)} className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-widest hover:text-red-500 transition-colors">
                                             Delete
                                          </button>
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                     ))}
                  </div>

                  {/* Table Footer Actions - Desktop only */}
                  <div className="hidden md:flex px-8 py-6 border-t border-[var(--border)] bg-[#FCFAF8]/40 items-center justify-between gap-6">
                     <div className="flex items-center gap-4">
                        <input 
                           type="checkbox" 
                           checked={selectedItems.length === cartItems.length}
                           onChange={toggleSelectAll}
                           className="w-4 h-4 rounded border-[#D1D1D1] text-[var(--rust)] focus:ring-[var(--rust)] cursor-pointer" 
                        />
                        <span className="text-xs font-bold text-[var(--muted)]">Select All ({cartItems.length})</span>
                     </div>
                     <div className="flex items-center gap-8 w-full md:w-auto">
                        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 shrink-0">
                           <span className="text-xs font-bold text-[var(--muted)]">Total ({selectedItems.length} items):</span>
                           <span className="font-serif text-[24px] font-bold text-[var(--rust)] italic">₱{total.toLocaleString()}</span>
                        </div>
                        <button 
                           type="button"
                           onClick={handleCheckout}
                           disabled={selectedItems.length === 0}
                           className="flex-1 md:px-10 py-3.5 bg-[var(--rust)] text-white rounded-xl text-[10px] font-extrabold uppercase tracking-[0.2em] shadow-lg shadow-pink-900/5 hover:bg-[#A33420] transition-all disabled:bg-[#E5DDD5] disabled:text-[var(--muted)] disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
                        >
                           CHECK OUT ({selectedItems.length})
                        </button>
                     </div>
                  </div>
               </div>
            </div>

            {/* Right: Summary Sidebar */}
            <div className="lg:col-span-4 sticky top-[100px]">
               <div className="bg-white rounded-[2rem] border border-[var(--border)] p-10 shadow-sm space-y-10">
                  <h3 className="font-serif text-[24px] font-bold text-[#1A1A1A]">Order Summary</h3>
                  
                  <div className="space-y-6">
                     <div className="flex justify-between items-center text-xs font-bold text-[#A3A3A3] uppercase tracking-widest">
                        <span>Subtotal</span>
                        <span className="text-[#1A1A1A]">₱{subtotal.toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between items-center text-xs font-bold text-[#A3A3A3] uppercase tracking-widest border-b border-[var(--border)] pb-8">
                        <span>Shipping</span>
                        <span className="text-[#1A1A1A]">—</span>
                     </div>
                     
                     <div className="flex justify-between items-end pt-4">
                        <span className="text-[14px] font-bold tracking-tight text-[#1A1A1A]">Total</span>
                        <span className="font-serif text-[32px] font-bold text-[var(--rust)] leading-none italic">₱{total.toLocaleString()}</span>
                     </div>
                  </div>

                  <div className="space-y-6 pt-4">
                     <button 
                       type="button"
                       onClick={handleCheckout}
                       disabled={selectedItems.length === 0}
                       className="w-full py-5 bg-[var(--rust)] text-white rounded-[1.2rem] text-[11px] font-extrabold uppercase tracking-[0.2em] shadow-lg shadow-pink-900/10 hover:bg-[#A33420] transition-all flex items-center justify-center gap-2 group/btn disabled:bg-[#E5DDD5] disabled:text-[var(--muted)] disabled:opacity-50 active:scale-[0.98]"
                     >
                        CHECK OUT ({selectedItems.length})
                     </button>
                     <div className="flex items-center justify-center gap-2.5 text-[10px] font-bold text-[#A3A3A3] uppercase tracking-widest">
                        <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
                        Secure checkout
                     </div>
                  </div>
               </div>
            </div>

          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
