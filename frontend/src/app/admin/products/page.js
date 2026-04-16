"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { ShoppingBag, Search, Filter, TrendingUp, Store, Package, Trash2, Eye, LayoutGrid, List as ListIcon, CheckCircle2, XCircle, Edit2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { api, BACKEND_URL } from "@/lib/api";
import { io } from "socket.io-client";
import { getProductImageSrc } from "@/lib/productImages";

export default function AdminProducts() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("products"); // "products" or "categories"
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (err) {
      console.warn("Failed to fetch products", err.message || "Backend offline");
      setProducts([]); // Fallback to empty array
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (err) {
      console.warn("Failed to fetch categories", err.message || "Backend offline");
      setCategories([]); // Fallback to empty array
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchProducts(), fetchCategories()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const socket = io(BACKEND_URL);
    socket.on("stats_update", fetchData);
    return () => socket.disconnect();
  }, []);

  const deleteProduct = async (id) => {
    if (!confirm("Are you sure you want to remove this product from the global marketplace?")) return;
    setError(null); setSuccess(null);
    try {
      await api.delete(`/products/${id}`);
      setSuccess("Product deleted successfully.");
      setTimeout(() => setSuccess(null), 3000);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete product.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name) return;
    setError(null); setSuccess(null);
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, newCategory);
        setSuccess("Category updated successfully.");
      } else {
        await api.post("/categories", newCategory);
        setSuccess("Category added successfully.");
      }
      setNewCategory({ name: "", description: "" });
      setEditingCategory(null);
      setTimeout(() => setSuccess(null), 3000);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${editingCategory ? 'update' : 'add'} category.`);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleEditClick = (cat) => {
    setEditingCategory(cat);
    setNewCategory({ name: cat.name, description: cat.description || "" });
    // Scroll to form on mobile or small screens if needed, but here it's side-by-side
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setNewCategory({ name: "", description: "" });
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm("Are you sure? This will only work if no products belong to this category.")) return;
    setError(null); setSuccess(null);
    try {
      await api.delete(`/categories/${id}`);
      setSuccess("Category deleted successfully.");
      setTimeout(() => setSuccess(null), 3000);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete category.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.seller?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8 mb-16 sm:mb-20">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:gap-6 pb-2">
          <div>
            <h1 className="font-serif text-xl sm:text-2xl lg:text-3xl font-black tracking-tighter text-[var(--charcoal)] uppercase">
              Central <span className="text-[var(--rust)] italic lowercase">Catalog</span>
            </h1>
            <p className="text-[9px] sm:text-xs font-bold text-[var(--muted)] opacity-60 uppercase tracking-widest mt-1">
              Overseeing all heritage collections and segments.
            </p>
          </div>
          <div className="flex items-center p-1 sm:p-1.5 bg-white rounded-2xl border border-[var(--border)] shadow-sm w-fit">
            <button
              onClick={() => setActiveTab("products")}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === "products" ? 'bg-red-50 text-[var(--rust)] shadow-sm ring-1 ring-red-100' : 'text-[var(--muted)] hover:bg-[var(--cream)]'}`}
            >
              <Package className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> <span className="hidden sm:inline">All Products</span><span className="sm:hidden">Products</span>
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === "categories" ? 'bg-red-50 text-[var(--rust)] shadow-sm ring-1 ring-red-100' : 'text-[var(--muted)] hover:bg-[var(--cream)]'}`}
            >
              <LayoutGrid className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> <span className="hidden sm:inline">Categories</span><span className="sm:hidden">Cats</span>
            </button>
          </div>
        </div>

        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-3 sm:p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs sm:text-sm font-bold flex items-start sm:items-center gap-2 mb-4 overflow-hidden">
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-700 shrink-0 mt-0.5 sm:mt-0" /> <span className="line-clamp-2 sm:line-clamp-none">{error}</span>
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-3 sm:p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs sm:text-sm font-bold flex items-start sm:items-center gap-2 mb-4 overflow-hidden">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-700 shrink-0 mt-0.5 sm:mt-0" /> <span className="line-clamp-2 sm:line-clamp-none">{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {activeTab === "products" ? (
          <>
            {/* Search Bar */}
            <div className="flex items-center bg-white w-full rounded-2xl px-3 sm:px-5 py-2.5 sm:py-3.5 border border-[var(--border)] focus-within:border-[var(--rust)] shadow-sm transition-all group">
              <Search className="w-4 sm:w-4.5 h-4 sm:h-4.5 text-[var(--muted)] mr-2 sm:mr-4 group-focus-within:text-[var(--rust)] transition-colors shrink-0" />
              <input
                type="text"
                placeholder="Filter by name, category, or artisan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent w-full text-xs sm:text-xs outline-none font-bold placeholder:opacity-50 truncate"
              />
            </div>

            {/* Catalog Table - Responsive Wrapper */}
            <div className="artisan-card p-0 overflow-hidden border-none shadow-xl bg-white/80 backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-max">
                  <thead className="bg-[var(--cream)]/30 border-b border-[var(--border)] sticky top-0">
                    <tr>
                      <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[var(--muted)] whitespace-nowrap">Product</th>
                      <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[var(--muted)] whitespace-nowrap">Artisan</th>
                      <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[var(--muted)] whitespace-nowrap">Status</th>
                      <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[var(--muted)] text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {loading ? (
                      <tr><td colSpan="4" className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-center text-xs font-bold text-[var(--muted)] animate-pulse uppercase tracking-widest italic">Synchronizing Archives...</td></tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr><td colSpan="4" className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-center text-xs font-bold text-[var(--muted)] uppercase tracking-widest italic">Empty Catalog Registry</td></tr>
                    ) : (
                      filteredProducts.map((product) => (
                        <tr key={product.id} className="group hover:bg-[var(--cream)]/10 transition-colors">
                          <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                            <div className="flex items-center gap-3 sm:gap-5">
                              <div className="w-10 sm:w-14 h-10 sm:h-14 rounded-lg sm:rounded-xl overflow-hidden bg-[var(--cream)] border border-[var(--border)] shadow-sm shrink-0">
                                <img
                                  src={getProductImageSrc(product.image)}
                                  className="w-full h-full object-cover"
                                  alt={product.name}
                                  onError={(e) => { e.target.src = "/images/placeholder.png"; }}
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="font-black text-[var(--charcoal)] uppercase tracking-tight text-xs sm:text-sm group-hover:text-[var(--rust)] transition-colors truncate">{product.name}</div>
                                <div className="text-[8px] sm:text-[10px] font-bold text-[var(--muted)] mt-0.5 italic lowercase truncate">Category: {product.category}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 whitespace-nowrap">
                            <div className="text-[9px] sm:text-xs font-bold text-[var(--charcoal)] flex items-center gap-2 italic min-w-0">
                              <Store className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[var(--rust)] shrink-0" />
                              <span className="truncate">{product.seller?.name || "Unknown Artisan"}</span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 whitespace-nowrap">
                            <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 bg-green-50 text-green-700 text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded-lg border border-green-100 italic shadow-sm">
                              <CheckCircle2 className="w-2.5 sm:w-3 h-2.5 sm:h-3 shrink-0" /> <span className="hidden sm:inline">Approved</span><span className="sm:hidden">OK</span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                              <button onClick={() => router.push(`/products?id=${product.id}`)} className="p-2 sm:p-2.5 bg-white text-[var(--muted)] hover:text-[var(--rust)] rounded-lg transition-all border border-[var(--border)] shadow-sm hover:border-[var(--rust)]" title="View Listing"><Eye className="w-3.5 sm:w-4 h-3.5 sm:h-4" /></button>
                              <button onClick={() => deleteProduct(product.id)} className="p-2 sm:p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all border border-red-100 shadow-sm" title="Revoke Listing"><Trash2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Add Category Form */}
            <div className="lg:col-span-1">
              <div className="artisan-card p-4 sm:p-6 lg:p-8 bg-white shadow-xl space-y-4 sm:space-y-6">
                <h3 className="font-serif text-base sm:text-lg lg:text-xl font-bold text-[var(--charcoal)] tracking-tight uppercase">
                  {editingCategory ? 'Update' : 'Register'} <span className="text-[var(--rust)] italic lowercase">{editingCategory ? 'Category' : 'New Category'}</span>
                </h3>
                <form onSubmit={handleAddCategory} className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <label className="text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-[var(--muted)] ml-1">Category Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Pina Barong"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      className="w-full px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 bg-[var(--cream)]/30 border-2 border-transparent focus:border-[var(--rust)] rounded-xl outline-none text-xs sm:text-sm font-bold transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-[var(--muted)] ml-1">Segment Description</label>
                    <textarea
                      placeholder="Brief description of this heritage segment..."
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      rows="3"
                      className="w-full px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 bg-[var(--cream)]/30 border-2 border-transparent focus:border-[var(--rust)] rounded-xl outline-none text-xs sm:text-sm font-bold transition-all shadow-inner resize-none"
                    />
                  </div>
                  <div className="flex gap-2 sm:gap-3">
                    {editingCategory && (
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="flex-1 py-3 sm:py-4 bg-[var(--cream)] text-[var(--charcoal)] text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] rounded-xl hover:bg-[var(--border)] transition-all shadow-sm"
                      >
                        Cancel
                      </button>
                    )}
                    <button type="submit" className={`flex-[2] py-3 sm:py-4 bg-[var(--rust)] text-white text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] rounded-xl hover:opacity-90 transition-all shadow-lg active:scale-[0.98]`}>
                      {editingCategory ? 'Save Changes' : 'Add to Registry'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Categories List */}
            <div className="lg:col-span-2">
              <div className="artisan-card p-0 bg-white shadow-xl overflow-hidden border-none text-left">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead className="bg-[var(--cream)]/30 border-b border-[var(--border)] sticky top-0">
                      <tr>
                        <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[var(--muted)] whitespace-nowrap">Segment Name</th>
                        <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[var(--muted)] whitespace-nowrap">Description</th>
                        <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[var(--muted)] text-right whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {categories.length === 0 ? (
                        <tr><td colSpan="3" className="px-4 sm:px-6 lg:px-8 py-8 sm:py-10 text-center text-xs font-bold text-[var(--muted)] italic">No segments registered yet.</td></tr>
                      ) : (
                        categories.map(cat => (
                          <tr key={cat.id} className="group hover:bg-[var(--cream)]/5 transition-colors">
                            <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 font-black text-[var(--charcoal)] uppercase tracking-tight text-[9px] sm:text-xs group-hover:text-[var(--rust)] whitespace-nowrap">{cat.name}</td>
                            <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-[8px] sm:text-[10px] font-bold text-[var(--muted)] line-clamp-1 sm:line-clamp-2 italic">{cat.description || "No description provided."}</td>
                            <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                                <button
                                  onClick={() => handleEditClick(cat)}
                                  className={`p-2 sm:p-2.5 rounded-lg transition-all border ${editingCategory?.id === cat.id ? 'bg-red-50 text-[var(--rust)] border-red-100 shadow-sm' : 'text-[var(--muted)] hover:text-[var(--rust)] border-transparent hover:border-red-100 hover:bg-red-50'}`}
                                  title="Edit Category"
                                >
                                  <Edit2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(cat.id)}
                                  className="p-2 sm:p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100"
                                  title="Delete Category"
                                >
                                  <Trash2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
