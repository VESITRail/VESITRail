"use client";

import { useEffect } from "react";
import Status from "@/components/ui/status";
import { isValidErrorCode } from "@/lib/utils";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { authErrorMessages } from "@/types/error";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const GENERIC_ERROR = "An authentication error occurred. Please try again.";

const formatErrorMessage = (errorCode: string | null): string => {
  if (!errorCode) return "";

  const sanitized = errorCode.replace(/[^a-zA-Z0-9_]/g, "");

  if (isValidErrorCode(sanitized)) {
    return authErrorMessages[sanitized];
  }

  return GENERIC_ERROR;
};

const AuthError = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorCode: string | null = searchParams.get("error");

  useEffect(() => {
    if (!errorCode) {
      router.replace("/");
    }
  }, [errorCode, router]);

  if (!errorCode) return null;

  return (
    <main>
      <Header />
      <Status
        icon={AlertTriangle}
        iconColor="text-white"
        iconBg="bg-destructive"
        title="Authentication Error"
        containerClassName="min-h-[73vh]"
        description={formatErrorMessage(errorCode)}
        button={{
          icon: ArrowLeft,
          label: "Back to Home",
          onClick: () => router.replace("/"),
        }}
      />
      <Footer />
    </main>
  );
};

export default AuthError;
