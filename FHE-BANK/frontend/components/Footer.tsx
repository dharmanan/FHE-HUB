import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-8 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Built with <span className="font-semibold text-indigo-600 dark:text-indigo-400">FHEVM</span> by Zama
        </p>
        <div className="mt-4 flex justify-center gap-6">
          <a 
            href="https://github.com/dharmanan/fhevm-examples-hub" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
          >
            GitHub
          </a>
          <a 
            href="https://docs.zama.ai/fhevm" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
          >
            Documentation
          </a>
        </div>
      </div>
    </footer>
  );
};
