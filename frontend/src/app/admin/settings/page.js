"use client";
import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  ShieldCheck, Save,
  Loader2, AlertCircle, CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api, getApiErrorMessage } from "@/lib/api";

export default function AdminSettings() {
  const [verificationRequired, setVerificationRequired] = useState(true);
  const [automatedSupport, setAutomatedSupport]     = useState(false);
  const [publicLedger, setPublicLedger]             = useState(true);

  const [isSaving, setIsSaving]   = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState(null);
  const [success, setSuccess]     = useState(null);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const fetchSettings = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get("/admin/settings");
      const s = res.data;
      if (s.verificationRequired !== undefined) setVerificationRequired(s.verificationRequired === true || s.verificationRequired === "true");
      if (s.automatedSupport !== undefined)    setAutomatedSupport(s.automatedSupport === true || s.automatedSupport === "true");
      if (s.publicLedger !== undefined)        setPublicLedger(s.publicLedger === true || s.publicLedger === "true");
    } catch (err) {
      console.error("Failed to fetch settings", err);
      setError(getApiErrorMessage(err, "Failed to load platform parameters."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSaveSettings = async () => {
    setError(null);
    try {
      setIsSaving(true);
      await api.put("/admin/settings", {
        verificationRequired,
        automatedSupport,
        publicLedger,
      });
      showSuccess("Platform parameters synchronized successfully!");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to sync governance."));
    } finally {
      setIsSaving(false);
    }
  };




  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-10 mb-20 animate-fade-in">
        {/* Header */}
        <div>
          <div className="eyebrow">Main App Settings</div>
          <h1 className="font-serif text-4xl font-bold tracking-tight text-[var(--charcoal)] uppercase">
            App <span className="text-[var(--rust)] italic lowercase">Settings</span>
          </h1>
        </div>

        {/* Global Toasts */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700 text-sm font-bold"
            >
              <CheckCircle className="w-4 h-4 shrink-0" /> {success}
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-bold"
            >
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* App Rules */}
        <div className="artisan-card p-10 space-y-8 bg-white/50 backdrop-blur-md shadow-2xl">
          <h3 className="text-xl font-bold flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-[var(--rust)]" /> App Rules
          </h3>
          <div className="divide-y divide-[var(--border)]">
            <PolicySwitch
              label="Check Seller ID"
              desc="Require identity documents when a new seller signs up."
              active={verificationRequired}
              toggle={() => setVerificationRequired(v => !v)}
            />
            <PolicySwitch
              label="Auto Help"
              desc="Use AI to answer common customer questions automatically."
              active={automatedSupport}
              toggle={() => setAutomatedSupport(v => !v)}
            />
            <PolicySwitch
              label="Show Stats on Start Page"
              desc="Display total sales figure on the public landing page."
              active={publicLedger}
              toggle={() => setPublicLedger(v => !v)}
            />
          </div>
          <div className="pt-4">
            <button
              onClick={handleSaveSettings}
              disabled={isSaving || isLoading}
              className="btn-primary px-8 py-3 flex items-center gap-2 text-sm disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? "Saving…" : "Save Rules"}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function PolicySwitch({ label, desc, active, toggle }) {
  return (
    <div className="py-6 flex items-center justify-between group">
      <div className="space-y-1">
        <div className="text-sm font-bold text-[var(--charcoal)] group-hover:text-[var(--rust)] transition-colors">{label}</div>
        <div className="text-[10px] text-[var(--muted)] font-bold tracking-tight max-w-[280px]">{desc}</div>
      </div>
      <button
        onClick={toggle}
        className={`w-14 h-8 rounded-full relative transition-all duration-500 shadow-inner ${active ? "bg-[var(--rust)] ring-4 ring-red-50" : "bg-[var(--border)]"}`}
      >
        <motion.div animate={{ x: active ? 28 : 4 }} className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg" />
      </button>
    </div>
  );
}
