import React from "react";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  label?: string;
  required?: boolean;
  type?: "mobile" | "fixed" | "any"; // mobile: 06/07, fixed: 05/08, any: all
  prefix?: string; // default: +212
  disabled?: boolean;
  className?: string;
}

/**
 * Phone input component with numeric keypad
 * Supports different phone types (mobile, fixed line, any)
 * Automatically formats with country prefix (+212 for Morocco)
 */
export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      name,
      value,
      onChange,
      onBlur,
      placeholder = "6xxxxxxxx",
      error,
      label,
      required = false,
      type = "mobile",
      prefix = "+212",
      disabled = false,
      className,
    },
    ref
  ) => {
    // Get first digit patterns based on phone type
    const getFirstDigitPattern = () => {
      switch (type) {
        case "mobile":
          return "[67]"; // 06 or 07
        case "fixed":
          return "[58]"; // 05 or 08
        case "any":
          return "[5678]"; // any of these
        default:
          return "[67]";
      }
    };

    const getHelpText = () => {
      switch (type) {
        case "mobile":
          return "Jauval: 06xxxxxx ou 07xxxxxx";
        case "fixed":
          return "Ligne fixe: 05xxxxxx ou 08xxxxxx";
        case "any":
          return "Jauval: 06/07 ou Ligne fixe: 05/08";
        default:
          return "";
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;

      // Remove all non-digit characters
      const digits = inputValue.replace(/[^\d]/g, "").slice(0, 9);

      // Validate first digit based on type
      if (digits.length > 0) {
        const firstDigit = digits[0];
        const pattern = getFirstDigitPattern();
        const regex = new RegExp(`^${pattern}`);

        if (!regex.test(firstDigit)) {
          // Invalid first digit for this phone type - don't update
          return;
        }
      }

      // Update with prefix + digits
      const newValue = prefix + digits;
      onChange(newValue);
    };

    const displayValue = value.replace(prefix, "");

    return (
      <div>
        {label && (
          <label className="block text-sm font-bold text-gray-700 mb-2">
            {label}
            {required && <span className="text-red-500">*</span>}
          </label>
        )}

        <div className="flex gap-2">
          {/* Prefix - always disabled */}
          <input
            type="text"
            value={prefix}
            disabled
            className="w-16 px-3 py-3 border border-gray-300 rounded-lg bg-gray-100 text-center font-semibold text-gray-700"
          />

          {/* Phone number input - numeric keyboard */}
          <input
            ref={ref}
            type="tel"
            name={name}
            value={displayValue}
            onChange={handleChange}
            onBlur={onBlur}
            placeholder={placeholder}
            maxLength="9"
            disabled={disabled}
            inputMode="numeric"
            pattern="\d*"
            className={cn(
              "flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all",
              error ? "border-red-500" : "border-gray-300",
              disabled && "bg-gray-100 text-gray-500 cursor-not-allowed",
              className
            )}
          />
        </div>

        {/* Error or help text */}
        <div className="mt-2">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {!error && (
            <p className="text-xs text-gray-500">{getHelpText()}</p>
          )}
        </div>
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";
