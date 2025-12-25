import React from "react";

export type StatusKind = "info" | "success" | "error";

interface StatusMessageProps {
  kind: StatusKind;
  message: string;
  onClose?: () => void;
}

export const StatusMessage: React.FC<StatusMessageProps> = ({ kind, message, onClose }) => {
  const styles = {
    info: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800",
    error: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-800",
  };

  return (
    <div className={`rounded-lg border p-4 mb-6 flex justify-between items-start ${styles[kind]}`}>
      <div className="flex-1 text-sm font-medium">{message}</div>
      {onClose && (
        <button onClick={onClose} className="ml-4 text-current opacity-70 hover:opacity-100">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};
