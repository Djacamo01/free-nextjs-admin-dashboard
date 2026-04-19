"use client";

import React from "react";

type SpinnerOneProps = {
  className?: string;
};

export default function SpinnerOne({ className = "" }: SpinnerOneProps) {
  return (
    <div
      className={`inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-brand-500 border-r-transparent dark:border-brand-400 dark:border-r-transparent ${className}`}
      role="status"
      aria-label="Cargando"
    />
  );
}
