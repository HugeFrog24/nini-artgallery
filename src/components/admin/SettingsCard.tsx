import { ReactNode } from "react";

interface SettingsCardProps {
  title: string;
  description: string;
  error?: string;
  success?: string;
  children: ReactNode;
}

export default function SettingsCard({
  title,
  description,
  error,
  success,
  children,
}: SettingsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <div className="text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-md bg-green-50 dark:bg-green-900/20 p-4">
            <div className="text-sm text-green-700 dark:text-green-400">
              {success}
            </div>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
