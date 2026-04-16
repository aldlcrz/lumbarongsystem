import { Suspense } from "react";
import ProductDetailClient from "@/components/ProductDetailClient";

export const metadata = {
  title: "Product Details | Lumban Master Craft",
  description: "View hand-embroidered Filipino traditional Barong and Tagalog masterpieces."
};

export default function ProductDetailPage() {
  return (
    <Suspense fallback={null}>
      <ProductDetailClient />
    </Suspense>
  );
}
