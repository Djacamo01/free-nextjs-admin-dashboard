"use client";

import { getUserInitials } from "@/lib/userInitials";
import React from "react";

type UserAvatarInitialsProps = {
  name: string;
  email?: string;
  size?: "sm" | "md";
  className?: string;
  /** Accesibilidad; por defecto se deriva de nombre/email */
  "aria-label"?: string;
};

const sizeClasses = {
  sm: "h-11 w-11 text-xs",
  md: "h-20 w-20 text-lg",
};

export default function UserAvatarInitials({
  name,
  email,
  size = "sm",
  className = "",
  "aria-label": ariaLabel,
}: UserAvatarInitialsProps) {
  const initials = getUserInitials(name, email);
  const label =
    ariaLabel ??
    (name.trim() || email
      ? `Iniciales de ${name.trim() || email}`
      : "Avatar de usuario");
  return (
    <span
      role="img"
      aria-label={label}
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-500 font-semibold uppercase text-white ${sizeClasses[size]} ${className}`}
    >
      {initials}
    </span>
  );
}
