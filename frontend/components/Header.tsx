import React from "react";
import { Button } from "./ui/Button";

interface HeaderProps {
  account: string;
  onConnect: () => void;
  onDisconnect: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({ account, onConnect, onDisconnect, isLoading }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            Z
          </div>
          <span className="font-bold text-xl text-gray-900 dark:text-white">FHEVM Bank</span>
        </div>

        <div>
          {!account ? (
            <Button onClick={onConnect} isLoading={isLoading} size="sm">
              Connect Wallet
            </Button>
          ) : (
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">
                <span className="w-2 h-2 inline-block rounded-full bg-emerald-500 mr-2"></span>
                {account.slice(0, 6)}...{account.slice(-4)}
              </div>
              <Button onClick={onDisconnect} variant="outline" size="sm">
                Disconnect
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
