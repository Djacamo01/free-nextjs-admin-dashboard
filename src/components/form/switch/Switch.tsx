"use client";
import React, { useState } from "react";

interface SwitchProps {
  label: string;
  /** Modo controlado: si se define, el estado lo controla el padre. */
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  color?: "blue" | "gray";
}

const Switch: React.FC<SwitchProps> = ({
  label,
  checked: checkedProp,
  defaultChecked = false,
  disabled = false,
  onChange,
  color = "blue",
}) => {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const controlled = checkedProp !== undefined;
  const isChecked = controlled ? checkedProp : internalChecked;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;
    const next = !isChecked;
    if (!controlled) setInternalChecked(next);
    onChange?.(next);
  };

  const switchColors =
    color === "blue"
      ? {
          background: isChecked
            ? "bg-brand-500 "
            : "bg-gray-200 dark:bg-white/10",
          knob: isChecked
            ? "translate-x-[1.375rem] bg-white"
            : "translate-x-0 bg-white",
        }
      : {
          background: isChecked
            ? "bg-gray-800 dark:bg-white/10"
            : "bg-gray-200 dark:bg-white/10",
          knob: isChecked
            ? "translate-x-[1.375rem] bg-white"
            : "translate-x-0 bg-white",
        };

  return (
    <label
      className={`flex cursor-pointer select-none items-center gap-3 text-sm font-medium ${
        disabled
          ? "cursor-not-allowed text-gray-400"
          : "text-gray-700 dark:text-gray-400"
      }`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        disabled={disabled}
        onClick={handleToggle}
        className="relative shrink-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 rounded-full"
      >
        <span
          className={`block h-6 w-11 rounded-full transition-colors duration-150 ease-linear ${
            disabled
              ? "bg-gray-100 dark:bg-gray-800"
              : switchColors.background
          }`}
        />
        <span
          className={`pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full shadow-theme-sm transition duration-150 ease-linear ${switchColors.knob}`}
        />
      </button>
      <span onClick={disabled ? undefined : handleToggle}>{label}</span>
    </label>
  );
};

export default Switch;
