"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

type Props = {
  children: ReactNode;
};

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split("=");
    if (key === name) {
      return value ?? null;
    }
  }
  return null;
}

export default function DashboardClient({ children }: Props): ReactNode {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = getCookie("sb-access-token");
    const onboardingComplete = getCookie("onboarding-complete");

    // If not authenticated, send to login (middleware will also enforce this on full loads)
    if (!token) {
      window.location.href = "/login";
      return;
    }

    // If onboarding explicitly incomplete, force onboarding
    if (onboardingComplete === "false") {
      window.location.href = "/onboarding";
      return;
    }

    // Otherwise allow dashboard to render
    setAllowed(true);
  }, [router]);

  if (!allowed) {
    // Optionally show nothing or a tiny placeholder while we decide
    return null;
  }

  return <>{children}</>;
}
