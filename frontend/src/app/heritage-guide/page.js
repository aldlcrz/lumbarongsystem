"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sun, Flower2, Scissors, Waves, Wind, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function HeritageGuidePage() {
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

      <main className="flex-1 pb-0">

        {/* Hero */}
        <section className="py-32 text-center relative overflow-hidden -mt-24" style={{ background: "var(--charcoal, #1C1917)" }}>
          <div className="absolute inset-0 opacity-20">
            <img
              src="https://thumbs.dreamstime.com/b/barongs-12687297.jpg?w=992"
              className="w-full h-full object-cover"
              alt="Textile background"
            />
          </div>
          <div className="relative z-10 container mx-auto px-6">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="font-black text-[10px] uppercase tracking-[0.5em] mb-6"
              style={{ color: "var(--rust-light, #E8604A)" }}
            >
              The Artisan Manual
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter"
              style={{ color: "var(--warm-white, #FDFAF7)" }}
            >
              The Anatomy of <br />
              <span style={{ color: "var(--rust, #C0422A)" }}>Pure Craftsmanship</span>
            </motion.h1>
          </div>
        </section>

        {/* Steps */}
        <section className="container mx-auto px-6 max-w-6xl mt-20 mb-20">
          <div className="grid grid-cols-1 gap-24">

            <StepSection
              number="01"
              title="Harvesting the Soul"
              subtitle="Fiber Extraction"
              description="Every masterpiece begins in the fields. Our artisans use Piña (pineapple fiber) or Jusi (silk-based fabric). The pineapple leaves are hand-scraped to extract the fine 'Liniwan' fibers—the highest grade of silk-like thread known for its translucent luster."
              icon={<Sun size={40} className="text-amber-500" />}
              image="https://thumbs.dreamstime.com/b/barongs-12687297.jpg?w=992"
            />

            <StepSection
              number="02"
              title="The Calado Blueprint"
              subtitle="Hand Embroidery"
              description="This is where the magic happens. Using the 'Calado' technique, artisans painstakingly pull out threads from the fabric to create intricate lattices, then embroider back into the empty spaces. A single chest piece can take 2 to 4 weeks of continuous hand-stitching."
              icon={<Flower2 size={40} style={{ color: "var(--rust)" }} />}
              image="https://thumbs.dreamstime.com/b/barong-tagalog-pink-corsage-wedding-7620577.jpg?w=768"
              reversed
            />

            <StepSection
              number="03"
              title="The Master's Cut"
              subtitle="Tailoring & Assembly"
              description="Unlike mass-produced garments, a heritage Barong is cut following the unique flow of the embroidery. Our master tailors ensure that the patterns align perfectly across the seams, preserving the visual integrity of the artisan's vision."
              icon={<Scissors size={40} style={{ color: "var(--charcoal)" }} />}
              image="https://thumbs.dreamstime.com/b/formal-shirt-national-dress-barong-tagalog-philippines-96813235.jpg?w=992"
            />

          </div>
        </section>

        {/* Care section */}
        <section className="bg-white border-y py-20" style={{ borderColor: "var(--border)" }}>
          <div className="container mx-auto px-6 text-center mb-16">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-3" style={{ color: "var(--rust)" }}>
              Maintenance
            </p>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4" style={{ color: "var(--charcoal)" }}>
              Preserving the Legacy
            </h2>
            <p className="font-medium italic" style={{ color: "var(--muted)" }}>
              How to care for your ordered masterpiece.
            </p>
          </div>
          <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
            <CareCard
              icon={<Waves size={32} className="text-blue-500" />}
              title="Cold Rinse Only"
              desc="Hand wash with mild soap in cold water. Never machine wash or dry clean heritage fibers."
            />
            <CareCard
              icon={<Wind size={32} className="text-cyan-500" />}
              title="Air Dry"
              desc="Lay flat on a clean towel in a shaded area. Direct sunlight can weaken the delicate fibers."
            />
            <CareCard
              icon={<ShieldCheck size={32} className="text-green-600" />}
              title="Store Hanging"
              desc="Use padded hangers to maintain shoulder structure. Store in a breathable cotton garment bag."
            />
          </div>
        </section>

      </main>

      <footer className="py-8 text-center text-[9px] font-bold tracking-[0.2em] uppercase" style={{ background: "var(--charcoal)", color: "rgba(255,255,255,0.3)" }}>
        © {new Date().getFullYear()} Lumbarong Heritage Platform. All rights reserved.
      </footer>

    </div>
  );
}

function StepSection({ number, title, subtitle, description, icon, image, reversed }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col ${reversed ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-16 lg:gap-20`}
    >
      {/* Text side */}
      <div className="lg:w-1/2 w-full">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-6xl font-black leading-none select-none" style={{ color: "var(--border, #E5DDD5)" }}>
            {number}
          </span>
          <div className="h-px w-20" style={{ background: "var(--border)" }} />
        </div>
        <p className="font-black text-[10px] uppercase tracking-widest mb-2" style={{ color: "var(--rust)" }}>
          {subtitle}
        </p>
        <h3 className="text-4xl font-black uppercase italic tracking-tighter mb-8 leading-tight" style={{ color: "var(--charcoal)" }}>
          {title}
        </h3>
        <div className="flex gap-6 items-start">
          <div className="shrink-0 mt-1">{icon}</div>
          <p className="text-lg font-medium leading-relaxed italic" style={{ color: "var(--muted)" }}>
            {description}
          </p>
        </div>
      </div>

      {/* Image side */}
      <div className="lg:w-1/2 w-full">
        <div className="aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl grayscale hover:grayscale-0 transition-all duration-1000">
          <img src={image} className="w-full h-full object-cover" alt={title} />
        </div>
      </div>
    </motion.div>
  );
}

function CareCard({ icon, title, desc }) {
  return (
    <div
      className="p-10 rounded-[2.5rem] border text-center transition-all duration-300 group hover:border-[#C0422A] hover:shadow-lg"
      style={{ background: "var(--input-bg, #F9F6F2)", borderColor: "var(--border)" }}
    >
      <div className="mb-6 flex justify-center group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h4 className="text-lg font-black uppercase italic tracking-tight mb-4" style={{ color: "var(--charcoal)" }}>
        {title}
      </h4>
      <p className="text-sm font-medium leading-relaxed italic" style={{ color: "var(--muted)" }}>
        {desc}
      </p>
    </div>
  );
}
