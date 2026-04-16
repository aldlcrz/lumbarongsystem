import { Suspense } from "react";
import ShopClient from "@/components/ShopClient";

export const metadata = {
  title: "Artisan Workshop | Local Collection",
  description: "Explore the curated hand-made collections from local master crafters in Lumban, Laguna."
};

export default function ShopBySellerPage() {
  return (
    <Suspense fallback={null}>
      <ShopClient />
    </Suspense>
  );
}
