"use client";

import React, { useId, useState } from "react";

export type SegmentedTabItem = {
  id: string;
  label: string;
  /** Texto breve bajo las pestañas; ayuda a orientar al usuario */
  description?: string;
  content: React.ReactNode;
};

type SegmentedTabsProps = {
  tabs: SegmentedTabItem[];
  /** Etiqueta accesible del grupo de pestañas */
  ariaLabel?: string;
  className?: string;
  defaultIndex?: number;
};

export default function SegmentedTabs({
  tabs,
  ariaLabel = "Secciones",
  className = "",
  defaultIndex = 0,
}: SegmentedTabsProps) {
  const baseId = useId();
  const [active, setActive] = useState(defaultIndex);

  if (!tabs.length) return null;

  const current = tabs[active];

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex gap-1 overflow-x-auto rounded-xl bg-gray-100/90 p-1.5 [-ms-overflow-style:none] [scrollbar-width:none] dark:bg-gray-800/70 [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab, index) => {
          const selected = active === index;
          const tabId = `${baseId}-tab-${tab.id}`;
          const panelId = `${baseId}-panel-${tab.id}`;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={tabId}
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(index)}
              className={`shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition-all sm:px-4 ${
                selected
                  ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/80 dark:bg-gray-900 dark:text-white dark:ring-gray-600/80"
                  : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {current?.description ? (
        <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {current.description}
        </p>
      ) : null}

      <div className="mt-5">
        {tabs.map((tab, index) => {
          const panelId = `${baseId}-panel-${tab.id}`;
          const tabId = `${baseId}-tab-${tab.id}`;
          if (active !== index) return null;
          return (
            <div
              key={tab.id}
              role="tabpanel"
              id={panelId}
              aria-labelledby={tabId}
            >
              {tab.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
