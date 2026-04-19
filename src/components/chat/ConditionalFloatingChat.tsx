"use client";

import OrdelyChatAssistant from "@/components/chat/OrdelyChatAssistant";
import { ASK_ORDELY_ROUTE } from "@/constants/askOrdely";
import { usePathname } from "next/navigation";

/** No muestra el FAB en la página del asistente para evitar duplicar la UI. */
export default function ConditionalFloatingChat() {
  const pathname = usePathname();
  if (
    pathname === ASK_ORDELY_ROUTE ||
    pathname.startsWith(`${ASK_ORDELY_ROUTE}/`)
  ) {
    return null;
  }
  return <OrdelyChatAssistant variant="floating" />;
}
