"use client";

import React, { useState } from "react";

export type DefaultTabItem = {
  id: string;
  label: string;
  content: React.ReactNode;
};

type DefaultTabProps = {
  tabs: DefaultTabItem[];
  className?: string;
};

export default function DefaultTab({ tabs, className = "" }: DefaultTabProps) {
  const [active, setActive] = useState(0);

  if (!tabs.length) return null;

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-800">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(index)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              active === index
                ? "text-brand-500 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-brand-500 dark:text-brand-400 dark:after:bg-brand-400"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-6">{tabs[active]?.content}</div>
    </div>
  );
}
