"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SellerLayout from "./SellerLayout";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Clock, ShoppingBag, MessageCircle, Package, Receipt } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

export default function SellerCustomerClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();
  
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const fetchCustomerData = async () => {
      try {
        const res = await api.get("/orders/seller");
        const customerOrders = res.data.filter(order => order.customer && String(order.customer.id) === String(id));
        setOrders(customerOrders);

        if (customerOrders.length > 0) {
          const latestOrder = customerOrders.reduce((latest, current) => 
            new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
          );
          setCustomer({
            ...latestOrder.customer,
            address: latestOrder.shippingAddress
          });
        }
      } catch (err) {
        console.error("Failed to fetch customer portfolio.");
      } finally {
        setLoading(false);
      }
    };
    fetchCustomerData();
  }, [id]);

  const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.totalPrice || 0), 0);

  if (loading) return (
    <SellerLayout>
      <div className="py-24 text-center text-[var(--muted)] animate-pulse italic">Retrieving customer portfolio...</div>
    </SellerLayout>
  );

  if (!id) return (
    <SellerLayout>
      <div className="py-24 text-center text-[var(--muted)]">Select a customer from the registry to view a portfolio.</div>
    </SellerLayout>
  );

  if (!customer) return (
    <SellerLayout>
      <div className="space-y-10 mb-20 animate-fade-in">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--rust)] transition-colors group">
          <div className="w-10 h-10 rounded-full bg-white border border-[var(--border)] flex items-center justify-center shadow-sm group-hover:-translate-x-1 transition-transform">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Registry
        </button>
        <div className="artisan-card py-24 text-center space-y-4 shadow-sm">
           <div className="w-16 h-16 bg-[var(--cream)] rounded-full flex items-center justify-center mx-auto mb-6"><Receipt className="w-8 h-8 text-[var(--muted)]" /></div>
           <h3 className="font-serif text-3xl font-bold tracking-tight text-[var(--charcoal)]">No Portfolio Found</h3>
           <p className="text-[var(--muted)] max-w-sm mx-auto">We couldn't locate any orders linked to this customer in your workshop registry.</p>
        </div>
      </div>
    </SellerLayout>
  );

  return (
    <SellerLayout>
      <div className="space-y-10 mb-20 animate-fade-in">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--rust)] transition-colors group">
          <div className="w-10 h-10 rounded-full bg-white border border-[var(--border)] flex items-center justify-center shadow-sm group-hover:-translate-x-1 transition-transform">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Registry
        </button>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-4 space-y-8">
            <div className="artisan-card p-10 space-y-8 shadow-xl relative overflow-hidden bg-gradient-to-br from-white to-[var(--cream)]/30 border-none">
              <div className="absolute top-0 left-0 w-full h-2 bg-[var(--rust)]" />
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-28 h-28 bg-[var(--bark)] rounded-[2rem] flex items-center justify-center text-white font-serif text-5xl font-bold shadow-2xl ring-8 ring-white rotate-3 group-hover:rotate-0 transition-transform">
                  {customer.name[0]}
                </div>
                <div>
                  <h2 className="font-serif text-3xl font-bold text-[var(--charcoal)] tracking-tight">{customer.name}</h2>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] opacity-60 mt-1">Acclaimed Customer</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]">
                 <div className="bg-white p-4 rounded-2xl shadow-sm border border-[var(--border)] text-center">
                    <div className="text-3xl font-serif font-bold text-[var(--rust)]">{orders.length}</div>
                    <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mt-1">Orders</div>
                 </div>
                 <div className="bg-white p-4 rounded-2xl shadow-sm border border-[var(--border)] text-center">
                    <div className="text-2xl font-serif font-bold text-[var(--charcoal)] mt-1">₱{totalSpent.toLocaleString()}</div>
                    <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mt-1">Total Value</div>
                 </div>
              </div>
              <div className="space-y-4 pt-4">
                <div className="text-[9px] font-extrabold text-[var(--muted)] tracking-widest uppercase">Contact Intelligence</div>
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm">
                  <Mail className="w-5 h-5 text-[var(--rust)]" />
                  <span className="text-xs font-bold text-[var(--charcoal)] break-all">{customer.email}</span>
                </div>
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm">
                  <Phone className="w-5 h-5 text-[var(--rust)]" />
                  <span className="text-xs font-bold text-[var(--charcoal)] break-all">{customer.address?.mobile || 'Not provided'}</span>
                </div>
                <div className="flex items-start gap-4 bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm">
                  <MapPin className="w-5 h-5 text-[var(--rust)] shrink-0 mt-0.5" />
                  <span className="text-xs font-medium text-[var(--charcoal)] leading-relaxed">
                    {customer.address ? `${customer.address.street}, ${customer.address.city}` : 'No logistics log found'}
                  </span>
                </div>
              </div>
              <button onClick={() => router.push(`/seller/messages?customerId=${customer.id}&customerName=${encodeURIComponent(customer.name)}`)} className="w-full btn-primary py-5 rounded-2xl flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest">
                <MessageCircle className="w-4 h-4" /> Message Customer
              </button>
            </div>
          </div>

          <div className="xl:col-span-8 space-y-6">
            <div className="flex items-end justify-between px-2">
              <div>
                <h3 className="font-serif text-3xl font-bold text-[var(--charcoal)] tracking-tight">Order <span className="text-[var(--rust)] italic">History</span></h3>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mt-1 ml-1 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> Timeline Sequence
                </div>
              </div>
            </div>
            <div className="space-y-6">
              {orders.map((order, idx) => (
                <motion.div 
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="artisan-card p-8 flex flex-col md:flex-row gap-8 shadow-md border-[var(--border)] hover:border-[var(--rust)]/30 transition-all bg-white"
                >
                  <div className="flex-1 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
                       <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--muted)] flex items-center gap-2">
                         <Calendar className="w-3.5 h-3.5" /> {new Date(order.createdAt).toLocaleDateString()}
                       </div>
                       <div className={`px-4 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest
                         ${order.status === 'Delivered' ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 
                         order.status === 'Cancelled' ? 'bg-red-50 text-red-700 ring-1 ring-red-200' : 
                         'bg-amber-50 text-amber-700 ring-1 ring-amber-200'}`}
                       >
                         {order.status}
                       </div>
                    </div>
                    <div className="space-y-4">
                      {(order.items ? (typeof order.items === 'string' ? JSON.parse(order.items) : order.items) : []).map((item, i) => (
                        <div key={i} className="flex gap-4">
                          <div className="w-16 h-20 bg-[var(--cream)] rounded-xl relative overflow-hidden border border-[var(--border)] shrink-0">
                             <img src={item.image?.[0] || item.image || "/images/placeholder.png"} alt={item.name} className="object-cover w-full h-full" />
                          </div>
                          <div>
                             <div className="font-bold text-[var(--charcoal)] line-clamp-2 leading-snug">{item.name}</div>
                             <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)] mt-1">Size: {item.size} • Qty: {item.quantity}</div>
                             <div className="font-serif text-lg font-bold text-[var(--rust)] mt-1">{item.price}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="w-full md:w-64 shrink-0 bg-[var(--input-bg)] p-6 rounded-2xl flex flex-col justify-between border border-[var(--border)]">
                     <div className="space-y-3">
                       <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                         <span>Mode</span>
                         <span className="text-[var(--charcoal)]">{order.paymentMethod}</span>
                       </div>
                       <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                         <span>Ref No</span>
                         <span className="text-[var(--charcoal)]">{order.paymentReference || 'N/A'}</span>
                       </div>
                     </div>
                     <div className="pt-4 mt-4 border-t border-[var(--border)]">
                       <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-1">Total Valuation</div>
                       <div className="font-serif text-3xl font-bold text-[var(--charcoal)] tracking-tighter">₱{parseFloat(order.totalPrice || 0).toLocaleString()}</div>
                     </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SellerLayout>
  );
}
