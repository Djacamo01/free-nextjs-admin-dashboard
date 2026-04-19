"use client";

import PatientCreateForm from "@/components/patients/PatientCreateForm";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

export default function PatientCreatePageView() {
  const router = useRouter();

  return (
    <div className="w-full min-w-0 space-y-6">

      {/* back link */}
      <Link
        href="/clientes"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 16 16">
          <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Clientes
      </Link>

      {/* page header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500 shadow-sm">
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
            Nuevo cliente
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Solo el nombre es obligatorio. El resto puedes completarlo después.
          </p>
        </div>
      </div>

      {/* form */}
      <PatientCreateForm
        onSuccess={() => router.push("/clientes")}
        onCancel={() => router.push("/clientes")}
      />
    </div>
  );
}
