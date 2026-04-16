"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
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

        <h1 className="font-serif text-5xl font-bold text-[var(--charcoal)] mb-8 tracking-tighter">Privacy <span className="text-[var(--rust)] italic">Policy</span></h1>
        
        <div className="prose prose-lg text-[var(--muted)] space-y-6 bg-white p-12 rounded-[2rem] shadow-xl artisan-card">
          <h2 className="font-serif text-2xl font-bold text-[var(--charcoal)]">Information We Collect</h2>
          <p className="font-sans leading-relaxed">
            When you register as a customer or artisan, we collect identifying information such as your name, contact details, shipping address, and necessary verification documents (e.g., Certificates of Indigency for artisans).
          </p>

          <h2 className="font-serif text-2xl font-bold text-[var(--charcoal)] pt-6">How We Use Your Data</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To process and fulfill your heritage orders securely.</li>
            <li>To facilitate real-time chat communication between customers and artisans.</li>
            <li>To verify artisan credentials and maintain the integrity of our marketplace.</li>
            <li>To improve the Lumbarong platform and your browsing experience.</li>
          </ul>

          <h2 className="font-serif text-2xl font-bold text-[var(--charcoal)] pt-6">Your Data Security</h2>
          <p className="font-sans leading-relaxed">
            All user data and transactions are encrypted in transit. Your passwords are securely hashed, and direct payment data (such as GCash references and screenshots) are preserved purely for order fulfillment and dispute resolution. We do not sell your personal information to third-party ad networks.
          </p>
        </div>
      </main>

      <footer className="bg-[var(--charcoal)] text-white/60 py-8 text-center text-sm mt-auto">
        <p>&copy; {new Date().getFullYear()} Lumbarong Heritage Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
