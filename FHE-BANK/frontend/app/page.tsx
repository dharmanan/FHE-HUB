"use client";

import { useState, useEffect, useCallback } from "react";
import { BrowserProvider, Contract, formatUnits, parseUnits } from "ethers";
import { decryptHandle, decryptHandles, encryptValue, getContract } from "../lib/fhevm";
import {
  CHAIN_ID,
  COLLATERAL_CONTRACT_ABI,
  COLLATERAL_CONTRACT_ADDRESS,
  PRIVATE_ZAMA_TOKEN_ABI,
  PRIVATE_ZAMA_TOKEN_ADDRESS,
} from "../lib/config";

import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { StatusMessage } from "../components/ui/StatusMessage";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

// TypeScript window.ethereum tip tanımı
declare global {
  type Eip1193Provider = {
    request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
    on?: (event: string, listener: (...args: unknown[]) => void) => void;
    removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
  };

  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export default function Home() {
  // We treat amounts as 18-decimal fixed-point (wei-style) integers under the hood.
  const AMOUNT_DECIMALS = 18;

  type StatusKind = "info" | "success" | "error";
  const [status, setStatus] = useState<{ kind: StatusKind; message: string } | null>(null);

  const setStatusFor = (kind: StatusKind, message: string, clearAfterMs?: number): void => {
    setStatus({ kind, message });
    if (clearAfterMs && clearAfterMs > 0) {
      setTimeout(() => setStatus(null), clearAfterMs);
    }
  };

  const [account, setAccount] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [networkChainId, setNetworkChainId] = useState<number | null>(null);

  const [privateZamaTokenContract, setPrivateZamaTokenContract] = useState<Contract | null>(null);
  const [collateralContract, setCollateralContract] = useState<Contract | null>(null);

  // Private token UI state
  const [privateTokenBalance, setPrivateTokenBalance] = useState<string>("—");
  const [privateFaucetAmount, setPrivateFaucetAmount] = useState<string>("10");
  const [privateTransferTo, setPrivateTransferTo] = useState<string>("");
  const [privateTransferAmount, setPrivateTransferAmount] = useState<string>("");

  // Collateral UI state
  const [collateralDepositAmount, setCollateralDepositAmount] = useState<string>("");
  const [collateralWithdrawAmount, setCollateralWithdrawAmount] = useState<string>("");
  const [borrowAmount, setBorrowAmount] = useState<string>("");
  const [repayAmount, setRepayAmount] = useState<string>("");
  const [protocolTarget, setProtocolTarget] = useState<string>("");
  const [protocolTransferAmount, setProtocolTransferAmount] = useState<string>("");
  const [liquidationTarget, setLiquidationTarget] = useState<string>("");
  const [collateralValue, setCollateralValue] = useState<string>("—");
  const [borrowedValue, setBorrowedValue] = useState<string>("—");
  const [positionHealthy, setPositionHealthy] = useState<string>("—");
  const [positionLiquidatable, setPositionLiquidatable] = useState<string>("—");
  const [liquidatorReward, setLiquidatorReward] = useState<string>("—");

  const DISCONNECT_FLAG_KEY = "fhevm.walletDisconnected";

  const setWalletDisconnected = (disconnected: boolean): void => {
    if (typeof window === "undefined") return;
    if (disconnected) {
      window.localStorage.setItem(DISCONNECT_FLAG_KEY, "1");
    } else {
      window.localStorage.removeItem(DISCONNECT_FLAG_KEY);
    }
  };

  const isWalletDisconnected = (): boolean => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(DISCONNECT_FLAG_KEY) === "1";
  };

  const initContract = useCallback(async (): Promise<void> => {
    try {
      if (typeof window === "undefined" || !window.ethereum) return;
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const network = await provider.getNetwork();
      setNetworkChainId(Number(network.chainId));

      const privateTokenAddr = PRIVATE_ZAMA_TOKEN_ADDRESS.trim();
      if (privateTokenAddr) {
        const privateTokenInstance = await getContract(
          signer,
          privateTokenAddr,
          PRIVATE_ZAMA_TOKEN_ABI,
        );
        setPrivateZamaTokenContract(privateTokenInstance);
      } else {
        setPrivateZamaTokenContract(null);
      }

      const collateralAddr = COLLATERAL_CONTRACT_ADDRESS.trim();
      if (collateralAddr) {
        const collateralInstance = await getContract(
          signer,
          collateralAddr,
          COLLATERAL_CONTRACT_ABI,
        );
        setCollateralContract(collateralInstance);
      } else {
        setCollateralContract(null);
      }

    } catch (error) {
      console.error("Contract init error:", error);
    }
  }, []);

  const checkWallet = useCallback(async (): Promise<void> => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        if (isWalletDisconnected()) return;
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0].address);
          await initContract();
        }
      } catch (error) {
        console.error("Wallet check error:", error);
      }
    }
  }, [initContract]);

  useEffect(() => {
    checkWallet();

    if (typeof window === "undefined" || !window.ethereum?.on) {
      return () => {
        setStatus(null);
      };
    }

    const onAccountsChanged = (accounts: unknown): void => {
      const list = Array.isArray(accounts) ? (accounts as unknown[]) : [];
      const next = typeof list[0] === "string" ? (list[0] as string) : "";

      if (!next) {
        setWalletDisconnected(true);
        setAccount("");
        setPrivateZamaTokenContract(null);
        setPrivateTokenBalance("—");
        setCollateralContract(null);
        return;
      }

      setWalletDisconnected(false);
      setAccount(next);
      setPrivateTokenBalance("—");
      void initContract();
    };

    const onChainChanged = (): void => {
      void initContract();
      setPrivateTokenBalance("—");
    };

    window.ethereum.on("accountsChanged", onAccountsChanged);
    window.ethereum.on("chainChanged", onChainChanged);

    return () => {
      window.ethereum?.removeListener?.("accountsChanged", onAccountsChanged);
      window.ethereum?.removeListener?.("chainChanged", onChainChanged);
      setStatus(null);
    };
  }, [checkWallet, initContract]);

  const connectWallet = async (): Promise<void> => {
    if (typeof window === "undefined" || !window.ethereum) {
      setStatusFor("error", "MetaMask is not available in this browser.");
      return;
    }

    try {
      setIsLoading(true);
      const provider = new BrowserProvider(window.ethereum);
      
      // Force permission request to allow selecting a new account
      await provider.send("wallet_requestPermissions", [{ eth_accounts: {} }]);
      
      const accounts = await provider.send("eth_requestAccounts", []);
      setWalletDisconnected(false);
      setAccount(accounts[0]);
      await initContract();
      setStatusFor("success", "Wallet connected.", 3000);

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setStatusFor("error", `Error: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = (): void => {
    setWalletDisconnected(true);
    setAccount("");
    setPrivateZamaTokenContract(null);
    setPrivateTokenBalance("—");
    setCollateralContract(null);
    setStatus(null);

    // Clear FHEVM keys from localStorage
    if (typeof window !== "undefined") {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith("fhevm.userKeypair")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    }
  };

  const parseAmountToBaseUnits = (amount: string): bigint => {
    const amountBaseUnits = parseUnits(amount, AMOUNT_DECIMALS);
    if (amountBaseUnits < 0n) throw new Error("Amount must be >= 0");
    const MAX_UINT64 = (1n << 64n) - 1n;
    if (amountBaseUnits > MAX_UINT64) throw new Error("Amount too large for euint64");
    return amountBaseUnits;
  };

  const isZeroEncryptedHandle = (handle: unknown): boolean => {
    if (typeof handle === "bigint") return handle === 0n;
    if (typeof handle === "string") return /^0x0{64}$/i.test(handle);
    return false;
  };



  const viewPrivateTokenBalance = async (): Promise<void> => {
    if (!privateZamaTokenContract || !account) return;

    setIsLoading(true);
    setStatusFor("info", "Fetching encrypted private token balance...");

    try {
      const encryptedBalance = await privateZamaTokenContract.getBalance();

      if (isZeroEncryptedHandle(encryptedBalance)) {
        setPrivateTokenBalance("0");
        setStatusFor("info", "No private token balance yet. Use Faucet.", 4000);
        return;
      }

      setStatusFor("info", "Decrypting...");
      if (!window.ethereum) throw new Error("No injected wallet provider found");
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const decrypted = await decryptHandle(
        encryptedBalance,
        signer,
        account,
        PRIVATE_ZAMA_TOKEN_ADDRESS,
      );

      setPrivateTokenBalance(formatUnits(decrypted, AMOUNT_DECIMALS));
      setStatusFor("success", "Private token balance decrypted.", 2500);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setStatusFor("error", `Error: ${message}`);
      setPrivateTokenBalance("—");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrivateTokenFaucet = async (): Promise<void> => {
    if (!privateZamaTokenContract || !account || !privateFaucetAmount) return;

    let amountBaseUnits: bigint;
    try {
      amountBaseUnits = parseAmountToBaseUnits(privateFaucetAmount);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Invalid amount";
      setStatusFor("error", `Invalid amount: ${message}`, 5000);
      return;
    }

    setIsLoading(true);

    try {
      if (!window.ethereum) throw new Error("No injected wallet provider found");
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== CHAIN_ID) {
        throw new Error(`Wrong network (chainId=${network.chainId}). Switch to chainId ${CHAIN_ID}.`);
      }
      const code = await provider.getCode(PRIVATE_ZAMA_TOKEN_ADDRESS);
      if (!code || code === "0x") {
        throw new Error(
          "Private token contract not found on this RPC. " +
            "You are likely connected to a non-FHEVM Sepolia RPC. Please add/switch to the Zama FHEVM Sepolia network RPC.",
        );
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setStatusFor("error", message);
      setIsLoading(false);
      return;
    }

    setStatusFor("info", "Encrypting faucet mint amount...");

    try {
      const encrypted = await encryptValue(
        amountBaseUnits,
        account,
        PRIVATE_ZAMA_TOKEN_ADDRESS,
      );

      setStatusFor("info", "Sending faucet transaction...");
      let tx: { hash: string; wait: () => Promise<unknown> };
      try {
        tx = (await privateZamaTokenContract.faucet(
          encrypted.handle,
          encrypted.inputProof,
        )) as typeof tx;
      } catch {
        // FHE-enabled calls can fail during estimateGas with missing revert data.
        // Retry with a conservative gasLimit so the tx can be submitted.
        const faucetWithOverrides = (privateZamaTokenContract as unknown as {
          faucet: (...args: unknown[]) => Promise<unknown>;
        }).faucet;

        tx = (await faucetWithOverrides(
          encrypted.handle,
          encrypted.inputProof,
          { gasLimit: 3_000_000 },
        )) as typeof tx;
      }
      setStatusFor("info", `Transaction sent: ${tx.hash}`);
      setStatusFor("info", "Waiting for confirmation...");
      await tx.wait();
      setStatusFor("success", "Faucet mint completed.", 3000);
      await viewPrivateTokenBalance();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setStatusFor("error", `Error: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrivateTokenTransfer = async (): Promise<void> => {
    if (!privateZamaTokenContract || !account || !privateTransferTo || !privateTransferAmount) return;

    setIsLoading(true);

    try {
      if (!window.ethereum) throw new Error("No injected wallet provider found");
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== CHAIN_ID) {
        throw new Error(`Wrong network (chainId=${network.chainId}). Switch to chainId ${CHAIN_ID}.`);
      }
      const code = await provider.getCode(PRIVATE_ZAMA_TOKEN_ADDRESS);
      if (!code || code === "0x") {
        throw new Error(
          "Private token contract not found on this RPC. " +
            "You are likely connected to a non-FHEVM Sepolia RPC. Please add/switch to the Zama FHEVM Sepolia network RPC.",
        );
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setStatusFor("error", message);
      setIsLoading(false);
      return;
    }

    setStatusFor("info", "Encrypting private token transfer amount...");

    try {
      if (!/^0x[a-fA-F0-9]{40}$/.test(privateTransferTo)) {
        throw new Error("Invalid Ethereum address");
      }

      let amountBaseUnits: bigint;
      try {
        amountBaseUnits = parseAmountToBaseUnits(privateTransferAmount);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Invalid amount";
        throw new Error(`Invalid amount: ${message}`);
      }

      const encrypted = await encryptValue(
        amountBaseUnits,
        account,
        PRIVATE_ZAMA_TOKEN_ADDRESS,
      );

      setStatusFor("info", "Sending transfer transaction...");
      let tx: { hash: string; wait: () => Promise<unknown> };
      try {
        tx = (await privateZamaTokenContract.transfer(
          privateTransferTo,
          encrypted.handle,
          encrypted.inputProof,
        )) as typeof tx;
      } catch {
        const transferWithOverrides = (privateZamaTokenContract as unknown as {
          transfer: (...args: unknown[]) => Promise<unknown>;
        }).transfer;

        tx = (await transferWithOverrides(
          privateTransferTo,
          encrypted.handle,
          encrypted.inputProof,
          { gasLimit: 3_000_000 },
        )) as typeof tx;
      }
      setStatusFor("info", `Transaction sent: ${tx.hash}`);
      setStatusFor("info", "Waiting for confirmation...");
      await tx.wait();

      setStatusFor("success", "Encrypted transfer completed.", 3000);
      setPrivateTransferTo("");
      setPrivateTransferAmount("");
      await viewPrivateTokenBalance();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setStatusFor("error", `Error: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const viewCollateralPosition = async (): Promise<void> => {
    if (!collateralContract || !account) return;
    setIsLoading(true);
    setStatusFor("info", "Fetching encrypted position...");

    try {
      const has = (await collateralContract.hasPosition(account)) as boolean;
      if (!has) {
        setCollateralValue("—");
        setBorrowedValue("—");
        setPositionHealthy("—");
        setPositionLiquidatable("—");
        setStatusFor("info", "No position found yet. Deposit collateral first.", 4500);
        return;
      }

      const encryptedCollateral = await collateralContract.getCollateral();
      const encryptedBorrowed = await collateralContract.getBorrowed();

      if (!window.ethereum) throw new Error("No injected wallet provider found");
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Batch-decrypt to avoid multiple signature prompts.
      const [collateral, borrowed] = await decryptHandles(
        [encryptedCollateral, encryptedBorrowed],
        signer,
        account,
        COLLATERAL_CONTRACT_ADDRESS,
      );

      setCollateralValue(formatUnits(collateral, AMOUNT_DECIMALS));
      setBorrowedValue(formatUnits(borrowed, AMOUNT_DECIMALS));

      // Compute health/liquidation client-side to avoid decrypting computed ebools
      // that may not have explicit allow() on-chain.
      // Match on-chain logic:
      // minRequired = borrowed * 150% = borrowed + borrowed/2
      // liquidationThreshold = borrowed * 120% = borrowed + borrowed/5
      const requiredForHealthy = borrowed + borrowed / 2n;
      const requiredForLiquidation = borrowed + borrowed / 5n;

      const healthy = collateral >= requiredForHealthy;
      const liquidatable = collateral < requiredForLiquidation;

      setPositionHealthy(healthy ? "Yes" : "No");
      setPositionLiquidatable(liquidatable ? "Yes" : "No");
      setStatusFor("success", "Position decrypted.", 2500);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setStatusFor("error", `Error: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const doCollateralTx = async (
    label: string,
    fn: (
      handle: string,
      inputProof: string,
      overrides?: Record<string, unknown>,
    ) => Promise<{ hash?: string; wait: () => Promise<unknown> }>,
    amount: string,
    clear: () => void,
  ): Promise<void> => {
    if (!collateralContract || !account) return;
    setIsLoading(true);

    let amountBaseUnits: bigint;
    try {
      amountBaseUnits = parseAmountToBaseUnits(amount);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Invalid amount";
      setStatusFor("error", `Invalid amount: ${message}`, 5000);
      setIsLoading(false);
      return;
    }

    try {
      setStatusFor("info", "Encrypting amount...");
      const encrypted = await encryptValue(amountBaseUnits, account, COLLATERAL_CONTRACT_ADDRESS);
      setStatusFor("info", "Sending transaction...");
      let tx: { hash?: string; wait: () => Promise<unknown> };
      try {
        tx = await fn(encrypted.handle, encrypted.inputProof);
      } catch {
        // FHE-enabled calls can fail during estimateGas with missing revert data.
        // Retry with a conservative gasLimit so the tx can be submitted.
        tx = await fn(encrypted.handle, encrypted.inputProof, { gasLimit: 3_000_000 });
      }
      setStatusFor("info", "Waiting for confirmation...");
      await tx.wait();
      setStatusFor("success", `${label} completed: ${amount}`, 4000);
      clear();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setStatusFor("error", `Error: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCollateralDeposit = async (): Promise<void> => {
    if (!collateralDepositAmount || !collateralContract) return;
    await doCollateralTx(
      "Collateral deposit",
      (h, p, overrides) => collateralContract.depositCollateral(h, p, overrides),
      collateralDepositAmount,
      () => setCollateralDepositAmount(""),
    );
  };

  const handleCollateralWithdraw = async (): Promise<void> => {
    if (!collateralWithdrawAmount || !collateralContract) return;
    await doCollateralTx(
      "Collateral withdraw",
      (h, p, overrides) => collateralContract.withdrawCollateral(h, p, overrides),
      collateralWithdrawAmount,
      () => setCollateralWithdrawAmount(""),
    );
  };

  const handleBorrow = async (): Promise<void> => {
    if (!borrowAmount || !collateralContract) return;
    await doCollateralTx(
      "Borrow",
      (h, p, overrides) => collateralContract.borrow(h, p, overrides),
      borrowAmount,
      () => setBorrowAmount(""),
    );
  };

  const handleRepay = async (): Promise<void> => {
    if (!repayAmount || !collateralContract) return;
    await doCollateralTx(
      "Repay",
      (h, p, overrides) => collateralContract.repay(h, p, overrides),
      repayAmount,
      () => setRepayAmount(""),
    );
  };

  const handleTransferCollateralToProtocol = async (): Promise<void> => {
    if (!collateralContract || !account) return;

    // Validate protocol address
    if (!/^0x[a-fA-F0-9]{40}$/.test(protocolTarget)) {
      setStatusFor("error", "Invalid protocol address.", 5000);
      return;
    }

    if (!protocolTransferAmount) return;

    setIsLoading(true);
    let amountBaseUnits: bigint;
    try {
      amountBaseUnits = parseAmountToBaseUnits(protocolTransferAmount);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Invalid amount";
      setStatusFor("error", `Invalid amount: ${message}`, 5000);
      setIsLoading(false);
      return;
    }

    try {
      setStatusFor("info", "Encrypting amount...");
      const encrypted = await encryptValue(amountBaseUnits, account, COLLATERAL_CONTRACT_ADDRESS);
      setStatusFor("info", "Sending transaction...");
      let tx: { hash?: string; wait: () => Promise<unknown> };
      try {
        tx = (await collateralContract.transferCollateralToProtocol(
          protocolTarget,
          encrypted.handle,
          encrypted.inputProof,
        )) as typeof tx;
      } catch {
        const fn = (collateralContract as unknown as {
          transferCollateralToProtocol: (...args: unknown[]) => Promise<unknown>;
        }).transferCollateralToProtocol;
        tx = (await fn(protocolTarget, encrypted.handle, encrypted.inputProof, { gasLimit: 3_000_000 })) as typeof tx;
      }
      setStatusFor("info", "Waiting for confirmation...");
      await tx.wait();
      setStatusFor("success", "Collateral transferred to protocol.", 4000);
      setProtocolTransferAmount("");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setStatusFor("error", `Error: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLiquidate = async (): Promise<void> => {
    if (!collateralContract || !account) return;
    if (!/^0x[a-fA-F0-9]{40}$/.test(liquidationTarget)) {
      setStatusFor("error", "Invalid user address to liquidate.", 5000);
      return;
    }

    setIsLoading(true);
    try {
      setStatusFor("info", "Sending transaction...");
      let tx: { hash?: string; wait: () => Promise<unknown> };
      try {
        tx = (await collateralContract.liquidate(liquidationTarget)) as typeof tx;
      } catch {
        const fn = (collateralContract as unknown as {
          liquidate: (...args: unknown[]) => Promise<unknown>;
        }).liquidate;
        tx = (await fn(liquidationTarget, { gasLimit: 3_000_000 })) as typeof tx;
      }
      setStatusFor("info", "Waiting for confirmation...");
      await tx.wait();
      setStatusFor("success", "Liquidation transaction submitted.", 4000);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setStatusFor("error", `Error: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const viewLiquidatorReward = async (): Promise<void> => {
    if (!collateralContract || !account) return;
    setIsLoading(true);
    setStatusFor("info", "Fetching encrypted liquidator rewards...");

    try {
      const encryptedReward = await collateralContract.getLiquidatorReward();
      if (!window.ethereum) throw new Error("No injected wallet provider found");
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const decrypted = await decryptHandle(
        encryptedReward,
        signer,
        account,
        COLLATERAL_CONTRACT_ADDRESS,
      );
      setLiquidatorReward(formatUnits(decrypted, AMOUNT_DECIMALS));
      setStatusFor("success", "Rewards decrypted.", 2500);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setStatusFor("error", `Error: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header 
        account={account} 
        onConnect={connectWallet} 
        onDisconnect={disconnectWallet} 
        isLoading={isLoading} 
      />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
            FHEVM DeFi Bank
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Experience privacy-preserving decentralized finance powered by Fully Homomorphic Encryption.
          </p>
        </div>

        {networkChainId != null && networkChainId !== CHAIN_ID && (
          <div className="mb-8">
            <StatusMessage 
              kind="error" 
              message={`Wrong network. Please switch to chainId ${CHAIN_ID}. Current chainId: ${networkChainId}.`} 
            />
          </div>
        )}

        {status && (
          <div className="mb-8">
            <StatusMessage 
              kind={status.kind} 
              message={status.message} 
              onClose={() => setStatus(null)}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Private Token Operations */}
          <div className="space-y-8">
            <Card 
              title="Private Token Faucet" 
              description="Mint encrypted pZAMA tokens for testing."
            >
              <div className="space-y-4">
                <div className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  {PRIVATE_ZAMA_TOKEN_ADDRESS.trim() || "Contract not deployed"}
                </div>
                <div className="flex gap-3">
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={privateFaucetAmount}
                    onChange={(e) => setPrivateFaucetAmount(e.target.value)}
                    disabled={isLoading || !privateZamaTokenContract}
                  />
                  <Button
                    onClick={handlePrivateTokenFaucet}
                    disabled={!account || !privateZamaTokenContract || !privateFaucetAmount}
                    isLoading={isLoading}
                    variant="primary"
                  >
                    Mint
                  </Button>
                </div>
              </div>
            </Card>

            <Card 
              title="My pZAMA Balance" 
              description="Your encrypted balance, decrypted only for you."
              action={
                <Button
                  onClick={viewPrivateTokenBalance}
                  disabled={!account || !privateZamaTokenContract}
                  isLoading={isLoading}
                  size="sm"
                  variant="secondary"
                >
                  Decrypt
                </Button>
              }
            >
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-center">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {privateTokenBalance}
                </span>
                <span className="ml-2 text-gray-500">pZAMA</span>
              </div>
            </Card>

            <Card title="Transfer pZAMA" description="Send encrypted tokens privately.">
              <div className="space-y-4">
                <Input
                  placeholder="Recipient Address (0x...)"
                  value={privateTransferTo}
                  onChange={(e) => setPrivateTransferTo(e.target.value)}
                  disabled={isLoading || !privateZamaTokenContract}
                />
                <div className="flex gap-3">
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={privateTransferAmount}
                    onChange={(e) => setPrivateTransferAmount(e.target.value)}
                    disabled={isLoading || !privateZamaTokenContract}
                  />
                  <Button
                    onClick={handlePrivateTokenTransfer}
                    disabled={!account || !privateZamaTokenContract || !privateTransferTo || !privateTransferAmount}
                    isLoading={isLoading}
                    className="w-32"
                  >
                    Send
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Collateral & DeFi */}
          <div className="space-y-8">
            <Card 
              title="Encrypted Collateral (Privacy Demo)" 
              description="Demonstrates FHE operations: encrypted deposits, borrows, health checks, and liquidation logic - all computed on encrypted data without revealing amounts."
              action={
                <Button
                  onClick={viewCollateralPosition}
                  disabled={!account || !collateralContract}
                  isLoading={isLoading}
                  size="sm"
                  variant="secondary"
                >
                  Refresh
                </Button>
              }
            >
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Collateral</div>
                  <div className="text-lg font-semibold">{collateralValue}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Borrowed</div>
                  <div className="text-lg font-semibold">{borrowedValue}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Healthy</div>
                  <div className={`text-lg font-semibold ${positionHealthy === 'Yes' ? 'text-emerald-600' : positionHealthy === 'No' ? 'text-rose-600' : ''}`}>
                    {positionHealthy}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Liquidatable</div>
                  <div className={`text-lg font-semibold ${positionLiquidatable === 'Yes' ? 'text-rose-600' : positionLiquidatable === 'No' ? 'text-emerald-600' : ''}`}>
                    {positionLiquidatable}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    placeholder="Deposit Amount"
                    value={collateralDepositAmount}
                    onChange={(e) => setCollateralDepositAmount(e.target.value)}
                    disabled={isLoading || !collateralContract}
                  />
                  <Button
                    onClick={handleCollateralDeposit}
                    disabled={!account || !collateralContract || !collateralDepositAmount}
                    isLoading={isLoading}
                    variant="primary"
                    className="w-full"
                  >
                    Deposit
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    placeholder="Withdraw Amount"
                    value={collateralWithdrawAmount}
                    onChange={(e) => setCollateralWithdrawAmount(e.target.value)}
                    disabled={isLoading || !collateralContract}
                  />
                  <Button
                    onClick={handleCollateralWithdraw}
                    disabled={!account || !collateralContract || !collateralWithdrawAmount}
                    isLoading={isLoading}
                    variant="outline"
                    className="w-full"
                  >
                    Withdraw
                  </Button>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700 my-4"></div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    placeholder="Borrow Amount"
                    value={borrowAmount}
                    onChange={(e) => setBorrowAmount(e.target.value)}
                    disabled={isLoading || !collateralContract}
                  />
                  <Button
                    onClick={handleBorrow}
                    disabled={!account || !collateralContract || !borrowAmount}
                    isLoading={isLoading}
                    variant="secondary"
                    className="w-full"
                  >
                    Borrow
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    placeholder="Repay Amount"
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    disabled={isLoading || !collateralContract}
                  />
                  <Button
                    onClick={handleRepay}
                    disabled={!account || !collateralContract || !repayAmount}
                    isLoading={isLoading}
                    variant="outline"
                    className="w-full"
                  >
                    Repay
                  </Button>
                </div>
              </div>
            </Card>

            <Card title="Advanced Operations">
               <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Transfer Collateral to Protocol</h4>
                    <div className="space-y-2">
                      <Input
                        placeholder="Protocol Address"
                        value={protocolTarget}
                        onChange={(e) => setProtocolTarget(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={protocolTransferAmount}
                          onChange={(e) => setProtocolTransferAmount(e.target.value)}
                        />
                        <Button
                          onClick={handleTransferCollateralToProtocol}
                          disabled={!account || !collateralContract || !protocolTarget || !protocolTransferAmount}
                          isLoading={isLoading}
                          size="sm"
                        >
                          Transfer
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-700"></div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Liquidation</h4>
                    <div className="flex gap-2">
                      <Input
                        placeholder="User Address to Liquidate"
                        value={liquidationTarget}
                        onChange={(e) => setLiquidationTarget(e.target.value)}
                      />
                      <Button
                        onClick={handleLiquidate}
                        disabled={!account || !collateralContract || !liquidationTarget}
                        isLoading={isLoading}
                        variant="danger"
                        size="sm"
                      >
                        Liquidate
                      </Button>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-700"></div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500">My Liquidator Rewards</div>
                      <div className="font-semibold">{liquidatorReward}</div>
                    </div>
                    <Button
                      onClick={viewLiquidatorReward}
                      disabled={!account || !collateralContract}
                      isLoading={isLoading}
                      variant="outline"
                      size="sm"
                    >
                      View Rewards
                    </Button>
                  </div>
               </div>
            </Card>
          </div>
        </div>

        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            About FHEVM
          </h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <li>Amounts are encrypted client-side via Zama Relayer SDK</li>
            <li>On-chain values are stored as encrypted handles (euint64/ebool)</li>
            <li>Addresses and timestamps remain public (standard EVM behavior)</li>
            <li>Only the authorized account can decrypt its own handles</li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
}
