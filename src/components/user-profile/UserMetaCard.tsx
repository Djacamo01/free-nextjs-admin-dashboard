"use client";
import UserAvatarInitials from "@/components/common/UserAvatarInitials";
import { labelContactRole } from "@/constants/publicEnums";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import React from "react";

export default function UserMetaCard() {
  const { user, loading, error } = useCurrentUser();

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 dark:border-gray-800">
          {loading ? (
            <span className="block h-full w-full animate-pulse bg-gray-200 dark:bg-gray-700" aria-hidden />
          ) : (
            <UserAvatarInitials
              name={user?.name ?? ""}
              email={user?.email}
              size="md"
              className="!h-full !w-full border-0"
            />
          )}
        </div>
        <div className="text-center sm:text-left">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {user?.name?.trim() || (loading ? "Cargando…" : "Usuario")}
          </h4>
          {error && (
            <p className="text-sm text-error-500 dark:text-error-400">{error}</p>
          )}
          <div className="mt-1 flex flex-col items-center gap-1 sm:flex-row sm:gap-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user?.role ? labelContactRole(user.role) : loading ? "…" : "—"}
            </p>
            {user?.email && (
              <>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 sm:block" />
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
