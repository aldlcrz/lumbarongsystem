"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/context/SocketContext';
import { Bell, X, Info, AlertTriangle } from 'lucide-react';

export default function BroadcastNotification() {
  const { currentBroadcast, clearBroadcast } = useSocket();

  useEffect(() => {
    if (currentBroadcast) {
      // Auto-dismiss after 10 seconds
      const timer = setTimeout(() => {
        clearBroadcast();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [currentBroadcast, clearBroadcast]);

  return (
    <AnimatePresence>
      {currentBroadcast && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="fixed top-6 left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none"
        >
          <div className="pointer-events-auto bg-white border border-[var(--border)] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-stretch overflow-hidden max-w-xl w-full min-h-[80px]">
            {/* Accent Side Bar */}
            <div className="w-2 bg-[var(--rust)] shrink-0" />
            
            <div className="flex-1 p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[rgba(192,66,42,0.1)] flex items-center justify-center text-[var(--rust)] shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-[var(--rust)] uppercase tracking-widest">
                    {currentBroadcast.title}
                  </span>
                  <span className="w-1 h-1 bg-[var(--border)] rounded-full" />
                  <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">
                    Real-time
                  </span>
                </div>
                <p className="text-sm font-semibold text-[var(--charcoal)] leading-relaxed">
                  {currentBroadcast.message}
                </p>
              </div>
              
              <button 
                onClick={clearBroadcast}
                className="absolute top-4 right-4 p-2 text-[var(--muted)] hover:text-[var(--rust)] hover:bg-[var(--warm-white)] rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
