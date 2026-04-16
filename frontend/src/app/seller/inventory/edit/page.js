import { Suspense } from "react";
import EditProductClient from "@/components/EditProductClient";

export const metadata = {
  title: "Edit Masterpiece | Artisan Workshop",
  description: "Refine and update your handcrafted Barong and Filipiniana masterpieces in the municipal registry."
};

export default function EditProductPage() {
  return (
    <Suspense fallback={null}>
      <EditProductClient />
    </Suspense>
  );
}
