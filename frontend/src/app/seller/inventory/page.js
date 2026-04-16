"use client";
import React, { useState, useEffect } from "react";
import SellerLayout from "@/components/SellerLayout";
import Image from "next/image";
import Link from "next/link";
import { 
  Package, 
  Search, 
  Filter, 
  MoreVertical, 
  Plus, 
  Edit3, 
  Trash2, 
  TrendingUp, 
  Inbox,
  LayoutGrid,
  List as ListIcon,
  CheckCircle,
  AlertTriangle,
  XCircle
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// No static products; data is fetched from the backend on mount and updated via Socket.IO.
import { api } from "@/lib/api";
import { useSocket } from "@/context/SocketContext";
import { getProductImageSrc } from "@/lib/productImages";

export default function InventoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products/seller");
      setProducts(res.data);
    } catch (err) {
      console.warn("Failed to fetch products", err.message || "Backend offline");
    } finally {
      setLoading(false);
    }
  };

  const { socket } = useSocket();

  useEffect(() => {
    fetchProducts();
    
    if (socket) {
      socket.on("inventory_updated", fetchProducts);
      socket.on("stats_update", (data) => {
        if (data.type === 'inventory') fetchProducts();
      });
    }

    return () => {
      if (socket) {
        socket.off("inventory_updated");
        socket.off("stats_update");
      }
    };
  }, [socket]);

  const deleteProduct = async (id) => {
    if(!confirm("Are you sure you want to remove this masterpiece?")) return;
    setError(null); setSuccess(null);
    try {
      await api.delete(`/products/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setSuccess("Product deleted successfully.");
      setTimeout(() => setSuccess(null), 3000);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete product.");
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <SellerLayout>
      <div className="space-y-10 mb-20">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-down">
          <div>
            <div className="eyebrow">Artisan Catalog</div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-[var(--charcoal)] uppercase">
              Inventory <span className="text-[var(--rust)] italic lowercase">& Stock</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/seller/add-product" className="btn-primary px-8 py-3 shadow-xl">
               Create New Listing <Plus className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-bold flex items-center gap-2 mt-4">
              <XCircle className="w-4 h-4" /> {error}
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-bold flex items-center gap-2 mt-4">
              <CheckCircle className="w-4 h-4" /> {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters and Search */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pt-4 animate-fade-up">
           <div className="flex items-center bg-white w-full max-w-xl rounded-2xl px-5 py-4 border border-[var(--border)] focus-within:border-[var(--rust)] shadow-sm transition-all group">
              <Search className="w-5 h-5 text-[var(--muted)] mr-4 group-focus-within:text-[var(--rust)] transition-colors" />
              <input 
                type="text" 
                placeholder="Filter your mastercrafts by name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent w-full text-sm outline-none font-medium" 
              />
           </div>

           <div className="flex items-center gap-4">
              <div className="flex bg-white rounded-xl p-1 border border-[var(--border)] shadow-sm">
                 <button onClick={() => setView("list")} className={`p-2 rounded-lg transition-all ${view === "list" ? 'bg-[var(--bark)] text-white shadow-md' : 'text-[var(--muted)] hover:bg-[var(--cream)]'}`}><ListIcon className="w-4 h-4" /></button>
                 <button onClick={() => setView("grid")} className={`p-2 rounded-lg transition-all ${view === "grid" ? 'bg-[var(--bark)] text-white shadow-md' : 'text-[var(--muted)] hover:bg-[var(--cream)]'}`}><LayoutGrid className="w-4 h-4" /></button>
              </div>
              <button 
                onClick={() => {
                  const filters = ["All", "Active", "Low Stock", "Out of Stock"];
                  setStatusFilter(filters[(filters.indexOf(statusFilter) + 1) % filters.length]);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-[var(--border)] rounded-xl text-xs font-bold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--rust)] hover:border-[var(--rust)] transition-all w-48 justify-center"
              >
                 <Filter className="w-4 h-4 shrink-0" /> {statusFilter === "All" ? "Filter Status" : statusFilter}
              </button>
           </div>
        </div>

        {/* Inventory View */}
        {loading ? (
           <div className="artisan-card py-24 text-center text-[var(--muted)] animate-pulse italic">Sychronizing with your artisan catalog...</div>
        ) : products.length === 0 ? (
          <div className="artisan-card py-20 flex flex-col items-center justify-center text-center space-y-4">
             <div className="w-20 h-20 bg-[var(--cream)] rounded-full flex items-center justify-center text-[var(--muted)]"><Inbox className="w-10 h-10" /></div>
             <div className="text-xl font-serif font-bold">No products found</div>
             <p className="text-sm text-[var(--muted)] max-w-xs">Start your heritage business by adding your first embroidered masterpiece.</p>
          </div>
        ) : (
          <div className={`grid ${view === "list" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"} gap-6`}>
            {products
              .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.categories && p.categories.join(' ').toLowerCase().includes(searchTerm.toLowerCase())))
              .filter(p => {
                if (statusFilter === "All") return true;
                const status = p.stock > 5 ? 'Active' : p.stock > 0 ? 'Low Stock' : 'Out of Stock';
                return status === statusFilter;
              })
              .map((product, i) => {
              const status = product.stock > 5 ? 'Active' : product.stock > 0 ? 'Low Stock' : 'Out of Stock';
              return (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`artisan-card overflow-hidden transition-all group ${view === "list" ? 'p-6 flex items-center gap-8' : 'p-0 flex flex-col'}`}
              >
                {/* Product Image */}
                <div className={`relative shrink-0 overflow-hidden bg-[var(--cream)] rounded-xl border border-[var(--border)] ${view === "list" ? 'w-24 h-24' : 'w-full h-64 border-none border-b rounded-none'}`}>
                   <img 
                     src={getProductImageSrc(product.image)} 
                     className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                     alt={product.name}
                     onError={(e) => { e.target.src = "/images/placeholder.png"; if (!e.target.dataset.tried) { e.target.dataset.tried = true; e.target.src = "/images/placeholder.png"; } }}
                   />
                </div>

                {/* Content */}
                <div className={`flex-1 ${view === "list" ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 items-center' : 'p-6 space-y-6 flex flex-col justify-between h-full'}`}>
                   <div className="space-y-1">
                      <h3 className="font-bold text-[var(--charcoal)] line-clamp-1 group-hover:text-[var(--rust)] transition-colors">{product.name}</h3>
                      <div className="text-[10px] uppercase font-bold tracking-widest text-[var(--muted)] opacity-50 underline decoration-1 decoration-[var(--border)] underline-offset-4">Ref ID: #ART-00{product.id}</div>
                   </div>

                   <div className="space-y-1">
                      <div className="text-[10px] uppercase font-bold tracking-widest text-[var(--muted)] opacity-60">Listing Price</div>
                      <div className="font-serif font-bold text-lg text-[var(--rust)]">₱{parseFloat(product.price).toLocaleString()}</div>
                   </div>

                   <div className="space-y-2">
                      <div className="text-[10px] uppercase font-bold tracking-widest text-[var(--muted)] opacity-60">Stock Left</div>
                      <div className="flex items-center gap-2">
                         <div className="h-1.5 w-20 bg-[var(--cream)] rounded-full overflow-hidden shrink-0">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(product.stock * 5, 100)}%` }} className={`h-full ${product.stock > 5 ? 'bg-[var(--bark)]' : product.stock > 0 ? 'bg-amber-500' : 'bg-red-400'}`} />
                         </div>
                         <span className={`text-xs font-bold ${product.stock === 0 ? 'text-red-500' : 'text-[var(--charcoal)]'}`}>{product.stock} units</span>
                      </div>
                   </div>

                   <div className="hidden md:flex flex-col gap-1">
                      <div className="text-[10px] uppercase font-bold tracking-widest text-[var(--muted)] opacity-60">Listing Category</div>
                      <div className="text-xs font-bold text-[var(--muted)]">
                         {product.categories?.join(', ') || "Uncategorized"}
                      </div>
                   </div>

                   <div className="flex items-center justify-between md:justify-end gap-3 pt-4 md:pt-0 border-t md:border-none border-[var(--border)]">
                      <div className={`px-2 py-1 rounded-md text-[9px] font-bold tracking-widest uppercase flex items-center gap-1.5 border ${status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : status === 'Low Stock' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                         {status === 'Active' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />} {status}
                      </div>
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => router.push(`/seller/inventory/edit?id=${product.id}`)}
                          className="p-2 hover:bg-[var(--cream)] rounded-lg transition-all text-[var(--muted)] hover:text-[var(--rust)]" 
                          title="Edit Listing"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteProduct(product.id)} className="p-2 hover:bg-red-50 rounded-lg transition-all text-[var(--muted)] hover:text-red-500" title="Delete Product"><Trash2 className="w-4 h-4" /></button>
                      </div>
                   </div>
                </div>
              </motion.div>
            )})}
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
