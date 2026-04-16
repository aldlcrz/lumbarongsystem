"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[var(--cream)] flex flex-col">
      {/* Header */}
      <header className="relative z-50 w-full px-8 lg:px-14 py-8 flex items-center justify-between" style={{ background: "var(--charcoal, #1C1917)" }}>
        <Link href="/">
          <span className="font-serif text-2xl font-black italic tracking-tight text-[#D4B896]">
            LumbaRong
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-10">
          {[
            { href: "/", label: "HOME" },
            { href: "/heritage-guide", label: "GUIDE" },
            { href: "/about", label: "ABOUT US" },
            { href: "/privacy-policy", label: "PRIVACY POLICY" },
            { href: "/terms", label: "TERMS OF USE" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[10px] font-bold tracking-[0.2em] text-[#D4B896]/80 hover:text-[#D4B896] transition-colors duration-300"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-8">
          <Link
            href="/login"
            className="text-[11px] font-bold tracking-[0.12em] text-[#D4B896]/80 hover:text-[#D4B896] transition-colors duration-300"
          >
            SIGN IN
          </Link>
          <Link
            href="/register"
            className="bg-[#C0422A] text-white px-7 py-3 rounded-full text-[10px] font-bold tracking-[0.15em] hover:bg-[#E8604A] hover:scale-105 transition-all duration-300 shadow-lg shadow-[#C0422A]/30"
          >
            CREATE ACCOUNT
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-20 max-w-4xl animate-fade-in">

        <h1 className="font-serif text-5xl font-bold text-[var(--charcoal)] mb-8 tracking-tighter">Terms of <span className="text-[var(--rust)] italic">Use</span></h1>
        
        <div className="prose prose-lg text-[var(--muted)] space-y-6 bg-white p-12 rounded-[2rem] shadow-xl artisan-card">
          <h2 className="font-serif text-2xl font-bold text-[var(--charcoal)]">Agreement to Terms</h2>
          <p className="font-sans leading-relaxed">
            By accessing the Lumbarong marketplace, you agree to be bound by these Terms of Use. If you do not agree, do not use the platform.
          </p>

          <h2 className="font-serif text-2xl font-bold text-[var(--charcoal)] pt-6">Customer Responsibilities</h2>
          <p className="font-sans leading-relaxed">
            Customers agree to provide accurate payment information, upload valid and authentic proof of transactions, and communicate respectfully with artisans through the in-app chat.
          </p>

          <h2 className="font-serif text-2xl font-bold text-[var(--charcoal)] pt-6">Artisan Obligations</h2>
          <p className="font-sans leading-relaxed">
            Registered artisans must ensure that all listings represent genuine Lumban craftsmanship. Artisans are responsible for maintaining accurate inventory status and fulfilling orders within a reasonable timeframe. Any misrepresentation of materials or authenticity will result in suspension.
          </p>

          <h2 className="font-serif text-2xl font-bold text-[var(--charcoal)] pt-6">Disputes and Resolution</h2>
          <p className="font-sans leading-relaxed">
            All transaction disputes must be raised within 7 days of order receipt. Lumbarong administrators reserve the right to adjudicate disputes based on chat history, provided payment proofs, and delivery confirmation from the courier.
          </p>
        </div>
      </main>

      <footer className="bg-[var(--charcoal)] text-white/60 py-8 text-center text-sm mt-auto">
        <p>&copy; {new Date().getFullYear()} Lumbarong Heritage Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
