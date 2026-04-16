"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { api, getApiErrorMessage, clearSession } from "@/lib/api";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const queryRedirect = searchParams.get("redirect");
    if (queryRedirect) {
      setRedirectUrl(queryRedirect);
      localStorage.setItem("returnUrl", queryRedirect);
    }
  }, [searchParams]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please provide a valid secure email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password, });
      const { token, user } = response.data;
      
      // Store ONLY role-specific keys — never overwrite the generic 'token'/'user'
      // to prevent cross-tab session collision (other tabs would see the wrong user).
      const roleKey = user.role || "customer";
      localStorage.setItem(`${roleKey}_token`, token);
      localStorage.setItem(`${roleKey}_user`, JSON.stringify(user));

      const returnUrl = redirectUrl || localStorage.getItem("returnUrl");
      if (returnUrl) {
        localStorage.removeItem("returnUrl");
        window.location.replace(returnUrl);
        return;
      }

      if (user.role === "admin") window.location.replace("/admin/dashboard");
      else if (user.role === "seller") window.location.replace("/seller/dashboard");
      else window.location.replace("/home");
    } catch (error) {
      setError(getApiErrorMessage(error, "Authentication failed. Check your credentials."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden selection:bg-red-200"
      style={{ background: "var(--cream, #F7F3EE)" }}
    >
      {/* Subtle warm blobs */}
      <div className="absolute top-0 right-0 w-[560px] h-[560px] rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none"
        style={{ background: "var(--rust, #C0422A)", opacity: 0.04 }} />
      <div className="absolute bottom-0 left-0 w-[380px] h-[380px] rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl pointer-events-none"
        style={{ background: "var(--sand, #D4B896)", opacity: 0.12 }} />

      {/* Card */}
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
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          {/* Logo Container */}
          <motion.div variants={itemVariants} className="mb-10 text-center relative flex items-center justify-center">
            <button 
              onClick={() => router.back()}
              className="absolute left-0 p-2.5 bg-[#F9F6F2] hover:bg-[#EBDCCB] text-[var(--muted)] hover:text-[var(--rust)] rounded-xl transition-all border border-[#E5DDD5] shadow-sm transform hover:scale-105"
              title="Go Back"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
            <div>
              <Link href="/" className="inline-block mb-1">
                <span className="font-serif text-xl font-black italic tracking-tight"
                  style={{ color: "var(--rust, #C0422A)" }}>
                  LumbaRong
                </span>
              </Link>
              <div className="text-[11px] font-bold uppercase tracking-[0.3em]"
                style={{ color: "var(--muted, #8C7B70)" }}>
                Authentication Portal
              </div>
            </div>
          </motion.div>

          {/* Error */}
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

          <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
            {/* Email */}
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest px-5 block"
                style={{ color: "var(--muted, #8C7B70)" }}>
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 group-focus-within:text-[color:var(--rust)]"
                  style={{ color: "var(--border, #E5DDD5)" }} />
                <input
                  type="email"
                  name="email"
                  autoComplete="off"
                  className="w-full text-sm font-medium outline-none transition-all duration-300 placeholder:text-gray-300"
                  placeholder=""
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    paddingLeft: "3rem", paddingRight: "1.25rem", paddingTop: "0.75rem", paddingBottom: "0.75rem",
                    background: "var(--input-bg, #F9F6F2)",
                    borderRadius: "9999px",
                    border: "1.5px solid transparent",
                    color: "var(--charcoal, #1C1917)",
                    fontSize: "0.8rem",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "var(--rust)"; e.target.style.background = "white"; }}
                  onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.background = "var(--input-bg, #F9F6F2)"; }}
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div variants={itemVariants} className="space-y-2">
              <div className="flex justify-between items-center px-5">
                <label className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--muted, #8C7B70)" }}>
                  Password
                </label>
                <Link href="/forgot-password"
                  className="text-[10px] font-bold uppercase tracking-widest hover:opacity-70 transition-opacity"
                  style={{ color: "var(--rust, #C0422A)" }}>
                  Forgot Password?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300"
                  style={{ color: "var(--border, #E5DDD5)" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="new-password"
                  className="w-full text-sm font-medium outline-none transition-all duration-300 placeholder:text-gray-300"
                  placeholder="••••••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    paddingLeft: "3rem", paddingRight: "3rem", paddingTop: "0.75rem", paddingBottom: "0.75rem",
                    background: "var(--input-bg, #F9F6F2)",
                    borderRadius: "9999px",
                    border: "1.5px solid transparent",
                    color: "var(--charcoal, #1C1917)",
                    fontSize: "0.8rem",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "var(--rust)"; e.target.style.background = "white"; }}
                  onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.background = "var(--input-bg, #F9F6F2)"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 transition-colors duration-300 hover:opacity-70"
                  style={{ color: "var(--muted, #8C7B70)" }}
                  tabIndex="-1"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={showPassword ? "off" : "on"}
                      initial={{ opacity: 0, rotate: -15, scale: 0.8 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: 15, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </motion.span>
                  </AnimatePresence>
                </button>
              </div>
            </motion.div>



            {/* Submit */}
            <motion.div variants={itemVariants}>
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
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--rust, #C0422A)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bark, #3D2B1F)"; }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {loading ? (
                    <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </motion.span>
                  ) : (
                    <motion.span key="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex items-center gap-3">
                      Log-In <ArrowRight className="w-4 h-4" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>
          </form>

          {/* Footer link */}
          <motion.div variants={itemVariants} className="mt-10 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "var(--muted, #8C7B70)" }}>
              Don&apos;t have an account?{" "}
              <Link href="/register"
                className="hover:opacity-70 transition-opacity ml-1"
                style={{ color: "var(--rust, #C0422A)" }}>
                Create Account
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
