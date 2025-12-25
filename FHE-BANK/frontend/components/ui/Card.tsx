import React from "react";

interface CardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, title, description, className = "", action }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden ${className}`}>
      {(title || description || action) && (
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start">
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>}
            {description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
          </div>
          {action && <div className="ml-4">{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};
