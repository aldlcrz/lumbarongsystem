"use client";
import React, { useState, useEffect } from "react";
import CustomerLayout from "@/components/CustomerLayout";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronRight,
  SlidersHorizontal,
  Star,
  RefreshCw,
  ShoppingCart,
  ArrowRight,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { useSocket } from "@/context/SocketContext";
import { normalizeProductImages, getProductImageSrc } from "@/lib/productImages";
import { fetchCategories, normalizeCategories } from "@/lib/categories";

export default function ShopPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("customer_user") || "{}");
      setUserRole(stored.role || "customer");
    } catch (e) {
      setUserRole("customer");
    }
  }, []);

  const showActions = true; // Enable quick purchase actions for all roles toggle for testing/UX versatility


  const { socket } = useSocket();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (err) {
      console.error("Failed to fetch products from backend.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(normalizeCategories(data));
      } catch (err) {
        console.error("Failed to fetch categories from backend.");
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("inventory_updated", (data) => {
        // Update product state if current product exists in the list
        setProducts(prev => prev.map(p =>
          p.id === data.product.id ? { ...p, ...data.product } : p
        ));
      });

      socket.on("stats_update", fetchProducts);
      socket.on("order_created", fetchProducts); // Refresh to account for stock changes
    }

    return () => {
      if (socket) {
        socket.off("inventory_updated");
        socket.off("stats_update");
        socket.off("order_created");
      }
    };
  }, [socket]);

  // Replaced with library functions


  const addToCart = (product) => {
    router.push(`/products?id=${product.id}`);
  };

  const handleBuyNow = (product) => {
    router.push(`/products?id=${product.id}`);
  };


  return (
    <CustomerLayout>
      <div className="space-y-4 mb-20">

        {/* ── WELCOME ── */}
        <div style={{ textAlign: "center", padding: "8px 0 2px" }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(20px, 6vw, 32px)", fontWeight: 600, color: "#1a1208", letterSpacing: "-0.01em" }}>
            Welcome to <em style={{ color: "#c0392b", fontStyle: "italic" }}>Lumbarong</em>
          </h1>
        </div>

        {/* Categories, Search & Filter Bar */}
        {/* Categories & Search Bar - Full Hero Layout */}
        <div className="flex flex-col items-center justify-center space-y-4 py-2">

          {/* Categories Slider - Limited to 3 + ALL trigger */}
          <div className="w-full max-w-6xl relative group/cats">
            <div className="flex items-center justify-center gap-2 sm:gap-3 py-2 px-4 sm:px-10">
              <button
                onClick={() => setShowCategoryModal(true)}
                className={`px-4 sm:px-6 py-2 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.1em] transition-all border-2 whitespace-nowrap ${activeCategory === "ALL"
                    ? 'bg-[var(--rust)] border-[var(--rust)] text-white shadow-lg shadow-red-900/10'
                    : 'bg-white border-[var(--border)]/60 text-[var(--muted)] hover:border-[var(--rust)] hover:text-[var(--rust)]'
                  }`}
              >
                ALL +
              </button>
              {categories.slice(0, 2).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 sm:px-6 py-2 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.1em] transition-all border-2 whitespace-nowrap ${activeCategory === cat
                      ? 'bg-[var(--rust)] border-[var(--rust)] text-white shadow-lg shadow-red-900/10'
                      : 'bg-white border-[var(--border)]/60 text-[var(--muted)] hover:border-[var(--rust)] hover:text-[var(--rust)]'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="relative group w-full max-w-xl">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] group-focus-within:text-[var(--rust)] transition-colors" />
            <input
              type="text"
              placeholder="Search by product name or artisan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-[var(--border)] rounded-full text-sm outline-none focus:border-[var(--rust)] focus:ring-8 focus:ring-[var(--rust)]/5 transition-all shadow-xl shadow-stone-200/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-5 top-1/2 -translate-y-1/2 p-1 hover:text-[var(--rust)] opacity-50 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Product Grid - Denser Minimalist Layout */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
          <AnimatePresence>
            {loading ? (
              <div className="col-span-full py-32 text-center text-[var(--muted)] opacity-50 italic animate-pulse">Loading items...</div>
            ) : products.filter(p => {
              const productCategories = Array.isArray(p.categories)
                ? p.categories
                : p.category
                  ? [p.category]
                  : [];
              const matchesCategory = activeCategory === "ALL" || productCategories.some((category) => (
                category?.toString().toLowerCase() === activeCategory.toLowerCase()
              ));
              const s = searchQuery.toLowerCase();
              const matchesSearch = !searchQuery || (p.name?.toLowerCase().includes(s)) || (p.artisan?.toLowerCase().includes(s)) || (p.description?.toLowerCase().includes(s));
              return matchesCategory && matchesSearch;
            }).map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="group relative flex flex-col bg-white rounded-sm shadow-sm hover:-translate-y-1 hover:shadow-lg border border-transparent hover:border-[var(--rust)] transition-all duration-300"
              >
                {/* Image Area - Minimal Square */}
                <div className="relative w-full aspect-square bg-[#F7F3EE] overflow-hidden rounded-t-sm group/img pointer-events-auto">
                  <Link href={`/products?id=${product.id}`} className="absolute inset-0 block z-0" aria-label={`View ${product.name} details`}>
                    <Image
                      src={getProductImageSrc(product.image)}
                      alt={product.name}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover/img:scale-105 transition-transform duration-700 mix-blend-multiply opacity-90 group-hover/img:opacity-100"
                    />
                  </Link>
                  {/* Add to Cart / Buy Now Overlay */}
                  {showActions && (
                    <div className="absolute inset-x-2 bottom-2 translate-y-0 opacity-100 lg:translate-y-8 lg:opacity-0 lg:group-hover/img:translate-y-0 lg:group-hover/img:opacity-100 transition-all duration-300 z-20 space-y-1.5 pointer-events-auto lg:pointer-events-none lg:group-hover/img:pointer-events-auto">
                      <button
                        onClick={(e) => { e.preventDefault(); handleBuyNow(product); }}
                        className="w-full bg-[var(--rust)] text-white py-2 rounded-sm text-[10px] leading-none font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md hover:bg-[#b03b25] transition-colors"
                      >
                        <ArrowRight className="w-3.5 h-3.5" /> Buy Now
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); addToCart(product); }}
                        className="w-full bg-white/95 text-[var(--charcoal)] py-2 rounded-sm text-[10px] leading-none font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md hover:bg-white transition-colors border border-gray-100"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                      </button>
                    </div>
                  )}
                </div>

                {/* Details Area */}
                <div className="px-2 pb-3 pt-2 space-y-1 flex-1 flex flex-col justify-between">
                  <Link href={`/products?id=${product.id}`} className="block flex-1">
                    <h3 className="text-[13px] leading-tight font-medium text-[#222] group-hover:text-[var(--rust)] transition-colors line-clamp-2 min-h-[36px]">{product.name}</h3>
                  </Link>

                  <div className="flex flex-col mt-1 space-y-1">
                    <span className="text-[16px] font-medium text-[var(--rust)]">₱{(product.price || 0).toLocaleString()}</span>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-[10px] text-[#757575]">{product.rating ? Number(product.rating).toFixed(1) : "5.0"}</span>
                      </div>
                      <span className="text-[10px] text-[#757575] line-clamp-1">{product.artisan || "Trusted Seller"}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Minimalist Category Selection Modal */}
        <AnimatePresence>
          {showCategoryModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCategoryModal(false)}
                className="absolute inset-0 bg-[#2A1E14]/30 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                className="bg-white w-full max-w-lg sm:max-w-xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] relative z-10 overflow-hidden flex flex-col border border-stone-200/50"
              >
                {/* Header Section */}
                <div className="px-8 sm:px-12 pt-10 sm:pt-12 pb-6 sm:pb-8">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--rust)] opacity-60">Catalogue</span>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2A2A2A] mt-1">Browse Categories</h2>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[50vh] sm:max-h-[60vh] px-6 sm:px-10 pb-10 no-scrollbar">
                  <div className="grid grid-cols-1 gap-1">
                    {["ALL", ...categories].map((cat) => {
                      const isSelected = activeCategory === cat;
                      const displayName = cat === "ALL" 
                        ? "All Collections" 
                        : cat.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
                      
                      return (
                        <button
                          key={cat}
                          onClick={() => {
                            setActiveCategory(cat);
                            setShowCategoryModal(false);
                          }}
                          className={`w-full text-left px-6 py-4 rounded-2xl transition-all duration-300 flex items-center justify-between group ${
                            isSelected
                              ? "bg-stone-50 text-[var(--rust)]"
                              : "text-[#2A2A2A]/70 hover:bg-stone-50/50 hover:text-[var(--rust)]"
                          }`}
                        >
                          <span className={`text-base sm:text-lg font-serif ${isSelected ? "font-bold" : "font-medium"}`}>
                            {displayName}
                          </span>
                          {isSelected && (
                            <motion.div layoutId="active-dot" className="w-1.5 h-1.5 rounded-full bg-[var(--rust)]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-8 sm:p-10 border-t border-stone-100 bg-stone-50/30">
                  <button
                    onClick={() => setShowCategoryModal(false)}
                    className="w-full py-4 bg-white border border-stone-200 rounded-2xl flex items-center justify-between px-8 sm:px-10 hover:border-[var(--rust)] transition-all group"
                  >
                    <span className="font-serif text-lg sm:text-xl font-bold text-[#2A2A2A]">
                      Select Category
                    </span>
                    <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-red-50 transition-colors">
                      <X className="w-4 h-4 text-[#2A2A2A] group-hover:text-[var(--rust)] transition-colors" />
                    </div>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </CustomerLayout>
  );
}
