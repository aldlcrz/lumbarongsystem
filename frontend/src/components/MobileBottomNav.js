"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function MobileBottomNav({ items = [] }) {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-around gap-1 border-t border-[var(--border)] bg-white/90 px-2 py-2 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl h-[calc(78px+var(--safe-bottom,0px))] pb-[calc(0.5rem+var(--safe-bottom,0px))] sm:px-4">
      {items.map((item, idx) => {
        const active = pathname === item.path || (item.path !== '/' && item.path !== '/home' && item.path !== '/seller/dashboard' && item.path !== '/admin/dashboard' && pathname.startsWith(item.path));
        return (
          <Link 
            key={idx} 
            href={item.path} 
            className="group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl py-1"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-300 ${active ? 'bg-[var(--rust)] text-white shadow-lg -translate-y-1' : 'text-[var(--muted)] group-hover:text-[var(--rust)] group-hover:bg-[var(--cream)]'}`}>
              {React.cloneElement(item.icon, { className: "w-5 h-5" })}
            </div>
            <span className={`max-w-full truncate px-1 text-[11px] font-semibold uppercase tracking-[0.14em] transition-opacity duration-300 ${active ? 'opacity-100 text-[var(--rust)]' : 'opacity-70 text-[var(--charcoal)]'}`}>
              {item.label}
            </span>
            
            {active && (
              <motion.div 
                layoutId="nav-indicator"
                className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-[var(--rust)]"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
