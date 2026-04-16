"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  message = "This action cannot be undone.",
  children,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger" // danger, warning, info
}) {
  if (!isOpen) return null;

  const getTheme = () => {
    switch(type) {
      case 'danger': return { bg: 'bg-red-500', hover: 'hover:bg-red-600', text: 'text-red-500', icon: <X className="w-6 h-6 text-red-500" /> };
      case 'warning': return { bg: 'bg-amber-500', hover: 'hover:bg-amber-600', text: 'text-amber-500', icon: <AlertTriangle className="w-6 h-6 text-amber-500" /> };
      default: return { bg: 'bg-[var(--rust)]', hover: 'hover:bg-[#a63924]', text: 'text-[var(--rust)]', icon: <AlertTriangle className="w-6 h-6 text-[var(--rust)]" /> };
    }
  };

  const theme = getTheme();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#2A1E14]/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl relative z-10 overflow-hidden border border-[var(--border)]"
          >
            <div className="p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto border border-[var(--border)]">
                {theme.icon}
              </div>
              
              <div className="space-y-2">
                <h3 className="font-serif text-2xl font-bold text-[#2A2A2A]">{title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed italic">{message}</p>
                {children}
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button
                  onClick={() => { onConfirm(); onClose(); }}
                  className={`w-full py-4 ${theme.bg} ${theme.hover} text-white rounded-2xl text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95`}
                >
                  {confirmText}
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-4 bg-white border border-[var(--border)] text-[var(--charcoal)] rounded-2xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-50 transition-all active:scale-95"
                >
                  {cancelText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
