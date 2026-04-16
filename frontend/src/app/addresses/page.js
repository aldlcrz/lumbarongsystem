"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AddressesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/profile?tab=address");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#F7F3EE]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--rust)]" />
        <p className="font-serif italic text-lg text-[var(--muted)]">Redirecting to your new profile registry...</p>
      </div>
    </div>
  );
}
