"use client";
import React from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { labelContactRole } from "@/constants/publicEnums";

export default function UserInfoCard() {
  const { user, loading } = useCurrentUser();

  const nameParts = user?.name?.trim().split(/\s+/).filter(Boolean) ?? [];
  const firstName = nameParts[0] ?? "—";
  const lastName = nameParts.slice(1).join(" ") || "—";

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("es", { dateStyle: "long" })
    : "—";

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <h4 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
        Información personal
      </h4>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 w-48 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
          <div>
            <p className="mb-1 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Nombre
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {firstName}
            </p>
          </div>

          <div>
            <p className="mb-1 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Apellido
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {lastName}
            </p>
          </div>

          <div>
            <p className="mb-1 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Correo electrónico
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user?.email ?? "—"}
            </p>
          </div>

          <div>
            <p className="mb-1 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Rol
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user?.role ? labelContactRole(user.role) : "—"}
            </p>
          </div>

          <div>
            <p className="mb-1 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Miembro desde
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {memberSince}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
