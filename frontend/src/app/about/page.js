"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, Sparkles, MapPin, Quote } from "lucide-react";
import { motion } from "framer-motion";

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--cream, #F7F3EE)" }}>

      {/* Header */}
      <header className="relative z-50 w-full px-8 lg:px-14 py-8 flex items-center justify-between">
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

      <main className="flex-1">

        {/* Hero Section */}
        <section className="relative h-[55vh] flex items-center justify-center overflow-hidden -mt-24" style={{ background: "var(--charcoal, #1C1917)" }}>
          <div className="absolute inset-0 opacity-40">
            <img
              src="https://www.needlenthread.com/wp-content/uploads/2015/01/pina-cloth-embroidered-01.jpg"
              className="w-full h-full object-cover"
              alt="Artisan Background"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1C1917]/90" />

          <div className="relative z-10 text-center px-6">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-black text-[10px] uppercase tracking-[0.5em] mb-4"
              style={{ color: "var(--rust-light, #E8604A)" }}
            >
              Our Heritage Narrative
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl md:text-6xl font-black tracking-tighter italic uppercase underline decoration-[#C0422A] decoration-4 md:decoration-8 underline-offset-[8px] md:underline-offset-[12px]"
              style={{ color: "var(--warm-white, #FDFAF7)" }}
            >
              The Spirit of Lumban
            </motion.h1>
          </div>
        </section>

        {/* Genesis Section */}
        <section className="py-20 container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="aspect-[4/5] rounded-[4rem] overflow-hidden shadow-2xl relative z-20" style={{ background: "var(--border)" }}>
                <img
                  src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiWiSS2cXm1Qjfo6dB8IhRgF2mmweKwE__qvZFXdeTTp49Cr4AzBMHtPFVFXjl1l3YaBt9ldTXWlmOfd4s3PkAb1zcfshExo20QD6ZIZG_l_FU3sQyz8EuODuAEPSYEb0QRO38R5cAkIKyL/s1600/IMG_3143.JPG"
                  className="w-full h-full object-cover"
                  alt="Artisan at work"
                />
              </div>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 rounded-[3rem] -z-10 shadow-2xl opacity-20"
                style={{ background: "var(--rust, #C0422A)", boxShadow: "0 20px 60px rgba(192,66,42,0.3)" }} />
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <Quote style={{ color: "var(--rust)" }} size={48} strokeWidth={3} className="mb-6" />
              <h2 className="text-3xl md:text-4xl font-black tracking-tight italic uppercase mb-6 leading-tight" style={{ color: "var(--charcoal)" }}>
                Born from a <span style={{ color: "var(--rust)" }}>tapestry</span> <br />
                of ancestral threads.
              </h2>
              <div className="space-y-4 text-base font-medium leading-relaxed italic" style={{ color: "var(--muted)" }}>
                <p>
                  LumBarong was never just an e-commerce platform. It was a promise made in the quiet, sun-drenched workshops of Lumban, Laguna—the barong capital of the Philippines.
                </p>
                <p>
                  Our story began when a group of heritage advocates recognized a disconnect between the master embroiderers who spend months hand-stitching a single piece of piña-silk and the modern world that craved authentic Filipino identity.
                </p>
                <p>
                  We saw master artisans whose skills had been passed down through generations, yet their craft was being overshadowed by mass-produced imitations. We chose to build a digital bridge—a registry of excellence.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Values HUD */}
        <section className="py-20" style={{ background: "var(--charcoal, #1C1917)" }}>
          <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-12">
            <ValueCard
              icon={<Heart style={{ color: "var(--rust)" }} size={40} />}
              title="Empowering Artisans"
              desc="We connect independent shops directly to the registry, ensuring every order fairly values the artisan's time and heritage."
            />
            <ValueCard
              icon={<Sparkles className="text-amber-400" size={40} fill="currentColor" />}
              title="Uncompromising Quality"
              desc="Each Barong and Filipiniana is a masterwork, utilizing traditional hand embroidery techniques that define the Luzon spirit."
            />
            <ValueCard
              icon={<MapPin style={{ color: "var(--rust-light)" }} size={40} />}
              title="Heritage Preservation"
              desc="A portion of every piece sold supports training programs for the next generation of embroiderers in Laguna."
            />
          </div>
        </section>

        {/* Legacy Section */}
        <section className="py-20 container mx-auto px-6 md:px-12 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-8"
              style={{ background: "#FEF0EE", color: "var(--rust)" }}>
              The LumBarong Vision
            </div>
            <h3 className="text-3xl md:text-5xl font-black tracking-tighter italic uppercase mb-10" style={{ color: "var(--charcoal)" }}>
              To clothe the world in <br />
              <span style={{ color: "var(--rust)" }}>Filipino Pride.</span>
            </h3>
            <p className="text-lg font-medium leading-relaxed italic mb-12" style={{ color: "var(--muted)" }}>
              Today, LumBarong stands as more than a marketplace. It is a community of customers and artisans bound by a shared respect for the threads that weave our history together. When you wear a LumBarong piece, you are not just wearing clothing; you are carrying a story of resilience, craftsmanship, and the eternal beauty of the Philippines.
            </p>
          </div>

          {/* Vision Image Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[
              "https://mb.com.ph/uploads/imported_images/mb-mkt-neo-prod-1-uploads-2/media/Skillful_hand_makes_beautiful_embroidery_54e5bab4ab/Skillful_hand_makes_beautiful_embroidery_54e5bab4ab.jpg",
              "https://i0.wp.com/kapampangantraveller.com/wp-content/uploads/2023/10/img_7966.jpg?w=768&ssl=1",
              "https://traveleronfoot.wordpress.com/wp-content/uploads/2015/09/lumban-embroidery-pina-fabric.jpg?w=584",
              "https://www.heritagebarong.com/cdn/shop/files/About_Us_Banner_Image_01.jpg?v=1613550691&width=1800",
            ].map((url, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="aspect-square rounded-3xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-700"
              >
                <img src={url} className="w-full h-full object-cover" alt="Heritage Gallery" />
              </motion.div>
            ))}
          </div>
        </section>

      </main>

      <footer className="py-8 text-center text-[9px] font-bold tracking-[0.2em] uppercase" style={{ background: "var(--charcoal)", color: "rgba(255,255,255,0.3)" }}>
        © {new Date().getFullYear()} Lumbarong Heritage Platform. All rights reserved.
      </footer>
    </div>
  );
}

function ValueCard({ icon, title, desc }) {
  return (
    <div className="group text-center">
      <div className="mb-6 flex justify-center group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-black mb-3 tracking-tight uppercase italic" style={{ color: "var(--warm-white, #FDFAF7)" }}>
        {title}
      </h3>
      <p className="text-sm font-medium leading-relaxed italic" style={{ color: "rgba(212,184,150,0.7)" }}>
        {desc}
      </p>
    </div>
  );
}
