import { Suspense } from "react";
import SellerCustomerClient from "@/components/SellerCustomerClient";

export const metadata = {
  title: "Customer Portfolio | Artisan Dashboard",
  description: "Detailed order history and contact intelligence for your workshop customers."
};

export default function SellerCustomerDetailPage() {
  return (
    <Suspense fallback={null}>
      <SellerCustomerClient />
    </Suspense>
  );
}
