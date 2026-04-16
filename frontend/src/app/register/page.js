"use client";
import React, { useState } from "react";
import Link from "next/link";
import { User, Mail, Lock, Upload, ArrowRight, Loader2, CheckCircle2, ShieldCheck, ShoppingBag, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { api, getApiErrorMessage } from "@/lib/api";
import {
  INPUT_LIMITS,
  sanitizePersonNameInput,
  sanitizePhoneInput,
  validatePersonName,
  validatePhilippineMobileNumber,
} from "@/lib/inputValidation";

const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "customer" });
  const [certificate, setCertificate] = useState(null);
  const [validId, setValidId] = useState(null);
  const [gcashQrCode, setGcashQrCode] = useState(null);
  const [sellerData, setSellerData] = useState({ mobileNumber: "", gcashNumber: "", isAdult: false });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleNext = (e) => {
    e.preventDefault();
    setError("");

    try {
      validatePersonName(formData.name, "Registry name");
    } catch (err) {
      setError(err.message);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      setError("Please provide a valid secure email address.");
      return;
    }

    if (formData.email.length > INPUT_LIMITS.email) {
      setError("Email address is too long.");
      return;
    }

    if (formData.password.length < INPUT_LIMITS.passwordMin) {
      setError("Security key must be at least 6 characters.");
      return;
    }

    if (formData.password.length > INPUT_LIMITS.passwordMax) {
      setError("Security key cannot exceed 32 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (step === 1) setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData();
    data.append("name", formData.name);
    data.append("email", formData.email);
    data.append("password", formData.password);
    data.append("role", formData.role);
    if (formData.role === "seller") {
      if (!certificate || !validId || !gcashQrCode || !sellerData.mobileNumber || !sellerData.gcashNumber || !sellerData.isAdult) {
        setError("All seller verification fields are required.");
        setLoading(false);
        return;
      }

      let cleanMobile = "";
      let cleanGcash = "";
      try {
        cleanMobile = validatePhilippineMobileNumber(sellerData.mobileNumber, "Mobile number");
        cleanGcash = validatePhilippineMobileNumber(sellerData.gcashNumber, "GCash number");
      } catch (err) {
        setError(err.message);
        setLoading(false);
        return;
      }

      data.append("indigencyCertificate", certificate);
      data.append("validId", validId);
      data.append("gcashQrCode", gcashQrCode);
      data.append("mobileNumber", cleanMobile);
      data.append("gcashNumber", cleanGcash);
      data.append("isAdult", sellerData.isAdult);
    }
    try {
      await api.post("/auth/register", data, { headers: { "Content-Type": "multipart/form-data" } });
      setStep(3);
    } catch (error) {
      setError(getApiErrorMessage(error, "Registration failed. Please audit your information."));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    paddingLeft: "3rem", paddingRight: "1.25rem", paddingTop: "0.75rem", paddingBottom: "0.75rem",
    background: "var(--input-bg, #F9F6F2)", borderRadius: "9999px",
    border: "1.5px solid transparent", color: "var(--charcoal, #1C1917)",
    width: "100%", fontSize: "0.8rem", fontWeight: 500, outline: "none", transition: "all 0.3s",
  };

  const handleFocus = (e) => { e.target.style.borderColor = "var(--rust)"; e.target.style.background = "white"; };
  const handleBlur = (e) => { e.target.style.borderColor = "transparent"; e.target.style.background = "var(--input-bg, #F9F6F2)"; };

  const labelStyle = { color: "var(--muted, #8C7B70)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginLeft: "1.25rem", display: "block", marginBottom: "0.5rem" };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden selection:bg-red-200"
      style={{ background: "var(--cream, #F7F3EE)" }}>
      {/* Warm blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none"
        style={{ background: "var(--rust, #C0422A)", opacity: 0.04 }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl pointer-events-none"
        style={{ background: "var(--sand, #D4B896)", opacity: 0.12 }} />

      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-xl relative z-10"
        style={{ background: "white", borderRadius: "2.5rem", border: "1px solid var(--border, #E5DDD5)", padding: "2rem", boxShadow: "0 20px 60px rgba(60,40,20,0.08)" }}
      >

        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          {/* Logo & Header */}
          <motion.div variants={itemVariants} className="mb-10 w-full relative">
            <div className="flex items-center justify-center relative">
              <button
                onClick={() => router.back()}
                className="absolute left-0 p-2.5 bg-[#F9F6F2] hover:bg-[#EBDCCB] text-[var(--muted)] hover:text-[var(--rust)] rounded-xl transition-all border border-[#E5DDD5] shadow-sm transform hover:scale-105"
                title="Go Back"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
              <div className="text-center">
                <Link href="/" className="inline-block mb-1">
                  <span className="font-serif text-xl font-black italic tracking-tight" style={{ color: "var(--rust, #C0422A)" }}>
                    LumbaRong
                  </span>
                </Link>
                <div className="text-[9px] font-bold uppercase tracking-[0.3em]" style={{ color: "var(--muted, #8C7B70)" }}>
                  LumbaRong Registration
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mt-8 mb-6 max-w-[280px] mx-auto px-4">
              <div className="flex items-center w-full">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500 shrink-0"
                  style={{ background: step >= 1 ? "var(--rust, #C0422A)" : "var(--input-bg, #F9F6F2)", color: step >= 1 ? "white" : "var(--muted)", boxShadow: step >= 1 ? "0 4px 12px rgba(192,66,42,0.25)" : "none" }}>
                  1
                </div>
                <div className="flex-1 h-px transition-all duration-700 mx-4"
                  style={{ background: step > 1 ? "var(--rust, #C0422A)" : "var(--border, #E5DDD5)" }} />
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500 shrink-0"
                  style={{ background: step >= 2 ? "var(--rust, #C0422A)" : "var(--input-bg, #F9F6F2)", color: step >= 2 ? "white" : "var(--muted)", boxShadow: step >= 2 ? "0 4px 12px rgba(192,66,42,0.25)" : "none" }}>
                  2
                </div>
              </div>
            </div>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.3 }}
                className="mb-8 p-4 rounded-2xl text-[10px] font-bold flex items-center justify-center gap-2 uppercase tracking-wider"
                style={{ background: "#FEF0EE", border: "1px solid #F9D0C8", color: "var(--rust)" }}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {/* Step 1 */}
            {step === 1 && (
              <motion.form key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} onSubmit={handleNext} className="space-y-6" autoComplete="off">
                <motion.div variants={itemVariants} className="space-y-2">
                  <label style={labelStyle}>Registry Name</label>
                  <div className="relative">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--border)" }} />
                    <input type="text" style={inputStyle} placeholder="" required value={formData.name} name="register_name" autoComplete="off"
                      maxLength={INPUT_LIMITS.personName}
                      onChange={(e) => setFormData({ ...formData, name: sanitizePersonNameInput(e.target.value) })}
                      onFocus={handleFocus} onBlur={handleBlur} />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <label style={labelStyle}>Secure Email</label>
                  <div className="relative">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--border)" }} />
                    <input type="email" style={inputStyle} placeholder="" required value={formData.email} name="register_email" autoComplete="off"
                      maxLength={100}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      onFocus={handleFocus} onBlur={handleBlur} />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <label style={labelStyle}>Platform Password</label>
                  <div className="relative">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--border)" }} />
                    <input type={showPassword ? "text" : "password"} style={{ ...inputStyle, paddingRight: "3.5rem" }} placeholder="••••••••••••" required value={formData.password} name="register_password" autoComplete="new-password"
                      maxLength={32}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      onFocus={handleFocus} onBlur={handleBlur} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 transition-colors duration-300 hover:opacity-70"
                      style={{ color: "var(--muted)" }}>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span key={showPassword ? "off" : "on"} initial={{ opacity: 0, rotate: -15, scale: 0.8 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 15, scale: 0.8 }} transition={{ duration: 0.2 }}>
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </motion.span>
                      </AnimatePresence>
                    </button>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <label style={labelStyle}>Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--border)" }} />
                    <input type={showPassword ? "text" : "password"} style={{ ...inputStyle, paddingRight: "3.5rem" }} placeholder="••••••••••••" required value={formData.confirmPassword} name="register_confirm_password" autoComplete="new-password"
                      maxLength={32}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      onFocus={handleFocus} onBlur={handleBlur} />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="w-full text-white text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 mt-4"
                    style={{ padding: "0.875rem", borderRadius: "9999px", background: "var(--bark, #3D2B1F)", boxShadow: "0 6px 20px rgba(60,43,31,0.18)", transition: "background 0.3s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--rust, #C0422A)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bark, #3D2B1F)"; }}>
                    Continue <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              </motion.form>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <motion.form key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} onSubmit={handleSubmit} className="space-y-8" autoComplete="off">
                <div className="space-y-4">
                  <label style={labelStyle}>Platform Intent (Role Selection)</label>
                  <div className="grid grid-cols-2 gap-4">
                    {["customer", "seller"].map((role) => (
                      <button key={role} type="button" onClick={() => setFormData({ ...formData, role })}
                        className="p-6 rounded-[2rem] flex flex-col items-center gap-3 relative overflow-hidden transition-all duration-300"
                        style={{
                          border: `1.5px solid ${formData.role === role ? "var(--rust, #C0422A)" : "var(--border, #E5DDD5)"}`,
                          background: formData.role === role ? "white" : "var(--input-bg, #F9F6F2)",
                          boxShadow: formData.role === role ? "0 12px 30px rgba(192,66,42,0.12)" : "none",
                          transform: formData.role === role ? "scale(1.05)" : "scale(1)",
                        }}>
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-md"
                          style={{ background: formData.role === role ? "var(--rust, #C0422A)" : "white", color: formData.role === role ? "white" : "var(--muted)", transform: formData.role === role ? "rotate(6deg)" : "none" }}>
                          {role === "customer" ? <User className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                        </div>
                        <span className="font-bold text-[9px] uppercase tracking-[0.2em]" style={{ color: "var(--charcoal)" }}>
                          {role === "customer" ? "User" : "Seller"}
                        </span>
                        {formData.role === role && <div className="absolute top-2 right-2"><CheckCircle2 className="w-3 h-3" style={{ color: "var(--rust)" }} /></div>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seller fields */}
                <div className={`space-y-6 transition-all duration-500 overflow-hidden ${formData.role === "seller" ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0 m-0 p-0"}`}>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Mobile", placeholder: "09xx-xxx-xxxx", key: "mobileNumber" },
                      { label: "GCash", placeholder: "09xx-xxx-xxxx", key: "gcashNumber" },
                    ].map((field) => (
                      <div key={field.key} className="space-y-2">
                        <label style={labelStyle}>{field.label}</label>
                        <input type="text"
                          style={{ ...inputStyle, paddingLeft: "1.5rem" }}
                          placeholder={field.placeholder}
                          value={sellerData[field.key]}
                          autoComplete="off"
                          maxLength={INPUT_LIMITS.mobileNumber}
                          onChange={(e) => setSellerData({ ...sellerData, [field.key]: sanitizePhoneInput(e.target.value) })}
                          onFocus={handleFocus} onBlur={handleBlur} />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <label style={labelStyle}>Requirements</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "cert", label: "Indigency", file: certificate, set: setCertificate },
                        { id: "id", label: "Valid ID", file: validId, set: setValidId },
                        { id: "qr", label: "GCash QR", file: gcashQrCode, set: setGcashQrCode },
                      ].map((item) => (
                        <div key={item.id}
                          className="rounded-2xl p-4 text-center cursor-pointer flex flex-col items-center justify-center min-h-[90px] transition-all duration-300"
                          style={{ border: `1.5px dashed ${item.file ? "var(--rust)" : "var(--border)"}`, background: item.file ? "#FEF0EE" : "var(--input-bg)" }}
                          onClick={() => document.getElementById(`${item.id}-upload`).click()}>
                          <Upload className="w-4 h-4 mb-2" style={{ color: item.file ? "var(--rust)" : "var(--muted)" }} />
                          <div className="text-[7px] font-bold uppercase leading-tight line-clamp-2" style={{ color: "var(--muted)" }}>
                            {item.file ? item.file.name : item.label}
                          </div>
                          <input id={`${item.id}-upload`} type="file" className="hidden" onChange={(e) => item.set(e.target.files[0])} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-5 py-3 rounded-2xl"
                    style={{ background: "var(--input-bg)", border: "1px solid var(--border)" }}>
                    <input type="checkbox" id="is-adult"
                      className="w-4 h-4 cursor-pointer"
                      style={{ accentColor: "var(--rust, #C0422A)" }}
                      checked={sellerData.isAdult}
                      onChange={(e) => setSellerData({ ...sellerData, isAdult: e.target.checked })} />
                    <label htmlFor="is-adult" className="text-[9px] font-bold uppercase tracking-widest cursor-pointer"
                      style={{ color: "var(--muted)" }}>
                      I am at least 18 years of age
                    </label>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex-1 font-bold uppercase text-[9px] tracking-widest transition-all"
                    style={{ padding: "0.875rem", borderRadius: "9999px", border: "1.5px solid var(--border)", color: "var(--muted)", background: "transparent" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--input-bg)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                    Back
                  </button>
                  <motion.button type="submit" disabled={loading} whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="flex-[2] text-white text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ padding: "0.875rem", borderRadius: "9999px", background: "var(--rust, #C0422A)", boxShadow: "0 6px 20px rgba(192,66,42,0.2)", transition: "background 0.3s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--rust-light, #E8604A)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--rust, #C0422A)"; }}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign Up"}
                  </motion.button>
                </div>
              </motion.form>
            )}

            {/* Step 3 — Success */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="text-center py-8">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl"
                  style={{ background: "var(--input-bg)", color: "var(--sage, #8FA882)", transform: "rotate(6deg)" }}>
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="font-serif text-2xl font-black mb-4" style={{ color: "var(--charcoal)" }}>Certified!</h2>
                <p className="max-w-xs mx-auto mb-10 text-[11px] font-medium leading-relaxed italic" style={{ color: "var(--muted)" }}>
                  Your heritage application has been logged.{" "}
                  {formData.role === "seller"
                    ? "Our curators will review your credentials within 24 hours."
                    : "You may now explore our curated collection."}
                </p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                  <Link href="/login"
                    className="inline-flex items-center gap-3 text-white px-10 text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg"
                    style={{ padding: "1rem 2.5rem", borderRadius: "9999px", background: "var(--bark, #3D2B1F)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--rust, #C0422A)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bark, #3D2B1F)"; }}>
                    Begin Journey <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          {step < 3 && (
            <motion.div variants={itemVariants} className="mt-10 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted, #8C7B70)" }}>
                Already Registered?{" "}
                <Link href="/login" className="hover:opacity-70 transition-opacity ml-1" style={{ color: "var(--rust, #C0422A)" }}>
                  Sign-In
                </Link>
              </p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
