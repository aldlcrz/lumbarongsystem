"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import CustomerLayout from "./CustomerLayout";
import AdminLayout from "./AdminLayout";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  MapPin,
  MessageCircle,
  Loader2,
  Clock,
  Package,
  CheckCircle2,
  Instagram,
  Youtube,
  Music,
  Link as LinkIcon,
  Facebook,
} from "lucide-react";
import { api } from "@/lib/api";
import { getProductImageSrc } from "@/lib/productImages";

function SocialCard({ icon, label, href, linkLabel, color }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--cream)]/40 p-4 sm:p-5">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="flex w-full flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <span className="truncate text-gray-500">{label}</span>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="font-medium font-serif hover:underline sm:text-right"
          style={{ color }}
        >
          {linkLabel}
        </a>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--cream)]/40 p-4 sm:p-5">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="flex w-full flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <span className="text-gray-500">{label}</span>
        <span className="font-serif text-base font-medium text-[var(--rust)] sm:text-right sm:text-lg">
          {value}
        </span>
      </div>
    </div>
  );
}

export default function ShopClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    try {
      const customerUser = JSON.parse(localStorage.getItem("customer_user") || "null");
      setUserRole(customerUser?.role || "customer");
    } catch {
      setUserRole("customer");
    }
  }, []);

  const displayedProducts = useMemo(() => {
    let nextProducts = [...products];

    if (activeTab === "sale") {
      nextProducts = nextProducts.filter(() => false);
    } else if (activeTab === "rated") {
      nextProducts = nextProducts.sort(
        (a, b) => (Number(b.rating) || 5) - (Number(a.rating) || 5)
      );
    }

    return nextProducts;
  }, [products, activeTab]);

  const socialCards = useMemo(() => {
    if (!seller) return [];

    let links = seller.socialLinks;
    if (typeof links === "string") {
      try {
        links = JSON.parse(links);
      } catch {
        links = [];
      }
    }
    if (!Array.isArray(links)) links = [];

    const parsedLinks = links
      .filter((link) => link.url && link.url.trim())
      .map((link) => {
        const href = link.url.startsWith("http") ? link.url : `https://${link.url}`;
        const lowerHref = href.toLowerCase();

        if (lowerHref.includes("facebook.com")) {
          return {
            icon: <Facebook className="h-4 w-4 text-[#1877F2]" />,
            label: link.label || "Facebook",
            href,
            linkLabel: "View Profile",
            color: "#1877F2",
          };
        }

        if (lowerHref.includes("instagram.com")) {
          return {
            icon: <Instagram className="h-4 w-4 text-[#E4405F]" />,
            label: link.label || "Instagram",
            href,
            linkLabel: "View Page",
            color: "#E4405F",
          };
        }

        if (lowerHref.includes("tiktok.com")) {
          return {
            icon: <Music className="h-4 w-4 text-[#111111]" />,
            label: link.label || "TikTok",
            href,
            linkLabel: "View Profile",
            color: "#111111",
          };
        }

        if (lowerHref.includes("youtube.com")) {
          return {
            icon: <Youtube className="h-4 w-4 text-[#FF0000]" />,
            label: link.label || "YouTube",
            href,
            linkLabel: "Watch Channel",
            color: "#FF0000",
          };
        }

        return {
          icon: <LinkIcon className="h-4 w-4 text-[var(--rust)]" />,
          label: link.label || "Link",
          href,
          linkLabel: "Open Link",
          color: "var(--rust)",
        };
      });

    if (parsedLinks.length > 0) return parsedLinks;

    const fallbacks = [];
    if (seller.facebookLink) {
      fallbacks.push({
        icon: <Facebook className="h-4 w-4 text-[#1877F2]" />,
        label: "Facebook",
        href: seller.facebookLink.startsWith("http")
          ? seller.facebookLink
          : `https://${seller.facebookLink}`,
        linkLabel: "View Profile",
        color: "#1877F2",
      });
    }

    if (seller.instagramLink) {
      fallbacks.push({
        icon: <Instagram className="h-4 w-4 text-[#E4405F]" />,
        label: "Instagram",
        href: seller.instagramLink.startsWith("http")
          ? seller.instagramLink
          : `https://${seller.instagramLink}`,
        linkLabel: "View Page",
        color: "#E4405F",
      });
    }

    return fallbacks;
  }, [seller]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchShopData = async () => {
      try {
        const [sellerRes, productsRes] = await Promise.all([
          api.get(`/users/seller/${id}`),
          api.get(`/products?seller=${id}`),
        ]);
        setSeller(sellerRes.data);
        setProducts(productsRes.data);
      } catch (error) {
        console.warn("Artisan not found in municipal registry.", error);
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [id]);

  const Layout = userRole === "admin" ? AdminLayout : CustomerLayout;

  if (loading) {
    return (
      <Layout>
        <div className="flex h-[70vh] flex-col items-center justify-center space-y-6">
          <Loader2 className="h-10 w-10 animate-spin text-[var(--rust)] opacity-30" />
          <p className="font-serif italic text-[var(--muted)]">Opening artisan workshop...</p>
        </div>
      </Layout>
    );
  }

  if (!id) {
    return (
      <Layout>
        <div className="flex h-[70vh] items-center justify-center px-4 text-center text-[var(--muted)]">
          Select a shop first to open its collection.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#f5f5f5] pb-24 font-sans sm:pb-28 lg:pb-20">
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="flex flex-col items-start gap-6 sm:gap-8 lg:flex-row lg:items-center lg:gap-10">
              <div className="relative flex w-full flex-col items-center overflow-hidden rounded-[2rem] bg-[var(--charcoal)] p-5 text-white shadow-lg sm:p-6 lg:w-[320px]">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
                <div className="relative mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white/20 bg-white/10 font-serif text-3xl font-bold sm:h-24 sm:w-24 sm:text-4xl">
                  {seller?.profilePhoto ? (
                    <img
                      src={
                        seller.profilePhoto.startsWith("http")
                          ? seller.profilePhoto
                          : `http://localhost:5000/uploads/profile_photos/${seller.profilePhoto.split("/").pop()}`
                      }
                      alt={seller.shopName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    seller?.shopName?.[0] || "L"
                  )}
                </div>
                <h2 className="relative mb-1 text-center text-xl font-bold sm:text-2xl">
                  {seller?.shopName || "Lumban Artisan"}
                </h2>
                <div className="relative mb-6 flex items-center gap-1 text-sm text-white/70">
                  <Clock className="h-4 w-4" /> Active 5 mins ago
                </div>

                {userRole !== "admin" && (
                  <div className="relative flex w-full gap-2">
                    <Link
                      href={`/messages?sellerId=${id}&sellerName=${seller?.shopName}`}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/30 px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] transition-colors hover:bg-white/10"
                    >
                      <MessageCircle className="h-4 w-4" /> Chat
                    </Link>
                  </div>
                )}
              </div>

              <div className="grid flex-1 grid-cols-1 gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
                <MetricCard
                  icon={<Package className="h-4 w-4 text-[var(--rust)]" />}
                  label="Products"
                  value={seller?.productCount ?? products.length}
                />
                <MetricCard
                  icon={<MessageCircle className="h-4 w-4 text-[var(--rust)]" />}
                  label="Response"
                  value={seller?.responseRate || "100%"}
                />
                <MetricCard
                  icon={<Clock className="h-4 w-4 text-[var(--rust)]" />}
                  label="Established"
                  value={seller?.establishedOn || seller?.joined || "Just Joined"}
                />
                <MetricCard
                  icon={<Star className="h-4 w-4 text-[var(--rust)]" />}
                  label="Rating"
                  value={seller?.rating || "5.0"}
                />
                <MetricCard
                  icon={<MapPin className="h-4 w-4 text-[var(--rust)]" />}
                  label="Location"
                  value={seller?.location || "Lumban, Laguna"}
                />
                <MetricCard
                  icon={<CheckCircle2 className="h-4 w-4 text-[var(--rust)]" />}
                  label="Verified"
                  value={seller?.isVerified ? "Registry Gold" : "Municipal Registry"}
                />

                {seller?.indigencyStatus && (
                  <MetricCard
                    icon={<Package className="h-4 w-4 text-[var(--rust)]" />}
                    label="Indigency Status"
                    value={seller.indigencyStatus}
                  />
                )}

                {socialCards.map((card, index) => (
                  <SocialCard
                    key={`${card.label}-${index}`}
                    icon={card.icon}
                    label={card.label}
                    href={card.href}
                    linkLabel={card.linkLabel}
                    color={card.color}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <h3 className="font-serif text-2xl font-bold tracking-tight text-[var(--charcoal)] sm:text-3xl">
              Artisan <span className="text-[var(--rust)] italic">Collection</span>
            </h3>

            <div className="no-scrollbar flex w-full gap-2 overflow-x-auto pb-1 text-sm font-medium sm:w-auto sm:flex-wrap sm:justify-end">
              <button
                onClick={() => setActiveTab("all")}
                className={`shrink-0 rounded-full border px-4 py-2 transition-colors ${
                  activeTab === "all"
                    ? "border-[var(--rust)] bg-[var(--rust)] text-white"
                    : "border-[var(--border)] bg-white text-gray-500 hover:text-[var(--rust)]"
                }`}
              >
                All Products
              </button>
              <button
                onClick={() => setActiveTab("sale")}
                className={`shrink-0 rounded-full border px-4 py-2 transition-colors ${
                  activeTab === "sale"
                    ? "border-[var(--rust)] bg-[var(--rust)] text-white"
                    : "border-[var(--border)] bg-white text-gray-500 hover:text-[var(--rust)]"
                }`}
              >
                On Sale
              </button>
              <button
                onClick={() => setActiveTab("rated")}
                className={`shrink-0 rounded-full border px-4 py-2 transition-colors ${
                  activeTab === "rated"
                    ? "border-[var(--rust)] bg-[var(--rust)] text-white"
                    : "border-[var(--border)] bg-white text-gray-500 hover:text-[var(--rust)]"
                }`}
              >
                Highest Rated
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {displayedProducts.map((product) => (
              <Link
                key={product.id}
                href={`/products?id=${product.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-transparent bg-white shadow-sm transition-all hover:border-[var(--rust)]/10 hover:shadow-md"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-[#fafafa]">
                  <Image
                    src={getProductImageSrc(product.image)}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {product.stock <= 5 && (
                    <div className="absolute bottom-2 left-2 rounded-full bg-red-500/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-sm sm:text-[10px]">
                      Limited Stock
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between p-3 sm:p-4">
                  <div>
                    <h4 className="mb-2 line-clamp-2 text-sm font-medium leading-tight text-[#222] transition-colors group-hover:text-[var(--rust)] sm:text-[15px]">
                      {product.name}
                    </h4>
                    <div className="mb-2 flex items-center gap-1">
                      <div className="flex text-[var(--rust)]">
                        {[...Array(5)].map((_, index) => (
                          <Star
                            key={index}
                            className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${
                              index < Math.floor(product.rating || 5) ? "fill-current" : "opacity-20"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-gray-400">({product.rating || "5.0"})</span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <div className="text-base font-bold text-[var(--rust)] sm:text-lg">
                      {"\u20B1"}
                      {(product.price || 0).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-gray-400">Sold {product.soldCount || 0}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {products.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 px-6 py-16 text-center sm:py-24">
              <p className="font-serif italic text-gray-400">
                This artisan has not released any collection to the registry yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
