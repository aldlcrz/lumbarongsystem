import { Suspense } from "react";
import ResetPasswordClient from "@/components/ResetPasswordClient";

export const metadata = {
  title: "Reset Password | LumbaRong",
  description: "Set a new password for your LumbaRong account.",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordClient />
    </Suspense>
  );
}
