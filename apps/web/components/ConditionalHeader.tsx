"use client";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";

export default function ConditionalHeader() {
  const pathname = usePathname();
  
  // Don't show the dashboard header on landing, auth, onboarding, or marketing pages
  const noHeaderPaths = ["/", "/login", "/signin", "/signup", "/forgot-password", "/onboarding", "/features"];
  
  if (noHeaderPaths.includes(pathname)) {
    return null;
  }
  
  return <Header />;
}

