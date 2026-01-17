import { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  children: ReactNode;
  helperText?: string;
  characterCount?: {
    current: number;
    max: number;
  };
}

export default function FormField({
  label,
  htmlFor,
  children,
  helperText,
  characterCount,
}: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        {label}
      </label>
      {children}
      {(helperText || characterCount) && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {characterCount
            ? `${characterCount.current}/${characterCount.max} characters`
            : helperText}
        </p>
      )}
    </div>
  );
}
