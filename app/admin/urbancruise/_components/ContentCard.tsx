// app/admin/urbancruise/_components/ContentCard.tsx
'use client';

import Link from 'next/link';
import { ReactNode, ComponentType } from 'react';
import { MdOutlineArrowForward } from 'react-icons/md';

export type CardColor = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink' | 'indigo' | 'teal';

interface ContentCardProps {
  /** Card title */
  title: string;
  /** Optional description shown below the title */
  description?: string;
  /** Optional href — makes the card a link */
  href?: string;
  /** Optional icon component (react-icons) */
  icon?: ComponentType<{ className?: string }>;
  /** Color theme for the icon background */
  color?: CardColor;
  /** Optional count badge (e.g. number of sections) */
  count?: number;
  /** Optional count label (defaults to "sections") */
  countLabel?: string;
  /** Optional children rendered in place of default content */
  children?: ReactNode;
  /** Optional onClick handler — used when href is not provided */
  onClick?: () => void;
  /** Optional disabled state */
  disabled?: boolean;
  /** Optional className override */
  className?: string;
  /** Compact variant — smaller padding */
  compact?: boolean;
}

const COLOR_MAP: Record<
  CardColor,
  { bg: string; text: string; border: string; ring: string }
> = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'hover:border-blue-300 dark:hover:border-blue-700',
    ring: 'group-hover:text-blue-600',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'hover:border-purple-300 dark:hover:border-purple-700',
    ring: 'group-hover:text-purple-600',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-400',
    border: 'hover:border-green-300 dark:hover:border-green-700',
    ring: 'group-hover:text-green-600',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/20',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'hover:border-orange-300 dark:hover:border-orange-700',
    ring: 'group-hover:text-orange-600',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    border: 'hover:border-red-300 dark:hover:border-red-700',
    ring: 'group-hover:text-red-600',
  },
  pink: {
    bg: 'bg-pink-100 dark:bg-pink-900/20',
    text: 'text-pink-600 dark:text-pink-400',
    border: 'hover:border-pink-300 dark:hover:border-pink-700',
    ring: 'group-hover:text-pink-600',
  },
  indigo: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/20',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'hover:border-indigo-300 dark:hover:border-indigo-700',
    ring: 'group-hover:text-indigo-600',
  },
  teal: {
    bg: 'bg-teal-100 dark:bg-teal-900/20',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'hover:border-teal-300 dark:hover:border-teal-700',
    ring: 'group-hover:text-teal-600',
  },
};

export default function ContentCard({
  title,
  description,
  href,
  icon: Icon,
  color = 'blue',
  count,
  countLabel = 'sections',
  children,
  onClick,
  disabled = false,
  className = '',
  compact = false,
}: ContentCardProps) {
  const colors = COLOR_MAP[color];

  const baseClasses = `
    group relative bg-white dark:bg-gray-900
    rounded-xl border border-gray-200 dark:border-gray-800
    transition-all duration-200
    ${compact ? 'p-4' : 'p-5'}
    ${disabled
      ? 'opacity-50 cursor-not-allowed'
      : `${colors.border} hover:shadow-md cursor-pointer`
    }
    ${className}
  `;

  const inner = (
    <>
      {/* Top row: icon + arrow */}
      <div className={`flex items-start justify-between ${compact ? 'mb-2' : 'mb-3'}`}>
        {Icon ? (
          <div
            className={`${compact ? 'w-9 h-9' : 'w-11 h-11'} ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}
          >
            <Icon className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} ${colors.text}`} />
          </div>
        ) : (
          <div />
        )}

        {!disabled && (
          <MdOutlineArrowForward
            className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400 ${colors.ring} transition-colors flex-shrink-0`}
          />
        )}
      </div>

      {/* Title */}
      <h3
        className={`font-semibold text-gray-900 dark:text-white ${
          compact ? 'text-sm' : 'text-base'
        } truncate`}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={`text-gray-500 dark:text-gray-400 mt-1 ${
            compact ? 'text-xs' : 'text-sm'
          } line-clamp-2`}
        >
          {description}
        </p>
      )}

      {/* Custom children */}
      {children}

      {/* Count badge */}
      {count !== undefined && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <span className="text-xs text-gray-400 dark:text-gray-500">
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