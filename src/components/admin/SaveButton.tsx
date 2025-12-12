interface SaveButtonProps {
  isLoading: boolean;
  loadingText: string;
  saveText: string;
  disabled?: boolean;
}

export default function SaveButton({
  isLoading,
  loadingText,
  saveText,
  disabled,
}: SaveButtonProps) {
  return (
    <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
      <button
        type="submit"
        disabled={isLoading || disabled}
        className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-accent-600 hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? loadingText : saveText}
      </button>
    </div>
  );
}
