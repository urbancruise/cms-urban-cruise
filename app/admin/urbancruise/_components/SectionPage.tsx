'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MdOutlineArrowBack,
  MdOutlineSave,
  MdOutlineCheckCircle,
  MdOutlineEdit,
  MdOutlineRefresh,
} from 'react-icons/md';

interface SectionPageProps {
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Custom children — if not provided, shows a default placeholder */
  children?: ReactNode;
  /** Show back button (default true) */
  showBackButton?: boolean;
  /** Override back navigation href */
  backHref?: string;
  /** Show the save bar (default true when no children provided) */
  showSaveBar?: boolean;
  /** Called when save is clicked */
  onSave?: () => Promise<void> | void;
}

export default function SectionPage({
  title,
  description,
  children,
  showBackButton = true,
  backHref,
  showSaveBar = true,
  onSave,
}: SectionPageProps) {
  const pathname = usePathname();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const defaultBackHref = pathname
    ? pathname.split('/').slice(0, -1).join('/')
    : '/admin/urbancruise';

  const handleSave = async () => {
    try {
      setSaving(true);
      if (onSave) {
        await onSave();
      } else {
        // Default: simulate save
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSaved(false);
  };

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          {showBackButton && (
            <Link
              href={backHref || defaultBackHref}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
              aria-label="Go back"
            >
              <MdOutlineArrowBack className="w-5 h-5 text-gray-500" />
            </Link>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">
              {title}
            </h1>
            {description && (
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        {children || (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <MdOutlineEdit className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {title}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto text-sm">
              This section is ready for content editing. Add your content here or
              extend this page with your own editor fields.
            </p>

            {showSaveBar && (
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-5 py-2 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  <MdOutlineRefresh className="w-4 h-4" />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <MdOutlineSave className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}

            {saved && (
              <div className="mt-4 inline-flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <MdOutlineCheckCircle className="w-4 h-4" />
                Saved successfully
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}