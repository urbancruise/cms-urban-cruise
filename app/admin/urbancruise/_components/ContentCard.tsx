"use client";

import Link from "next/link";
import type { ReactNode, ComponentType } from "react";
import { MdOutlineArrowForward } from "react-icons/md";

export type CardColor =
  "blue" | "purple" | "green" | "orange" | "red" | "pink" | "indigo" | "teal";

interface ContentCardProps {
  title: string;
  description?: string;
  href?: string;
  icon?: ComponentType<{ className?: string }>;
  color?: CardColor;
  count?: number;
  countLabel?: string;
  children?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
}

const COLOR_MAP: Record<
  CardColor,
  { bg: string; text: string; border: string; ring: string }
> = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "hover:border-blue-300",
    ring: "group-hover:text-blue-600",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "hover:border-purple-300",
    ring: "group-hover:text-purple-600",
  },
  green: {
    bg: "bg-green-50",
    text: "text-green-600",
    border: "hover:border-green-300",
    ring: "group-hover:text-green-600",
  },
  orange: {
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "hover:border-orange-300",
    ring: "group-hover:text-orange-600",
  },
  red: {
    bg: "bg-red-50",
    text: "text-red-600",
    border: "hover:border-red-300",
    ring: "group-hover:text-red-600",
  },
  pink: {
    bg: "bg-pink-50",
    text: "text-pink-600",
    border: "hover:border-pink-300",
    ring: "group-hover:text-pink-600",
  },
  indigo: {
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    border: "hover:border-indigo-300",
    ring: "group-hover:text-indigo-600",
  },
  teal: {
    bg: "bg-teal-50",
    text: "text-teal-600",
    border: "hover:border-teal-300",
    ring: "group-hover:text-teal-600",
  },
};

export default function ContentCard({
  title,
  description,
  href,
  icon: Icon,
  color = "teal",
  count,
  countLabel = "sections",
  children,
  onClick,
  disabled = false,
  className = "",
  compact = false,
}: ContentCardProps) {
  const colors = COLOR_MAP[color];

  const baseClasses = `
    group relative bg-white
    rounded-xl border border-slate-200
    transition-all duration-200
    ${compact ? "p-4" : "p-5"}
    ${
      disabled
        ? "opacity-50 cursor-not-allowed"
        : `${colors.border} hover:shadow-md cursor-pointer`
    }
    ${className}
  `;

  const inner = (
    <>
      <div className={`flex items-start justify-between ${compact ? "mb-2" : "mb-3"}`}>
        {Icon ? (
          <div
            className={`${compact ? "w-9 h-9" : "w-11 h-11"} ${
              colors.bg
            } rounded-lg flex items-center justify-center flex-shrink-0`}
          >
            <Icon className={`${compact ? "w-4 h-4" : "w-5 h-5"} ${colors.text}`} />
          </div>
        ) : (
          <div />
        )}

        {!disabled && (
          <MdOutlineArrowForward
            className={`${compact ? "w-4 h-4" : "w-5 h-5"} text-slate-400 ${
              colors.ring
            } transition-colors flex-shrink-0`}
          />
        )}
      </div>

      <h3
        className={`font-semibold text-slate-900 ${
          compact ? "text-sm" : "text-base"
        } truncate`}
      >
        {title}
      </h3>

      {description && (
        <p
          className={`text-slate-500 mt-1 ${
            compact ? "text-xs" : "text-sm"
          } line-clamp-2`}
        >
          {description}
        </p>
      )}

      {children}

      {count !== undefined && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-400">
            {count} {countLabel}
          </span>
        </div>
      )}
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={baseClasses} aria-label={title}>
        {inner}
      </Link>
    );
  }

  if (onClick && !disabled) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClasses} text-left w-full`}
        aria-label={title}
      >
        {inner}
      </button>
    );
  }

  return <div className={baseClasses}>{inner}</div>;
}
