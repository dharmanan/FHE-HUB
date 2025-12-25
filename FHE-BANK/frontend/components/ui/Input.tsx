import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = "", ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors
          ${error 
            ? "border-rose-500 focus:ring-rose-500 focus:border-rose-500" 
            : "border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          } 
          ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-rose-500">{error}</p>}
    </div>
  );
};
