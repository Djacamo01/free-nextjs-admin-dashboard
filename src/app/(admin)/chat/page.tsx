import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import OrdelyChatAssistant from "@/components/chat/OrdelyChatAssistant";
import {
  ASK_ORDELY_LABEL,
  ASK_ORDELY_SUBTITLE,
} from "@/constants/askOrdely";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: `${ASK_ORDELY_LABEL} | Ordely`,
  description: ASK_ORDELY_SUBTITLE,
};

export default function PreguntaOrdelyPage() {
  return (
    <div className="flex h-[calc(100dvh-10rem)] min-h-[420px] flex-col gap-3 md:h-[calc(100dvh-9rem)] md:gap-4">
      <PageBreadcrumb
        pageTitle={ASK_ORDELY_LABEL}
        className="mb-0 shrink-0"
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <OrdelyChatAssistant variant="page" />
      </div>
    </div>
  );
}
