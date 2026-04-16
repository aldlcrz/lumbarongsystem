"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, Mail, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { api, getApiErrorMessage } from "@/lib/api";

const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function ForgotPasswordClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      setError("Please provide a valid secure email address.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: normalizedEmail });
      setSubmitted(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to start password reset right now."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden selection:bg-red-200"
      style={{ background: "var(--cream, #F7F3EE)" }}
    >
      <div
        className="absolute top-0 right-0 w-[560px] h-[560px] rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none"
        style={{ background: "var(--rust, #C0422A)", opacity: 0.04 }}
      />
      <div
        className="absolute bottom-0 left-0 w-[380px] h-[380px] rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl pointer-events-none"
        style={{ background: "var(--sand, #D4B896)", opacity: 0.12 }}
      />

      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md relative z-10"
        style={{
          background: "white",
          borderRadius: "2.5rem",
          border: "1px solid var(--border, #E5DDD5)",
          padding: "2rem",
          boxShadow: "0 20px 60px rgba(60,40,20,0.08)",
        }}
      >
        <div className="mb-10 text-center relative flex items-center justify-center">
          <button
            onClick={() => router.back()}
            className="absolute left-0 p-2.5 bg-[#F9F6F2] hover:bg-[#EBDCCB] text-[var(--muted)] hover:text-[var(--rust)] rounded-xl transition-all border border-[#E5DDD5] shadow-sm transform hover:scale-105"
            title="Go Back"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
          <div>
            <Link href="/" className="inline-block mb-1">
              <span
                className="font-serif text-xl font-black italic tracking-tight"
                style={{ color: "var(--rust, #C0422A)" }}
              >
                LumbaRong
              </span>
            </Link>
            <div
              className="text-[9px] font-bold uppercase tracking-[0.3em]"
              style={{ color: "var(--muted, #8C7B70)" }}
            >
              Password Recovery
            </div>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.3 }}
              className="mb-8 p-4 rounded-2xl text-[10px] font-bold text-center flex items-center justify-center gap-2 uppercase tracking-wider"
              style={{ background: "#FEF0EE", border: "1px solid #F9D0C8", color: "var(--rust)" }}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {submitted ? (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#eef8f2] text-[#1c7c54] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-3">
              <h1 className="font-serif text-xl font-bold text-[var(--charcoal)]">Check your email</h1>
              <p className="text-sm leading-6 text-[var(--muted)]">
                If an account exists for <span className="font-semibold text-[var(--charcoal)]">{email}</span>, a reset link has been sent.
              </p>
              <p className="text-xs leading-5 text-[var(--muted)]">
                In local development, if email delivery is not configured, check the backend terminal for the reset link.
              </p>
            </div>
            <div className="space-y-3">
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center gap-3 text-white text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{
                  padding: "0.875rem",
                  borderRadius: "9999px",
                  background: "var(--bark, #3D2B1F)",
                  boxShadow: "0 6px 20px rgba(60,43,31,0.18)",
                }}
              >
                Back To Login <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setEmail("");
                }}
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--rust)] hover:opacity-70 transition-opacity"
              >
                Try Another Email
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
            <div className="space-y-3 text-center">
              <h1 className="font-serif text-xl font-bold text-[var(--charcoal)]">Forgot your password?</h1>
              <p className="text-sm leading-6 text-[var(--muted)]">
                Enter your account email and we will send you a reset link.
              </p>
            </div>

            <div className="space-y-2">
              <label
                className="text-[10px] font-bold uppercase tracking-widest ml-5 block"
                style={{ color: "var(--muted, #8C7B70)" }}
              >
                Email Address
              </label>
              <div className="relative group">
                <Mail
                  className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 group-focus-within:text-[color:var(--rust)]"
                  style={{ color: "var(--border, #E5DDD5)" }}
                />
                <input
                  type="email"
                  name="forgot_password_email"
                  autoComplete="off"
                  className="w-full text-sm font-medium outline-none transition-all duration-300 placeholder:text-gray-300"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  style={{
                    paddingLeft: "3rem",
                    paddingRight: "1.25rem",
                    paddingTop: "0.75rem",
                    paddingBottom: "0.75rem",
                    background: "var(--input-bg, #F9F6F2)",
                    borderRadius: "9999px",
                    border: "1.5px solid transparent",
                    color: "var(--charcoal, #1C1917)",
                    fontSize: "0.8rem",
                  }}
                  onFocus={(event) => {
                    event.target.style.borderColor = "var(--rust)";
                    event.target.style.background = "white";
                  }}
                  onBlur={(event) => {
                    event.target.style.borderColor = "transparent";
                    event.target.style.background = "var(--input-bg, #F9F6F2)";
                  }}
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-full text-white text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 mt-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                padding: "0.875rem",
                borderRadius: "9999px",
                background: "var(--bark, #3D2B1F)",
                boxShadow: "0 6px 20px rgba(60,43,31,0.18)",
              }}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send Reset Link <ArrowRight className="w-4 h-4" /></>}
            </motion.button>

            <div className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Remembered it?{" "}
              <Link href="/login" className="text-[var(--rust)] hover:opacity-70 transition-opacity">
                Back To Login
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
