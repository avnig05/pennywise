"use client";

import { usePathname } from "next/navigation";
import ChatButton from "@/components/ChatButton";

// Same routes that hide the header - hide chat button there too
const noChatPaths = ["/", "/login", "/signin", "/signup", "/forgot-password", "/onboarding", "/features"];

export default function ConditionalChatButton() {
  const pathname = usePathname();
  const showChat = pathname && !noChatPaths.includes(pathname);

  if (!showChat) return null;
  return <ChatButton />;
}
